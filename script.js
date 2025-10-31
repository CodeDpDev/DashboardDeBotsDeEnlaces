// Dashboard — carga masiva de iframes y vista individual
const loadBtn = document.getElementById('loadBtn');
const urlsInput = document.getElementById('urlsInput');
const colsInput = document.getElementById('colsInput');
const grid = document.getElementById('grid');
const thumbHeight = document.getElementById('thumbHeight');

const viewerArea = document.getElementById('viewerArea');
const viewerTitle = document.getElementById('viewerTitle');
const viewerPlaceholder = document.getElementById('viewerPlaceholder');
const openNewTabBtn = document.getElementById('openNewTab');
const closeViewerBtn = document.getElementById('closeViewer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const viewerStatus = document.getElementById('viewerStatus');

let thumbs = []; // {url, el, iframe, status}
let currentIndex = -1;

function buildGridColumns(n) {
  // limit between 1 and 6
  const cols = Math.max(1, Math.min(6, n || 3));
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

// create thumb card
function createThumb(url, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'thumb-card';

  const top = document.createElement('div');
  top.className = 'thumb-top';
  top.style.height = `${thumbHeight.value}px`;

  const loading = document.createElement('div');
  loading.className = 'thumb-loading';
  loading.innerHTML = `<div class="spinner-border" role="status" style="width:2rem;height:2rem"><span class="visually-hidden">Loading...</span></div>`;

  top.appendChild(loading);
  wrapper.appendChild(top);

  const meta = document.createElement('div');
  meta.className = 'thumb-meta';
  meta.innerHTML = `
    <div class="small-url" title="${url}">${url}</div>
    <div>
      <button class="btn btn-sm btn-outline-primary btn-open">Abrir</button>
      <button class="btn btn-sm btn-outline-secondary btn-tab">↗</button>
    </div>
  `;
  wrapper.appendChild(meta);

  // iframe (hidden behind loading until onload)
  const iframe = document.createElement('iframe');
  // sandbox attribute: adjust as needed. Removing sandbox may be required for some sites,
  // but many sites block embedding anyway via server headers.
  iframe.setAttribute('src', url);
  iframe.setAttribute('loading', 'eager'); // try to load immediately
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = '0';
  iframe.style.display = 'none';

  // track load
  iframe.addEventListener('load', () => {
    loading.style.display = 'none';
    iframe.style.display = 'block';
    thumbs[index].status = 'Cargado';
    thumbs[index].loaded = true;
  });

  // many browsers don't emit error for iframe due to x-frame-options; use timeout fallback
  const failTimeout = setTimeout(() => {
    if (!thumbs[index].loaded) {
      loading.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.className = 'thumb-fallback';
      fallback.innerHTML = `<div>No se pudo mostrar la miniatura.<br>Probablemente el sitio impide ser embebido.</div>`;
      top.appendChild(fallback);
      thumbs[index].status = 'Falló';
    }
  }, 3000);

  top.appendChild(iframe);

  // button actions
  meta.querySelector('.btn-open').addEventListener('click', () => {
    openInViewer(index);
  });

  meta.querySelector('.btn-tab').addEventListener('click', () => {
    window.open(url, "_blank");
  });

  return { wrapper, iframe, failTimeout };
}

function openInViewer(index) {
  if (index < 0 || index >= thumbs.length) return;
  currentIndex = index;

  // clear previous
  viewerArea.innerHTML = '';
  viewerArea.classList.remove('d-none');
  viewerPlaceholder.classList.add('d-none');

  const item = thumbs[index];

  // create a fresh iframe for viewer (separate from thumbnail, to avoid cross-window issues)
  const bigIframe = document.createElement('iframe');
  bigIframe.setAttribute('src', item.url);
  bigIframe.setAttribute('loading', 'eager');
  bigIframe.style.width = '100%';
  bigIframe.style.height = '450px';
  bigIframe.style.border = '0';

  viewerArea.appendChild(bigIframe);
  viewerTitle.textContent = `Visor — ${index + 1}`;

  viewerStatus.textContent = 'Cargando...';
  bigIframe.addEventListener('load', () => {
    viewerStatus.textContent = 'Cargado';
  });

  openNewTabBtn.onclick = () => window.open(item.url, '_blank');
  closeViewerBtn.onclick = () => {
    viewerArea.innerHTML = '';
    viewerArea.classList.add('d-none');
    viewerPlaceholder.classList.remove('d-none');
    viewerStatus.textContent = '—';
    currentIndex = -1;
  };
}

prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) openInViewer(currentIndex - 1);
});
nextBtn.addEventListener('click', () => {
  if (currentIndex < thumbs.length - 1) openInViewer(currentIndex + 1);
});

// main load action
loadBtn.addEventListener('click', () => {
  const raw = urlsInput.value.trim();
  if (!raw) return alert('Ingresa al menos un enlace.');
  const urls = raw.split(/\r?\n/).map(u => u.trim()).filter(Boolean);

  // reset
  grid.innerHTML = '';
  thumbs = [];

  buildGridColumns(parseInt(colsInput.value, 10));

  // create all thumbnails at once (iframes will attempt to load)
  urls.forEach((u, i) => {
    const container = document.createElement('div');
    container.className = 'h-100';
    const { wrapper, iframe, failTimeout } = createThumb(u, i);

    container.appendChild(wrapper);
    grid.appendChild(container);

    thumbs.push({
      url: u,
      el: wrapper,
      iframe,
      loaded: false,
      status: 'Cargando',
      failTimeout
    });
  });
});
