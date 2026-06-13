const body = document.body;

window.addEventListener("load", () => {
  const preloader = document.querySelector(".preloader");
  if (preloader) {
    window.setTimeout(() => preloader.classList.add("hide"), 250);
  }
});

const drawer = document.querySelector(".mobile-drawer");
const drawerOpenButtons = document.querySelectorAll(".menu-toggle, .bottom-menu");
const drawerCloseButton = document.querySelector(".drawer-close");

function setDrawer(open) {
  if (!drawer) return;
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  body.classList.toggle("drawer-open", open);
}

drawerOpenButtons.forEach((button) => {
  button.addEventListener("click", () => setDrawer(true));
});

drawerCloseButton?.addEventListener("click", () => setDrawer(false));

drawer?.addEventListener("click", (event) => {
  if (event.target === drawer) {
    setDrawer(false);
  }
});

document.querySelectorAll(".drawer-accordion").forEach((button) => {
  button.addEventListener("click", () => {
    const links = button.nextElementSibling;
    if (!links) return;
    links.classList.toggle("open");
    button.classList.toggle("active");
  });
});

const searchModal = document.querySelector(".search-modal");
const searchOpenButtons = document.querySelectorAll(".mobile-search-toggle, .bottom-search");
const searchCloseButton = document.querySelector(".search-close");

function setSearch(open) {
  if (!searchModal) return;
  searchModal.classList.toggle("open", open);
  searchModal.setAttribute("aria-hidden", String(!open));
  body.classList.toggle("search-open", open);

  if (open) {
    window.setTimeout(() => searchModal.querySelector("input")?.focus(), 120);
  }
}

searchOpenButtons.forEach((button) => {
  button.addEventListener("click", () => setSearch(true));
});

searchCloseButton?.addEventListener("click", () => setSearch(false));

searchModal?.addEventListener("click", (event) => {
  if (event.target === searchModal) {
    setSearch(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setDrawer(false);
    setSearch(false);
    setQuickview(false);
  }
});

const slides = Array.from(document.querySelectorAll(".hero-slide"));
const dotsContainer = document.querySelector(".slider-dots");
const nextButton = document.querySelector(".slider-arrow.next");
const prevButton = document.querySelector(".slider-arrow.prev");
let currentSlide = 0;
let sliderTimer;

function showSlide(index) {
  if (!slides.length) return;
  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === currentSlide);
  });

  document.querySelectorAll(".slider-dots button").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === currentSlide);
  });
}

function startSlider() {
  if (slides.length < 2) return;
  window.clearInterval(sliderTimer);
  sliderTimer = window.setInterval(() => showSlide(currentSlide + 1), 5500);
}

slides.forEach((_, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `Show campaign ${index + 1}`);
  dot.addEventListener("click", () => {
    showSlide(index);
    startSlider();
  });
  dotsContainer?.appendChild(dot);
});

nextButton?.addEventListener("click", () => {
  showSlide(currentSlide + 1);
  startSlider();
});

prevButton?.addEventListener("click", () => {
  showSlide(currentSlide - 1);
  startSlider();
});

showSlide(0);
startSlider();

const categorySlider = document.querySelector(".category-card-grid");
const categoryPrev = document.querySelector(".category-prev");
const categoryNext = document.querySelector(".category-next");

function getCategoryStep() {
  if (!categorySlider) return 0;
  const card = categorySlider.querySelector(".category-card");
  if (!card) return categorySlider.clientWidth;
  const styles = window.getComputedStyle(categorySlider);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
  return card.getBoundingClientRect().width + gap;
}

function updateCategoryArrows() {
  if (!categorySlider || !categoryPrev || !categoryNext) return;
  const maxScroll = categorySlider.scrollWidth - categorySlider.clientWidth;
  const hasScroll = maxScroll > 2;

  categoryPrev.disabled = !hasScroll || categorySlider.scrollLeft <= 2;
  categoryNext.disabled = !hasScroll || categorySlider.scrollLeft >= maxScroll - 2;
}

function scrollCategory(direction) {
  if (!categorySlider) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  categorySlider.scrollBy({ left: direction * getCategoryStep(), behavior });
}

