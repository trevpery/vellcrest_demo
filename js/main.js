const button = document.querySelector(".menu-btn"),
  overlay = document.querySelector(".overlay");
const header = document.querySelector(".header");
const brand = document.querySelector(".brand");
const brandImage = brand.querySelector("img");
const colourLogo = "assets/images/vellcrest-logo-tm.png?v=20261007-tm-final";
const whiteLogo = "assets/images/vellcrest-logo-tm-white.png?v=20261007-tm-final";
const sectionRequestKey = "vellcrest-section-request";
const storedSectionRequest = sessionStorage.getItem(sectionRequestKey);
if (storedSectionRequest) document.documentElement.classList.add("initial-anchor");
function setMenu(open) {
  // A forced-close class from an earlier navigation must never survive into
  // the next open cycle, otherwise the button changes but the panel stays hidden.
  if (open) {
    overlay.style.removeProperty("display");
    overlay.classList.remove("is-closing-now");
  }
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
function closeMenuImmediately() {
  // Menu selections must feel decisive: remove the panel in the same frame as
  // the click instead of playing the normal 750ms closing animation.
  overlay.classList.add("is-closing-now");
  overlay.style.setProperty("display", "none", "important");
  setMenu(false);
}
function releaseImmediateMenuClose() {
  overlay.style.removeProperty("display");
  overlay.classList.remove("is-closing-now");
}
button.addEventListener("click", () => setMenu(!overlay.classList.contains("open")));
// Capture the selection before link-specific navigation code runs, ensuring
// the overlay is already hidden when the browser processes the destination.
overlay.addEventListener("click", (event) => {
  if (event.target.closest("a[href]")) closeMenuImmediately();
}, { capture: true });

function revealPage() {
  document.body.classList.remove("is-page-leaving");
  // When arriving at a section URL, keep the new page concealed until its
  // exact scroll position has been applied. This prevents a visible rush from
  // the hero through every section on the way to the destination.
  if (document.documentElement.classList.contains("initial-anchor")) return;
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

    if (link.target === "_blank" || destination.origin !== window.location.origin) {
      closeMenuImmediately();
      return;
    }

    // Let normal browser navigation begin immediately. The menu is removed in
    // this click frame, so it never lingers over the requested page.
    if (!sameDocument) {
      if (destination.hash) {
        event.preventDefault();
        sessionStorage.setItem(sectionRequestKey, destination.hash);
        window.location.assign(destination.pathname + destination.search);
      }
      closeMenuImmediately();
      return;
    }

    event.preventDefault();
    closeMenuImmediately();

    if (!destination.hash) return;
    const target = destination.hash === "#home"
      ? document.querySelector("#home")
      : document.querySelector(destination.hash);
    if (!target) return;

    if (destination.hash === "#industries") resetIndustriesScene();
    const nextHash = destination.hash === "#home" ? "#home" : destination.hash;
    history.pushState(null, "", nextHash);
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({
      top: destination.hash === "#home" ? 0 : target.offsetTop,
      left: 0,
      behavior: "auto",
    });
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    updateScrollScenes();
    updateHeaderTheme();
    window.requestAnimationFrame(releaseImmediateMenuClose);
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
  const requestedHash = sessionStorage.getItem(sectionRequestKey) || window.location.hash;
  sessionStorage.removeItem(sectionRequestKey);
  if (requestedHash && requestedHash !== "#home") {
    const target = document.querySelector(requestedHash);
    if (target) {
      if (requestedHash === "#industries") resetIndustriesScene();
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: target.offsetTop, left: 0, behavior: "auto" });
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: target.offsetTop, left: 0, behavior: "auto" });
        history.replaceState(null, "", requestedHash);
        document.documentElement.classList.remove("initial-anchor");
        document.documentElement.style.scrollBehavior = "";
        window.requestAnimationFrame(() => document.body.classList.add("is-page-ready"));
      });
    }
    return;
  }
  if (requestedHash === "#home" || window.location.hash === "#home") {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("initial-anchor");
    document.documentElement.style.scrollBehavior = "";
    window.requestAnimationFrame(() => document.body.classList.add("is-page-ready"));
  });
});

