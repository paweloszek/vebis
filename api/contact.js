/* Vercel serverless function (@vercel/node) — consultation form → email via SMTP.
   SMTP credentials come from Vercel env vars (SMTP_HOST/PORT/USER/PASS, CONTACT_*).
   This same handler is mounted by server/index.js for local development. */
import nodemailer from "nodemailer";

// escape user-supplied text before dropping it into the HTML email body
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, email, phone, message } = req.body ?? {};
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !emailRe.test(email.trim()) ||
    typeof message !== "string" || !message.trim()
  ) {
    return res.status(400).json({ error: "Uzupełnij poprawnie wymagane pola." });
  }

  const lead = {
    name: name.trim().slice(0, 200),
    email: email.trim().slice(0, 200),
    phone: (typeof phone === "string" ? phone.trim() : "").slice(0, 60),
    message: message.trim().slice(0, 4000),
    at: new Date().toISOString(),
  };

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const CONTACT_TO = process.env.CONTACT_TO || "kontakt@vebis.pl";
  const CONTACT_FROM = process.env.CONTACT_FROM || SMTP_USER;

  if (!(SMTP_HOST && SMTP_USER && SMTP_PASS)) {
    console.warn("SMTP not configured — set SMTP_* env vars in Vercel.");
    return res.status(500).json({ error: "Wysyłka e-mail nie jest skonfigurowana." });
  }

  const mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465 (implicit TLS), false for 587 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await mailer.sendMail({
      from: `"Vebis — formularz" <${CONTACT_FROM}>`,
      to: CONTACT_TO,
      replyTo: `"${lead.name}" <${lead.email}>`, // reply goes straight to the lead
      subject: `Nowe zapytanie z konsultacji — ${lead.name}`,
      text:
        `Nowe zapytanie z formularza konsultacji\n\n` +
        `Imię:     ${lead.name}\n` +
        `E-mail:   ${lead.email}\n` +
        `Telefon:  ${lead.phone || "—"}\n` +
        `Data:     ${lead.at}\n\n` +
        `Wiadomość:\n${lead.message}\n`,
      html:
        `<h2 style="margin:0 0 12px">Nowe zapytanie z formularza konsultacji</h2>` +
        `<table style="border-collapse:collapse;font:15px/1.5 system-ui,Arial,sans-serif">` +
        `<tr><td style="padding:2px 12px 2px 0;color:#666">Imię</td><td><strong>${esc(lead.name)}</strong></td></tr>` +
        `<tr><td style="padding:2px 12px 2px 0;color:#666">E-mail</td><td><a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a></td></tr>` +
        `<tr><td style="padding:2px 12px 2px 0;color:#666">Telefon</td><td>${esc(lead.phone) || "—"}</td></tr>` +
        `<tr><td style="padding:2px 12px 2px 0;color:#666">Data</td><td>${esc(lead.at)}</td></tr>` +
        `</table>` +
        `<p style="margin:16px 0 4px;color:#666">Wiadomość:</p>` +
        `<p style="white-space:pre-wrap;margin:0">${esc(lead.message)}</p>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact email failed:", err);
    return res.status(502).json({ error: "Nie udało się wysłać wiadomości." });
  }
}
