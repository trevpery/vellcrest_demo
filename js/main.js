const button = document.querySelector(".menu-btn"),
  overlay = document.querySelector(".overlay");
const header = document.querySelector(".header");
const brand = document.querySelector(".brand");
const brandImage = brand.querySelector("img");
const colourLogo = "assets/images/vellcrest-logo-primary.png";
const whiteLogo = "assets/images/vellcrest-logo-light.png";
function setMenu(open) {
  button.classList.toggle("active", open);
  overlay.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  overlay.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
  updateHeaderTheme();
}
button.addEventListener("click", () =>
  setMenu(!button.classList.contains("active")),
);

function revealPage() {
  document.body.classList.remove("is-page-leaving");
  requestAnimationFrame(() => document.body.classList.add("is-page-ready"));
}
revealPage();
window.addEventListener("pageshow", revealPage);

overlay.querySelectorAll("a[href]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const destination = new URL(link.href, window.location.href);
    const sameDocument =
      destination.origin === window.location.origin &&
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search;

    event.preventDefault();
    overlay.classList.add("is-closing-now");
    setMenu(false);

    if (sameDocument && destination.hash === "#home") {
      document.body.classList.add("is-section-switching");
      window.setTimeout(() => {
        history.replaceState(null, "", window.location.pathname + window.location.search);
        restartHomeSequence();
        document.body.classList.remove("is-section-switching");
        document.body.classList.add("is-section-arriving");
        window.setTimeout(() => document.body.classList.remove("is-section-arriving"), 300);
      }, 135);
      window.setTimeout(() => overlay.classList.remove("is-closing-now"), 80);
      return;
    }

    if (sameDocument && destination.hash) {
      const target = document.querySelector(destination.hash);
      if (target) {
        document.body.classList.add("is-section-switching");
        window.setTimeout(() => {
          const previousScrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = "auto";
          history.pushState(null, "", destination.hash);
          window.scrollTo({ top: target.offsetTop, left: 0, behavior: "auto" });
          document.documentElement.style.scrollBehavior = previousScrollBehavior;
          document.body.classList.remove("is-section-switching");
          document.body.classList.add("is-section-arriving");
          window.setTimeout(() => document.body.classList.remove("is-section-arriving"), 300);
        }, 135);
      }
      window.setTimeout(() => overlay.classList.remove("is-closing-now"), 80);
      return;
    }

    document.body.classList.add("is-page-leaving");
    window.setTimeout(() => window.location.assign(destination.href), 190);
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});
document.querySelector("#year").textContent = new Date().getFullYear();

const hero = document.querySelector(".hero");
const heroParagraph = document.querySelector(".hero-copy p");
if (heroParagraph) {
  const words = heroParagraph.textContent.trim().split(/\s+/);
  heroParagraph.textContent = "";
  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "hero-word";
    span.style.setProperty("--word-index", index);
    span.textContent = word;
    heroParagraph.append(span, document.createTextNode(" "));
  });
}
requestAnimationFrame(() => hero.classList.add("is-intro-ready"));

const heroMessages = [...document.querySelectorAll(".hero-message")];
if (heroMessages.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let heroMessageIndex = 0;
  const heroMessageInterval = 4000;
  const heroMessageTransition = 600;
  window.setInterval(() => {
    const outgoing = heroMessages[heroMessageIndex];
    outgoing.classList.add("is-leaving");
    window.setTimeout(() => {
      outgoing.classList.remove("is-active", "is-leaving");
      heroMessageIndex = (heroMessageIndex + 1) % heroMessages.length;
      const incoming = heroMessages[heroMessageIndex];
      incoming.classList.add("is-active");
    }, heroMessageTransition);
  }, heroMessageInterval);
}

const revealSection = document.querySelector(".reveal");
const revealFrame = revealSection?.querySelector(".frame");
const industriesSection = document.querySelector(".industries");
function clamp01(value) { return Math.max(0, Math.min(1, value)); }

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// Browsers often restore the previous scroll position during refresh after the
// script has begun executing. Arm the sequence from `pageshow`, after that
// restoration point, so every normal refresh reliably starts from the hero.
window.addEventListener("pageshow", () => {
  if (window.location.hash && window.location.hash !== "#home") {
    const target = document.querySelector(window.location.hash);
    if (target) {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: target.offsetTop, left: 0, behavior: "auto" });
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: target.offsetTop, left: 0, behavior: "auto" });
        document.documentElement.classList.remove("initial-anchor");
        document.documentElement.style.scrollBehavior = "";
      });
    }
    return;
  }
  if (window.location.hash === "#home") {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("initial-anchor");
    document.documentElement.style.scrollBehavior = "";
  });
});

const statementSection = document.querySelector(".statement");
const servicesSection = document.querySelector("#services");
const imageScrollCue = document.querySelector(".image-scroll-cue");
let nextSectionTransitioning = false;
let touchStartY = null;

function imageIsSettled() {
  if (!revealSection) return false;
  const rect = revealSection.getBoundingClientRect();
  return Math.abs(rect.top) < Math.max(20, window.innerHeight * .04);
}

