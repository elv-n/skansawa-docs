/**
 * EduDocs — Main Entry Point
 * Assembles Hero + Selector into #app
 */

import "./styles/index.css";
import "./styles/print.css";
import { createHero } from "./components/hero.js";
import { createSelector } from "./components/dropdown.js";
import { fetchAllDocumentData, isApiConfigured } from "./api/sheets.js";

async function init() {
  const app = document.getElementById("app");
  if (!app) return;

  // Show Loading Overlay if API is configured
  if (isApiConfigured()) {
    const overlay = document.createElement("div");
    overlay.className = "global-loading-overlay";
    overlay.innerHTML = `
      <div class="global-loading-content">
        <div class="global-spinner"></div>
        <h3 class="global-loading-title">Menyiapkan Data...</h3>
        <p class="global-loading-subtitle">Mengambil data dari Google Sheets</p>
        <p class="global-loading-timer" style="font-size: 0.75rem; color: #9CA3AF; margin: 0;"></p>
        <button class="global-loading-skip" style="display:none; margin-top: 8px; padding: 8px 20px; border: 1px solid #E5E7EB; border-radius: 8px; background: white; cursor: pointer; font-size: 0.85rem; color: #4B5563; transition: background 0.2s;">Lewati & Lanjutkan</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const timerEl = overlay.querySelector(".global-loading-timer");
    const skipBtn = overlay.querySelector(".global-loading-skip");
    const subtitleEl = overlay.querySelector(".global-loading-subtitle");
    const spinnerEl = overlay.querySelector(".global-spinner");
    let seconds = 0;
    let done = false;

    // Elapsed timer
    const interval = setInterval(() => {
      seconds++;
      timerEl.textContent = `${seconds} detik...`;
      // Show skip button after 5 seconds
      if (seconds >= 5 && !done) {
        skipBtn.style.display = "inline-block";
      }
    }, 1000);

    // Skip button handler
    const skipPromise = new Promise((resolve) => {
      skipBtn.addEventListener("click", () => {
        resolve("skipped");
      });
    });

    function dismissOverlay(success = true) {
      if (done) return;
      done = true;
      clearInterval(interval);
      if (success) {
        subtitleEl.textContent = "Data berhasil dimuat ✓";
        spinnerEl.style.borderTopColor = "#10B981";
      }
      overlay.classList.add("hidden");
      setTimeout(() => overlay.remove(), 400);
    }

    try {
      const result = await Promise.race([fetchAllDocumentData().then(() => "done"), skipPromise]);
      dismissOverlay(result === "done");
    } catch (err) {
      console.error("Gagal memuat data awal:", err);
      subtitleEl.textContent = "Gagal memuat data, lanjut tanpa cache";
      subtitleEl.style.color = "#EF4444";
      setTimeout(() => dismissOverlay(false), 1500);
    }
  }

  // Render Hero
  app.appendChild(createHero());

  // Render Document Selector
  app.appendChild(createSelector());

  // Render Footer
  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.textContent = "SMK Negeri 1 Wadaslintang · 2026";
  app.appendChild(footer);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
