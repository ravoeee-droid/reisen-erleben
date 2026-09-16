/* R&E V6.3 CRO runtime — one finder, measurable funnel, low-friction booking */
(() => {
  'use strict';
  const d=document;
  const q=(s,e=d)=>e.querySelector(s);
  const qa=(s,e=d)=>[...e.querySelectorAll(s)];
  const page=d.body?.dataset.croPage||location.pathname;

  function track(name,meta={}){
    const payload={event:name,path:location.pathname,ts:Date.now(),...meta};
    try{window.dataLayer=window.dataLayer||[];window.dataLayer.push(payload);}catch{}
    try{if(typeof window.va==='function') window.va('event',name,meta);}catch{}
    try{
      const body=JSON.stringify(payload);
      if(navigator.sendBeacon){navigator.sendBeacon('/api/event',new Blob([body],{type:'application/json'}));}
      else fetch('/api/event',{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true}).catch(()=>{});
    }catch{}
  }
  window.reTrack=track;

  // One finder engine: every discovery CTA opens Tobi; legacy modal is removed at build time.
  d.addEventListener('click',e=>{
    const opener=e.target.closest('[data-open-finder]');
    if(opener){
      e.preventDefault();
      const launcher=q('.tobi-v6-launcher');
      if(launcher){ if(!q('[data-tobi-v6]')?.classList.contains('is-open')) launcher.click(); track('finder_open',{source:opener.textContent.trim().slice(0,60)}); }
    }
    const phone=e.target.closest('a[href^="tel:"]');
    if(phone) track('phone_click',{phone:phone.getAttribute('href')});
    const booking=e.target.closest('a[href*="/buchung/"]');
    if(booking) track('tour_cta',{href:booking.getAttribute('href'),label:booking.textContent.trim().slice(0,80)});
  });

  // Detect recommendation completion without coupling to the finder implementation.
  const tobi=q('[data-tobi-v6]');
  if(tobi){
    const observer=new MutationObserver(()=>{
      const match=q('.tobi-v6-match',tobi);
      if(match && !match.dataset.tracked){match.dataset.tracked='1';track('finder_complete',{recommendation:q('.tobi-v6-match strong',tobi)?.textContent||''});}
    });
    observer.observe(tobi,{subtree:true,childList:true});
  }

  // Travel list: show bookable future inventory first, then allow purposeful exploration.
  const travelTable=q('.cro-tour-table');
  if(travelTable){
    const rows=qa('[data-tour-row]',travelTable);
    const buttons=qa('[data-cro-filter]');
    const counter=q('[data-cro-count]');
    function apply(mode){
      let shown=0;
      rows.forEach(row=>{
        const status=row.dataset.status||'';
        const days=Number(row.dataset.croDuration||0);
        const theme=row.dataset.croTheme||'';
        const available=status==='free'||status==='few';
        let visible=false;
        if(mode==='available') visible=available;
        else if(mode==='short') visible=available&&days>=1&&days<=5;
        else if(mode==='week') visible=available&&days>=6&&days<=9;
        else if(mode==='long') visible=available&&days>=10;
        else if(mode==='south') visible=available&&theme==='south';
        else if(mode==='alps') visible=available&&theme==='alps';
        else if(mode==='all') visible=true;
        row.hidden=!visible;
        if(visible) shown++;
      });
      buttons.forEach(b=>b.classList.toggle('active',b.dataset.croFilter===mode));
      if(counter) counter.textContent=`${shown} Reisen`;
      track('travel_filter',{filter:mode,results:shown});
    }
    buttons.forEach(btn=>btn.addEventListener('click',()=>apply(btn.dataset.croFilter)));
    apply('available');
  }

  // Booking page: retain selected-tour context and require one reliable contact channel.
  const form=q('form[data-prototype-form]');
  if(form){
    const select=q('select[name="tour"]',form);
    const summary=q('[data-booking-summary]');
    function updateSummary(){
      if(!summary||!select) return;
      const text=select.options[select.selectedIndex]?.textContent?.trim()||'Persönliche Beratung';
      q('[data-booking-title]',summary).textContent=text;
      q('[data-booking-copy]',summary).textContent=select.value==='beratung'?'R&E meldet sich persönlich und findet gemeinsam mit dir die passende Tour.':'Deine Anfrage ist unverbindlich. R&E prüft die Verfügbarkeit und meldet sich persönlich bei dir.';
    }
    updateSummary(); select?.addEventListener('change',updateSummary);
    form.addEventListener('submit',e=>{
      const email=q('input[name="email"]',form)?.value.trim();
      const phone=q('input[name="phone"]',form)?.value.trim();
      q('.cro-contact-error',form)?.remove();
      if(!email&&!phone){
        e.preventDefault(); e.stopImmediatePropagation();
        const msg=d.createElement('p'); msg.className='cro-contact-error'; msg.textContent='Bitte gib mindestens eine E-Mail-Adresse oder Telefonnummer an, damit R&E dich zur Anfrage erreichen kann.';
        q('.fields',form)?.prepend(msg); q('input[name="email"]',form)?.focus();
        track('lead_validation_error',{reason:'contact_required'}); return;
      }
      track('booking_start',{tour:select?.value||''});
    },true);
  }

  if(q('.tour-detail')) track('tour_view',{tour:q('.tour-visual h1')?.textContent.trim()||d.title});
})();
