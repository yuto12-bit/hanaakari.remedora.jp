
/* ==========================================
   彩灯り (Irodori Care) - main.js
   Lightweight JS: loading, header, menu, fade-up, hero parallax
   ========================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------
     0. Loading screen
  ------------------------------------------ */
  var loader = document.getElementById('site-loading');

  if (loader) {
    // Bar animation takes 1.4s (delay 0.5s + duration 1.4s = 1.9s total)
    // Wait at least that long before hiding
    var MIN_DISPLAY = 1900;
    var startTime = Date.now();

    function hideLoader() {
      var elapsed = Date.now() - startTime;
      var wait = Math.max(0, MIN_DISPLAY - elapsed);
      setTimeout(function () {
        loader.classList.add('is-hidden');
        // Remove from DOM after fade-out transition (0.7s)
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 750);
      }, wait);
    }

    // Hide after all resources (images) are loaded
    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader);
    }

    // Hard fallback: never block the user more than 5s
    setTimeout(function () {
      loader.classList.add('is-hidden');
    }, 5000);
  }

  /* ------------------------------------------
     1. Header scroll state
  ------------------------------------------ */
  const header = document.querySelector('.site-header');

  function updateHeader() {
    if (!header) return;
    if (window.scrollY > 72) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader(); // run on load

  /* ------------------------------------------
     2. Mobile navigation drawer
  ------------------------------------------ */
  const menuBtn = document.querySelector('.menu-circle');
  const navDrawer = document.querySelector('.nav-drawer');

  if (menuBtn && navDrawer) {
    menuBtn.addEventListener('click', function () {
      const isOpen = navDrawer.classList.toggle('is-open');
      menuBtn.classList.toggle('is-active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close when a nav link is clicked
    navDrawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navDrawer.classList.remove('is-open');
        menuBtn.classList.remove('is-active');
        document.body.style.overflow = '';
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navDrawer.classList.contains('is-open')) {
        navDrawer.classList.remove('is-open');
        menuBtn.classList.remove('is-active');
        document.body.style.overflow = '';
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ------------------------------------------
     3. Fade-up on scroll (IntersectionObserver)
  ------------------------------------------ */
  if (!prefersReducedMotion) {
    const fadeEls = document.querySelectorAll('.fade-up');

    if (fadeEls.length && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: '0px 0px -32px 0px'
        }
      );

      fadeEls.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback: make all visible immediately
      fadeEls.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
  }

  /* ------------------------------------------
     4. Hero parallax (very subtle, index only)
  ------------------------------------------ */
  if (!prefersReducedMotion) {
    const heroBg = document.querySelector('.hero__bg');

    if (heroBg) {
      var ticking = false;

      function applyParallax() {
        var scrollY = window.scrollY;
        var viewH = window.innerHeight;
        if (scrollY < viewH) {
          heroBg.style.transform = 'translateY(' + (scrollY * 0.12) + 'px)';
        }
        ticking = false;
      }

      window.addEventListener('scroll', function () {
        if (!ticking) {
          window.requestAnimationFrame(applyParallax);
          ticking = true;
        }
      }, { passive: true });
    }
  }

  /* ------------------------------------------
     5. Service card thumbnail color placeholders
        (fallback: ensure aria labels are set)
  ------------------------------------------ */
  document.querySelectorAll('.service-card__media').forEach(function (el) {
    el.setAttribute('role', 'img');
    if (!el.getAttribute('aria-label')) {
      var card = el.closest('.service-card');
      var title = card && card.querySelector('.service-card__title');
      if (title) el.setAttribute('aria-label', title.textContent.trim() + 'のイメージ');
    }
  });


    /* ------------------------------------------
     6. Values accordion
  ------------------------------------------ */
  (function () {
    const accordionItems = document.querySelectorAll('.value-item--accordion');
    if (!accordionItems.length) return;

    function getParts(item) {
      return {
        item: item,
        trigger: item.querySelector('.value-item__trigger'),
        panelWrap: item.querySelector('.value-item__panel-wrap'),
        panel: item.querySelector('.value-item__panel')
      };
    }

    function setOpened(parts, immediate) {
      if (!parts.trigger || !parts.panelWrap || !parts.panel) return;

      parts.item.classList.add('is-open');
      parts.item.classList.remove('is-closing');
      parts.trigger.setAttribute('aria-expanded', 'true');
      parts.panelWrap.hidden = false;
      parts.panelWrap.style.overflow = 'hidden';

      if (prefersReducedMotion || immediate) {
        parts.panelWrap.style.height = 'auto';
        parts.panelWrap.style.transition = '';
        parts.panel.style.transition = '';
        parts.panel.style.opacity = '1';
        parts.panel.style.transform = 'translateY(0)';
        parts.panel.style.filter = 'blur(0)';
        return;
      }

      parts.panelWrap.style.transition = 'none';
      parts.panel.style.transition = 'none';
      parts.panelWrap.style.height = '0px';
      parts.panel.style.opacity = '0';
      parts.panel.style.transform = 'translateY(-10px)';
      parts.panel.style.filter = 'blur(3px)';

      parts.panelWrap.offsetHeight;

      const targetHeight = parts.panel.scrollHeight;

      parts.panelWrap.style.transition = 'height 720ms cubic-bezier(.22, 1, .36, 1)';
      parts.panel.style.transition = 'opacity 340ms ease 70ms, transform 720ms cubic-bezier(.22, 1, .36, 1), filter 560ms ease 30ms';
      parts.panelWrap.style.height = targetHeight + 'px';
      parts.panel.style.opacity = '1';
      parts.panel.style.transform = 'translateY(0)';
      parts.panel.style.filter = 'blur(0)';

      parts.panelWrap.addEventListener('transitionend', function handleOpenEnd(e) {
        if (e.propertyName !== 'height') return;
        parts.panelWrap.style.height = 'auto';
        parts.panelWrap.style.transition = '';
        parts.panelWrap.style.overflow = '';
        parts.panelWrap.removeEventListener('transitionend', handleOpenEnd);
      });
    }

    function setClosed(parts, immediate) {
      if (!parts.trigger || !parts.panelWrap || !parts.panel) return;

      parts.item.classList.remove('is-open');
      parts.item.classList.add('is-closing');
      parts.trigger.setAttribute('aria-expanded', 'false');

      if (prefersReducedMotion || immediate) {
        parts.panelWrap.hidden = true;
        parts.panelWrap.style.height = '';
        parts.panelWrap.style.transition = '';
        parts.panel.style.transition = '';
        parts.item.classList.remove('is-closing');
        return;
      }

      const startHeight = parts.panelWrap.scrollHeight;

      parts.panelWrap.hidden = false;
      parts.panelWrap.style.overflow = 'hidden';
      parts.panelWrap.style.transition = 'none';
      parts.panel.style.transition = 'none';
      parts.panelWrap.style.height = startHeight + 'px';
      parts.panel.style.opacity = '1';
      parts.panel.style.transform = 'translateY(0)';
      parts.panel.style.filter = 'blur(0)';

      parts.panelWrap.offsetHeight;

      parts.panelWrap.style.transition = 'height 420ms cubic-bezier(.55, .06, .68, .19)';
      parts.panel.style.transition = 'opacity 220ms ease, transform 360ms cubic-bezier(.32, 0, .67, 0), filter 260ms ease';
      parts.panelWrap.style.height = '0px';
      parts.panel.style.opacity = '0';
      parts.panel.style.transform = 'translateY(-10px)';
      parts.panel.style.filter = 'blur(3px)';

      parts.panelWrap.addEventListener('transitionend', function handleCloseEnd(e) {
        if (e.propertyName !== 'height') return;
        parts.panelWrap.hidden = true;
        parts.panelWrap.style.height = '';
        parts.panelWrap.style.transition = '';
        parts.panelWrap.style.overflow = '';
        parts.item.classList.remove('is-closing');
        parts.panelWrap.removeEventListener('transitionend', handleCloseEnd);
      });
    }

    accordionItems.forEach(function (item, index) {
      const parts = getParts(item);
      const shouldOpen = item.classList.contains('is-open') || index === 0;

      if (shouldOpen) {
        setOpened(parts, true);
      } else {
        setClosed(parts, true);
      }

      if (!parts.trigger) return;

      parts.trigger.addEventListener('click', function () {
        const isOpen = parts.item.classList.contains('is-open');

        accordionItems.forEach(function (otherItem) {
          if (otherItem === parts.item) return;
          if (!otherItem.classList.contains('is-open')) return;
          setClosed(getParts(otherItem), false);
        });

        if (isOpen) {
          setClosed(parts, false);
        } else {
          setOpened(parts, false);
        }
      });
    });
  })();

  /* ------------------------------------------
     7. Smooth scroll for anchor links
  ------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();