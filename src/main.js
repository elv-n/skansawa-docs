/**
 * EduDocs — Main Entry Point
 * Assembles Hero + Selector into #app
 */

import './styles/index.css';
import './styles/print.css';
import { createHero } from './components/hero.js';
import { createSelector } from './components/dropdown.js';

function init() {
  const app = document.getElementById('app');
  if (!app) return;

  // Render Hero
  app.appendChild(createHero());

  // Render Document Selector
  app.appendChild(createSelector());

  // Render Footer
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.textContent = 'EduDocs · Document Engine';
  app.appendChild(footer);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
