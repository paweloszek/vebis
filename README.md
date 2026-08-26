<div align="center">

# Vebis Studio

**Webdesign & AI automation agency — landing site with a built‑in AI assistant.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-vebis.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white)](https://vebis.vercel.app)

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?logo=greensock&logoColor=000)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)

</div>

---

## 🇵🇱 W skrócie

Strona agencji **Vebis Studio** — nowoczesny, animowany landing page z wbudowanym **asystentem AI**
(chatbot oparty o OpenAI), formularzem kontaktowym wysyłającym e‑mail oraz rezerwacją terminu przez
Cal.com. Front‑end to lekki, autorski kod (bez frameworka), a logika backendowa działa jako
funkcje serverless na Vercel. **Klucze API nigdy nie trafiają do przeglądarki.**

---

## ✨ Overview

Vebis Studio is a fast, animated single‑page‑feel marketing site for a webdesign & AI‑automation
agency. Beyond the visual design, it ships a real, production‑ready **AI assistant** and lead‑capture
flow:

- **AI chat assistant** — visitors can ask about services, process and pricing. The browser talks
  only to a first‑party `/api/chat` endpoint; the OpenAI API key stays server‑side and is never
  exposed to the client.
- **Contact form → email** — the consultation form posts to `/api/contact`, which sends the lead
  straight to the agency inbox via SMTP (with the sender set as `Reply‑To`).
- **Booking** — an inline **Cal.com** calendar for scheduling a 30‑minute consultation.
- **Polished UX** — GSAP + ScrollTrigger hero animation, Lenis smooth scrolling, an asset
  **preloader**, WebP‑optimized imagery, a cookie‑consent banner and a dedicated privacy‑policy page.

## 🧰 Tech Stack

| Area | Technology |
|------|------------|
| **Frontend** | Vanilla **HTML5 / CSS3 / JavaScript** (no framework), multi‑page |
| **Animation** | [GSAP](https://gsap.com/) + ScrollTrigger, [Lenis](https://lenis.studio/) smooth scroll |
| **Typography** | Google Fonts (Archivo, Inter) + a self‑hosted display font |
| **AI Assistant** | [OpenAI](https://platform.openai.com/) Chat Completions API (`gpt-4o-mini` by default) |
| **Email** | [Nodemailer](https://nodemailer.com/) over SMTP |
| **Booking** | [Cal.com](https://cal.com/) inline embed |
| **Backend** | **Vercel Serverless Functions** (`@vercel/node`) under `/api` |
| **Local dev** | [Express](https://expressjs.com/) server that mirrors the production API |
| **Hosting** | [Vercel](https://vercel.com/) |

## 📁 Project structure

```text
.
├── api/                      # Vercel serverless functions (@vercel/node)
│   ├── chat.js               #   secure OpenAI chat proxy   → /api/chat
│   └── contact.js            #   contact form → email (SMTP) → /api/contact
├── assets/                   # WebP images, fonts, favicon
├── server/
│   └── index.js              # local dev server (reuses the same /api handlers)
├── index.html                # landing page
├── konsultacja.html          # consultation: Cal.com booking + contact form
├── polityka-prywatnosci.html # privacy policy
├── styles.css
├── script.js                 # hero animation, preloader, smooth scroll
├── chatbot.js                # AI assistant UI
├── konsultacja.js            # Cal.com embed + contact form logic
├── cookie-consent.js
├── vercel.json               # serverless function config
└── package.json
```

## 🚀 Getting started (local)

**Requirements:** Node.js 18+ and npm.

```bash
# 1. install dependencies
npm install

# 2. create your local environment file
cp .env.example .env
#    then fill in the values (see below)

# 3. run the dev server (auto‑restarts on change)
npm run dev
```

Open **http://localhost:4321** in your browser. The local Express server serves the static site
**and** runs the same `/api/chat` and `/api/contact` handlers used in production, so the chatbot and
contact form work end‑to‑end while developing.

## 🔐 Environment variables

Secrets live in a local `.env` (git‑ignored) and, in production, in **Vercel → Project Settings →
Environment Variables**. Copy `.env.example` and fill it in:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key — powers the chat assistant. |
| `OPENAI_MODEL` | – | Chat model (defaults to `gpt-4o-mini`). |
| `SMTP_HOST` | ✅¹ | SMTP server host (e.g. `smtp.gmail.com`). |
| `SMTP_PORT` | – | SMTP port (`587` STARTTLS / `465` SSL, default `587`). |
| `SMTP_USER` | ✅¹ | SMTP username / mailbox address. |
| `SMTP_PASS` | ✅¹ | SMTP password / app password. |
| `CONTACT_TO` | – | Where leads are delivered (default `kontakt@vebis.pl`). |
| `CONTACT_FROM` | – | From address on the lead email (defaults to `SMTP_USER`). |
| `PORT` | – | Local dev port (default `4321`). |

¹ Required only for the contact form to actually send email. Without SMTP, the form still validates
but returns a "not configured" response.

> **Never commit `.env`.** The OpenAI key and SMTP credentials must stay out of the repository —
> the browser only ever calls the first‑party `/api/*` endpoints.

## ☁️ Deployment (Vercel)

The site deploys to Vercel with zero build step: static files are served from the CDN and everything
under `/api` runs as a serverless function.

1. Import the repository into Vercel.
2. Set **Root Directory** to the repository root (`./`).
3. Add the environment variables above (Production).
4. Deploy.

---

<div align="center">
<sub>© Vebis Studio — <a href="https://vebis.vercel.app">vebis.vercel.app</a></sub>
</div>
