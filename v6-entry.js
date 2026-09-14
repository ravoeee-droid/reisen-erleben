/* Reisen & Erleben V6 — fast, dependency-free experience layer */
(() => {
  'use strict';
  const d = document;
  const q = (s, el=d) => el.querySelector(s);
  const qa = (s, el=d) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  d.documentElement.classList.add('re-v6');
  d.body?.classList.add('re-ready', 're-v6-ready');
  qa('.re-page-loader,.re-cursor,.re-float-cta,.re-tobi,.re-tobi-panel').forEach(el => el.remove());

  // Media: the build step localises and compresses R&E images. Runtime only prioritises what matters.
  const hero = q('.hero-media img');
  if (hero) {
    hero.loading = 'eager';
    hero.decoding = 'async';
    hero.fetchPriority = 'high';
    const onHeroReady = () => hero.closest('.hero')?.classList.add('hero-image-ready');
    if (hero.complete && hero.naturalWidth) onHeroReady();
    else hero.addEventListener('load', onHeroReady, {once:true});
  }

  qa('img').forEach(img => {
    if (img === hero || img.closest('.brand,.footer-brand')) return;
    if (!img.loading) img.loading = 'lazy';
    img.decoding = 'async';
    try { img.fetchPriority = 'low'; } catch {}
    const mark = () => img.classList.add('media-loaded');
    if (img.complete && img.naturalWidth) mark();
    else img.addEventListener('load', mark, {once:true});
  });

  // Lightweight reveals; no GSAP/Lenis/CDN dependency and no content hidden while JS loads.
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('v6-in');
        io.unobserve(entry.target);
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
    qa('.section-head,.journey,.service-card,.person,.road-day,.manifesto-grid,.team-grid,.tour-row').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * .92) { el.classList.add('v6-in'); return; }
      el.classList.add('v6-reveal'); io.observe(el);
    });
  } else {
    qa('.v6-reveal').forEach(el => el.classList.add('v6-in'));
  }

  // Tobi V6: human-feeling, accessible, useful Tour Concierge — not a fake "AI robot".
  const existing = q('[data-tobi-v6]');
  if (!existing) {
    const candidates = [
      {name:'Frühlingsstart Andalusien', href:'/touren/andalusien-fruehling/', meta:'10 Tage · Flug & Motorradtransport', tags:['fruehjahr','sonne','mix','lang']},
      {name:'Spanien bis Portugal', href:'/touren/spanien-portugal/', meta:'19 Tage · Pyrenäen bis Atlantik', tags:['fruehjahr','sonne','zuegig','lang']},
      {name:'Böhmen bis Prag', href:'/touren/boehmen-prag/', meta:'6 Tage · Kultur & entspanntes Fahren', tags:['fruehjahr','genuss','gemuetlich','woche']},
      {name:'Vogesen & Schwarzwald', href:'/touren/vogesen-schwarzwald/', meta:'4 Tage · viele Kurven', tags:['sommer','kurven','zuegig','kurz']},
      {name:'Trentino, Gardasee & Brenta', href:'/touren/trentino-gardasee/', meta:'9 Tage · Alpenpässe & gutes Hotel', tags:['sommer','paesse','zuegig','woche']},
      {name:'Salzkammergut', href:'/touren/salzkammergut/', meta:'7 Tage · Seen & Großglockner', tags:['sommer','paesse','mix','woche']},
      {name:'Slowenien', href:'/touren/slowenien/', meta:'7 Tage · Soča, Vršič & Julische Alpen', tags:['sommer','paesse','mix','woche']},
      {name:'Istrien All Inclusive', href:'/touren/istrien/', meta:'9 Tage · Adria & Genuss', tags:['sommer','sonne','mix','woche']},
      {name:'Kroatien erleben', href:'/touren/kroatien/', meta:'10 Tage · Alpen, Adria & Inseln', tags:['herbst','sonne','mix','lang']},
      {name:'Winterflucht Teneriffa', href:'/touren/teneriffa/', meta:'8 Tage · Vulkan & Atlantik', tags:['herbst','sonne','zuegig','woche']}
    ];
    const questions = [
      {key:'season', eyebrow:'01 · REISEZEIT', text:'Wann willst du am liebsten los?', choices:[['Frühjahr','fruehjahr','März–Mai'],['Sommer','sommer','Juni–August'],['Herbst','herbst','September–November'],['Noch offen','offen','Hauptsache Motorrad']]},
      {key:'feeling', eyebrow:'02 · FAHRGEFÜHL', text:'Wonach soll sich die Reise anfühlen?', choices:[['Sonne & Süden','sonne','Wärme, Meer, Weite'],['Pässe & Kehren','paesse','Höhenmeter & Panorama'],['Kurven ohne Ende','kurven','Flow statt Geradeaus'],['Genuss & Gruppe','genuss','Fahren plus gute Abende']]},
      {key:'pace', eyebrow:'03 · FAHRSTIL', text:'Wie fährst du am liebsten?', choices:[['Entspannt','gemuetlich','mehr Pausen'],['Ausgewogen','mix','zügig & gemütlich'],['Dynamisch','zuegig','erfahren & flott'],['Beratung','beratung','R&E hilft persönlich']]},
      {key:'duration', eyebrow:'04 · DAUER', text:'Wie lange darf der Alltag warten?', choices:[['3–5 Tage','kurz','kompakt raus'],['6–9 Tage','woche','eine volle Woche'],['10+ Tage','lang','richtig weg'],['Flexibel','flex','zeig mir das Beste']]}
    ];

    const shell = d.createElement('aside');
    shell.className = 'tobi-v6';
    shell.dataset.tobiV6 = '';
    shell.innerHTML = `
      <button class="tobi-v6-launcher" type="button" aria-expanded="false" aria-controls="tobi-v6-panel">
        <span class="tobi-v6-avatar" aria-hidden="true"><span>T</span><i></i></span>
        <span class="tobi-v6-launcher-copy"><strong>Tobi</strong><small>findet deine passende Tour</small></span>
        <span class="tobi-v6-launcher-arrow" aria-hidden="true">↗</span>
      </button>
      <section class="tobi-v6-panel" id="tobi-v6-panel" role="dialog" aria-modal="false" aria-label="Tobi Tour-Concierge" hidden>
        <header class="tobi-v6-head">
          <div class="tobi-v6-identity"><span class="tobi-v6-avatar" aria-hidden="true"><span>T</span><i></i></span><div><strong>Tobi</strong><small>R&E Tour-Concierge</small></div></div>
          <button class="tobi-v6-close" type="button" aria-label="Tobi schließen">×</button>
        </header>
        <div class="tobi-v6-progress"><span></span></div>
        <div class="tobi-v6-body" aria-live="polite"></div>
        <footer class="tobi-v6-foot"><span>Kein Callcenter.</span> Am Ende kannst du direkt zur Tour oder zu R&E.</footer>
      </section>`;
    d.body.append(shell);

    const launcher = q('.tobi-v6-launcher', shell);
    const panel = q('.tobi-v6-panel', shell);
    const close = q('.tobi-v6-close', shell);
    const body = q('.tobi-v6-body', shell);
    const progress = q('.tobi-v6-progress span', shell);
    let step = 0;
    const answers = {};

    const open = () => {
      panel.hidden = false;
      requestAnimationFrame(() => shell.classList.add('is-open'));
      launcher.setAttribute('aria-expanded','true');
      if (!body.dataset.started) { body.dataset.started='1'; renderQuestion(); }
      close.focus({preventScroll:true});
    };
    const shut = () => {
      shell.classList.remove('is-open');
      launcher.setAttribute('aria-expanded','false');
      setTimeout(() => { if (!shell.classList.contains('is-open')) panel.hidden = true; }, reduce ? 0 : 220);
      launcher.focus({preventScroll:true});
    };
    const rank = () => {
      const values = Object.values(answers);
      return candidates.map(c => ({...c, score:c.tags.reduce((sum,t) => sum + (values.includes(t) ? 1 : 0), 0)}))
        .sort((a,b) => b.score-a.score);
    };
    const renderQuestion = () => {
      const item = questions[step];
      progress.style.width = `${((step+1)/questions.length)*100}%`;
      body.innerHTML = `<div class="tobi-v6-message"><span>${item.eyebrow}</span><p>${item.text}</p></div><div class="tobi-v6-choices"></div>`;
      const choices = q('.tobi-v6-choices', body);
      item.choices.forEach(([label,value,sub]) => {
        const btn = d.createElement('button');
        btn.type='button'; btn.className='tobi-v6-choice'; btn.dataset.value=value;
        btn.innerHTML=`<span><strong>${label}</strong><small>${sub}</small></span><b aria-hidden="true">→</b>`;
        btn.addEventListener('click', () => {
          answers[item.key]=value;
          if (step < questions.length-1) { step++; renderQuestion(); }
          else renderResult();
        });
        choices.append(btn);
      });
      if (step > 0) {
        const back=d.createElement('button'); back.type='button'; back.className='tobi-v6-back'; back.textContent='← zurück';
        back.addEventListener('click',()=>{ step--; renderQuestion(); }); body.append(back);
      }
    };
    const renderResult = () => {
      progress.style.width='100%';
      const [best, second] = rank();
      const pct = Math.min(98, 78 + best.score*5);
      body.innerHTML = `
        <div class="tobi-v6-message result"><span>DEIN TOUR-MATCH</span><p><strong>${best.name}</strong> passt gerade am besten zu dir.</p></div>
        <article class="tobi-v6-match"><div><span class="tobi-v6-score">${pct}%</span><small>Match</small></div><div><strong>${best.name}</strong><span>${best.meta}</span></div></article>
        <div class="tobi-v6-result-actions"><a href="${best.href}">Tour ansehen <b>↗</b></a><a class="secondary" href="/kontakt/?tour=${encodeURIComponent(best.name)}">Persönlich fragen</a></div>
        <button class="tobi-v6-alt" type="button">Alternative: ${second.name} →</button>
        <button class="tobi-v6-back restart" type="button">Neu starten</button>`;
      q('.tobi-v6-alt',body)?.addEventListener('click',()=>location.href=second.href);
      q('.restart',body)?.addEventListener('click',()=>{ Object.keys(answers).forEach(k=>delete answers[k]); step=0; renderQuestion(); });
    };

    launcher.addEventListener('click', () => shell.classList.contains('is-open') ? shut() : open());
    close.addEventListener('click', shut);
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && shell.classList.contains('is-open')) shut(); });
  }
})();