// Footer, logo and CTA links on the home page must jump directly to their
// section rather than visibly smooth-scrolling through all intervening panels.
document.querySelectorAll('a[href^="#"]:not(.image-scroll-cue)').forEach((link) => {
  if (overlay.contains(link)) return;
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    if (hash === "#industries") resetIndustriesScene();
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    history.pushState(null, "", hash);
    window.scrollTo({ top: hash === "#home" ? 0 : target.offsetTop, left: 0, behavior: "auto" });
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    updateScrollScenes();
    updateHeaderTheme();
  });
});

const statementSection = document.querySelector(".statement");
const imageScrollCue = document.querySelector(".image-scroll-cue");
let nextSectionTransitioning = false;

function openNextSection(event) {
  if (!statementSection || nextSectionTransitioning) return false;
  if (event?.cancelable) event.preventDefault();
  nextSectionTransitioning = true;
  statementSection.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
  window.setTimeout(() => { nextSectionTransitioning = false; }, 1100);
  return true;
}

imageScrollCue?.addEventListener("click", openNextSection);
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
    // At the section anchor the curtain must be completely flush left. Motion
    // begins only after the user scrolls further into the pinned scene.
    const startAt = 0;
    const travel = window.innerHeight * (window.innerWidth <= 800 ? .80 : .92);
    const progress = clamp01((startAt - rect.top) / travel);
    const eased = progress * progress * (3 - 2 * progress);
    industriesSection.style.setProperty("--industry-progress", String(progress));
    industriesSection.style.setProperty("--industry-x", `${eased * 105}%`);
    industriesSection.style.setProperty("--industry-y", `${(1 - eased) * 18}px`);
  }
}

function resetIndustriesScene() {
  if (!industriesSection) return;
  industriesSection.style.setProperty("--industry-progress", "0");
  industriesSection.style.setProperty("--industry-x", "0%");
  industriesSection.style.setProperty("--industry-y", "18px");
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
  // The home banner begins with the approved blue identity because the logo
  // and menu sit over the bright window area. Dark sections still switch the
  // header to white, and the open navigation always remains white on blue.
  const onHomeBanner = Boolean(point && point.closest(".home-image-hero"));
  const onDark = menuOpen || Boolean(
    point && !onHomeBanner && point.closest(".reveal, .statement, .industries, .contact-section, .footer"),
  );
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
const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  const startedField = contactForm.querySelector('[name="form_started"]');
  const successCard = document.querySelector("#contact-success");
  const successClose = successCard?.querySelector(".contact-success__close");
  if (startedField) startedField.value = String(Date.now());

  successClose?.addEventListener("click", () => {
    successCard.hidden = true;
    contactForm.hidden = false;
    if (startedField) startedField.value = String(Date.now());
    contactForm.querySelector('[name="name"]')?.focus();
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const note = form.querySelector(".form-note");
    const button = form.querySelector('button[type="submit"]');
    const submittedName = String(new FormData(form).get("name") || "").trim();

    if (!form.checkValidity()) {
      form.reportValidity();
      if (note) note.textContent = "Please complete all required fields";
      return;
    }

    if (button) button.disabled = true;
    if (note) note.textContent = "Sending your enquiry";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Your enquiry could not be sent");
      }

      form.reset();
      if (startedField) startedField.value = String(Date.now());
      if (successCard) {
        const nameTarget = successCard.querySelector("[data-contact-name]");
        if (nameTarget) nameTarget.textContent = submittedName;
        form.hidden = true;
        successCard.hidden = false;
        successCard.setAttribute("tabindex", "-1");
        successCard.focus({ preventScroll: true });
      } else if (note) {
        note.textContent = `Dear ${submittedName}, your message has been received. We will get back to you shortly`;
      }
    } catch (error) {
      if (note) note.textContent = error.message || "Your enquiry could not be sent. Please try again";
    } finally {
      if (button) button.disabled = false;
    }
  });
}
