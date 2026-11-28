(() => {
  const lab = document.querySelector('[data-cover-lab]');
  if (!lab) return;
  const preview = lab.querySelector('[data-cover-preview]');
  const photo = lab.querySelector('[data-cover-photo]');
  const upload = lab.querySelector('[data-cover-upload]');
  let objectUrl = null;

  const setView = (view) => {
    preview.dataset.view = view;
    lab.querySelectorAll('[data-cover-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.coverView === view));
    preview.querySelector('.cover-remix')?.setAttribute('aria-hidden', view === 'remix' ? 'false' : 'true');
  };

  const setPhoto = (src, selectedButton = null) => {
    photo.src = src;
    lab.querySelectorAll('[data-cover-src]').forEach((button) => button.classList.toggle('is-active', button === selectedButton));
    setView('remix');
  };

  lab.querySelectorAll('[data-cover-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.coverView)));
  lab.querySelectorAll('[data-cover-src]').forEach((button) => button.addEventListener('click', () => setPhoto(button.dataset.coverSrc, button)));
  upload?.addEventListener('change', () => {
    const file = upload.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    setPhoto(objectUrl);
  });
  window.addEventListener('pagehide', () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });
})();
