// Replace only page content: the theme toggle and live shark canvas never unmount.
(() => {
  if (!/^https?:$/.test(window.location.protocol)) return;
  const directory = new URL("./", window.location.href);
  const allowed = new Set([
    directory.pathname,
    new URL("index.html", directory).pathname,
    new URL("projects.html", directory).pathname,
  ]);
  const cache = new Map();
  let renderedPath = window.location.pathname;
  let pending = 0;

  function snapshot() {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || "",
      main: document.querySelector("main").outerHTML,
    };
  }
  cache.set(renderedPath, snapshot());

  async function navigate(url, push) {
    const request = ++pending;
    try {
      let page = cache.get(url.pathname);
      if (!page) {
        const response = await fetch(url.pathname + url.search);
        if (!response.ok) throw new Error("Page unavailable");
        const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
        const main = parsed.querySelector("main");
        if (!main) throw new Error("Missing page content");
        page = {
          title: parsed.title,
          description: parsed.querySelector('meta[name="description"]')?.content || "",
          main: main.outerHTML,
        };
        cache.set(url.pathname, page);
      }
      if (request !== pending) return;
      const template = document.createElement("template");
      template.innerHTML = page.main;
      const main = template.content.querySelector("main");
      // Cached project markup must bind to its new DOM, not reuse detached listeners.
      main.querySelectorAll("[data-bound]").forEach((node) => node.removeAttribute("data-bound"));
      main.querySelectorAll("dialog[open]").forEach((dialog) => dialog.removeAttribute("open"));
      if (push) window.history.pushState(null, "", url.href);
      document.querySelector("main").replaceWith(main);
      document.title = page.title;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = page.description;
      renderedPath = url.pathname;
      window.mountProjects?.();
      window.scrollTo(0, 0);
      if (!main.querySelector("dialog[open]")) {
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }
    } catch {
      if (request === pending) window.location.assign(url.href);
    }
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !allowed.has(url.pathname)) return;
    if (url.pathname === renderedPath) return;
    event.preventDefault();
    navigate(url, true);
  });
  window.addEventListener("popstate", () => {
    const url = new URL(window.location.href);
    if (url.pathname !== renderedPath) navigate(url, false);
  });
})();
