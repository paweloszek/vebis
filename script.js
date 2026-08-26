gsap.registerPlugin(ScrollTrigger);

/* ---------- Smooth scrolling (Lenis) like nudot.com.tw ---------- */
const lenis = new Lenis({
  duration: 1.15,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
window.lenis = lenis;
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rocks = gsap.utils.toArray(".rock");

/* Give every rock a stable, unique personality (its "own gravity").
   Heavy formations barely stir; light fragments float and spin more. */
const rnd = gsap.utils.random;
rocks.forEach((rock) => {
  const isFrag = rock.dataset.type === "fragment";
  rock._isFrag = isFrag;
  rock._float = {
    y: isFrag ? rnd(24, 46) : rnd(6, 12),    // bob amplitude (px)
    x: isFrag ? rnd(60, 130) : rnd(3, 7),    // lateral travel — fragments glide across (px)
    rot: isFrag ? rnd(4, 9) : rnd(1, 2.5),   // idle rotation sway (deg)
    dur: isFrag ? rnd(11, 18) : rnd(8, 12),  // seconds per cycle (slow = subtle glide)
    delay: rnd(0, 3),
    dir: Math.random() > 0.5 ? 1 : -1,
    // scroll spin: fragments tumble, formations turn a touch
    turn: (isFrag ? rnd(50, 120) : rnd(4, 10)) * (Math.random() > 0.5 ? 1 : -1),
  };
});

/* ---------- Deep-space starfield (layered for depth + parallax) ---------- */
const starLayers = [];
(function buildStars() {
  const host = document.getElementById("stars");
  if (!host) return;
  // two depth layers: far (many, small, dim) and near (fewer, bigger, brighter)
  const configs = [
    { depth: 0.3, count: 215, size: [0.7, 1.8], min: [0.14, 0.32], max: [0.48, 0.8], glow: 0.06 },
    { depth: 0.65, count: 95, size: [1.3, 2.5], min: [0.2, 0.4], max: [0.64, 0.94], glow: 0.24 },
    { depth: 1.0, count: 58, size: [2.1, 3.5], min: [0.24, 0.46], max: [0.74, 1.0], glow: 0.6 },
  ];
  configs.forEach((cfg) => {
    const layer = document.createElement("div");
    layer.className = "star-layer";
    const inner = document.createElement("div"); // idle drift lives here
    inner.className = "star-drift";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < cfg.count; i++) {
      const s = document.createElement("span");
      s.className = "star";
      const size = rnd(cfg.size[0], cfg.size[1]);
      s.style.width = s.style.height = size.toFixed(2) + "px";
      s.style.left = rnd(0, 100).toFixed(2) + "%";
      s.style.top = rnd(0, 100).toFixed(2) + "%";
      s.style.setProperty("--min", rnd(cfg.min[0], cfg.min[1]).toFixed(2));
      s.style.setProperty("--max", rnd(cfg.max[0], cfg.max[1]).toFixed(2));
      s.style.setProperty("--dur", rnd(2.4, 6.5).toFixed(2) + "s");
      s.style.setProperty("--delay", rnd(0, 6).toFixed(2) + "s");
      if (Math.random() < cfg.glow) {
        s.style.background = "#eef3ff";
        s.style.boxShadow = "0 0 6px rgba(175,200,255,0.75)";
      }
      frag.appendChild(s);
    }
    inner.appendChild(frag);
    layer.appendChild(inner);
    host.appendChild(layer);
    starLayers.push({ layer, inner, depth: cfg.depth });
  });

  if (!reduceMotion) {
    // very slight continuous drift so the field feels alive
    starLayers.forEach((L, i) => {
      gsap.to(L.inner, {
        x: (i % 2 ? 1 : -1) * (8 + L.depth * 10),
        y: (i % 2 ? -1 : 1) * (5 + L.depth * 6),
        duration: 16 + i * 5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });
    // mouse parallax — nearer layer reacts more
    if (window.matchMedia("(pointer: fine)").matches) {
      const setters = starLayers.map((L) => ({
        depth: L.depth,
        xTo: gsap.quickTo(L.layer, "x", { duration: 1.3, ease: "power3" }),
        yTo: gsap.quickTo(L.layer, "y", { duration: 1.3, ease: "power3" }),
      }));
      window.addEventListener("pointermove", (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        setters.forEach((s) => { s.xTo(-nx * 26 * s.depth); s.yTo(-ny * 18 * s.depth); });
      });
    }
  }
})();

/* ---------- Subtle shooting stars ---------- */
if (!reduceMotion) {
  const shootHost = document.getElementById("stars");
  if (shootHost) {
    const spawnShoot = () => {
      const s = document.createElement("div");
      s.className = "shooting-star";
      const angle = rnd(20, 38); // gentle downward-right streak
      gsap.set(s, { left: rnd(-4, 55) + "vw", top: rnd(0, 38) + "vh", rotation: angle, opacity: 0 });
      shootHost.appendChild(s);
      const rad = (angle * Math.PI) / 180;
      const dist = rnd(window.innerWidth * 0.34, window.innerWidth * 0.58);
      const dur = rnd(0.7, 1.1);
      gsap.timeline({ onComplete: () => s.remove() })
        .to(s, { opacity: 0.9, duration: 0.14, ease: "power1.out" }, 0)
        .to(s, { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, duration: dur, ease: "power1.in" }, 0)
        .to(s, { opacity: 0, duration: 0.35, ease: "power1.in" }, dur - 0.32);
      gsap.delayedCall(rnd(4.5, 11), spawnShoot);
    };
    gsap.delayedCall(rnd(2.5, 5.5), spawnShoot);
  }
}

/* ---------- Idle levitation: each rock floats on its own ---------- */
if (!reduceMotion) {
  rocks.forEach((rock) => {
    const inner = rock.querySelector(".rock__f");
    const f = rock._float;
    gsap.to(inner, {
      y: -f.y * f.dir,
      x: f.x * f.dir,
      rotation: f.rot * f.dir,
      duration: f.dur,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: f.delay,
    });
  });
}

/* ---------- Idle float for the planet ---------- */
if (!reduceMotion) {
  gsap.to("#moonInner", { y: 10, duration: 7, ease: "sine.inOut", repeat: -1, yoyo: true });
}

/* ---------- Mouse parallax: rocks drift with the cursor ---------- */
// Uses x/y (px) — separate transform channels from the scroll (xPercent/
// yPercent/rotation/scale) and idle float (on .rock__f), so nothing fights.
if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  const drifters = rocks.map((rock) => ({
    depth: parseFloat(rock.dataset.depth) || 0.6,
    isFrag: rock._isFrag,
    xTo: gsap.quickTo(rock, "x", { duration: 1, ease: "power3" }),
    yTo: gsap.quickTo(rock, "y", { duration: 1, ease: "power3" }),
  }));

  window.addEventListener("pointermove", (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 .. 1
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    drifters.forEach((d) => {
      // fragments drift a lot; heavy formations barely respond
      const amt = (d.isFrag ? 48 : 14) * d.depth;
      d.xTo(-nx * amt);
      d.yTo(-ny * amt);
    });
  });
}

/* ---------- Scroll: fly FORWARD through the rock field ----------
   On scroll the camera pushes forward: each rock scales up and sweeps
   radially outward from the centre (past the viewer), nearer rocks
   (bigger depth) rushing faster than distant ones = parallax depth.
   Built on load so getBoundingClientRect reads settled positions. */
function buildHeroScroll() {
  if (reduceMotion) return;

  const vcx = window.innerWidth / 2;
  const vcy = window.innerHeight / 2;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "+=200%",
      scrub: 1,
      pin: ".hero",
      anticipatePin: 1,
    },
  });

  rocks.forEach((rock) => {
    const depth = parseFloat(rock.dataset.depth) || 0.5;
    const r = rock.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    // direction from screen centre → the rock (radial "past the camera")
    const nx = gsap.utils.clamp(-1, 1, (cx - vcx) / vcx);
    const sideX = nx >= 0 ? 1 : -1; // firm commit to one side so the walls part

    // squeeze-through: strongly depth-weighted so the huge foreground rocks sweep
    // hard past the camera while distant debris drift only subtly (parallax).
    const pushX = 45 + depth * 300;
    const pushY = 30 + depth * 200;

    tl.to(
      rock,
      {
        xPercent: sideX * pushX,
        yPercent: sideX * pushY, // left rock exits up-left, right rock exits down-right
        scale: 1.05 + depth * 2.3, // near rocks balloon; far debris grow only a little
        rotation: rock._float.turn * 0.15,
        ease: "power1.in",
        duration: 1,
      },
      0
    );
    // stay solid while passing, then fade as it clears the camera
    tl.to(rock, { opacity: 0, ease: "none", duration: 0.32 }, 0.7);
  });

  // As the rocks part, the planet rises toward the gap and grows a little,
  // then dissolves into darkness at the end for a seamless hand-off.
  // On phones keep the rise small so the planet never lifts off the bottom edge
  // (the scale keeps it covering — a big upward move would expose a black strip).
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  tl.to("#moonInner", { yPercent: isMobile ? -8 : -34, scale: 1.4, ease: "power1.out", duration: 1 }, 0);
  tl.to("#moon", { opacity: 0, ease: "none", duration: 0.32 }, 0.72);

  // Stars streak past and fade out too.
  tl.to("#stars", { yPercent: -12, opacity: 0, ease: "none", duration: 1 }, 0);

  // Headline & CTA recede and fade.
  tl.to("#title", { yPercent: -40, opacity: 0, ease: "none", duration: 1 }, 0);
  tl.to("#cta", { yPercent: -90, opacity: 0, ease: "none", duration: 0.85 }, 0);
  tl.to("#hint", { opacity: 0, ease: "none", duration: 0.3 }, 0);
}

