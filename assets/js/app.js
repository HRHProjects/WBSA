/* WBSA site JS (single-file, no modules; works from file:// and GitHub Pages) */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }

  function initYear() {
    var el = document.querySelector('[data-year]');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initNav() {
    var toggle = qs('.nav-toggle');
    var links = qs('#navLinks');
    if (!toggle || !links) return;

    function setOpen(isOpen) {
      toggle.setAttribute('aria-expanded', String(isOpen));
      links.classList.toggle('is-open', !!isOpen);
      document.body.classList.toggle('nav-open', !!isOpen);
    }

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    // Close menu when clicking on a link
    links.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (a) {
        setOpen(false);
      }
    });

    // Close menu when clicking on the backdrop/overlay (outside the menu panel)
    links.addEventListener('click', function (e) {
      if (e.target === links) {
        setOpen(false);
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && !e.target.closest('.nav')) {
        var isOpen = toggle.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          setOpen(false);
        }
      }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
      }
    });
  }

  function initSliderHover() {
    var slide = qs('[data-slide]');
    if (!slide) return;

    var shine = slide.querySelector('.slide-shine');
    var img = slide.querySelector('.slide-img');

    function onMove(e) {
      var rect = slide.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;

      if (shine) {
        shine.style.setProperty('--mx', (x - rect.width * 0.5) + 'px');
        shine.style.setProperty('--my', (y - rect.height * 0.5) + 'px');
      }

      var px = (x / rect.width) - 0.5;
      var py = (y / rect.height) - 0.5;

      if (img) {
        var rotateY = px * 6;
        var rotateX = -py * 6;
        img.style.transform = 'scale(1.07) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
      }
    }

    function onEnter() { slide.classList.add('is-hovered'); }
    function onLeave() {
      slide.classList.remove('is-hovered');
      if (img) img.style.transform = '';
    }

    slide.addEventListener('pointerenter', onEnter);
    slide.addEventListener('pointerleave', onLeave);
    slide.addEventListener('pointermove', onMove);
  }

  function safeText(v) {
    if (v == null) return '';
    return String(v).replace(/[<>]/g, '');
  }

  function setStatus(el, msg) {
    if (!el) return;
    el.textContent = msg;
  }

  function nowTs() { return Date.now(); }

  function initForms() {
    var contactForm = qs('[data-contact-form]');
    var contactStatus = contactForm ? qs('.form-status', contactForm) : null;

    var subForm = qs('[data-subscribe-form]');
    var subStatus = qs('[data-subscribe-status]');

    if (contactForm) {
      var ts = qs('input[name="ts"]', contactForm);
      if (ts) ts.value = String(nowTs());

      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var fd = new FormData(contactForm);
        var payload = {};
        fd.forEach(function (v, k) { payload[k] = v; });

        // honeypot
        if (payload.company) {
          setStatus(contactStatus, 'Unable to send. Please email Info@wbsa.ca.');
          return;
        }

        // min time on page
        var started = Number(payload.ts || 0);
        if (!isFinite(started) || nowTs() - started < 2500) {
          setStatus(contactStatus, 'Unable to send. Please try again.');
          return;
        }

        setStatus(contactStatus, 'Sending…');

        fetch('./api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(function (res) {
          if (!res.ok) throw new Error('bad status');
          return res.json().catch(function () { return {}; });
        }).then(function () {
          setStatus(contactStatus, 'Sent. Thank you.');
          contactForm.reset();
          var ts2 = qs('input[name="ts"]', contactForm);
          if (ts2) ts2.value = String(nowTs());
        }).catch(function () {
          // Fallback to mailto
          var subject = encodeURIComponent(safeText(payload.subject || 'WBSA contact'));
          var body = encodeURIComponent(
            'Name: ' + safeText(payload.name) + '\n' +
            'Email: ' + safeText(payload.email) + '\n\n' +
            safeText(payload.message)
          );

          var mailto = 'mailto:Info@wbsa.ca?subject=' + subject + '&body=' + body;
          setStatus(contactStatus, 'API not available. Opening email…');
          window.location.href = mailto;
        });
      });
    }

    if (subForm) {
      subForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var fd = new FormData(subForm);
        var payload = {};
        fd.forEach(function (v, k) { payload[k] = v; });

        setStatus(subStatus, 'Subscribing…');

        fetch('./api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(function (res) {
          if (!res.ok) throw new Error('bad status');
          return res.json().catch(function () { return {}; });
        }).then(function () {
          setStatus(subStatus, 'Subscribed. Thank you.');
          subForm.reset();
        }).catch(function () {
          setStatus(subStatus, 'API not available. Email Info@wbsa.ca to subscribe.');
        });
      });
    }
  }

  initYear();
  initNav();
  initSliderHover();
  initForms();
})();
