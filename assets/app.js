(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('[data-header]');
  const onScroll = () => header?.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('[data-menu-button]');
  const menu = $('[data-mobile-menu]');
  const setMenu = (open) => {
    menu?.classList.toggle('open', open);
    menu?.setAttribute('aria-hidden', String(!open));
    menuBtn?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('modal-open', open);
  };
  menuBtn?.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a,button', menu).forEach(el => el.addEventListener('click', () => setMenu(false)));

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    $$('.reveal').forEach(el => revealObserver.observe(el));

    const routeScene = $('[data-route-scene]');
    if (routeScene) {
      const routeObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) routeScene.classList.add('in-view');
      }, { threshold: .25 });
      routeObserver.observe(routeScene);
    }
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  if (!reducedMotion && matchMedia('(pointer:fine)').matches) {
    $$('.tilt-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(8px)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
  }

  $$('.choice').forEach(choice => choice.addEventListener('click', () => {
    $$('.choice').forEach(c => c.classList.remove('selected'));
    choice.classList.add('selected');
    setTimeout(() => openFinder(), 220);
  }));

  const range = $('[data-club-range]');
  const count = $('[data-club-count]');
  const discount = $('[data-club-discount]');
  const updateClub = () => {
    if (!range) return;
    const n = Number(range.value);
    count.textContent = n;
    discount.textContent = n >= 20 ? '5%' : n >= 10 ? '3%' : 'individuell';
  };
  range?.addEventListener('input', updateClub);
  updateClub();

  const modal = $('[data-finder-modal]');
  const progress = $('[data-modal-progress]');
  const finderForm = $('#tourFinderForm');
  const answers = {};
  let step = 1;
  const showStep = (next) => {
    step = Math.max(1, Math.min(5, next));
    $$('.modal-step', modal).forEach(el => el.classList.toggle('active', Number(el.dataset.step) === step));
    if (progress) progress.style.width = `${step * 20}%`;
  };
  const openFinder = () => {
    if (!modal) return;
    showStep(1);
    if (typeof modal.showModal === 'function') modal.showModal();
    document.body.classList.add('modal-open');
  };
  window.openTourFinder = openFinder;
  $$('[data-open-finder]').forEach(btn => btn.addEventListener('click', openFinder));
  modal?.addEventListener('close', () => document.body.classList.remove('modal-open'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  $$('.modal-choices button', modal).forEach(btn => btn.addEventListener('click', () => {
    answers[step] = btn.dataset.value;
    showStep(step + 1);
  }));

  finderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(finderForm);
    const payload = {
      name: fd.get('name') || '',
      email: fd.get('email') || '',
      source: 'tour-finder-prototype',
      answers,
      matchedTour: 'Andalusien'
    };
    try {
      await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (_) {}
    modal?.close();
    const toast = $('[data-toast]');
    toast?.classList.add('show');
    setTimeout(() => toast?.classList.remove('show'), 4200);
  });
})();
