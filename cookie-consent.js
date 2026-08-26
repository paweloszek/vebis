/* Subtle cookie-consent notice.
   Shows a bottom banner once; remembers acceptance in localStorage so it
   never nags a returning visitor. The stored flag is strictly-functional
   (it only records the choice), not tracking. */
(function cookieConsent() {
  var KEY = "vebisCookieConsent";
  try {
    if (localStorage.getItem(KEY) === "accepted") return;
  } catch (e) {
    /* storage blocked — still show the banner, just won't persist */
  }

  function build() {
    if (document.querySelector(".cookie-banner")) return;

    var bar = document.createElement("div");
    bar.className = "cookie-banner";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-live", "polite");
    bar.setAttribute("aria-label", "Informacja o plikach cookies");
    bar.innerHTML =
      '<p class="cookie-banner__text">' +
      "Używamy plików cookies, aby zapewnić Ci najlepsze wrażenia na naszej stronie. " +
      'Klikając „Akceptuję”, zgadzasz się na naszą ' +
      '<a href="polityka-prywatnosci.html">Politykę prywatności</a>.' +
      "</p>" +
      '<button type="button" class="cookie-banner__btn">Akceptuję</button>';

    document.body.appendChild(bar);
    requestAnimationFrame(function () {
      bar.classList.add("is-visible");
    });

    bar.querySelector(".cookie-banner__btn").addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, "accepted");
      } catch (e) {}
      bar.classList.remove("is-visible");
      setTimeout(function () {
        bar.remove();
      }, 400);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
