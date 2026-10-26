/* Replace the placeholder below once Kishore's final LinkedIn URL is available. */
const VELLCREST_LINKEDIN_URL = "https://www.linkedin.com/in/kishore-iyer-6443a014/";

document.querySelectorAll("[data-linkedin], .linkedin-link").forEach((link) => {
  if (VELLCREST_LINKEDIN_URL) {
    link.href = VELLCREST_LINKEDIN_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  } else {
    link.addEventListener("click", (event) => event.preventDefault());
    link.setAttribute("aria-disabled", "true");
  }
});
