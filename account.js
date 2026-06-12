/* =====================================================================
   ACCOUNT.JS — My Account nav active-state switching (presentational)
   Loaded AFTER script.js. Selectors scoped to .acc markup and guarded,
   so it is safe to include site-wide. Since this static build ships a
   single Dashboard view, the nav links are functional anchors; clicking
   a sidebar/inline link just moves the gold active state and, on mobile,
   scrolls that tab into view. Real navigation (Orders, Addresses, etc.)
   would resolve to their own pages in production.
   ===================================================================== */
(function () {
  "use strict";

  var links = Array.prototype.slice.call(
    document.querySelectorAll(".acc-nav-link")
  );
  if (!links.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setActive(target) {
    var tab = target && target.getAttribute("data-acc-tab");
    if (!tab) return;

    links.forEach(function (link) {
      var isActive = link.getAttribute("data-acc-tab") === tab;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    // On the mobile tab bar, bring the active tab into view.
    var activeSidebarLink = document.querySelector(
      '.acc-nav-link.is-active[data-acc-tab="' + tab + '"]'
    );
    activeSidebarLink?.scrollIntoView?.({
      behavior: reduceMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest"
    });
  }

  // Any element carrying data-acc-tab (sidebar links + in-content "View All"
  // style links) can drive the active state.
  document.addEventListener("click", function (event) {
    var trigger = event.target.closest?.("[data-acc-tab]");
    if (!trigger) return;
    // Logout is a real action in production; don't trap it visually here,
    // but still reflect intent so the UI stays consistent in this demo.
    setActive(trigger);
  });
})();