if (!reduceMotion) {
  gsap.to("#nav", {
    yPercent: -160,
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "+=40%", scrub: 1 },
  });
}

/* ---------- Services: reveal on scroll ---------- */
const reveals = gsap.utils.toArray(".reveal");
if (reduceMotion) {
  gsap.set(reveals, { opacity: 1, y: 0 });
} else {
  reveals.forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });
}

/* ---------- FAQ accordion (single item open at a time) ---------- */
(function faqAccordion() {
  const items = gsap.utils.toArray(".faq__item");
  if (!items.length) return;
  items.forEach((item) => {
    const btn = item.querySelector(".faq__q");
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      items.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".faq__q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
})();

/* ---------- Smooth-scroll for in-page anchor links (nav, CTAs) ---------- */
(function anchorNav() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const hash = a.getAttribute("href");
    if (!hash || hash.length < 2) return; // skip bare "#" placeholders
    const target = document.querySelector(hash);
    if (!target) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      lenis.scrollTo(target, {
        offset: -24,
        duration: 1.3,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    });
  });
})();

/* ---------- Intro reveal ---------- */
function playIntro() {
  const intro = gsap.timeline({
    defaults: { ease: "power3.out" },
    // build the scroll fly-through only after everything is settled & visible,
    // so ScrollTrigger captures the correct (fully-shown) start state
    onComplete: () => {
      buildHeroScroll();
      ScrollTrigger.refresh();
    },
  });
  intro
    .from("#nav", { y: -24, opacity: 0, duration: 0.8 })
    // opacity-only reveal — never touch scale/xPercent so the scroll fly-through starts clean
    .from(".rock", { opacity: 0, duration: 1.2, stagger: 0.1, ease: "power2.out" }, 0.1)
    .from("#title .line", { yPercent: 110, opacity: 0, duration: 1.0, stagger: 0.12 }, "-=1.1")
    .from("#cta", { y: 24, opacity: 0, duration: 0.8 }, "-=0.5")
    .from("#hint", { opacity: 0, duration: 0.6 }, "-=0.3");
}

