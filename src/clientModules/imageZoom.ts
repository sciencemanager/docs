// Click-to-zoom for images in all docs pages except the landing.
if (typeof document !== 'undefined') {
  const close = () => document.querySelector('.img-zoom-overlay')?.remove();

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('.img-zoom-overlay')) {
      close();
      return;
    }
    if (
      target instanceof HTMLImageElement &&
      target.closest('.theme-doc-markdown') &&
      !target.closest('.docs-doc-id-index')
    ) {
      const overlay = document.createElement('div');
      overlay.className = 'img-zoom-overlay';
      const img = document.createElement('img');
      img.src = target.currentSrc || target.src;
      img.alt = target.alt;
      overlay.appendChild(img);
      document.body.appendChild(overlay);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}
