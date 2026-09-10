(() => {
  const form = document.querySelector('#andalusiaLeadForm');
  const toast = document.querySelector('[data-toast]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    payload.source = 'andalusien-detail';
    try {
      await fetch('/api/lead', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload) });
    } catch (_) {}
    form.reset();
    toast?.classList.add('show');
    setTimeout(() => toast?.classList.remove('show'), 4200);
  });
})();
