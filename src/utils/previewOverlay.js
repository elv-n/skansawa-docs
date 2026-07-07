/**
 * Lightweight Preview Overlay
 */
export function showPreviewOverlay(htmlPages, isLandscape) {
  // Clean up any existing
  const oldContainer = document.getElementById('preview-overlay');
  if (oldContainer) oldContainer.remove();

  // Hide main UI
  const appContainer = document.getElementById('app');
  if (appContainer) appContainer.style.display = 'none';

  if (isLandscape) {
    document.body.classList.add('print-landscape');
  } else {
    document.body.classList.remove('print-landscape');
  }

  // Create container
  const overlay = document.createElement('div');
  overlay.id = 'preview-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.minHeight = '100vh';
  overlay.style.backgroundColor = '#d1d5db';
  overlay.style.padding = '40px 20px 100px';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '50';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.position = 'fixed';
  toolbar.style.bottom = '20px';
  toolbar.style.left = '50%';
  toolbar.style.transform = 'translateX(-50%)';
  toolbar.style.background = 'white';
  toolbar.style.padding = '12px 24px';
  toolbar.style.borderRadius = '999px';
  toolbar.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
  toolbar.style.display = 'flex';
  toolbar.style.gap = '16px';
  toolbar.style.zIndex = '1000';

  const btnClose = document.createElement('button');
  btnClose.innerHTML = '⬅ Kembali';
  btnClose.style.padding = '8px 16px';
  btnClose.style.borderRadius = '8px';
  btnClose.style.border = '1px solid #e5e7eb';
  btnClose.style.background = 'white';
  btnClose.style.cursor = 'pointer';
  btnClose.style.fontWeight = '600';
  
  btnClose.onclick = () => {
    overlay.remove();
    document.body.classList.remove('print-landscape');
    if (appContainer) appContainer.style.display = 'flex'; // Use flex since #app is a flex container
  };

  toolbar.appendChild(btnClose);
  document.body.appendChild(overlay);
  overlay.appendChild(toolbar);

  // Render pages
  htmlPages.forEach((pageHtml, idx) => {
    const paper = document.createElement('div');
    paper.className = isLandscape ? 'paper-page landscape-page' : 'paper-page';
    if (idx > 0) paper.style.marginTop = '24px';
    paper.innerHTML = pageHtml;
    overlay.appendChild(paper);
  });
}
