# Nova AI Chatbot — Google Gemini API

A college web-development project using HTML, CSS, JavaScript, Node.js, Express, the official Google GenAI SDK, and browser LocalStorage.

## Features
- Responsive chat interface and mobile sidebar
- Real responses from Google Gemini
- Recent conversations saved in browser LocalStorage
- New chat, switch chat, and delete chat
- Dark/light theme
- Suggested prompts, typing indicator, and error handling
- API key stays on the server in `.env`
- Backend health endpoint at `/api/health`

## Requirements
- Node.js 20 or a current supported LTS release
- Internet connection
- Google Gemini API key

## Setup (Windows)
1. Install Node.js from https://nodejs.org/ if it is not installed.
2. Download and extract this project ZIP.
3. Open the extracted `gemini-ai-chatbot` folder in VS Code.
4. Open Terminal > New Terminal.
5. Install dependencies:

   ```bash
   npm install
   ```

6. Copy `.env.example` to a new file named `.env` in the same folder as `server.js`.
7. Get an API key from https://aistudio.google.com/app/apikey and paste it into `.env`:

   ```env
   GEMINI_API_KEY=your_real_key_goes_here
   PORT=3000
   ```

   Do not add quotes or share the key. Never put it in `public/app.js` or commit `.env`.

8. Start the server:

   ```bash
   npm start
   ```

9. Open http://localhost:3000 in your browser. Keep the terminal open while using the app.

For automatic restart during development, use `npm run dev`.

## Test the project
1. Visit `http://localhost:3000/api/health`. Expected JSON includes `"ok": true` and `"apiKeyConfigured": true`.
2. Open `http://localhost:3000`.
3. Ask: `What is artificial intelligence? Explain in simple words.`
4. Ask a follow-up: `Give me two examples.` The chatbot receives recent conversation context.
5. Click **New chat** and ask a different question.
6. Refresh the page. Existing chats should remain because they are stored in LocalStorage.
7. Switch between chats, delete a chat, and toggle dark/light mode.
8. Temporarily change the API key to an invalid value to test the error message, then restore the valid key and restart the server.

## Common problems
- **API key missing:** Confirm `.env` is next to `server.js`, the filename is exactly `.env` (not `.env.txt`), and restart the server.
- **Invalid key:** Create/check the key in Google AI Studio and paste it without spaces.
- **Quota/rate limit:** Review the project's current usage and rate limits in Google AI Studio. Availability and pricing depend on the account, region, model, and current policy.
- **Model not found / unavailable:** Check the current Gemini model list at https://ai.google.dev/gemini-api/docs/models and update the model name in `server.js` if needed.
- **Port already in use:** Change `PORT=3001` in `.env`, restart, then open `http://localhost:3001`.
- **Network issue:** Check your internet connection and try again.

## Project structure
```text
gemini-ai-chatbot/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Viva questions with short answers

1. **What is an AI chatbot?**  
   Software that interacts with users through natural language and generates helpful responses.

2. **What is Google Gemini API?**  
   An API that lets an application send input to Gemini models and receive generated output.

3. **Why do we use an API key?**  
   It identifies/authenticates the application for API access and is subject to the provider's usage controls.

4. **Why is the API key stored in `.env`?**  
   To keep secrets out of source code and browser files. The `.env` file must not be committed or shared.

5. **What is Node.js?**  
   A JavaScript runtime used to run JavaScript outside a browser.

6. **What is Express.js?**  
   A Node.js framework used to create HTTP routes and web servers.

7. **What is an API endpoint?**  
   A URL and HTTP method through which a client accesses a server function; this project uses `POST /api/chat`.

8. **What is LocalStorage?**  
   Browser storage that keeps small key-value data across page reloads on the same browser/device.

9. **Does LocalStorage save chats to a cloud database?**  
   No. It stores the chats locally in that browser; it does not sync them across devices.

10. **What is JSON?**  
    A text format for representing structured data, often used for API requests and responses.

11. **Why use `async` and `await`?**  
    To handle asynchronous operations, such as waiting for a response from the Gemini API.

12. **What happens if the API fails?**  
    The backend returns an error response, and the frontend displays a helpful message.

13. **What is frontend vs backend?**  
    Frontend is the user interface; backend handles server-side logic and calls Gemini without exposing the key.

14. **What is the purpose of `express.json()`?**  
    It parses incoming JSON request bodies so the server can read `req.body`.

15. **What are future improvements?**  
    User login, database-backed chat history, streaming responses, file uploads, and deployment with server-side secret management.

## Security notes
- Never publish `.env` or share screenshots that expose your API key.
- The key is not sent to the browser by this project; the browser calls your own Express backend.
- For public deployment, add authentication, request rate limiting, usage monitoring, and stricter abuse controls.
- AI responses may be inaccurate; verify important information.
