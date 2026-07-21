/**
 * SkansawaDocs — Hero Section Component
 * Hero section for document printing.
 */

export function createHero() {
  const hero = document.createElement("header");
  hero.className = "hero";

  hero.innerHTML = `
     <div class="hero__badge">
    <span class="hero__badge-dot"></span>
    SKANSAWA DOCS
  </div>

  <p class="hero__subtitle">
    Presensi, Jurnal dan Daftar Nilai Tahun Ajaran 2026/2027
  </p>

  <p class="hero__tagline">
    Terhubung dengan Google Sheets
  </p>
`;

  return hero;
}
