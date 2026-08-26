// Vebis — LOCAL development server.
// In production (Vercel) the static files are served by Vercel's CDN and the
// API lives in the serverless functions under /api. This Express server just
// reproduces that setup locally, reusing the exact same /api handlers so there
// is one source of truth. (Excluded from the Vercel deploy via .vercelignore.)
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import chatHandler from "../api/chat.js";
import contactHandler from "../api/contact.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// load .env from the project root regardless of the process cwd
dotenv.config({ path: path.join(ROOT, ".env") });

const PORT = process.env.PORT || 4321;

const app = express();
app.use(express.json({ limit: "64kb" }));

// same API routes as Vercel, backed by the shared serverless handlers
app.post("/api/chat", chatHandler);
app.post("/api/contact", contactHandler);

// never expose backend/config files to the browser (defence in depth)
app.use((req, res, next) => {
  if (/^\/(server|api|node_modules|package(-lock)?\.json|\.env|\.git|\.claude|vercel\.json)(\/|$)/i.test(req.path)) {
    return res.status(404).end();
  }
  next();
});

app.use(express.static(ROOT, { dotfiles: "ignore" }));

app.listen(PORT, () => {
  console.log(`Vebis running on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠  OPENAI_API_KEY is not set — add it to vebis/.env to enable the assistant.");
  }
});
