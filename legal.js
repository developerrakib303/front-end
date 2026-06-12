/* =====================================================================
   LEGAL.JS — Shared behaviour for Privacy + Terms pages
   - Scrollspy via IntersectionObserver (graceful scroll fallback)
   - Smooth-scroll to anchors, respecting prefers-reduced-motion
   - Mobile TOC <details> toggle: close on selection
   Self-contained, no dependencies. Safe if elements are absent.
   ===================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var sections = Array.prototype.slice.call(
      document.querySelectorAll(".legal-section[id]")
    );
    if (!sections.length) return;

    // Every TOC link on the page (desktop sidebar + mobile dropdown).
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".legal-toc-list a[href^='#']")
    );

    // Map section id -> array of links pointing at it.
    var linksById = {};
    links.forEach(function (link) {
      var id = decodeURIComponent((link.getAttribute("href") || "").slice(1));
      if (!id) return;
      (linksById[id] = linksById[id] || []).push(link);
    });

    var mobileToc = document.querySelector(".legal-toc-mobile");
    var prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    var currentId = null;

    function setActive(id) {
      if (!id || id === currentId) return;
      currentId = id;
      links.forEach(function (link) {
        var linkId = decodeURIComponent(
          (link.getAttribute("href") || "").slice(1)
        );
        var on = linkId === id;
        link.classList.toggle("is-active", on);
        if (on) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    /* ---------- Scrollspy: IntersectionObserver (preferred) ---------- */
    var usingObserver = false;

    if ("IntersectionObserver" in window) {
      usingObserver = true;
      var visible = {};

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              visible[entry.target.id] = entry.intersectionRatio;
            } else {
              delete visible[entry.target.id];
            }
          });

          // Choose the topmost visible section (smallest document order
          // among those currently intersecting the active band).
          var bestId = null;
          var bestTop = Infinity;
          sections.forEach(function (sec) {
            if (visible[sec.id] != null) {
              var top = sec.getBoundingClientRect().top;
              if (top < bestTop) {
                bestTop = top;
                bestId = sec.id;
              }
            }
          });

          if (bestId) {
            setActive(bestId);
          } else {
            // Nothing in the band — fall back to nearest section above.
            updateByScroll();
          }
        },
        {
          // Active band sits just below the sticky header (~96px) and ends
          // partway down the viewport so a heading lights up as it enters.
          rootMargin: "-104px 0px -62% 0px",
          threshold: [0, 0.25, 0.5, 1]
        }
      );

      sections.forEach(function (sec) {
        observer.observe(sec);
      });
    }

    /* ---------- Fallback / supplement: scroll position ---------- */
    function updateByScroll() {
      var offset = 120; // sticky-header clearance
      var pos = window.scrollY + offset;
      var activeId = sections[0].id;

      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= pos) {
          activeId = sections[i].id;
        } else {
          break;
        }
      }

      // Pin the last section when scrolled to the bottom of the page.
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      ) {
        activeId = sections[sections.length - 1].id;
      }

      setActive(activeId);
    }

    if (!usingObserver) {
      var ticking = false;
      window.addEventListener(
        "scroll",
        function () {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(function () {
            updateByScroll();
            ticking = false;
          });
        },
        { passive: true }
      );
      updateByScroll();
    }

    /* ---------- Smooth scroll + mobile close-on-select ---------- */
    function scrollToId(id) {
      var target = document.getElementById(id);
      if (!target) return;
      var headerOffset = 100;
      var top =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;

      if (prefersReduced) {
        window.scrollTo(0, top);
      } else {
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    }

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = decodeURIComponent((link.getAttribute("href") || "").slice(1));
        if (!id || !document.getElementById(id)) return;

        e.preventDefault();
        setActive(id);
        scrollToId(id);

        // Update the URL hash without an extra jump.
        if (history.replaceState) {
          history.replaceState(null, "", "#" + id);
        }

        // Collapse the mobile "On this page" dropdown after a pick.
        if (mobileToc && mobileToc.hasAttribute("open")) {
          mobileToc.removeAttribute("open");
        }

        // Move focus to the target heading for accessibility.
        var heading = document.getElementById(id).querySelector("h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      });
    });

    /* ---------- Back-to-top control ---------- */
    var backTop = document.querySelector(".legal-backtop");
    if (backTop) {
      backTop.addEventListener("click", function (e) {
        e.preventDefault();
        if (prefersReduced) {
          window.scrollTo(0, 0);
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (history.replaceState) {
          history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }
      });
    }

    /* ---------- Deep-link: honour an incoming #hash on load ---------- */
    if (window.location.hash) {
      var initId = decodeURIComponent(window.location.hash.slice(1));
      if (document.getElementById(initId)) {
        // Defer so layout is settled before measuring offsets.
        window.requestAnimationFrame(function () {
          scrollToId(initId);
          setActive(initId);
        });
      }
    }
  });
})();
