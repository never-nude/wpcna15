/* Mobile navigation */
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");

if (navToggle && navMenu) {
  const navToggleLabel = navToggle.querySelector("[data-nav-toggle-label]");
  const setNavState = (open) => {
    navMenu.classList.toggle("is-open", open);
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    if (navToggleLabel) {
      navToggleLabel.textContent = open ? "Close navigation" : "Open navigation";
    }
  };

  const close = () => {
    setNavState(false);
  };

  navToggle.addEventListener("click", () => {
    setNavState(!navMenu.classList.contains("is-open"));
  });

  navMenu.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });

  document.addEventListener("click", (e) => {
    if (!navMenu.classList.contains("is-open")) return;
    if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
    close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
      close();
      navToggle.focus();
    }
  });
}

/* Event filtering */
const filterForm = document.querySelector("[data-event-filters]");
const EVENT_TIME_ZONE = "America/New_York";

const getTimeZoneParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

const getNowKey = () => {
  const parts = getTimeZoneParts(new Date());
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const getEventEndKey = (card) => {
  const endDate = card.dataset.endDate || card.dataset.startDate;
  if (!endDate) return "";
  return `${endDate}T${card.dataset.endTime || "23:59"}`;
};

const markStaleUpcomingCards = () => {
  const nowKey = getNowKey();

  document.querySelectorAll("[data-upcoming-events] [data-event-card]").forEach((card) => {
    const endKey = getEventEndKey(card);
    const isPast = endKey && endKey < nowKey;
    card.dataset.clientPast = isPast ? "true" : "false";
    card.hidden = isPast;
  });
};

const updateEventSectionStates = (sections) => {
  sections.forEach((sec) => {
    const visible = sec.querySelectorAll("[data-event-card]:not([hidden])").length;
    const active = sec.querySelectorAll("[data-event-card]:not([data-client-past='true'])").length;
    const count = sec.querySelector("[data-event-count]");
    const filterEmpty = sec.querySelector("[data-filter-empty]");
    const upcomingEmpty = sec.querySelector("[data-upcoming-empty]");

    if (count) count.textContent = `${visible} event${visible === 1 ? "" : "s"}`;
    if (filterEmpty) filterEmpty.hidden = visible !== 0 || active === 0;
    if (upcomingEmpty) upcomingEmpty.hidden = active !== 0;
  });
};

markStaleUpcomingCards();
updateEventSectionStates(Array.from(new Set([
  ...document.querySelectorAll("[data-event-section]"),
  ...document.querySelectorAll("[data-upcoming-events]")
])));

if (filterForm) {
  const cards = Array.from(document.querySelectorAll("[data-event-card]"));
  const sections = Array.from(document.querySelectorAll("[data-event-section]"));

  const apply = () => {
    const fd = new FormData(filterForm);
    const search = String(fd.get("search") || "").trim().toLowerCase();
    const category = String(fd.get("category") || "");
    const month = String(fd.get("month") || "");

    cards.forEach((card) => {
      card.hidden = !(
        card.dataset.clientPast !== "true" &&
        (!search || card.dataset.search.includes(search)) &&
        (!category || card.dataset.category === category) &&
        (!month || card.dataset.month === month)
      );
    });

    updateEventSectionStates(sections);
  };

  apply();
  filterForm.addEventListener("input", apply);
  filterForm.addEventListener("change", apply);
  filterForm.addEventListener("reset", () => requestAnimationFrame(apply));
}

/* Carousel */
const track = document.querySelector("[data-carousel-track]");
const prev = document.querySelector("[data-carousel-prev]");
const next = document.querySelector("[data-carousel-next]");

if (track && prev && next) {
  const step = () => {
    const first = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).gap || "0");
    return first ? first.getBoundingClientRect().width + gap : track.clientWidth * 0.9;
  };

  const update = () => {
    const max = Math.max(0, track.scrollWidth - track.clientWidth - 2);
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  };

  prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  update();
}

/* Homepage photo carousel */
const homeCarousel = document.querySelector("[data-home-carousel]");

