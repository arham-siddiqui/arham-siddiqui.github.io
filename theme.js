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

if (window.matchMedia("(pointer: fine)").matches) {
  const cursorGlow = document.createElement("div");
  cursorGlow.className = "cursor-glow";
  cursorGlow.setAttribute("aria-hidden", "true");
  document.body.append(cursorGlow);

  window.addEventListener("pointermove", (event) => {
    document.body.classList.add("has-cursor-glow");
    cursorGlow.style.setProperty("--cursor-x", `${event.clientX}px`);
    cursorGlow.style.setProperty("--cursor-y", `${event.clientY}px`);
    cursorGlow.style.opacity = "0.62";
  });

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("has-cursor-glow");
    cursorGlow.style.opacity = "0";
  });
}

const filterButtons = [...document.querySelectorAll(".filter-btn[data-filter]")];
const projectCards = [...document.querySelectorAll(".project-card[data-category]")];

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    projectCards.forEach((card) => {
      const categories = card.dataset.category.split(/\s+/);
      card.classList.toggle("is-hidden", filter !== "all" && !categories.includes(filter));
    });
  });
});

document.querySelectorAll(".project-gallery").forEach((gallery) => {
  const slides = [...gallery.querySelectorAll(".project-slide")];
  const thumbs = [...gallery.querySelectorAll(".project-thumb")];
  const previous = gallery.querySelector(".gallery-nav-prev");
  const next = gallery.querySelector(".gallery-nav-next");
  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));

  function setActive(index) {
    if (!slides.length) return;
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("is-active", isActive);
      if (!isActive) {
        slide.querySelectorAll("video").forEach((video) => video.pause());
      }
    });
    thumbs.forEach((thumb, thumbIndex) => {
      thumb.classList.toggle("is-active", thumbIndex === activeIndex);
      thumb.setAttribute("aria-selected", String(thumbIndex === activeIndex));
    });
  }

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => setActive(index));
  });

  previous?.addEventListener("click", () => setActive(activeIndex - 1));
  next?.addEventListener("click", () => setActive(activeIndex + 1));
  setActive(activeIndex);
});

const resumePanel = document.querySelector(".resume-panel");

