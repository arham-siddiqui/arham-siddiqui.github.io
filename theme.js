const themeToggle = document.querySelector(".theme-toggle");
const root = document.documentElement;

function setTheme(isDark) {
  root.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  themeToggle.setAttribute("title", `Switch to ${isDark ? "light" : "dark"} mode`);
}

setTheme(root.classList.contains("dark"));

themeToggle.addEventListener("click", () => {
  setTheme(!root.classList.contains("dark"));
});