if (homeCarousel) {
  const slides = Array.from(homeCarousel.querySelectorAll("[data-home-carousel-slide]"));
  const prevBtn = homeCarousel.querySelector("[data-home-carousel-prev]");
  const nextBtn = homeCarousel.querySelector("[data-home-carousel-next]");
  const status = homeCarousel.querySelector("[data-home-carousel-status]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rotationDelayMs = 5000;
  let activeIndex = Math.max(0, slides.findIndex((slide) => !slide.hidden));
  let rotationTimer = 0;

  const showSlide = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;

      slide.hidden = !isActive;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    if (status) {
      status.textContent = `${activeIndex + 1} / ${slides.length}`;
    }
  };

  const stopRotation = () => {
    window.clearInterval(rotationTimer);
    rotationTimer = 0;
  };

  const startRotation = () => {
    stopRotation();

    if (slides.length < 2 || prefersReducedMotion.matches) {
      return;
    }

    rotationTimer = window.setInterval(() => {
      showSlide(activeIndex + 1);
    }, rotationDelayMs);
  };

  if (slides.length) {
    showSlide(activeIndex);
  }

  prevBtn?.addEventListener("click", () => {
    showSlide(activeIndex - 1);
    startRotation();
  });

  nextBtn?.addEventListener("click", () => {
    showSlide(activeIndex + 1);
    startRotation();
  });

  homeCarousel.addEventListener("mouseenter", stopRotation);
  homeCarousel.addEventListener("mouseleave", startRotation);
  homeCarousel.addEventListener("focusin", stopRotation);
  homeCarousel.addEventListener("focusout", (event) => {
    if (homeCarousel.contains(event.relatedTarget)) return;
    startRotation();
  });

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener("change", startRotation);
  } else if (typeof prefersReducedMotion.addListener === "function") {
    prefersReducedMotion.addListener(startRotation);
  }

  startRotation();
}

/* Community posting form */
const postingForm = document.querySelector("[data-posting-form]");

if (postingForm) {
  const statusEl = postingForm.querySelector("[data-posting-status]");
  const submitBtn = postingForm.querySelector("[data-posting-submit]");
  const messageField = postingForm.querySelector("#posting-message");
  const charHint = postingForm.querySelector("[data-char-count]");
  const maxLen = 240;

  // Character counter
  if (messageField && charHint) {
    const updateCount = () => {
      const remaining = maxLen - messageField.value.length;
      charHint.textContent = `${remaining} character${remaining === 1 ? "" : "s"} left`;
      charHint.style.color = remaining < 20 ? "var(--accent)" : "";
    };
    messageField.addEventListener("input", updateCount);
  }

  const showStatus = (msg, isError) => {
    statusEl.textContent = msg;
    statusEl.hidden = false;
    statusEl.className = "form-status " + (isError ? "form-status-error" : "form-status-success");
  };

  postingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending\u2026";

    const fd = new FormData(postingForm);
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      subject: fd.get("subject"),
      message: fd.get("message"),
      website: fd.get("website"),
    };

    try {
      const apiUrl = postingForm.dataset.postingApi;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showStatus("Sent. WPCNA will review your submission.", false);
        postingForm.reset();
        if (charHint) charHint.textContent = maxLen + " characters";
      } else {
        const data = await res.json().catch(() => ({}));
        showStatus(data.error || "Something went wrong. Please try again.", true);
      }
    } catch {
      showStatus("Could not reach the server. Please try again later.", true);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Send for review";
  });
}

/* Interactive neighborhood map */
const neighborhoodMap = document.querySelector("[data-neighborhood-map]");

