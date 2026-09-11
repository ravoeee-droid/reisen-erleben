/*
  Reisen & Erleben V3 interaction layer
  Interaction patterns adapted from permissively licensed inspirations:
  - Codrops OnScrollPathAnimations (MIT): scroll-linked SVG path concepts
  - Codrops Scroll3DGrid (MIT): perspective/grid depth concepts
  - motion-primitives (MIT): magnetic/tilt interaction concepts
  Implemented here with native Web APIs to keep the build dependency-free and fast.
*/
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = (s, el=document) => el.querySelector(s);
  const qa = (s, el=document) => [...el.querySelectorAll(s)];

  // Header
  const header = q('[data-header]');
  const onScrollHeader = () => header?.classList.toggle('scrolled', scrollY > 24);
  onScrollHeader(); addEventListener('scroll', onScrollHeader, {passive:true});

  // Mobile menu
  const menuBtn = q('[data-menu-button]'); const mobileMenu = q('[data-mobile-menu]');
  const setMenu = open => { document.body.classList.toggle('menu-open', open); mobileMenu?.classList.toggle('open', open); menuBtn?.setAttribute('aria-expanded', String(open)); };
  menuBtn?.addEventListener('click', () => setMenu(!mobileMenu?.classList.contains('open')));
  qa('[data-mobile-menu] a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  // Parallax / CSS 3D
  if (!reduce) {
    const parallax = qa('[data-parallax]');
    const updateParallax = () => {
      const vh = innerHeight;
      parallax.forEach(el => {
        const r = el.getBoundingClientRect();
        const f = Number(el.dataset.parallax || .04);
        const p = (r.top + r.height/2 - vh/2) * f;
        el.style.transform = `translate3d(0,${-p}px,0)`;
      });
    };
    addEventListener('scroll', updateParallax, {passive:true}); updateParallax();
  }

  // Reveal text / sections
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
  }), {threshold:.12});
  qa('[data-reveal],.journey,.service-card,.person,.road-day').forEach(el => io.observe(el));

  // Route draw
  const routePaths = qa('.route-line path,.route');
  const drawRoutes = () => {
    routePaths.forEach(path => {
      const host = path.closest('section') || path.parentElement;
      const r = host.getBoundingClientRect();
      const span = r.height + innerHeight;
      const p = Math.max(0, Math.min(1, (innerHeight-r.top)/span));
      path.style.strokeDashoffset = String(1-p);
    });
  };
  if (!reduce) { addEventListener('scroll', drawRoutes, {passive:true}); drawRoutes(); } else routePaths.forEach(p=>p.style.strokeDashoffset='0');

  // 3D memory flight
  const memory = q('[data-memory]');
  const memoryItems = memory ? qa('[data-memory-item]', memory) : [];
  const meter = q('[data-memory-meter]');
  const memoryScroll = () => {
    if (!memory || reduce) return;
    const r = memory.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height-innerHeight)));
    memoryItems.forEach((item,i) => {
      const x = Number(item.dataset.x||0), y = Number(item.dataset.y||0), z = Number(item.dataset.z||-1800);
      const depth = z + progress * (Math.abs(z)+700);
      const driftX = x + (progress-.5) * (i%2?12:-10);
      const driftY = y + Math.sin(progress*Math.PI)*(i%2?6:-4);
      const scale = .55 + progress*.65;
      const opacity = Math.max(0, Math.min(1, (progress*1.35) - i*.02));
      item.style.transform = `translate3d(calc(-50% + ${driftX}vw),calc(-50% + ${driftY}vh),${depth}px) scale(${scale}) rotate(${(i%2?1:-1)*(5-progress*4)}deg)`;
      item.style.opacity = opacity;
    });
    if (meter) meter.textContent = String(Math.round(progress*100)).padStart(3,'0');
  };
  if (memory && !reduce) { addEventListener('scroll', memoryScroll, {passive:true}); memoryScroll(); }

  // Tilt surfaces (native version of magnetic/tilt primitive)
  if (!reduce && matchMedia('(pointer:fine)').matches) qa('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', ev => {
      const r = el.getBoundingClientRect(); const x=(ev.clientX-r.left)/r.width-.5; const y=(ev.clientY-r.top)/r.height-.5;
      el.style.transform = `perspective(900px) rotateX(${-y*4}deg) rotateY(${x*5}deg) translateY(-2px)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform='');
  });

  // Tour filters
  const filterButtons = qa('[data-filter]'); const tourRows = qa('[data-tour-row]');
  filterButtons.forEach(btn => btn.addEventListener('click', () => {
    filterButtons.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const f=btn.dataset.filter;
    tourRows.forEach(row => row.hidden = !(f==='all' || row.dataset.year===f || row.dataset.status===f));
  }));

  // FAQ
  qa('.faq-item button').forEach(btn => btn.addEventListener('click', () => btn.closest('.faq-item').classList.toggle('open')));

  // Finder modal
  const finder = q('[data-finder]');
  qa('[data-open-finder]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); if (finder?.showModal) finder.showModal(); }));
  q('[data-close-finder]')?.addEventListener('click',()=>finder?.close());
  if (finder) {
    let step = 1; const answers = {};
    const show = n => { step=n; qa('.finder-step',finder).forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===n)); };
    qa('[data-choice]',finder).forEach(btn => btn.addEventListener('click', () => {
      answers[`q${step}`]=btn.dataset.choice; if (step<4) show(++step); else show(5);
    }));
    q('[data-finder-reset]',finder)?.addEventListener('click',()=>show(1));
  }

  // Forms -> prototype confirmation; API hook remains optional
  qa('form[data-prototype-form]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn=q('button[type=submit]',form); const old=btn?.textContent; if(btn){btn.disabled=true;btn.textContent='Wird vorbereitet …';}
    const payload=Object.fromEntries(new FormData(form));
    try{
      const res=await fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,source:location.pathname})});
      if(!res.ok) throw new Error('api');
      form.innerHTML='<div class="callout"><strong>Danke.</strong><p>Die Anfrage wurde aufgenommen. R&E kann jetzt persönlich nachfassen.</p></div>';
    }catch{
      form.innerHTML='<div class="callout"><strong>Entwurf / Integration bereit.</strong><p>Das Formular ist für CRM, E-Mail oder WhatsApp-Automation vorbereitet. Im finalen Betrieb wird hier die gewünschte Schnittstelle angeschlossen.</p></div>';
    }finally{ if(btn){btn.disabled=false;btn.textContent=old;} }
  }));
})();
