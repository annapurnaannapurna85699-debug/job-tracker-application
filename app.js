function getTextFromElement(el) {
  if (!el) return "";
  return (el.innerText || el.textContent || "").trim();
}

async function copyToClipboard(text) {
  if (!text) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function setButtonFeedback(btn, nextLabel) {
  const prev = btn.textContent || "";
  btn.textContent = nextLabel;
  window.setTimeout(() => {
    btn.textContent = prev;
  }, 1200);
}

const routes = {
  "/": {
    kind: "landing",
  },
  "/dashboard": {
    kind: "page",
    title: "Dashboard",
    body: "No jobs yet. In the next step, you will load a realistic dataset.",
  },
  "/saved": {
    kind: "page",
    title: "Saved",
    body: "No saved jobs yet. This space will hold roles you explicitly save once data is connected.",
  },
  "/digest": {
    kind: "page",
    title: "Digest",
    body: "No digest generated yet. A daily summary will appear here when the feature is wired.",
  },
  "/settings": {
    kind: "settings",
    title: "Settings",
    body: "Preference controls for the Job Notification Tracker. These fields are placeholders only; nothing is saved yet.",
  },
  "/proof": {
    kind: "page",
    title: "Proof",
    body: "Placeholder page for artifact collection. In a later step, this will gather evidence that the system is working.",
  },
};

let currentPath = null;
let rootSection = null;
let settingsSection = null;
let placeholderSection = null;
let placeholderTitle = null;
let placeholderSubtext = null;
let navElement = null;
let navLinks = [];
let navToggle = null;

function getRouteForPath(path) {
  const match = routes[path];
  if (match) return match;

  return {
    kind: "page",
    title: "Page Not Found",
    body: "The page you are looking for does not exist.",
    notFound: true,
  };
}

function renderRoute(path, route) {
  currentPath = path;

  if (rootSection) rootSection.hidden = true;
  if (settingsSection) settingsSection.hidden = true;
  if (placeholderSection) placeholderSection.hidden = true;

  if (route.kind === "landing" && rootSection) {
    rootSection.hidden = false;
  } else if (route.kind === "settings" && settingsSection) {
    settingsSection.hidden = false;
  } else if (placeholderSection) {
    placeholderSection.hidden = false;
    if (placeholderTitle) {
      placeholderTitle.textContent = route.title || "";
    }
    if (placeholderSubtext) {
      placeholderSubtext.textContent = route.body || "";
    }
  }

  navLinks.forEach((link) => {
    const routeAttr = link.getAttribute("data-route");
    const isActive = routeAttr === path;
    if (isActive) {
      link.classList.add("nav__link--active");
    } else {
      link.classList.remove("nav__link--active");
    }
  });

  if (navElement && navElement.getAttribute("data-open") === "true") {
    navElement.setAttribute("data-open", "false");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
    }
  }
}

function navigate(path, options) {
  const opts = options || {};
  const targetPath = path || "/";

  if (targetPath === currentPath) {
    return;
  }

  const route = getRouteForPath(targetPath);
  if (!opts.silent) {
    const method = opts.replace ? "replaceState" : "pushState";
    window.history[method]({}, "", targetPath);
  }
  renderRoute(targetPath, route);
}

function initRouter() {
  rootSection = document.getElementById("route-root");
  settingsSection = document.getElementById("settings-root");
  placeholderSection = document.getElementById("route-placeholder");
  placeholderTitle = document.getElementById("routeTitle");
  placeholderSubtext = document.getElementById("routeSubtext");
  navElement = document.querySelector(".nav");
  navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav-link]"));
  navToggle = navElement ? navElement.querySelector(".nav__toggle") : null;

  const initialPath = window.location.pathname || "/";
  const initialRoute = getRouteForPath(initialPath);
  renderRoute(initialPath, initialRoute);

  window.addEventListener("popstate", () => {
    const path = window.location.pathname || "/";
    navigate(path, { silent: true, replace: true });
  });
}

document.addEventListener("click", async (e) => {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;

  const copyBtn = target.closest("[data-copy]");
  if (copyBtn) {
    const selector = copyBtn.getAttribute("data-copy");
    if (!selector) return;

    const el = document.querySelector(selector);
    const text = getTextFromElement(el);
    const ok = await copyToClipboard(text);

    setButtonFeedback(copyBtn, ok ? "Copied" : "Copy failed");
    return;
  }

  const toggle = target.closest(".nav__toggle");
  if (toggle && navElement) {
    const open = navElement.getAttribute("data-open") === "true";
    const next = open ? "false" : "true";
    navElement.setAttribute("data-open", next);
    toggle.setAttribute("aria-expanded", next === "true" ? "true" : "false");
    return;
  }

  const navLink = target.closest("[data-nav-link]");
  if (navLink) {
    const routeAttr = navLink.getAttribute("data-route") || "/";
    e.preventDefault();
    navigate(routeAttr, { replace: false });
  }
});

initRouter();