if (resumePanel) {
  const resumeMapLinks = [...document.querySelectorAll(".resume-scroll-map a[data-resume-target]")];
  const resumeSections = [...document.querySelectorAll(".resume-section[data-resume-section]")];
  const resumeVisual = document.querySelector(".resume-visual");
  const resumeBrainCalloutShell = document.querySelector(".resume-brain-callout");
  const resumeBrainCallout = resumeBrainCalloutShell?.querySelector("span");
  let resumeScrollTarget = resumePanel.scrollTop;
  let resumeScrollFrame = null;
  let activeResumeSection = null;
  let resumeScrambleFrame = null;
  let resumeFadeTimeout = null;
  let lockedResumeSection = null;
  let pendingResumeReveal = null;
  const resumeSectionLabels = {
    industry: "Industry Experience",
    projects: "Projects",
    leadership: "Leadership",
    skills: "Skills"
  };
  const scrambleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&";

  function getScrambledText(label, resolvedCount = 0) {
    let nextText = "";

    for (let index = 0; index < label.length; index += 1) {
      const character = label[index];

      if (character === " ") {
        nextText += " ";
      } else if (index < resolvedCount) {
        nextText += character;
      } else {
        nextText += scrambleCharacters[Math.floor(Math.random() * scrambleCharacters.length)];
      }
    }

    return nextText;
  }

  function scrambleResumeLabel(label) {
    if (!resumeBrainCallout) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      resumeBrainCallout.textContent = label;
      return;
    }

    if (resumeScrambleFrame) {
      window.clearInterval(resumeScrambleFrame);
      resumeScrambleFrame = null;
    }

    const frameDelay = 56;
    const holdFrames = 4;
    const resolveFrames = Math.max(14, label.length + 7);
    let frameIndex = 0;
    resumeBrainCallout.textContent = getScrambledText(label);

    resumeScrambleFrame = window.setInterval(() => {
      const resolveProgress = Math.max(0, frameIndex - holdFrames);
      const resolvedCount = Math.min(label.length, Math.floor(resolveProgress * 0.9));
      resumeBrainCallout.textContent = getScrambledText(label, resolvedCount);
      frameIndex += 1;

      if (frameIndex >= resolveFrames || resolvedCount >= label.length) {
        resumeBrainCallout.textContent = label;
        window.clearInterval(resumeScrambleFrame);
        resumeScrambleFrame = null;
      }
    }, frameDelay);
  }

  function revealResumeLabel(label) {
    if (!resumeBrainCallout) return;

    if (resumeScrambleFrame) {
      window.clearInterval(resumeScrambleFrame);
      resumeScrambleFrame = null;
    }

    if (resumeFadeTimeout) {
      window.clearTimeout(resumeFadeTimeout);
      resumeFadeTimeout = null;
    }

    if (!resumeBrainCalloutShell || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scrambleResumeLabel(label);
      return;
    }

    resumeBrainCallout.textContent = getScrambledText(label);
    resumeBrainCalloutShell.classList.add("is-switching");
    resumeFadeTimeout = window.setTimeout(() => {
      resumeBrainCalloutShell.classList.remove("is-switching");
      scrambleResumeLabel(label);
      resumeBrainCalloutShell.classList.remove("is-fading");
      resumeFadeTimeout = null;
    }, 34);
  }

  function setActiveResumeSection(sectionName) {
    resumeMapLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.resumeTarget === sectionName);
    });

    if (resumeVisual) {
      resumeVisual.dataset.activeResume = sectionName;
    }

    if (activeResumeSection === sectionName) return;
    activeResumeSection = sectionName;

    resumeBrainCalloutShell?.classList.add("is-fading", "is-switching");
    pendingResumeReveal = sectionName;

    window.dispatchEvent(
      new CustomEvent("resume-brain-section", {
        detail: { section: sectionName }
      })
    );
  }

  window.addEventListener("resume-brain-section-ready", (event) => {
    const sectionName = event.detail?.section;
    if (!sectionName || sectionName !== pendingResumeReveal || sectionName !== activeResumeSection) return;

    pendingResumeReveal = null;
    if (resumeBrainCallout) {
      revealResumeLabel(resumeSectionLabels[sectionName] || sectionName);
    }
  });

  function updateResumeMap() {
    if (!resumeSections.length) return;

    if (lockedResumeSection) {
      setActiveResumeSection(lockedResumeSection);
      return;
    }

    const maxScroll = resumePanel.scrollHeight - resumePanel.clientHeight;
    if (resumePanel.scrollTop >= maxScroll - 2) {
      setActiveResumeSection(resumeSections[resumeSections.length - 1].dataset.resumeSection);
      return;
    }

    const probe = resumePanel.scrollTop + resumePanel.clientHeight * 0.34;
    let active = resumeSections[0];

    resumeSections.forEach((section) => {
      if (section.offsetTop <= probe) active = section;
    });

    setActiveResumeSection(active.dataset.resumeSection);
  }

  function animateResumeScroll() {
    const distance = resumeScrollTarget - resumePanel.scrollTop;

    if (Math.abs(distance) < 0.5) {
      resumePanel.scrollTop = resumeScrollTarget;
      resumeScrollFrame = null;
      if (lockedResumeSection) {
        setActiveResumeSection(lockedResumeSection);
        lockedResumeSection = null;
      }
      return;
    }

    resumePanel.scrollTop += distance * 0.18;
    updateResumeMap();
    resumeScrollFrame = window.requestAnimationFrame(animateResumeScroll);
  }

  window.addEventListener(
    "wheel",
    (event) => {
      if (window.innerWidth <= 980) return;

      const maxScroll = resumePanel.scrollHeight - resumePanel.clientHeight;
      if (maxScroll <= 0) return;

      const nextScroll = Math.max(0, Math.min(maxScroll, resumeScrollTarget + event.deltaY));
      if (nextScroll === resumeScrollTarget) return;

      event.preventDefault();
      resumeScrollTarget = nextScroll;
      lockedResumeSection = null;

      if (!resumeScrollFrame) {
        resumeScrollFrame = window.requestAnimationFrame(animateResumeScroll);
      }
    },
    { passive: false }
  );

  resumePanel.addEventListener("scroll", () => {
    if (!resumeScrollFrame) resumeScrollTarget = resumePanel.scrollTop;
    updateResumeMap();
  });

  resumeMapLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      const maxScroll = resumePanel.scrollHeight - resumePanel.clientHeight;
      const targetScroll = link.dataset.resumeTarget === "skills"
        ? maxScroll
        : resumePanel.scrollTop + target.getBoundingClientRect().top - resumePanel.getBoundingClientRect().top;
      resumeScrollTarget = Math.max(0, Math.min(maxScroll, targetScroll));
      lockedResumeSection = link.dataset.resumeTarget;
      setActiveResumeSection(link.dataset.resumeTarget);

      if (!resumeScrollFrame) {
        resumeScrollFrame = window.requestAnimationFrame(animateResumeScroll);
      }
    });
  });

  updateResumeMap();
}

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

setActiveSection(sections[0]?.id || "industry");

document.querySelectorAll(".intro-link[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const offset = Math.min(150, window.innerHeight * 0.18);

    window.scrollTo({
      top: Math.max(0, targetTop - offset),
      behavior: "smooth"
    });

    history.pushState(null, "", link.getAttribute("href"));

    window.clearTimeout(target.pulseTimeout);
    target.classList.remove("is-pulsing");
    window.requestAnimationFrame(() => {
      target.classList.add("is-pulsing");
    });

    target.pulseTimeout = window.setTimeout(() => {
      target.classList.remove("is-pulsing");
    }, 1900);
  });
});
