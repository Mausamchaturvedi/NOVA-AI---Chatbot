const $ = (selector) => document.querySelector(selector);
const conversation = $("#conversation");
const messagesEl = $("#messages");
const welcome = $("#welcome");
const input = $("#messageInput");
const sendBtn = $("#sendBtn");
const chatList = $("#chatList");
const STORAGE_KEY = "nova-ai-chats-v1";

let chats = loadChats();
let activeChatId = chats[0]?.id || null;
let isSending = false;
let toastTimer;

function loadChats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(c => c && c.id && Array.isArray(c.messages)) : [];
  } catch { return []; }
}
function saveChats() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 30))); }
  catch { showToast("Browser storage is full. Delete old chats to free space."); }
}
function activeChat() { return chats.find(c => c.id === activeChatId); }
function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function createChat() {
  const chat = { id: makeId(), title: "New conversation", messages: [], updatedAt: Date.now() };
  chats.unshift(chat); activeChatId = chat.id; saveChats(); renderAll(); input.focus();
}
function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
function renderChatList() {
  chatList.replaceChildren();
  chats.forEach(chat => {
    const row = document.createElement("div");
    row.className = `chat-item ${chat.id === activeChatId ? "active" : ""}`;
    const label = document.createElement("span");
    label.textContent = "▤  " + (chat.title || "New conversation");
    label.title = label.textContent;
    label.addEventListener("click", () => { activeChatId = chat.id; renderAll(); });
    const del = document.createElement("button");
    del.className = "delete-chat"; del.type = "button"; del.textContent = "×"; del.title = "Delete chat";
    del.setAttribute("aria-label", "Delete chat");
    del.addEventListener("click", (event) => {
      event.stopPropagation();
      chats = chats.filter(c => c.id !== chat.id);
      if (activeChatId === chat.id) activeChatId = chats[0]?.id || null;
      saveChats(); renderAll();
    });
    row.append(label, del);
    row.addEventListener("click", () => { activeChatId = chat.id; renderAll(); });
    chatList.append(row);
  });
}
function addMessageElement(role, text, options = {}) {
  const item = document.createElement("div");
  item.className = `message ${role === "user" ? "user" : "assistant"} ${options.error ? "error" : ""}`;
  const avatar = document.createElement("div"); avatar.className = "avatar";
  avatar.textContent = role === "user" ? "You" : "✦";
  const bubble = document.createElement("div"); bubble.className = "bubble";
  // textContent prevents AI responses from being interpreted as HTML.
  bubble.textContent = text;
  item.append(avatar, bubble); messagesEl.append(item);
  return item;
}
function renderAll() {
  renderChatList();
  messagesEl.replaceChildren();
  const chat = activeChat();
  const hasMessages = Boolean(chat?.messages?.length);
  welcome.hidden = hasMessages;
  messagesEl.hidden = !hasMessages;
  if (chat) chat.messages.forEach(m => addMessageElement(m.role, m.text, { error: m.error }));
  conversation.scrollTop = conversation.scrollHeight;
}
function resizeInput() { input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 160)}px`; }
function setBusy(busy) { isSending = busy; sendBtn.disabled = busy; input.disabled = busy; }
function addTyping() {
  const item = document.createElement("div"); item.className = "message assistant"; item.id = "typingIndicator";
  const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = "✦";
  const bubble = document.createElement("div"); bubble.className = "bubble";
  const dots = document.createElement("div"); dots.className = "typing";
  for (let i = 0; i < 3; i++) dots.append(document.createElement("i"));
  bubble.append(dots); item.append(avatar, bubble); messagesEl.append(item);
  conversation.scrollTop = conversation.scrollHeight;
}
async function sendMessage(text) {
  const clean = text.trim();
  if (!clean || isSending) return;
  if (!activeChat()) {
    const chat = { id: makeId(), title: "New conversation", messages: [], updatedAt: Date.now() };
    chats.unshift(chat); activeChatId = chat.id;
  }
  const chat = activeChat();
  chat.messages.push({ role: "user", text: clean, at: Date.now() });
  if (chat.messages.length === 1) chat.title = clean.length > 32 ? clean.slice(0, 32) + "…" : clean;
  chat.updatedAt = Date.now();
  saveChats(); renderAll(); setBusy(true); addTyping();
  try {
    const payload = chat.messages
      .filter(m => !m.error && (m.role === "user" || m.role === "model"))
      .map(m => ({ role: m.role, text: m.text }));
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    $("#typingIndicator")?.remove();
    chat.messages.push({ role: "model", text: data.reply, at: Date.now() });
    chat.updatedAt = Date.now(); saveChats(); renderAll();
  } catch (error) {
    $("#typingIndicator")?.remove();
    const message = error.message || "Something went wrong. Please try again.";
    chat.messages.push({ role: "model", text: `Sorry, I couldn't answer that. ${message}`, error: true, at: Date.now() });
    saveChats(); renderAll();
  } finally {
    setBusy(false); input.disabled = false; input.focus(); resizeInput();
  }
}
$("#chatForm").addEventListener("submit", event => {
  event.preventDefault();
  const text = input.value; input.value = ""; resizeInput(); sendMessage(text);
});
input.addEventListener("input", resizeInput);
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); $("#chatForm").requestSubmit();
  }
});
$("#newChatBtn").addEventListener("click", createChat);
document.querySelectorAll(".suggestion").forEach(button => button.addEventListener("click", () => sendMessage(button.dataset.prompt)));
$("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  try { localStorage.setItem("nova-ai-theme", document.body.classList.contains("light") ? "light" : "dark"); } catch {}
});
try { if (localStorage.getItem("nova-ai-theme") === "light") document.body.classList.add("light"); } catch {}

async function checkBackend() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    const status = $("#connectionStatus");
    status.textContent = data.apiKeyConfigured ? "API connected" : "API key missing";
    status.previousElementSibling.style.background = data.apiKeyConfigured ? "#54d6a1" : "#ffbd69";
  } catch { $("#connectionStatus").textContent = "Server unavailable"; }
}
if (!activeChatId && chats.length) activeChatId = chats[0].id;
renderAll(); checkBackend();
