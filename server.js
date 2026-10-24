import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Health check: useful when testing the backend.
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    apiKeyConfigured: Boolean(apiKey),
    model: "gemini-3.5-flash-lite"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "API key is not configured. Add GEMINI_API_KEY to your .env file and restart the server."
      });
    }

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Please send at least one message." });
    }

    // Keep only a bounded recent history and accept only plain text user/model messages.
    const validMessages = messages
      .filter((m) =>
        m &&
        (m.role === "user" || m.role === "model") &&
        typeof m.text === "string" &&
        m.text.trim().length > 0
      )
      .slice(-20)
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.text.trim().slice(0, 8000) }]
      }));

    if (validMessages.length === 0 || validMessages[validMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "The latest message must be a user message." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: validMessages,
      config: {
        systemInstruction:
          "You are Nova, a helpful AI assistant for students and everyday questions. " +
          "Answer clearly and accurately. Use short headings or lists when useful. " +
          "If you are uncertain, say so. Do not claim to have performed actions you cannot perform.",
        maxOutputTokens: 1200,
        temperature: 0.7
      }
    });

    const reply = response.text?.trim();
    if (!reply) {
      return res.status(502).json({
        error: "The AI returned an empty response. Please try asking in a different way."
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("Gemini API error:", error?.message || error);

    const message = String(error?.message || "");
    if (/API_KEY_INVALID|invalid api key|API key not valid|unauthorized/i.test(message)) {
      return res.status(401).json({
        error: "The API key was rejected. Check the key in your .env file."
      });
    }
    if (/quota|rate limit|resource exhausted|429/i.test(message)) {
      return res.status(429).json({
        error: "The API quota or rate limit was reached. Check your Gemini API usage and try again later."
      });
    }
    return res.status(502).json({
      error: "Could not get a response from Gemini. Check your internet connection, model availability, and API key settings, then try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Nova AI Chatbot is running at http://localhost:${PORT}`);
  if (!apiKey) console.warn("GEMINI_API_KEY is missing. Add it to .env before using AI chat.");
});