/* ---------- Preloader: hold the loading screen until the hero
   rock/planet images have decoded, then fade it out and play the intro.
   This kills the flash where the rocks are still blank on first paint. ---------- */
function revealSite() {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("is-done");
    setTimeout(() => loader.remove(), 750);
  }
  if (reduceMotion) buildHeroScroll(); // returns early under reduced motion
  else playIntro();
}

(function preloadHero() {
  const imgs = gsap.utils.toArray(".field img"); // rocks + planet
  const bar = document.querySelector("#loader .loader__bar span");
  const total = imgs.length || 1;
  let loaded = 0;
  let revealed = false;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    revealSite();
  };
  const tick = () => {
    loaded++;
    if (bar) bar.style.width = Math.min(100, Math.round((loaded / total) * 100)) + "%";
    if (loaded >= total) reveal();
  };

  if (!imgs.length) { reveal(); return; }

  imgs.forEach((img) => {
    if (img.complete && img.naturalWidth > 0) { tick(); return; } // already cached
    let counted = false;
    const mark = () => { if (counted) return; counted = true; tick(); };
    img.addEventListener("load", mark);
    img.addEventListener("error", mark); // never hang on a broken image
  });

  // safety net — never trap the visitor behind the loader
  setTimeout(reveal, 8000);
})();