categoryPrev?.addEventListener("click", () => scrollCategory(-1));

categoryNext?.addEventListener("click", () => scrollCategory(1));

categorySlider?.addEventListener("scroll", updateCategoryArrows, { passive: true });

categorySlider?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    scrollCategory(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    scrollCategory(1);
  }
});

window.addEventListener("resize", updateCategoryArrows);
updateCategoryArrows();

const tablist = document.querySelector('.new-arrivals [role="tablist"]');
const tabs = tablist ? Array.from(tablist.querySelectorAll('[role="tab"]')) : [];
const products = Array.from(document.querySelectorAll(".new-arrivals .product-card"));
const naGrid = document.getElementById("na-grid");
const naStatus = document.querySelector(".new-arrivals .result-count");
const naEmpty = document.querySelector(".new-arrivals .empty-state");
const tabIndicator = document.querySelector(".new-arrivals .tab-indicator");
const naLabels = { all: "New Arrivals", men: "Men", women: "Women", kids: "Kids" };
let naReclamp = null; // assigned by setupLoadMore() once the section is wired

function moveIndicator(tab) {
  if (!tabIndicator || !tab) return;
  tabIndicator.style.width = `${tab.offsetWidth}px`;
  tabIndicator.style.transform = `translateX(${tab.offsetLeft}px)`;
}

function applyFilter(filter) {
  let shown = 0;
  products.forEach((product) => {
    const matches = filter === "all" || product.dataset.category === filter;
    product.classList.toggle("is-hidden", !matches);
    if (matches) shown += 1;
  });

  if (naStatus) {
    const scope = filter === "all" ? "" : `${naLabels[filter]} `;
    naStatus.textContent = `Showing ${shown} ${scope}product${shown === 1 ? "" : "s"}`
      .replace(/\s+/g, " ")
      .trim();
  }
  if (naEmpty) naEmpty.hidden = shown !== 0;
  if (naGrid) naGrid.hidden = shown === 0;
  if (naReclamp) naReclamp(true); // re-collapse to 2 rows on each filter change (mobile)
}

function selectTab(tab) {
  tabs.forEach((item) => {
    const isActive = item === tab;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });
  if (naGrid) naGrid.setAttribute("aria-labelledby", tab.id);
  applyFilter(tab.dataset.filter);
  moveIndicator(tab);
}

tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab)));

tablist?.addEventListener("keydown", (event) => {
  const index = tabs.indexOf(document.activeElement);
  if (index < 0) return;

  let next;
  if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else return;

  event.preventDefault();
  tabs[next].focus();
  selectTab(tabs[next]);
});

document.querySelector(".new-arrivals .empty-reset")?.addEventListener("click", () => {
  const allTab = tabs.find((tab) => tab.dataset.filter === "all");
  if (allTab) {
    allTab.focus();
    selectTab(allTab);
  }
});

// Card interactions (wishlist toggle, swatch select, add-to-cart feedback),
// delegated on EVERY product grid so New Arrivals AND Flash Sale both work.
document.querySelectorAll(".product-grid").forEach((grid) => {
  grid.addEventListener("click", (event) => {
    const swatch = event.target.closest(".swatch");
    if (swatch) {
      swatch.parentElement
        .querySelectorAll(".swatch")
        .forEach((item) => item.classList.remove("is-selected"));
      swatch.classList.add("is-selected");
      return;
    }

    const wishlist = event.target.closest(".wishlist");
    if (wishlist) {
      const pressed = wishlist.getAttribute("aria-pressed") === "true";
      wishlist.setAttribute("aria-pressed", String(!pressed));
      const icon = wishlist.querySelector("i");
      if (icon) icon.className = pressed ? "fa-regular fa-heart" : "fa-solid fa-heart";
      return;
    }

    const cart = event.target.closest(".add-cart-button");
    if (cart && !cart.dataset.busy) {
      cart.dataset.busy = "1";
      const original = cart.innerHTML;
      cart.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Added';
      window.setTimeout(() => {
        cart.innerHTML = original;
        delete cart.dataset.busy;
      }, 1600);
    }
  });
});