function openNextSection(event) {
  const isHomeCue = event?.currentTarget === imageScrollCue;
  if (!statementSection || nextSectionTransitioning || (!isHomeCue && !imageIsSettled())) return false;
  if (event?.cancelable) event.preventDefault();
  nextSectionTransitioning = true;
  const destination = isHomeCue ? statementSection : (servicesSection || statementSection);
  destination.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
  window.setTimeout(() => { nextSectionTransitioning = false; }, 1100);
  return true;
}

imageScrollCue?.addEventListener("click", openNextSection);
window.addEventListener("wheel", (event) => {
  if (event.deltaY > 4) openNextSection(event);
}, { passive: false });
window.addEventListener("touchstart", (event) => {
  touchStartY = event.touches[0]?.clientY ?? null;
}, { passive: true });
window.addEventListener("touchmove", (event) => {
  if (touchStartY === null) return;
  const currentY = event.touches[0]?.clientY ?? touchStartY;
  if (touchStartY - currentY > 24 && openNextSection(event)) touchStartY = null;
}, { passive: false });
window.addEventListener("touchend", () => { touchStartY = null; }, { passive: true });
window.addEventListener("keydown", (event) => {
  if (["ArrowDown", "PageDown", " "].includes(event.key)) openNextSection(event);
});
function updateScrollScenes() {
  if (revealSection && revealFrame) {
    const rect = revealSection.getBoundingClientRect();
    const viewport = window.innerHeight;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The gap is widest when the image plane first enters the viewport and
    // closes before the frame reaches its pinned, full-screen state.
    const approach = clamp01((viewport - rect.top) / (viewport * .82));
    const eased = approach * approach * (3 - 2 * approach);
    const maximumGap = window.innerWidth <= 800 ? 24 : 36;
    const gap = prefersReducedMotion ? 0 : maximumGap * (1 - eased);
    revealFrame.style.setProperty("--layer-gap", `${gap.toFixed(2)}px`);
    document.body.classList.toggle("is-image-reveal-settled", approach > .88);
  }
  if (industriesSection) {
    const rect = industriesSection.getBoundingClientRect();
    // The scene pins before the curtain moves. The image then gets one complete
    // viewport of scroll to leave, after which the revealed content holds long
    // enough to be read before the section releases.
    const startAt = window.innerHeight * .08;
    const travel = window.innerHeight * .92;
    const progress = clamp01((startAt - rect.top) / travel);
    const eased = progress * progress * (3 - 2 * progress);
    industriesSection.style.setProperty("--industry-progress", String(progress));
    industriesSection.style.setProperty("--industry-x", `${eased * 105}%`);
    industriesSection.style.setProperty("--industry-y", `${(1 - eased) * 18}px`);
  }
}
window.addEventListener("scroll", updateScrollScenes, { passive: true });
window.addEventListener("resize", updateScrollScenes);
updateScrollScenes();

const deliveryGrid = document.querySelector(".delivery-grid");
const deliveryCards = deliveryGrid
  ? [...deliveryGrid.querySelectorAll(":scope > article")]
  : [];
let deliveryIndex = 0;
let deliveryTimer;
function activateDeliveryCard(index, animateText = true) {
  if (!deliveryCards.length) return;
  const card = deliveryCards[index];
  deliveryCards.forEach((item, itemIndex) => {
    item.classList.toggle("is-active", itemIndex === index);
    item.classList.remove("is-entering");
  });
  if (animateText) {
    requestAnimationFrame(() => card.classList.add("is-entering"));
  }
}
if (deliveryCards.length) {
  activateDeliveryCard(0, false);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    deliveryTimer = window.setInterval(() => {
      deliveryIndex = (deliveryIndex + 1) % deliveryCards.length;
      activateDeliveryCard(deliveryIndex);
    }, 3000);
  }
}

let currentLogo = colourLogo;
function setLogo(src) {
  if (currentLogo === src) return;
  currentLogo = src;
  brand.classList.add("is-switching");
  window.setTimeout(() => {
    brandImage.onload = () => brand.classList.remove("is-switching");
    brandImage.src = src;
    if (brandImage.complete) brand.classList.remove("is-switching");
  }, 120);
}
function updateHeaderTheme() {
  const menuOpen = overlay.classList.contains("open");
  const points = document.elementsFromPoint(
    Math.min(75, window.innerWidth - 30),
    Math.min(55, window.innerHeight - 20),
  );
  const point = points.find((element) => !element.closest(".header"));
  const onDark = menuOpen || Boolean(point && point.closest(".hero, .reveal, .statement, .industries, .contact-section, .footer"));
  header.classList.toggle("is-dark", onDark);
  setLogo(onDark ? whiteLogo : colourLogo);
}
window.addEventListener("scroll", updateHeaderTheme, { passive: true });
window.addEventListener("resize", updateHeaderTheme);
updateHeaderTheme();
const slides = [...document.querySelectorAll(".advisory-slideshow img")];
if (slides.length > 1) {
  let slideIndex = 0;
  setInterval(() => {
    slides[slideIndex].classList.remove("active");
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add("active");
  }, 4200);
}
document.querySelector("form")?.addEventListener("submit", (event) => {
  const note = event.currentTarget.querySelector(".form-note");
  if (note) note.textContent = "Sending your enquiry";
});
