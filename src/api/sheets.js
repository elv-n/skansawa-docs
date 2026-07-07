/**
 * EduDocs — Google Apps Script API Client
 * Handles all communication with the Google Sheets backend.
 *
 * In development, requests go through Vite's proxy (/api) to avoid CORS.
 * In production, requests go directly to the Apps Script URL.
 */

const APPS_SCRIPT_URL = import.meta.env.VITE_API_URL || '';

/**
 * Small delay helper
 * @param {number} ms
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build the request URL.
 * In dev mode, route through Vite proxy to bypass CORS.
 * In production, call Google Apps Script directly.
 */
function buildUrl(action, params = {}) {
  if (import.meta.env.DEV) {
    const url = new URL('/api', window.location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }

  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

/**
 * Generic fetch wrapper with retry logic.
 * Google Apps Script can be flaky with rapid sequential requests,
 * so we retry on failure with exponential backoff.
 *
 * @param {string} action - API action name
 * @param {Record<string, string>} params - Query parameters
 * @param {number} retries - Number of retries
 * @returns {Promise<any>}
 */
async function apiRequest(action, params = {}, retries = 2) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('API URL belum dikonfigurasi. Tambahkan VITE_API_URL di file .env');
  }

  const url = buildUrl(action, params);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Gagal mengambil data (${response.status})`);
      }

      const data = await response.json();

      if (data && data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      if (attempt < retries) {
        // Wait before retry (500ms, 1000ms, ...)
        console.warn(`API request "${action}" failed (attempt ${attempt + 1}), retrying...`, err.message);
        await delay(500 * (attempt + 1));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Fetch all data needed for a document in a single API call.
 * This avoids multiple rapid requests to Google Apps Script.
 * @param {string} kelas
 * @returns {Promise<{students: Array, waliKelas: Object|null}>}
 */
export async function fetchDocumentData(kelas) {
  return apiRequest('getDocumentData', { kelas });
}

/**
 * Fetch data for ALL classes in a single API call.
 * Returns array of { kelas, students, waliKelas } sorted by class name.
 * @returns {Promise<Array<{kelas: string, students: Array, waliKelas: Object|null}>>}
 */
export async function fetchAllDocumentData() {
  return apiRequest('getAllDocumentData', {}, 1);
}

/**
 * Fetch daftar kelas unik dari sheet Data
 * @returns {Promise<string[]>}
 */
export async function fetchClasses() {
  return apiRequest('getClasses');
}

/**
 * Fetch data siswa untuk kelas tertentu
 * @param {string} kelas
 * @returns {Promise<Array<{no: number, noAbsen: string, nis: string, nama: string, jk: string, nisn: string, kelas: string}>>}
 */
export async function fetchStudents(kelas) {
  return apiRequest('getStudents', { kelas });
}

/**
 * Fetch data wali kelas
 * @param {string} kelas
 * @returns {Promise<{nama: string, nip: string, waliKelas: string} | null>}
 */
export async function fetchWaliKelas(kelas) {
  return apiRequest('getWaliKelas', { kelas });
}

/**
 * Check if API is configured
 * @returns {boolean}
 */
export function isApiConfigured() {
  return Boolean(APPS_SCRIPT_URL);
}