if (tablist) {
  const activeTab = tablist.querySelector(".tab.active");
  moveIndicator(activeTab);
  window.addEventListener("load", () => moveIndicator(tablist.querySelector(".tab.active")));
  window.addEventListener("resize", () => moveIndicator(tablist.querySelector(".tab.active")));
}

applyFilter("all");

/* ===== "Load More" (mobile: show 2 rows, reveal the rest) ===== */
function setupLoadMore(section) {
  if (!section) return null;
  const grid = section.querySelector(".product-grid");
  const wrap = section.querySelector(".load-more-wrap");
  const btn = wrap && wrap.querySelector(".load-more-btn");
  if (!grid || !btn) return null;

  const LIMIT = 4; // 2 rows on the 2-column mobile grid
  const mq = window.matchMedia("(max-width: 767px)");
  let expanded = false;

  function apply(reset) {
    if (reset) expanded = false;
    const cards = Array.prototype.slice.call(grid.querySelectorAll(".product-card"));
    const visible = cards.filter((c) => !c.classList.contains("is-hidden"));
    cards.forEach((c) => c.classList.remove("na-clamped"));
    const clamp = mq.matches && !expanded;
    if (clamp) {
      visible.forEach((c, i) => {
        if (i >= LIMIT) c.classList.add("na-clamped");
      });
    }
    const remaining = visible.length - LIMIT;
    const need = clamp && remaining > 0;
    wrap.hidden = !need; // hide the whole wrap so no empty gap remains
    const count = btn.querySelector(".load-more-count");
    if (count) count.textContent = need ? "(" + remaining + ")" : "";
  }

  btn.addEventListener("click", () => {
    expanded = true;
    apply();
    // Move focus to the first newly revealed product for keyboard users.
    const visible = Array.prototype.slice
      .call(grid.querySelectorAll(".product-card"))
      .filter((c) => !c.classList.contains("is-hidden"));
    const link = visible[LIMIT] && visible[LIMIT].querySelector("h3 a");
    if (link) link.focus();
  });

  if (mq.addEventListener) mq.addEventListener("change", () => apply());
  else window.addEventListener("resize", () => apply());

  apply();
  return apply;
}

naReclamp = setupLoadMore(document.querySelector(".new-arrivals"));
setupLoadMore(document.querySelector(".flash-sale"));

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setSearch(false);
  });
});

/* ===== Product Quick-View Modal ===== */
const quickviewModal = document.querySelector(".quickview-modal");
const quickviewClose = document.querySelector(".quickview-close");
let qvTrigger = null;

function getFocusable(container) {
  return Array.from(
    container.querySelectorAll('button, [href], input, select, [tabindex]:not([tabindex="-1"])')
  ).filter((el) => !el.hidden && el.offsetParent !== null);
}

