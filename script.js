document.addEventListener('DOMContentLoaded', function () {
  var header = document.getElementById('siteHeader');
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mobileNav');
  var navClose = document.getElementById('navCloseBtn');
  var lockedScrollY = 0;

  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('is-scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  function openMenu() {
    lockedScrollY = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.position = 'fixed';
    document.body.style.top = (-lockedScrollY) + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    nav.classList.add('open');
    toggle.textContent = '✕';
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu(restoreScroll) {
    if (restoreScroll === undefined) { restoreScroll = true; }
    nav.classList.remove('open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    if (restoreScroll) { window.scrollTo(0, lockedScrollY); }
    toggle.textContent = '☰';
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) { closeMenu(); } else { openMenu(); }
    });
  }
  if (navClose) { navClose.addEventListener('click', function () { closeMenu(); }); }
  document.addEventListener('keydown', function (e) {
    if (nav && e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); }
  });

  // ---- Hash-free navigation ----
  // Same-page "#section" links scroll smoothly without ever writing a #hash
  // to the URL bar. Cross-page links (data-scroll-to, href="/") store the
  // target in sessionStorage, navigate to the clean "/" URL, and the target
  // page picks up the pending scroll on load — so the address bar only ever
  // shows the plain domain, on every page, at every step.
  document.addEventListener('click', function (e) {
    var crossPageLink = e.target.closest('a[data-scroll-to]');
    if (crossPageLink) {
      var scrollTarget = crossPageLink.getAttribute('data-scroll-to');
      var onHomeAlready = (location.pathname === '/' || location.pathname === '');
      if (onHomeAlready) {
        var el = document.getElementById(scrollTarget);
        if (el) {
          e.preventDefault();
          var menuOpen = nav && nav.classList.contains('open');
          if (menuOpen) { closeMenu(false); }
          requestAnimationFrame(function () {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      } else {
        sessionStorage.setItem('pendingScroll', scrollTarget);
        // let the normal href="/" navigation proceed
      }
      return;
    }

    var link = e.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('aria-disabled')) return;
    var hash = link.getAttribute('href');
    if (!hash) return;

    var menuWasOpen = nav && nav.classList.contains('open');

    if (hash === '#') {
      e.preventDefault();
      if (menuWasOpen) { closeMenu(false); }
      requestAnimationFrame(function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return;
    }

    var target = document.getElementById(hash.slice(1));
    if (!target) return;

    e.preventDefault();
    if (menuWasOpen) { closeMenu(false); }
    requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // On load, if a previous page queued a scroll target, honor it.
  var pending = sessionStorage.getItem('pendingScroll');
  if (pending) {
    sessionStorage.removeItem('pendingScroll');
    var pendingEl = document.getElementById(pending);
    if (pendingEl) {
      setTimeout(function () {
        pendingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  // ---- Future / "What's Coming Next" bubbles ----
  var tagBtns = document.querySelectorAll('.tag-btn');
  var descPanel = document.getElementById('futureDesc');
  tagBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasActive = btn.classList.contains('active');
      tagBtns.forEach(function (b) { b.classList.remove('active'); });
      if (wasActive) {
        descPanel.classList.remove('open');
        descPanel.textContent = '';
      } else {
        btn.classList.add('active');
        descPanel.textContent = btn.getAttribute('data-desc');
        descPanel.classList.add('open');
      }
    });
  });

  // ---- Contact form (Web3Forms) ----
  var contactForm = document.getElementById('contactForm');
  var formStatus = document.getElementById('formStatus');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      formStatus.textContent = '';
      formStatus.className = 'form-status';

      var data = new FormData(contactForm);
      var payload = Object.fromEntries(data);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result.success) {
            formStatus.textContent = "Thanks! We'll be in touch soon.";
            formStatus.classList.add('success');
            contactForm.reset();
          } else {
            formStatus.textContent = 'Something went wrong. Please call us instead.';
            formStatus.classList.add('error');
          }
        })
        .catch(function () {
          formStatus.textContent = 'Something went wrong. Please call us instead.';
          formStatus.classList.add('error');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        });
    });
  }

  // ---- Hero slideshow ----
  var heroSlides = document.querySelectorAll('.hero-slide');
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroSlides.length > 1 && !prefersReducedMotion) {
    var heroIndex = 0;
    setInterval(function () {
      heroSlides[heroIndex].classList.remove('active');
      heroIndex = (heroIndex + 1) % heroSlides.length;
      heroSlides[heroIndex].classList.add('active');
    }, 5000);
  }

  // ---- Gallery lightbox ----
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');
  var currentIndex = 0;

  function showImage(index) {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    var item = galleryItems[currentIndex];
    lightboxImg.src = item.getAttribute('data-full');
    lightboxImg.alt = item.getAttribute('data-caption') || '';
  }

  galleryItems.forEach(function (item, index) {
    item.addEventListener('click', function () {
      showImage(index);
      lightbox.classList.add('open');
    });
  });

  if (lightboxClose) { lightboxClose.addEventListener('click', function () { lightbox.classList.remove('open'); }); }
  if (lightboxPrev) { lightboxPrev.addEventListener('click', function () { showImage(currentIndex - 1); }); }
  if (lightboxNext) { lightboxNext.addEventListener('click', function () { showImage(currentIndex + 1); }); }
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { lightbox.classList.remove('open'); }
    });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') { lightbox.classList.remove('open'); }
      if (e.key === 'ArrowLeft') { showImage(currentIndex - 1); }
      if (e.key === 'ArrowRight') { showImage(currentIndex + 1); }
    });
  }

  // ---- FAQ accordion ----
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
});
