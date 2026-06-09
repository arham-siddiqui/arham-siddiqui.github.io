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

const navLinks = [...document.querySelectorAll(".topline a[href^='#']")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setActiveSection(sectionId) {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${sectionId}`);
  });
}

if ("IntersectionObserver" in window && sections.length) {
  const visibleSections = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry.intersectionRatio);
        } else {
          visibleSections.delete(entry.target.id);
        }
      });

      const active = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0];
      if (active) setActiveSection(active[0]);
    },
    {
      rootMargin: "-18% 0px -58% 0px",
      threshold: [0.08, 0.2, 0.4, 0.6]
    }
  );

  sections.forEach((section) => observer.observe(section));
} else {
  window.addEventListener("scroll", () => {
    const active = sections
      .map((section) => ({
        id: section.id,
        distance: Math.abs(section.getBoundingClientRect().top - 120)
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (active) setActiveSection(active.id);
  });
}

setActiveSection(sections[0]?.id || "experience");
