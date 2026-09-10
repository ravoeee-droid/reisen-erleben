(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const finePointer = matchMedia('(pointer:fine)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------
  const header = $('[data-header]');
  const updateHeader = () => header?.classList.toggle('scrolled', scrollY > 48);
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const menuBtn = $('[data-menu-button]');
  const mobileMenu = $('[data-mobile-menu]');
  const setMenu = (open) => {
    mobileMenu?.classList.toggle('open', open);
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    menuBtn?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('modal-open', open);
  };
  menuBtn?.addEventListener('click', () => setMenu(!mobileMenu?.classList.contains('open')));
  $$('a,button', mobileMenu).forEach((el) => el.addEventListener('click', () => setMenu(false)));

  // ------------------------------------------------------------
  // Reveal system — minimal equivalent of in-view / blur-fade
  // Pattern adapted from ibelick/motion-primitives and Magic UI,
  // translated to zero-runtime IntersectionObserver for this prototype.
  // ------------------------------------------------------------
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -7% 0px' });
    $$('.reveal-mask, .reveal-clip').forEach((el) => revealObserver.observe(el));
  } else {
    $$('.reveal-mask, .reveal-clip').forEach((el) => el.classList.add('is-visible'));
  }
  $$('.hero .reveal-mask').forEach((el, i) => setTimeout(() => el.classList.add('is-visible'), 110 + i * 120));

  // ------------------------------------------------------------
  // Magic UI text-reveal concept, rewritten for vanilla scroll progress.
  // The original component maps each word to a progress range.
  // ------------------------------------------------------------
  const revealText = $('[data-text-reveal] .manifesto-text');
  let revealWords = [];
  if (revealText) {
    const words = revealText.textContent.trim().split(/\s+/);
    revealText.innerHTML = words.map((word) => `<span class="word">${word}</span>`).join(' ');
    revealWords = $$('.word', revealText);
  }

  // ------------------------------------------------------------
  // Motion Primitives Tilt algorithm, translated 1:1 conceptually:
  // pointer position -> normalized -0.5...0.5 -> rotate X/Y.
  // ------------------------------------------------------------
  if (finePointer && !reducedMotion) {
    $$('.tilt-surface').forEach((surface) => {
      surface.addEventListener('pointermove', (event) => {
        const rect = surface.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        surface.style.transform = `perspective(1100px) rotateX(${(-y * 5.5).toFixed(2)}deg) rotateY(${(x * 6.5).toFixed(2)}deg)`;
      });
      surface.addEventListener('pointerleave', () => {
        surface.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1)';
        surface.style.transform = '';
        setTimeout(() => surface.style.transition = '', 850);
      });
    });
  }

  // ------------------------------------------------------------
  // Motion Primitives Magnetic algorithm adapted for vanilla DOM.
  // Distance from center attenuates attraction as pointer leaves range.
  // ------------------------------------------------------------
  if (finePointer && !reducedMotion) {
    $$('.magnetic').forEach((target) => {
      const range = 120;
      const intensity = .18;
      let hovering = false;
      target.addEventListener('pointerenter', () => hovering = true);
      target.addEventListener('pointerleave', () => {
        hovering = false;
        target.animate([{ transform: getComputedStyle(target).transform === 'none' ? 'translate3d(0,0,0)' : target.style.transform }, { transform: 'translate3d(0,0,0)' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
        target.style.transform = '';
      });
      addEventListener('pointermove', (e) => {
        if (!hovering) return;
        const rect = target.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = Math.max(0, 1 - distance / range);
        target.style.transform = `translate3d(${(dx * intensity * scale).toFixed(1)}px,${(dy * intensity * scale).toFixed(1)}px,0)`;
      }, { passive: true });
    });
  }

  // Custom cursor used only as a restrained interaction accent.
  if (finePointer && !reducedMotion) {
    const cursor = $('.cursor-orbit');
    let tx = -100, ty = -100, cx = -100, cy = -100;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const tick = () => {
      cx += (tx - cx) * .16; cy += (ty - cy) * .16;
      if (cursor) cursor.style.transform = `translate3d(${cx - 24}px,${cy - 24}px,0)`;
      requestAnimationFrame(tick);
    };
    tick();
    $$('a, button, .tilt-surface').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor?.classList.add('is-active'));
      el.addEventListener('pointerleave', () => cursor?.classList.remove('is-active'));
    });
  }

  // ------------------------------------------------------------
  // Parallax and scroll-mapped systems in a single rAF loop.
  // ------------------------------------------------------------
  const parallaxEls = $$('[data-parallax]');
  const manifesto = $('[data-text-reveal]');
  const roadbook = $('#roadbook');
  const roadRoute = $('.roadbook-route');
  const roadProgress = $('[data-road-progress]');
  const roadDays = $$('[data-road-day]');

  // ------------------------------------------------------------
  // Codrops OnScrollPathAnimations pattern, adapted without GSAP.
  // Their source scrubs an SVG path's `d` attribute toward
  // `data-path-to`. We keep that exact data contract, but interpolate
  // the numeric path values inside the existing single rAF scroll loop.
  // This preserves the organic cartographic morph at a fraction of the
  // runtime cost and avoids adding an animation framework to the critical path.
  // ------------------------------------------------------------
  const pathNumberPattern = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
  const morphers = $$('.path-morph', roadbook || document).map((path) => {
    const from = path.getAttribute('d') || '';
    const to = path.dataset.pathTo || '';
    const fromNumbers = (from.match(pathNumberPattern) || []).map(Number);
    const toNumbers = (to.match(pathNumberPattern) || []).map(Number);
    const fragments = from.split(pathNumberPattern);
    if (!fromNumbers.length || fromNumbers.length !== toNumbers.length || fragments.length !== fromNumbers.length + 1) return null;
    return (progress) => {
      const eased = progress * progress * (3 - 2 * progress);
      let value = fragments[0];
      for (let i = 0; i < fromNumbers.length; i++) {
        const n = fromNumbers[i] + (toNumbers[i] - fromNumbers[i]) * eased;
        value += Number(n.toFixed(2)) + fragments[i + 1];
      }
      path.setAttribute('d', value);
    };
  }).filter(Boolean);
  let ticking = false;

  const renderScroll = () => {
    ticking = false;
    const vh = innerHeight;
    if (!reducedMotion) {
      parallaxEls.forEach((el) => {
        const factor = Number(el.dataset.parallax || .04);
        const rect = el.parentElement.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        el.style.transform = `translate3d(0,${(-center * factor).toFixed(1)}px,0)`;
      });
    }

    if (manifesto && revealWords.length) {
      const r = manifesto.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (vh * .78 - r.top) / Math.max(1, r.height * .76)));
      const active = Math.floor(progress * (revealWords.length + 4));
      revealWords.forEach((word, i) => word.classList.toggle('active', i < active));
    }

    if (roadbook && roadRoute) {
      const r = roadbook.getBoundingClientRect();
      const max = roadbook.offsetHeight - vh;
      const progress = Math.max(0, Math.min(1, -r.top / Math.max(1, max)));
      roadRoute.style.strokeDashoffset = String(1 - progress);
      if (!reducedMotion) morphers.forEach((morph) => morph(progress));
      let closest = 1;
      let closestDistance = Infinity;
      roadDays.forEach((day, i) => {
        const d = Math.abs(day.getBoundingClientRect().top - vh * .38);
        if (d < closestDistance) { closestDistance = d; closest = i + 1; }
      });
      if (roadProgress) roadProgress.textContent = String(closest).padStart(2, '0');
    }
  };
  const requestScrollRender = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(renderScroll);
  };
  addEventListener('scroll', requestScrollRender, { passive: true });
  addEventListener('resize', requestScrollRender, { passive: true });
  renderScroll();

  // ------------------------------------------------------------
  // Codrops ImageToContent pattern modernized with native View Transitions.
  // Codrops moves the clicked preview image into full content via GSAP Flip.
  // Here the same UX is implemented with document.startViewTransition,
  // keeping the prototype dependency-free and significantly lighter.
  // ------------------------------------------------------------
  const journeyData = {
    andalusien: {
      title: 'Andalusien', kicker: 'SONNE · KURVEN · SÜDEN', days: '09.–18.03.2027 · 10 TAGE',
      copy: 'Winterflucht mit dem eigenen Motorrad: Flug, Motorradtransport, 4★ Hotel, All Inclusive und acht geführte Tagestouren.',
      image: 'https://www.reisenunderleben.net/images/slideshow/3aa0c948-c534-4cc2-982c-012afa0c43d4.jpg',
      facts: ['10 Tage', '8 Tagestouren', '4★ Hotel', 'All Inclusive', 'ab 2.990 €'],
      href: '/touren/andalusien/'
    },
    trentino: {
      title: 'Trentino', kicker: 'PÄSSE · DOLOMITEN · GENUSS', days: 'ALPEN · GARDASEE',
      copy: 'Kurvenreiche Tage zwischen Dolomiten und Gardasee — für alle, die Pässe genauso lieben wie den Espresso danach.',
      image: 'https://www.reisenunderleben.net/images/slideshow/slider_trentino.jpg',
      facts: ['Alpen', 'Geführt', 'Kleine Gruppen', 'Hotels organisiert'],
      href: 'https://www.reisenunderleben.net/reisebeschreibung/trentino-gardasee'
    },
    vogesen: {
      title: 'Vogesen', kicker: 'KURVEN · FRANKREICH · NAH', days: 'FRANKREICH',
      copy: 'Kurvige Höhenstraßen, französische Dörfer und genau die richtige Distanz für eine intensive Motorradauszeit.',
      image: 'https://www.reisenunderleben.net/images/slideshow/P0021_2024018_NOLTE_MOTORRAD_REISEN%26ERLEBEN_VOGESEN_2405-35_extended.jpg',
      facts: ['Frankreich', 'Geführt', 'Kurvenreich', 'Gemeinsam unterwegs'],
      href: 'https://www.reisenunderleben.net/index.php?id=499&motorradreise=vogesen&pg=reisebeschreibung&yr=2026'
    }
  };
  const journeyDialog = $('[data-journey-dialog]');
  const journeyDialogImage = $('[data-journey-dialog-image]');
  let currentJourneyTrigger = null;

  const populateJourney = (key) => {
    const data = journeyData[key];
    if (!data || !journeyDialog) return;
    $('[data-journey-dialog-title]').textContent = data.title;
    $('[data-journey-dialog-kicker]').textContent = data.kicker;
    $('[data-journey-dialog-days]').textContent = data.days;
    $('[data-journey-dialog-copy]').textContent = data.copy;
    journeyDialogImage.src = data.image;
    journeyDialogImage.alt = `Motorradreise ${data.title}`;
    $('[data-journey-dialog-link]').href = data.href;
    $('[data-journey-dialog-facts]').innerHTML = data.facts.map((fact) => `<span>${fact}</span>`).join('');
  };
  const openJourney = (key, trigger) => {
    if (!journeyDialog) return;
    currentJourneyTrigger = trigger;
    const sourceImage = trigger.closest('.journey-preview')?.querySelector('.journey-image img');
    if (sourceImage) sourceImage.style.viewTransitionName = 'journey-photo';
    journeyDialogImage.style.viewTransitionName = 'journey-photo';
    const update = () => { populateJourney(key); journeyDialog.showModal(); document.body.classList.add('modal-open'); };
    if (!reducedMotion && document.startViewTransition) {
      const transition = document.startViewTransition(update);
      transition.finished.finally(() => {
        if (sourceImage) sourceImage.style.viewTransitionName = '';
        journeyDialogImage.style.viewTransitionName = '';
      });
    } else update();
  };
  $$('[data-journey-open]').forEach((trigger) => trigger.addEventListener('click', () => openJourney(trigger.dataset.journeyOpen, trigger)));
  $('[data-journey-close]')?.addEventListener('click', () => {
    if (!journeyDialog) return;
    const close = () => { journeyDialog.close(); document.body.classList.remove('modal-open'); currentJourneyTrigger?.focus?.(); };
    if (!reducedMotion && document.startViewTransition) document.startViewTransition(close); else close();
  });
  journeyDialog?.addEventListener('cancel', () => document.body.classList.remove('modal-open'));

  // ------------------------------------------------------------
  // Tour finder / lead capture
  // ------------------------------------------------------------
  const finderModal = $('[data-finder-modal]');
  const finderProgress = $('[data-modal-progress]');
  const finderForm = $('#tourFinderForm');
  const answers = {};
  let finderStep = 1;
  const showFinderStep = (next) => {
    finderStep = Math.max(1, Math.min(5, next));
    $$('.finder-step', finderModal).forEach((el) => el.classList.toggle('active', Number(el.dataset.step) === finderStep));
    if (finderProgress) finderProgress.style.width = `${finderStep * 20}%`;
  };
  const openFinder = () => {
    if (!finderModal) return;
    showFinderStep(1);
    if (!finderModal.open) finderModal.showModal();
    document.body.classList.add('modal-open');
  };
  $$('[data-open-finder]').forEach((btn) => btn.addEventListener('click', openFinder));
  const finderChoiceButtons = finderModal ? $$('.finder-choices button', finderModal) : [];
  finderChoiceButtons.forEach((btn) => btn.addEventListener('click', () => {
    answers[finderStep] = btn.dataset.value;
    showFinderStep(finderStep + 1);
  }));
  finderModal?.addEventListener('close', () => document.body.classList.remove('modal-open'));
  finderModal?.addEventListener('click', (event) => { if (event.target === finderModal) finderModal.close(); });

  finderForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(finderForm);
    const payload = { name: fd.get('name') || '', email: fd.get('email') || '', source: 'tour-concierge-v2', answers, matchedTour: 'Andalusien' };
    try { await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); } catch (_) {}
    finderModal.close();
    const toast = $('[data-toast]');
    toast?.classList.add('show');
    setTimeout(() => toast?.classList.remove('show'), 4300);
  });
})();
