/* vebis AI assistant — UI layer.
   Talks only to our own /api/chat endpoint; the OpenAI key never touches
   the frontend (it lives in .env on the server). */
(() => {
  const log = document.getElementById("chatLog");
  const form = document.getElementById("chatForm");
  const field = document.getElementById("chatField");
  const sendBtn = document.getElementById("chatSend");
  const suggest = document.getElementById("chatSuggest");
  if (!log || !form || !field) return;

  const GREETING =
    "Cześć! Jestem asystentem AI Vebis. Zapytaj mnie o nasze usługi, proces współpracy albo poproś o wstępną wycenę. W czym mogę pomóc?";

  // conversation history sent to the API (system prompt is added server-side)
  const history = [{ role: "assistant", content: GREETING }];
  let busy = false;

  const scrollToEnd = () => { log.scrollTop = log.scrollHeight; };

  function addMessage(role, text) {
    const el = document.createElement("div");
    el.className = "msg msg--" + role; // bot | user | error
    el.textContent = text;
    log.appendChild(el);
    scrollToEnd();
    return el;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "msg msg--bot";
    el.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
    log.appendChild(el);
    scrollToEnd();
    return el;
  }

  function setBusy(state) {
    busy = state;
    field.disabled = state;
    sendBtn.disabled = state;
  }

  async function send(text) {
    const message = text.trim();
    if (!message || busy) return;

    if (suggest) suggest.classList.add("is-hidden");
    addMessage("user", message);
    history.push({ role: "user", content: message });
    field.value = "";
    setBusy(true);

    const typing = showTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();

      if (!res.ok || !data.reply) {
        addMessage("error", data.error || "Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.");
      } else {
        addMessage("bot", data.reply);
        history.push({ role: "assistant", content: data.reply });
      }
    } catch (err) {
      typing.remove();
      addMessage("error", "Brak połączenia z serwerem asystenta.");
    } finally {
      setBusy(false);
      field.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send(field.value);
  });

  if (suggest) {
    suggest.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => send(chip.dataset.prompt || chip.textContent));
    });
  }

  // seed the conversation with the greeting
  addMessage("bot", GREETING);
})();
