const button = document.querySelector(".menu-btn");
const overlay = document.querySelector(".overlay");
const header = document.querySelector(".header");
const brandImage = document.querySelector(".brand img");
function setMenu(open) {
  button.classList.toggle("active", open);
  overlay.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
  overlay.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
  updateHeaderTheme();
}
button.addEventListener("click", () => setMenu(!overlay.classList.contains("open")));

function revealPage() {
  document.body.classList.remove("is-page-leaving");
  requestAnimationFrame(() => document.body.classList.add("is-page-ready"));
}
revealPage();
window.addEventListener("pageshow", revealPage);

overlay.querySelectorAll("a[href]").forEach(link => link.addEventListener("click", event => {
  const destination = new URL(link.href, window.location.href);
  const sameDocument = destination.origin === window.location.origin && destination.pathname === window.location.pathname && destination.search === window.location.search;
  event.preventDefault();
  overlay.classList.add("is-closing-now");
  setMenu(false);

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
}));
document.addEventListener("keydown", event => { if (event.key === "Escape") setMenu(false); });
document.querySelector("#year").textContent = new Date().getFullYear();

function updateHeaderTheme() {
  const menuOpen = overlay.classList.contains("open");
  const points = document.elementsFromPoint(70, Math.min(55, window.innerHeight - 20));
  const point = points.find(element => !element.closest(".header"));
  const onDark = menuOpen || Boolean(point && point.closest(".advisory-section, .service-hero, .service-band, .service-cta, .footer"));
  header.classList.toggle("is-dark", onDark);
  const nextLogo = onDark ? "assets/images/vellcrest-logo-light.png" : "assets/images/vellcrest-logo-primary.png";
  if (!brandImage.src.endsWith(nextLogo)) brandImage.src = nextLogo;
}
window.addEventListener("scroll", updateHeaderTheme, { passive: true });
window.addEventListener("resize", updateHeaderTheme);
updateHeaderTheme();
