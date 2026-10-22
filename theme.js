// Runs before paint; shared by the hosted site and buildless GitHub Pages version.
(() => {
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let chosen = null;
  try { chosen = localStorage.getItem("portfolio-theme"); } catch { /* Storage may be disabled. */ }
  if (chosen !== "dark" && chosen !== "light") chosen = null;

  function updateButtons() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const dark = root.dataset.theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    });
  }
  function apply(theme) {
    root.dataset.theme = theme;
    updateButtons();
    window.dispatchEvent(new Event("portfolio-theme-change"));
  }
  apply(chosen || (system.matches ? "dark" : "light"));
  document.addEventListener("DOMContentLoaded", updateButtons);
  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("[data-theme-toggle]")) return;
    chosen = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("portfolio-theme", chosen); } catch { /* Keep toggling without persistence. */ }
    apply(chosen);
  });
  system.addEventListener("change", () => {
    if (!chosen) apply(system.matches ? "dark" : "light");
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== "portfolio-theme" && event.key !== null) return;
    chosen = event.newValue === "dark" || event.newValue === "light" ? event.newValue : null;
    apply(chosen || (system.matches ? "dark" : "light"));
  });
})();
