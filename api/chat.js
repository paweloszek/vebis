/* Vercel serverless function (@vercel/node) — secure OpenAI chat proxy.
   The API key stays server-side (Vercel env var OPENAI_API_KEY) and never
   reaches the browser. This same handler is mounted by server/index.js for
   local development, so there is a single source of truth. */

const SYSTEM_PROMPT = `Jesteś asystentem AI agencji webdesign i automatyzacji "Vebis".
Rozmawiasz po polsku, w tonie profesjonalnym, ciepłym i konkretnym.
Vebis projektuje strony internetowe szyte na miarę, buduje marki (branding i strategia),
tworzy produkty cyfrowe (UX/UI, e-commerce) oraz wdraża automatyzacje AI i SEO.
Twoje zadania:
- odpowiadać na pytania o usługi, proces współpracy i możliwości,
- pomagać przy wstępnej wycenie (dopytaj o zakres, cele i termin, zamiast podawać sztywne kwoty),
- zachęcać do kontaktu, gdy temat wykracza poza rozmowę.
Odpowiadaj zwięźle (zwykle 2–5 zdań). Nie zmyślaj cen ani faktów — jeśli czegoś nie wiesz,
zaproponuj kontakt z zespołem Vebis.`;

export default async function handler(req, res) {
  // Vercel routes every method here; the chatbot only ever POSTs.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Asystent nie jest skonfigurowany — brakuje klucza OPENAI_API_KEY.",
    });
  }

  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Nieprawidłowe zapytanie." });
  }

  // sanitize + cap history to keep requests small and safe
  const history = messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.6,
        max_tokens: 500,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI error:", response.status, detail);
      return res.status(502).json({ error: "Asystent jest chwilowo niedostępny." });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "Asystent nie zwrócił odpowiedzi." });

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat handler failed:", err);
    return res.status(500).json({ error: "Wystąpił błąd serwera." });
  }
}
