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

    function markActiveLink() {
      var current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
      var anchors = links.querySelectorAll('a[href]');
      anchors.forEach(function (a) {
        var href = (a.getAttribute('href') || '').toLowerCase();
        if (!href || href.startsWith('http')) return;
        if (href === current) {
          a.setAttribute('aria-current', 'page');
        }
      });
    }

    markActiveLink();

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

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1100 && toggle.getAttribute('aria-expanded') === 'true') {
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

  function createTextElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text || '';
    return element;
  }

  function ensureBusinessData() {
    var businesses = window.WBSA_BUSINESSES || [];
    if (!businesses.some(function (business) { return business.id === 'craftywand'; })) {
      businesses.push({
        id: 'craftywand',
        name: 'CraftyWand',
        category: 'Packaging design software',
        city: 'Online',
        address: '',
        phone: '',
        phoneHref: '',
        description: 'Free browser-based packaging design software for dielines, 3D mockups, and print-ready files.',
        logo: 'https://www.craftywand.com/og-image.png',
        profile: 'https://www.craftywand.com/'
      });
    }
    window.WBSA_BUSINESSES = businesses;
  }

  function createBusinessCard(business) {
    var detailUrl = 'business.html?id=' + encodeURIComponent(business.id);
    var card = document.createElement('article');
    card.className = 'card business-listing';

    var logoLink = document.createElement('a');
    logoLink.className = 'business-listing-logo';
    logoLink.href = detailUrl;
    logoLink.setAttribute('aria-label', business.name + ' details');
    if (business.logo) {
      var image = document.createElement('img');
      image.src = business.logo;
      image.alt = business.name + ' logo';
      image.loading = 'lazy';
      logoLink.appendChild(image);
    } else {
      var initials = business.name.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase();
      logoLink.appendChild(createTextElement('span', 'business-logo-placeholder', initials));
    }

    var content = document.createElement('div');
    content.className = 'business-listing-content';
    content.appendChild(createTextElement('p', 'business-type', business.category));
    content.appendChild(createTextElement('h3', '', business.name));
    content.appendChild(createTextElement('p', '', business.description || business.category + ' business serving ' + business.city + '.'));

    var details = document.createElement('p');
    details.className = 'business-meta';
    details.textContent = [business.address, business.city].filter(Boolean).join(', ');
    if (business.phone) {
      if (details.textContent) details.appendChild(document.createTextNode(' · '));
      var phoneLink = document.createElement('a');
      phoneLink.href = 'tel:' + (business.phoneHref || business.phone.replace(/[^0-9+]/g, ''));
      phoneLink.textContent = business.phone;
      details.appendChild(phoneLink);
    }
    content.appendChild(details);

    var detailLink = document.createElement('a');
    detailLink.className = 'business-profile-link';
    detailLink.href = detailUrl;
    detailLink.textContent = 'Business details';
    content.appendChild(detailLink);
    card.appendChild(logoLink);
    card.appendChild(content);
    return card;
  }

  function initBusinessDirectory() {
    var form = qs('[data-business-filter-form]');
    if (!form) return;

    var searchInput = qs('[data-business-search]', form);
    var categorySelect = qs('[data-business-category]', form);
    var resultCount = qs('[data-business-result-count]');
    var emptyState = qs('[data-business-empty]');
    var listingsContainer = qs('[data-business-listings]');
    var businesses = window.WBSA_BUSINESSES || [];
    if (!searchInput || !categorySelect || !resultCount || !emptyState || !listingsContainer || !businesses.length) return;

    listingsContainer.replaceChildren();
    businesses.forEach(function (business) {
      listingsContainer.appendChild(createBusinessCard(business));
    });
    var categories = Array.from(new Set(businesses.map(function (business) { return business.category; }).filter(Boolean))).sort();
    categorySelect.replaceChildren();
    var allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All categories';
    categorySelect.appendChild(allOption);
    categories.forEach(function (category) {
      var option = document.createElement('option');
      option.value = category.toLowerCase();
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    var listings = Array.prototype.slice.call(listingsContainer.querySelectorAll('.business-listing'));
    var schemaScript = qs('script[type="application/ld+json"]');
    if (schemaScript) {
      var schemaItems = businesses.map(function (business, index) {
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: business.name,
          url: 'https://www.wbsa.ca/business.html?id=' + encodeURIComponent(business.id)
        };
      });
      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Fort McMurray Local Business Directory',
        url: 'https://www.wbsa.ca/local-businesses.html',
        mainEntity: { '@type': 'ItemList', numberOfItems: businesses.length, itemListElement: schemaItems }
      });
    }

    function filterListings() {
      var query = searchInput.value.trim().toLowerCase();
      var selectedCategory = categorySelect.value.toLowerCase();
      var visibleCount = 0;

      listings.forEach(function (listing) {
        var type = qs('.business-type', listing);
        var listingCategory = type ? type.textContent.trim().toLowerCase() : '';
        var matchesQuery = listing.textContent.toLowerCase().indexOf(query) !== -1;
        var matchesCategory = selectedCategory === 'all' || listingCategory === selectedCategory;
        listing.hidden = !(matchesQuery && matchesCategory);
        if (!listing.hidden) visibleCount += 1;
      });

      setStatus(resultCount, visibleCount + (visibleCount === 1 ? ' business' : ' businesses'));
      emptyState.hidden = visibleCount !== 0;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
    });
    searchInput.addEventListener('input', filterListings);
    categorySelect.addEventListener('change', filterListings);
    filterListings();
  }

  function initBusinessDetails() {
    var container = qs('[data-business-detail]');
    if (!container) return;

    var businessId = new URLSearchParams(window.location.search).get('id');
    var businesses = window.WBSA_BUSINESSES || [];
    var business = businesses.find(function (item) { return item.id === businessId; });
    if (!business) {
      document.title = 'Business listing not found | WBSA';
      var missingHeading = qs('#businessPageTitle');
      if (missingHeading) missingHeading.textContent = 'Business listing not found';
      container.appendChild(createTextElement('p', 'directory-empty', 'This business listing could not be found.'));
      return;
    }

    var title = business.name + ' | Fort McMurray Local Business Directory';
    var description = business.description || business.name + ' in ' + business.city + '. View business details and contact information.';
    var canonicalUrl = 'https://www.wbsa.ca/business.html?id=' + encodeURIComponent(business.id);
    document.title = title;
    var pageHeading = qs('#businessPageTitle');
    if (pageHeading) pageHeading.textContent = business.name;
    var descriptionMeta = qs('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.content = description.slice(0, 160);
    var canonical = qs('link[rel="canonical"]');
    if (canonical) canonical.href = canonicalUrl;
    var socialTitle = qs('meta[property="og:title"]');
    if (socialTitle) socialTitle.content = title;
    var socialDescription = qs('meta[property="og:description"]');
    if (socialDescription) socialDescription.content = description.slice(0, 160);
    var socialUrl = qs('meta[property="og:url"]');
    if (socialUrl) socialUrl.content = canonicalUrl;

    var article = document.createElement('article');
    article.className = 'business-detail';
    if (business.logo) {
      var figure = document.createElement('div');
      figure.className = 'business-detail-logo';
      var image = document.createElement('img');
      image.src = business.logo;
      image.alt = business.name + ' logo';
      figure.appendChild(image);
      article.appendChild(figure);
    }

    var content = document.createElement('div');
    content.className = 'business-detail-content';
    content.appendChild(createTextElement('p', 'business-type', business.category));
    content.appendChild(createTextElement('h1', '', business.name));
    content.appendChild(createTextElement('p', 'lead', description));
    if (business.address || business.city) {
      content.appendChild(createTextElement('p', 'business-detail-meta', [business.address, business.city].filter(Boolean).join(', ')));
    }
    if (business.phone) {
      var phone = document.createElement('p');
      phone.className = 'business-detail-meta';
      var phoneLink = document.createElement('a');
      phoneLink.href = 'tel:' + (business.phoneHref || business.phone.replace(/[^0-9+]/g, ''));
      phoneLink.textContent = business.phone;
      phone.appendChild(phoneLink);
      content.appendChild(phone);
    }

    var actions = document.createElement('div');
    actions.className = 'business-detail-actions';
    var profileLink = document.createElement('a');
    profileLink.className = 'btn btn-solid';
    profileLink.href = business.profile;
    profileLink.target = '_blank';
    profileLink.rel = 'noopener';
    profileLink.textContent = 'Business website and full profile';
    actions.appendChild(profileLink);
    var backLink = document.createElement('a');
    backLink.className = 'btn btn-ghost';
    backLink.href = 'local-businesses.html';
    backLink.textContent = 'Back to directory';
    actions.appendChild(backLink);
    content.appendChild(actions);
    article.appendChild(content);
    container.replaceChildren(article);

    var detailSchema = qs('[data-business-detail-schema]');
    if (detailSchema) {
      detailSchema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: business.name,
        description: description,
        url: business.profile,
        telephone: business.phone || undefined,
        address: business.address ? {
          '@type': 'PostalAddress',
          streetAddress: business.address,
          addressLocality: business.city,
          addressRegion: 'AB',
          addressCountry: 'CA'
        } : undefined
      });
    }
  }

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
  ensureBusinessData();
  initBusinessDirectory();
  initBusinessDetails();
  initForms();
})();
