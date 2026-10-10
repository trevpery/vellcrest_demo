const menuButtons = document.querySelectorAll(".menu-btn, .mobile-service-menu");
const button = menuButtons[0];
const overlay = document.querySelector(".overlay");
const header = document.querySelector(".header");
const brandImage = document.querySelector(".brand img");
const sectionRequestKey = "vellcrest-section-request";
function setMenu(open) {
  if (open) {
    overlay.style.removeProperty("display");
    overlay.classList.remove("is-closing-now");
  }
  menuButtons.forEach(menuButton => {
    menuButton.classList.toggle("active", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });
  overlay.classList.toggle("open", open);
  overlay.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
  updateHeaderTheme();
}
function closeMenuImmediately() {
  // Remove the navigation panel in the exact frame in which an item is chosen.
  overlay.classList.add("is-closing-now");
  overlay.style.setProperty("display", "none", "important");
  setMenu(false);
}
function releaseImmediateMenuClose() {
  overlay.style.removeProperty("display");
  overlay.classList.remove("is-closing-now");
}
menuButtons.forEach(menuButton => menuButton.addEventListener("click", () => setMenu(!overlay.classList.contains("open"))));
overlay.addEventListener("click", event => {
  if (event.target.closest("a[href]")) closeMenuImmediately();
}, { capture: true });

function revealPage() {
  document.body.classList.remove("is-page-leaving");
  requestAnimationFrame(() => document.body.classList.add("is-page-ready"));
}
revealPage();
window.addEventListener("pageshow", revealPage);

overlay.querySelectorAll("a[href]").forEach(link => link.addEventListener("click", event => {
  const destination = new URL(link.href, window.location.href);
  const sameDocument = destination.origin === window.location.origin && destination.pathname === window.location.pathname && destination.search === window.location.search;
  if (link.target === "_blank" || destination.origin !== window.location.origin) {
    closeMenuImmediately();
    return;
  }

  // Do not hold the overlay while another document loads. Close immediately
  // and allow the link's native navigation to start without an added delay.
  if (!sameDocument) {
    if (destination.hash) {
      event.preventDefault();
      sessionStorage.setItem(sectionRequestKey, destination.hash);
      window.location.assign(destination.pathname + destination.search);
    }
    closeMenuImmediately();
    return;
  }

  if (destination.hash) {
    const target = document.querySelector(destination.hash);
    if (target) {
      event.preventDefault();
      closeMenuImmediately();
      history.pushState(null, "", destination.hash);
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: target.offsetTop, left: 0, behavior: "auto" });
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      updateHeaderTheme();
      window.requestAnimationFrame(releaseImmediateMenuClose);
    }
  } else {
    closeMenuImmediately();
  }
}));

// Footer and CTA links to homepage sections use the same no-scroll arrival
// path as menu links. The browser never receives a cross-page hash to animate.
document.querySelectorAll('a[href*="index.html#"]').forEach(link => {
  if (overlay.contains(link)) return;
  link.addEventListener("click", event => {
    if (event.defaultPrevented || link.target === "_blank") return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || !destination.hash) return;
    event.preventDefault();
    sessionStorage.setItem(sectionRequestKey, destination.hash);
    window.location.assign(destination.pathname + destination.search);
  });
});
document.addEventListener("keydown", event => { if (event.key === "Escape") setMenu(false); });
document.querySelector("#year").textContent = new Date().getFullYear();

function updateHeaderTheme() {
  const menuOpen = overlay.classList.contains("open");
  const points = document.elementsFromPoint(70, Math.min(55, window.innerHeight - 20));
  const point = points.find(element => !element.closest(".header"));
  const onDark = menuOpen || Boolean(point && point.closest(".advisory-section, .service-hero, .service-band, .service-cta, .footer"));
  header.classList.toggle("is-dark", onDark);
  menuButtons.forEach(menuButton => { menuButton.style.color = onDark ? "#fff" : "#20287a"; });
  const nextLogo = onDark ? "assets/images/vellcrest-logo-tm-white.png?v=20261007-tm-final" : "assets/images/vellcrest-logo-tm.png?v=20261007-tm-final";
  if (!brandImage.src.endsWith(nextLogo)) brandImage.src = nextLogo;
}
window.addEventListener("scroll", updateHeaderTheme, { passive: true });
window.addEventListener("resize", updateHeaderTheme);
updateHeaderTheme();

const serviceSwitcher = document.querySelector(".service-switcher");
const serviceSwitcherToggle = serviceSwitcher?.querySelector(".service-switcher-toggle");
const serviceSwitcherLinks = serviceSwitcher?.querySelectorAll(".service-switcher-panel a") || [];
let serviceSwitcherTimer;
const serviceSwitcherHiddenTime = 10000;
const serviceSwitcherVisibleTime = 3000;
function setServiceSwitcher(open) {
  if (!serviceSwitcher || !serviceSwitcherToggle) return;
  serviceSwitcher.classList.toggle("is-open", open);
  serviceSwitcherToggle.setAttribute("aria-expanded", String(open));
}
function scheduleServiceSwitcher(delay = serviceSwitcherHiddenTime) {
  if (!serviceSwitcher) return;
  window.clearTimeout(serviceSwitcherTimer);
  serviceSwitcherTimer = window.setTimeout(() => {
    setServiceSwitcher(true);
    serviceSwitcherTimer = window.setTimeout(() => {
      setServiceSwitcher(false);
      scheduleServiceSwitcher(serviceSwitcherHiddenTime);
    }, serviceSwitcherVisibleTime);
  }, delay);
}
serviceSwitcherToggle?.addEventListener("click", () => {
  setServiceSwitcher(false);
  scheduleServiceSwitcher(serviceSwitcherHiddenTime);
});
if (serviceSwitcher) scheduleServiceSwitcher(serviceSwitcherHiddenTime);
serviceSwitcherLinks.forEach(link => {
  link.addEventListener("click", () => {
    // Remove the card in the selection frame. Mobile browsers can resize the
    // visual viewport as navigation begins; leaving the fixed card visible
    // during that handoff makes it appear to jump vertically.
    window.clearTimeout(serviceSwitcherTimer);
    serviceSwitcher.style.setProperty("transition", "none", "important");
    serviceSwitcher.style.setProperty("display", "none", "important");
  }, { capture: true });
});
document.addEventListener("click", event => {
  if (serviceSwitcher?.classList.contains("is-open") && !serviceSwitcher.contains(event.target)) {
    setServiceSwitcher(false);
    scheduleServiceSwitcher(serviceSwitcherHiddenTime);
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && serviceSwitcher?.classList.contains("is-open")) {
    setServiceSwitcher(false);
    scheduleServiceSwitcher(serviceSwitcherHiddenTime);
  }
});