if (neighborhoodMap) {
  const regionLinks = Array.from(neighborhoodMap.querySelectorAll("[data-map-region]"));
  const tiles = Array.from(neighborhoodMap.querySelectorAll("[data-map-tile]"));
  const tileBySlug = new Map(tiles.map((tile) => [tile.dataset.mapTile, tile]));
  const regionBySlug = new Map(regionLinks.map((region) => [region.dataset.mapRegion, region]));
  let pinnedSlug = "";

  const getKeyboardFocusSlug = () => {
    const focusedSource = neighborhoodMap.querySelector(
      "[data-map-region]:focus-visible, [data-map-tile]:focus-visible"
    );

    if (!focusedSource) return "";

    return focusedSource.dataset.mapRegion || focusedSource.dataset.mapTile || "";
  };

  const setActive = (slug = "") => {
    regionLinks.forEach((region) => {
      region.classList.toggle("is-active", region.dataset.mapRegion === slug);
    });

    tiles.forEach((tile) => {
      tile.classList.toggle("is-active", tile.dataset.mapTile === slug);
    });
  };

  const restoreActive = () => {
    setActive(getKeyboardFocusSlug() || pinnedSlug);
  };

  const bindInteractiveState = (slug, source) => {
    source.addEventListener("mouseenter", () => setActive(slug));

    source.addEventListener("mouseleave", restoreActive);

    source.addEventListener("focusin", () => {
      window.requestAnimationFrame(() => {
        if (source.matches(":focus-visible")) {
          setActive(slug);
        } else {
          restoreActive();
        }
      });
    });

    source.addEventListener("focusout", () => {
      window.requestAnimationFrame(restoreActive);
    });
  };

  regionLinks.forEach((region) => {
    const slug = region.dataset.mapRegion;
    bindInteractiveState(slug, region);
  });

  tiles.forEach((tile) => {
    const slug = tile.dataset.mapTile;
    bindInteractiveState(slug, tile);
  });

  neighborhoodMap.addEventListener("mouseleave", restoreActive);

  const params = new URLSearchParams(window.location.search);
  const highlightSlug = params.get("highlight");

  if (highlightSlug && regionBySlug.has(highlightSlug) && tileBySlug.has(highlightSlug)) {
    pinnedSlug = highlightSlug;
    setActive(highlightSlug);
    tileBySlug.get(highlightSlug).scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

/* Represented neighborhood modal */
const neighborhoodModal = document.querySelector("[data-neighborhood-modal]");

if (neighborhoodModal) {
  const dialog = neighborhoodModal.querySelector("[data-neighborhood-dialog]");
  const closeButton = neighborhoodModal.querySelector("[data-neighborhood-close]");
  const panels = Array.from(neighborhoodModal.querySelectorAll("[data-neighborhood-panel]"));
  const triggers = Array.from(document.querySelectorAll("[data-neighborhood-trigger]"));
  let lastTrigger = null;

  const getFocusableElements = () => {
    if (!dialog) return [];

    return Array.from(
      dialog.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(
      (element) =>
        !element.hidden &&
        !element.closest("[hidden]") &&
        !element.closest('[aria-hidden="true"]') &&
        element.getAttribute("aria-hidden") !== "true" &&
        element.offsetParent !== null
    );
  };

  const setActiveTriggers = (slug = "") => {
    triggers.forEach((trigger) => {
      trigger.classList.toggle("is-active", trigger.dataset.neighborhoodTarget === slug);
    });
  };

  const showPanel = (slug) => {
    const panel = panels.find((item) => item.dataset.neighborhoodPanel === slug);

    if (!panel || !dialog) return false;

    panels.forEach((item) => {
      const isActive = item === panel;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-hidden", String(!isActive));
    });

    const title = panel.querySelector("h2[id]");

    if (title) {
      dialog.setAttribute("aria-labelledby", title.id);
    } else {
      dialog.removeAttribute("aria-labelledby");
    }

    setActiveTriggers(slug);
    return true;
  };

  const openModal = (slug, trigger) => {
    if (!dialog) return;

    lastTrigger = trigger || null;
    neighborhoodModal.hidden = false;
    neighborhoodModal.removeAttribute("hidden");
    document.body.classList.add("has-modal-open");

    window.requestAnimationFrame(() => {
      if (!showPanel(slug)) {
        closeModal();
        return;
      }

      dialog.scrollTop = 0;
      dialog.focus();
    });
  };

  const closeModal = () => {
    if (neighborhoodModal.hidden) return;

    neighborhoodModal.hidden = true;
    neighborhoodModal.setAttribute("hidden", "");
    document.body.classList.remove("has-modal-open");
    panels.forEach((panel) => {
      panel.classList.remove("is-active");
      panel.setAttribute("aria-hidden", "true");
    });
    setActiveTriggers("");

    const returnTarget =
      lastTrigger?.dataset.mapRegion && lastTrigger.dataset.neighborhoodTarget
        ? document.querySelector(`[data-map-tile="${lastTrigger.dataset.neighborhoodTarget}"]`) || lastTrigger
        : lastTrigger;

    if (returnTarget && typeof returnTarget.focus === "function") {
      returnTarget.focus();
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (trigger.hasAttribute("href")) {
        event.preventDefault();
      }

      openModal(trigger.dataset.neighborhoodTarget || "", trigger);
    });
  });

  closeButton?.addEventListener("click", closeModal);

  neighborhoodModal.addEventListener("click", (event) => {
    if (event.target === neighborhoodModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (neighborhoodModal.hidden || !dialog) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements();

    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
