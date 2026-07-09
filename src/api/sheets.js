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
 * Generic fetch wrapper with retry logic and timeout.
 * Google Apps Script can be flaky with rapid sequential requests,
 * so we retry on failure with exponential backoff.
 *
 * @param {string} action - API action name
 * @param {Record<string, string>} params - Query parameters
 * @param {number} retries - Number of retries
 * @returns {Promise<any>}
 */
async function apiRequest(action, params = {}, retries = 1) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('API URL belum dikonfigurasi. Tambahkan VITE_API_URL di file .env');
  }

  const url = buildUrl(action, params);
  const TIMEOUT_MS = 15000; // 15 seconds timeout

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gagal mengambil data (${response.status})`);
      }

      const data = await response.json();

      if (data && data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      const message = err.name === 'AbortError' ? 'Request timeout (15s)' : err.message;
      if (attempt < retries) {
        console.warn(`API request "${action}" failed (attempt ${attempt + 1}), retrying...`, message);
        await delay(500);
      } else {
        throw new Error(message);
      }
    }
  }
}

// --- CACHING LAYER ---
const CACHE_KEY = 'edudocs_data_cache';
let memoryCache = null;

/**
 * Ensures data is loaded in cache (Memory or LocalStorage).
 * If loading from LocalStorage, it triggers a background refresh.
 */
async function getCachedData() {
  if (memoryCache) return memoryCache;

  const stored = localStorage.getItem(CACHE_KEY);
  if (stored) {
    try {
      memoryCache = JSON.parse(stored);
      // Initiate background refresh
      apiRequest('getAllDocumentData', {}, 1)
        .then(data => {
          memoryCache = data;
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          console.log('Background cache refresh successful');
        })
        .catch(err => console.warn('Background cache refresh failed:', err.message));
      
      return memoryCache;
    } catch (e) {
      console.warn('Failed to parse local cache', e);
    }
  }

  // Fetch synchronously if no cache
  const data = await apiRequest('getAllDocumentData', {}, 1);
  memoryCache = data;
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  return data;
}

/**
 * Fetch all data needed for a document.
 * @param {string} kelas
 * @returns {Promise<{students: Array, waliKelas: Object|null}>}
 */
export async function fetchDocumentData(kelas) {
  const allData = await getCachedData();
  const doc = allData.find(d => String(d.kelas).trim() === String(kelas).trim());
  if (doc) {
    return { students: doc.students, waliKelas: doc.waliKelas };
  }
  throw new Error(`Data untuk kelas ${kelas} tidak ditemukan`);
}

/**
 * Fetch data for ALL classes.
 * @returns {Promise<Array<{kelas: string, students: Array, waliKelas: Object|null}>>}
 */
export async function fetchAllDocumentData() {
  return getCachedData();
}

/**
 * Fetch daftar kelas unik.
 * @returns {Promise<string[]>}
 */
export async function fetchClasses() {
  const allData = await getCachedData();
  return allData.map(d => d.kelas);
}

/**
 * Fetch data siswa untuk kelas tertentu.
 * @param {string} kelas
 * @returns {Promise<Array>}
 */
export async function fetchStudents(kelas) {
  const allData = await getCachedData();
  const doc = allData.find(d => String(d.kelas).trim() === String(kelas).trim());
  return doc ? doc.students : [];
}

/**
 * Fetch data wali kelas.
 * @param {string} kelas
 * @returns {Promise<Object|null>}
 */
export async function fetchWaliKelas(kelas) {
  const allData = await getCachedData();
  const doc = allData.find(d => String(d.kelas).trim() === String(kelas).trim());
  return doc ? doc.waliKelas : null;
}

/**
 * Force clear cache and re-fetch all data from Google Sheets.
 * @returns {Promise<Array>}
 */
export async function refreshCache() {
  memoryCache = null;
  localStorage.removeItem(CACHE_KEY);
  const data = await apiRequest('getAllDocumentData', {}, 1);
  memoryCache = data;
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  return data;
}

/**
 * Check if API is configured
 * @returns {boolean}
 */
export function isApiConfigured() {
  return Boolean(APPS_SCRIPT_URL);
}
