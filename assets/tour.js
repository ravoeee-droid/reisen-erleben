(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tour-specific word reveal: same scroll-to-word-range principle as the
  // Magic UI TextReveal component, kept dependency-free for the static prototype.
  const wrap = $('[data-text-reveal-tour]');
  const text = $('.tour-manifesto-text', wrap || document);
  let words = [];
  if (text) {
    text.innerHTML = text.textContent.trim().split(/\s+/).map((w) => `<span class="word">${w}</span>`).join(' ');
    words = $$('.word', text);
  }

  const roadbook = $('#roadbook-tour');
  const route = $('.tour-route-live');
  const counter = $('[data-tour-road-progress]');
  const days = $$('[data-tour-road-day]');

  // Codrops OnScrollPathAnimations `data-path-to` pattern, adapted
  // to the existing lightweight rAF loop instead of loading GSAP.
  const numberPattern = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
  const morphers = $$('.path-morph', roadbook || document).map((path) => {
    const from = path.getAttribute('d') || '';
    const to = path.dataset.pathTo || '';
    const a = (from.match(numberPattern) || []).map(Number);
    const b = (to.match(numberPattern) || []).map(Number);
    const fragments = from.split(numberPattern);
    if (!a.length || a.length !== b.length || fragments.length !== a.length + 1) return null;
    return (progress) => {
      const eased = progress * progress * (3 - 2 * progress);
      let d = fragments[0];
      for (let i = 0; i < a.length; i++) d += Number((a[i] + (b[i] - a[i]) * eased).toFixed(2)) + fragments[i + 1];
      path.setAttribute('d', d);
    };
  }).filter(Boolean);
  let raf = 0;
  const draw = () => {
    raf = 0;
    const vh = innerHeight;
    if (wrap && words.length) {
      const r = wrap.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh * .78 - r.top) / Math.max(1, r.height * .76)));
      const active = Math.floor(p * (words.length + 4));
      words.forEach((word, i) => word.classList.toggle('active', i < active));
    }
    if (roadbook && route) {
      const r = roadbook.getBoundingClientRect();
      const max = roadbook.offsetHeight - vh;
      const p = Math.max(0, Math.min(1, -r.top / Math.max(1, max)));
      route.style.strokeDashoffset = String(reducedMotion ? 0 : 1 - p);
      if (!reducedMotion) morphers.forEach((morph) => morph(p));
      let current = 1, distance = Infinity;
      days.forEach((day, i) => {
        const d = Math.abs(day.getBoundingClientRect().top - vh * .38);
        if (d < distance) { distance = d; current = i + 1; }
      });
      if (counter) counter.textContent = String(current).padStart(2, '0');
    }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(draw); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  draw();

  const form = $('#andalusiaLeadForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.source = 'andalusien-detail-v2';
    try { await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); } catch (_) {}
    const toast = $('[data-toast]');
    toast?.classList.add('show');
    setTimeout(() => toast?.classList.remove('show'), 4300);
    form.reset();
  });
})();
