/* Mobile navigation */
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");

if (navToggle && navMenu) {
  const close = () => {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
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
        (!search || card.dataset.search.includes(search)) &&
        (!category || card.dataset.category === category) &&
        (!month || card.dataset.month === month)
      );
    });

    sections.forEach((sec) => {
      const visible = sec.querySelectorAll("[data-event-card]:not([hidden])").length;
      const count = sec.querySelector("[data-event-count]");
      const empty = sec.querySelector("[data-filter-empty]");
      if (count) count.textContent = `${visible} event${visible === 1 ? "" : "s"}`;
      if (empty) empty.hidden = visible !== 0;
    });
  };

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
  let activeSlug = "";

  const setActive = (slug = "") => {
    activeSlug = slug;

    regionLinks.forEach((region) => {
      region.classList.toggle("is-active", region.dataset.mapRegion === slug);
    });

    tiles.forEach((tile) => {
      tile.classList.toggle("is-active", tile.dataset.mapTile === slug);
    });
  };

  const bindInteractiveState = (slug, source) => {
    source.addEventListener("mouseenter", () => setActive(slug));
    source.addEventListener("focus", () => setActive(slug));
    source.addEventListener("focusin", () => setActive(slug));
  };

  regionLinks.forEach((region) => {
    const slug = region.dataset.mapRegion;
    bindInteractiveState(slug, region);
  });

  tiles.forEach((tile) => {
    const slug = tile.dataset.mapTile;
    bindInteractiveState(slug, tile);
  });

  neighborhoodMap.addEventListener("mouseleave", () => setActive(activeSlug));

  const params = new URLSearchParams(window.location.search);
  const highlightSlug = params.get("highlight");

  if (highlightSlug && regionBySlug.has(highlightSlug) && tileBySlug.has(highlightSlug)) {
    setActive(highlightSlug);
    tileBySlug.get(highlightSlug).scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
