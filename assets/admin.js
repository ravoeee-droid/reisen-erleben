(() => {
  document.querySelectorAll('[data-spark]').forEach(canvas => {
    const values = canvas.dataset.spark.split(',').map(Number);
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    const w = rect.width, h = rect.height, max=Math.max(...values), min=Math.min(...values);
    ctx.strokeStyle = '#f27635'; ctx.lineWidth=1.8; ctx.beginPath();
    values.forEach((v,i)=>{const x=i*(w/(values.length-1));const y=h-5-((v-min)/(max-min||1))*(h-10);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
    ctx.stroke();
  });
})();
