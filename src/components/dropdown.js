/**
 * EduDocs — Cascading Dropdown Selector Component
 * Two-level dropdown: Document Type → Class → Preview & Download
 */

import { fetchClasses, fetchDocumentData, fetchAllDocumentData, isApiConfigured, refreshCache } from "../api/sheets.js";
import { generatePresensiGuru } from "../templates/presensi-guru.js";
import { generatePresensiKelasLandscape } from "../templates/presensi-kelas-landscape.js";
import { generatePresensiKelasPortrait } from "../templates/presensi-kelas-portrait.js";
import { generateDaftarNilai } from "../templates/daftar-nilai.js";
import { downloadPDF } from "../utils/exportPdf.js";
import { downloadExcel } from "../utils/exportExcel.js";
import { showPreviewOverlay } from "../utils/previewOverlay.js";

/** Available document types (hardcoded) */
const DOCUMENT_TYPES = [
  { id: "presensi-guru", label: "Presensi Guru" },
  { id: "presensi-kelas-portrait", label: "Presensi Kelas Portrait" },
  { id: "presensi-kelas-landscape", label: "Presensi Kelas Landscape" },
  { id: "daftar-nilai", label: "Daftar Nilai" },
];

/**
 * Create and return the document selector component
 * @returns {HTMLElement}
 */