function parsePrice(text) {
  const n = Number((text || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function populateQuickview(card) {
  if (!quickviewModal || !card) return;
  const img = card.querySelector(".product-image img");
  const title = card.querySelector("h3 a")?.textContent.trim() || "Product";
  const cat = card.querySelector(".meta-cat")?.textContent.trim() || "";
  const nowEl = card.querySelector(".price-now");
  const wasEl = card.querySelector(".price-was");

  const qvImg = quickviewModal.querySelector(".qv-image");
  if (img && qvImg) {
    qvImg.src = img.src;
    qvImg.alt = img.alt || title;
  }
  quickviewModal.querySelector(".qv-title").textContent = title;
  quickviewModal.querySelector(".qv-cat").textContent = cat;

  const nowOut = quickviewModal.querySelector(".qv-price-now");
  const wasOut = quickviewModal.querySelector(".qv-price-was");
  const disc = quickviewModal.querySelector(".qv-discount");
  nowOut.textContent = nowEl?.textContent.trim() || "";
  const isSale = !!wasEl || nowEl?.classList.contains("is-sale");
  nowOut.classList.toggle("is-sale", !!isSale);

  if (wasEl) {
    wasOut.textContent = wasEl.textContent.trim();
    wasOut.hidden = false;
    const now = parsePrice(nowEl?.textContent);
    const was = parsePrice(wasEl.textContent);
    if (was > now && now > 0) {
      disc.textContent = `-${Math.round((1 - now / was) * 100)}%`;
      disc.hidden = false;
    } else {
      disc.hidden = true;
    }
  } else {
    wasOut.hidden = true;
    disc.hidden = true;
  }

  // Color options (from card swatches if present); hide the field when none.
  const colorField = quickviewModal.querySelector(".qv-color-field");
  const colorWrap = quickviewModal.querySelector(".qv-colors");
  colorWrap.innerHTML = "";
  const swatches = card.querySelectorAll(".swatch");
  swatches.forEach((sw, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "qv-color" + (i === 0 ? " is-selected" : "");
    b.style.setProperty("--color", sw.style.getPropertyValue("--color").trim() || "#ccc");
    b.setAttribute("aria-label", sw.getAttribute("aria-label") || `Color ${i + 1}`);
    b.setAttribute("aria-pressed", String(i === 0));
    colorWrap.appendChild(b);
  });
  if (colorField) colorField.hidden = swatches.length === 0;

  // Reset quantity + size
  quickviewModal.querySelector(".qv-qty-value").textContent = "1";
}

function setQuickview(open, trigger) {
  if (!quickviewModal) return;
  quickviewModal.classList.toggle("open", open);
  quickviewModal.setAttribute("aria-hidden", String(!open));
  body.classList.toggle("quickview-open", open);

  if (open) {
    qvTrigger = trigger || null;
    window.setTimeout(() => quickviewClose?.focus(), 120);
  } else if (qvTrigger) {
    qvTrigger.focus();
    qvTrigger = null;
  }
}

// Document-level delegation so any .quickview button (New Arrivals + Flash Sale) works.
document.addEventListener("click", (event) => {
  const qvBtn = event.target.closest(".quickview");
  if (qvBtn) {
    const card = qvBtn.closest(".product-card");
    if (card) {
      populateQuickview(card);
      setQuickview(true, qvBtn);
    }
  }
});

quickviewClose?.addEventListener("click", () => setQuickview(false));

quickviewModal?.addEventListener("click", (event) => {
  if (event.target === quickviewModal) setQuickview(false);

  const size = event.target.closest(".qv-size");
  if (size) {
    quickviewModal.querySelectorAll(".qv-size").forEach((s) => s.setAttribute("aria-checked", "false"));
    size.setAttribute("aria-checked", "true");
    return;
  }

  const color = event.target.closest(".qv-color");
  if (color) {
    quickviewModal.querySelectorAll(".qv-color").forEach((c) => {
      c.classList.remove("is-selected");
      c.setAttribute("aria-pressed", "false");
    });
    color.classList.add("is-selected");
    color.setAttribute("aria-pressed", "true");
    return;
  }

  const valEl = quickviewModal.querySelector(".qv-qty-value");
  if (event.target.closest(".qv-qty-minus")) {
    valEl.textContent = String(Math.max(1, parseInt(valEl.textContent, 10) - 1));
    return;
  }
  if (event.target.closest(".qv-qty-plus")) {
    valEl.textContent = String(Math.min(99, parseInt(valEl.textContent, 10) + 1));
    return;
  }

  const wl = event.target.closest(".qv-wishlist");
  if (wl) {
    const pressed = wl.getAttribute("aria-pressed") === "true";
    wl.setAttribute("aria-pressed", String(!pressed));
    const icon = wl.querySelector("i");
    if (icon) icon.className = pressed ? "fa-regular fa-heart" : "fa-solid fa-heart";
    return;
  }

  const cart = event.target.closest(".qv-add-cart");
  if (cart && !cart.dataset.busy) {
    cart.dataset.busy = "1";
    const original = cart.innerHTML;
    cart.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Added';
    window.setTimeout(() => {
      cart.innerHTML = original;
      delete cart.dataset.busy;
    }, 1600);
  }
});

quickviewModal?.addEventListener("keydown", (event) => {
  if (event.key !== "Tab" || !quickviewModal.classList.contains("open")) return;
  const f = getFocusable(quickviewModal);
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

/* Popular-search chips fill the modal search input */
document.querySelectorAll(".search-suggest .suggest-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const input = document.querySelector(".modal-search-form input[type='search']");
    if (input) {
      input.value = chip.textContent.trim();
      input.focus();
    }
  });
});
