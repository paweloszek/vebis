/* Consultation page — real Cal.com inline booking embed + contact form.
   The form posts to /api/contact (email delivery is wired on the backend). */

/* ---------- Cal.com inline embed ----------
   Loads the official Cal.com embed and renders the live booking calendar
   inside #calInline. The booking link is read from the element's
   data-cal-link attribute, so there is only one place to update. */
(function calEmbed() {
  const el = document.getElementById("calInline");
  if (!el) return;
  const raw = (el.dataset.calLink || "").trim();
  const namespace = el.dataset.calNamespace || "konsultacja";
  if (!raw) return;

  // Accept either a bare slug ("username/event") or a full booking URL
  // ("https://cal.eu/username/event"). Derive the correct instance origin
  // and embed script so it works on cal.com (US) and cal.eu (EU) alike.
  let calLink = raw;
  let origin = "https://cal.com";
  let embedJs = "https://app.cal.com/embed/embed.js";
  if (/^https?:\/\//i.test(raw)) {
    const u = new URL(raw);
    origin = u.origin;                              // e.g. https://cal.eu
    calLink = u.pathname.replace(/^\/+|\/+$/g, ""); // e.g. vebis-studio/vebis-studio
    const bareHost = u.host.replace(/^app\./i, ""); // cal.eu
    embedJs = `https://app.${bareHost}/embed/embed.js`;
  }

  // Official Cal.com embed snippet (loads embed.js from the right instance once).
  (function (C, A, L) {
    let p = function (a, ar) { a.q.push(ar); };
    let d = C.document;
    C.Cal =
      C.Cal ||
      function () {
        let cal = C.Cal;
        let ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () { p(api, arguments); };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else {
            p(cal, ar);
          }
          return;
        }
        p(cal, ar);
      };
  })(window, embedJs, "init");

  Cal("init", namespace, { origin });

  Cal.ns[namespace]("inline", {
    elementOrSelector: "#calInline",
    config: { layout: "month_view" },
    calLink,
  });

  // Match the site's dark theme.
  Cal.ns[namespace]("ui", {
    theme: "dark",
    hideEventTypeDetails: false,
    layout: "month_view",
    cssVarsPerTheme: { dark: { "cal-brand": "#f2f2ef" } },
  });
})();

/* ---------- Contact form ---------- */
(function contactForm() {
  const form = document.getElementById("consultForm");
  if (!form) return;
  const submit = document.getElementById("cformSubmit");
  const status = document.getElementById("cformStatus");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setStatus = (msg, type) => {
    status.textContent = msg;
    status.className = "cform__status" + (type ? " is-" + type : "");
  };

  const fieldEls = {
    name: form.elements.name,
    email: form.elements.email,
    phone: form.elements.phone,
    message: form.elements.message,
  };

  // clear the invalid state as the user corrects a field
  Object.values(fieldEls).forEach((el) =>
    el.addEventListener("input", () => el.classList.remove("is-invalid"))
  );

  function validate() {
    let ok = true;
    const require = (el, cond) => {
      if (!cond) { el.classList.add("is-invalid"); ok = false; }
    };
    require(fieldEls.name, fieldEls.name.value.trim().length > 0);
    require(fieldEls.email, emailRe.test(fieldEls.email.value.trim()));
    require(fieldEls.message, fieldEls.message.value.trim().length > 0);
    return ok;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", null);

    if (!validate()) {
      setStatus("Uzupełnij poprawnie wymagane pola.", "err");
      return;
    }

    const payload = {
      name: fieldEls.name.value.trim(),
      email: fieldEls.email.value.trim(),
      phone: fieldEls.phone.value.trim(),
      message: fieldEls.message.value.trim(),
    };

    submit.disabled = true;
    const originalHTML = submit.innerHTML;
    submit.textContent = "Wysyłanie…";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "send-failed");

      form.reset();
      setStatus("Dziękujemy! Odezwiemy się w ciągu 24 godzin.", "ok");
    } catch (err) {
      setStatus("Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz na hello@vebis.pl.", "err");
    } finally {
      submit.disabled = false;
      submit.innerHTML = originalHTML;
    }
  });
})();