export function createSelector() {
  const section = document.createElement("section");
  section.className = "selector";

  /** @type {string | null} */
  let selectedDocument = null;
  /** @type {string | null} */
  let selectedClass = null;
  /** @type {string} */
  let selectedSemester = "Gasal";

  // Store the generated pages data
  let currentPagesData = [];
  let currentHtmlPages = [];

  section.innerHTML = `
    <div class="selector__card">
      <div class="selector__header">
        <div>
          <h2 class="selector__title">Pilih Dokumen</h2>
          <p class="selector__description">Pilih jenis dokumen dan kelas untuk melihat pratinjau dan mengunduh.</p>
        </div>
        <button class="btn-sync" id="btn-sync" type="button" title="Sinkronisasi ulang data dari Google Sheets">
          <svg class="btn-sync__icon" id="sync-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
          <span class="btn-sync__text">Sync Data</span>
        </button>
      </div>

      <div class="filters-row">
        <div class="select-group" id="group-document">
          <label class="select-label" for="select-document">Jenis Dokumen</label>
          <select class="select-input" id="select-document">
            <option value="" disabled selected>Pilih Dokumen...</option>
            ${DOCUMENT_TYPES.map((doc) => `<option value="${doc.id}">${doc.label}</option>`).join("")}
          </select>
        </div>

        <div class="select-group" id="group-class">
          <label class="select-label" for="select-class">Kelas</label>
          <div id="class-content">
            <select class="select-input" id="select-class" disabled>
              <option value="" disabled selected>Pilih Kelas...</option>
            </select>
          </div>
        </div>

        <div class="select-group" id="group-semester">
          <label class="select-label" for="select-semester">Semester</label>
          <select class="select-input" id="select-semester">
            <option value="Gasal" selected>Gasal</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      <div class="btn-print-wrapper" id="print-wrapper" style="display:flex; flex-direction:column; gap:8px;">
        <button class="btn-print" id="btn-preview" type="button" style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);">
          <span class="btn-print__icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></span>
          Lihat Pratinjau
        </button>
        <div style="display: flex; gap: 8px;">
          <button class="btn-print" id="btn-unduh-pdf" type="button" style="flex: 1; background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);">
            <span class="btn-print__icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg></span>
            Unduh PDF
          </button>
          <button class="btn-print" id="btn-unduh-excel" type="button" style="flex: 1; background: linear-gradient(135deg, #10B981 0%, #047857 100%);">
            <span class="btn-print__icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg></span>
            Unduh Excel
          </button>
        </div>
      </div>
    </div>
  `;

  // --- DOM References ---
  const selectDocument = /** @type {HTMLSelectElement} */ (section.querySelector("#select-document"));
  const groupClass = /** @type {HTMLElement} */ (section.querySelector("#group-class"));
  const classContent = /** @type {HTMLElement} */ (section.querySelector("#class-content"));
  const selectClass = /** @type {HTMLSelectElement} */ (section.querySelector("#select-class"));
  const selectSemester = /** @type {HTMLSelectElement} */ (section.querySelector("#select-semester"));
  const printWrapper = /** @type {HTMLElement} */ (section.querySelector("#print-wrapper"));
  const btnPreview = /** @type {HTMLButtonElement} */ (section.querySelector("#btn-preview"));
  const btnUnduhPdf = /** @type {HTMLButtonElement} */ (section.querySelector("#btn-unduh-pdf"));
  const btnUnduhExcel = /** @type {HTMLButtonElement} */ (section.querySelector("#btn-unduh-excel"));
  const btnSync = /** @type {HTMLButtonElement} */ (section.querySelector("#btn-sync"));
  const syncIcon = /** @type {SVGElement} */ (section.querySelector("#sync-icon"));

  // --- Event: Sync Button ---
  btnSync.addEventListener("click", async () => {
    if (btnSync.disabled) return;
    btnSync.disabled = true;
    syncIcon.classList.add('btn-sync__icon--spinning');
    const syncText = /** @type {HTMLElement} */ (btnSync.querySelector('.btn-sync__text'));
    const originalText = syncText.textContent;
    syncText.textContent = 'Syncing...';

    try {
      await refreshCache();
      syncText.textContent = 'Berhasil ✓';
      // Reload classes if document is selected
      if (selectedDocument) {
        await loadClasses();
      }
      setTimeout(() => { syncText.textContent = originalText; }, 2000);
    } catch (err) {
      console.error('Sync failed:', err);
      syncText.textContent = 'Gagal!';
      syncText.style.color = '#EF4444';
      setTimeout(() => { syncText.textContent = originalText; syncText.style.color = ''; }, 2000);
    } finally {
      btnSync.disabled = false;
      syncIcon.classList.remove('btn-sync__icon--spinning');
    }
  });

  // --- Event: Document Type Selected ---
  selectDocument.addEventListener("change", async (e) => {
    selectedDocument = /** @type {HTMLSelectElement} */ (e.target).value;
    selectedClass = null;

    selectClass.value = "";
    selectClass.disabled = true;
    hideActionButtons();

    await loadClasses();
  });

  // --- Event: Class Selected ---
  selectClass.addEventListener("change", async (e) => {
    selectedClass = /** @type {HTMLSelectElement} */ (e.target).value;
    if (selectedClass) {
      await generateData();
    }
  });

  // --- Event: Semester Selected ---
  selectSemester.addEventListener("change", async (e) => {
    selectedSemester = /** @type {HTMLSelectElement} */ (e.target).value;
    if (selectedClass) {
      await generateData();
    }
  });

  // --- Event: Preview ---
  btnPreview.addEventListener("click", () => {
    if (!selectedDocument || !selectedClass || currentHtmlPages.length === 0) return;
    const isLandscape = selectedDocument === "presensi-kelas-landscape";
    showPreviewOverlay(currentHtmlPages, isLandscape);
  });

  const PDF_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>`;

  // --- Event: Download PDF ---
  btnUnduhPdf.addEventListener("click", async () => {
    if (!selectedDocument || !selectedClass || currentHtmlPages.length === 0) return;
    const docType = DOCUMENT_TYPES.find((d) => d.id === selectedDocument);
    const isLandscape = selectedDocument === "presensi-kelas-landscape";

    setButtonLoading(btnUnduhPdf, true, PDF_ICON, "Mengunduh PDF...");
    try {
      await downloadPDF(currentHtmlPages, {
        landscape: isLandscape,
        filename: `${docType?.label || "dokumen"} - ${selectedClass}.pdf`,
        onProgress: (current, total) => {
          if (total > 1) {
            btnUnduhPdf.innerHTML = `<span class="loading__spinner" style="border-top-color: white;"></span> Memproses ${current}/${total}...`;
          }
        },
      });
    } catch (err) {
      showError(`Gagal mengunduh PDF: ${err.message}`);
    } finally {
      setButtonLoading(btnUnduhPdf, false, PDF_ICON, "Unduh PDF");
    }
  });

  const EXCEL_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>`;

  // --- Event: Download Excel ---
  btnUnduhExcel.addEventListener("click", async () => {
    if (!selectedDocument || !selectedClass || currentPagesData.length === 0) return;
    const docType = DOCUMENT_TYPES.find((d) => d.id === selectedDocument);

    setButtonLoading(btnUnduhExcel, true, EXCEL_ICON, "Mengunduh Excel...");
    try {
      await downloadExcel(selectedDocument, currentPagesData, {
        filename: `${docType?.label || "dokumen"} - ${selectedClass}.xlsx`,
      });
    } catch (err) {
      showError(`Gagal mengunduh Excel: ${err.message}`);
    } finally {
      setButtonLoading(btnUnduhExcel, false, EXCEL_ICON, "Unduh Excel");
    }
  });

  // --- Helper Functions ---

  async function generateData() {
    const docType = DOCUMENT_TYPES.find((d) => d.id === selectedDocument);

    hideActionButtons();
    currentPagesData = [];
    currentHtmlPages = [];

    // Show loading state directly in the container temporarily
    const loadingMsg = document.createElement("div");
    loadingMsg.className = "loading";
    loadingMsg.id = "temp-loading-msg";
    loadingMsg.innerHTML = `<span class="loading__spinner"></span> Memproses data...`;
    classContent.appendChild(loadingMsg);

    try {
      if (selectedClass === "__ALL__") {
        const allData = await fetchAllDocumentData();
        currentPagesData = allData.map(({ kelas, students, waliKelas }) => ({
          students,
          waliKelas,
          selectedClass: kelas,
          selectedSemester,
        }));
      } else {
        const { students, waliKelas } = await fetchDocumentData(selectedClass);
        currentPagesData = [{ students, waliKelas, selectedClass, selectedSemester }];
      }

      // Generate HTML pages based on doc type
      if (selectedDocument === "presensi-guru") {
        currentHtmlPages = currentPagesData.map((data) => generatePresensiGuru(data));
      } else if (selectedDocument === "presensi-kelas-landscape") {
        currentHtmlPages = currentPagesData.map((data) => generatePresensiKelasLandscape(data));
      } else if (selectedDocument === "presensi-kelas-portrait") {
        currentHtmlPages = currentPagesData.map((data) => generatePresensiKelasPortrait(data));
      } else if (selectedDocument === "daftar-nilai") {
        currentHtmlPages = currentPagesData.map((data) => generateDaftarNilai(data));
      } else {
        throw new Error(`Template untuk dokumen "${docType?.label}" belum tersedia.`);
      }

      showActionButtons();
    } catch (err) {
      console.error("Preview error:", err);
      showError(`Gagal memproses data: ${err.message}`);
    } finally {
      const tempLoading = classContent.querySelector("#temp-loading-msg");
      if (tempLoading) tempLoading.remove();
    }
  }

  async function loadClasses() {
    if (!isApiConfigured()) {
      showError("API belum dikonfigurasi. Tambahkan VITE_API_URL di file .env");
      return;
    }

    classContent.innerHTML = `
      <div class="loading">
        <span class="loading__spinner"></span>
        Memuat daftar kelas...
      </div>
    `;

    try {
      const classes = await fetchClasses();

      classContent.innerHTML = `
        <select class="select-input" id="select-class">
          <option value="" disabled selected>Pilih Kelas...</option>
          <option value="__ALL__">Semua Kelas</option>
          ${classes.map((cls) => `<option value="${cls}">${cls}</option>`).join("")}
        </select>
      `;

      const newSelect = /** @type {HTMLSelectElement} */ (classContent.querySelector("#select-class"));
      newSelect.addEventListener("change", async (e) => {
        selectedClass = /** @type {HTMLSelectElement} */ (e.target).value;
        if (selectedClass) {
          await generateData();
        }
      });
    } catch (err) {
      console.error("Error loading classes:", err);
      classContent.innerHTML = `
        <div class="error">
          <span class="error__icon">⚠</span>
          <span>${err.message}</span>
        </div>
        <select class="select-input" id="select-class" disabled>
          <option value="" disabled selected>— Gagal memuat kelas —</option>
        </select>
      `;
    }
  }



  function showActionButtons() {
    printWrapper.classList.add("btn-print-wrapper--visible");
  }

  function hideActionButtons() {
    printWrapper.classList.remove("btn-print-wrapper--visible");
  }

  function setButtonLoading(btn, isLoading, originalIcon = "", originalText = "") {
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="loading__spinner" style="border-top-color: white;"></span> Memproses...`;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<span class="btn-print__icon">${originalIcon}</span> ${originalText}`;
    }
  }

  function showError(message) {
    const existingError = section.querySelector(".error");
    if (existingError) existingError.remove();

    const errorEl = document.createElement("div");
    errorEl.className = "error";
    errorEl.innerHTML = `
      <span class="error__icon">⚠</span>
      <span>${message}</span>
    `;
    classContent.insertAdjacentElement("beforebegin", errorEl);

    setTimeout(() => errorEl.remove(), 5000);
  }

  return section;
}
