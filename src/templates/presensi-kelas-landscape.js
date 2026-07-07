/**
 * EduDocs — Presensi Kelas Landscape Template
 * Format: F4 Landscape (330mm × 210mm), kolom tanggal 1–31
 * Sesuai format referensi: 2 tanda tangan (Kepala Sekolah + Wali Kelas)
 */

export function generatePresensiKelasLandscape(data) {
  const { students, waliKelas, selectedClass, selectedSemester } = data;

  // Only include students that have actual data (non-empty rows)
  const filledStudents = students.filter(s => s.nama || s.nis || s.noAbsen);

  const totalL = filledStudents.filter(s => s.jk && s.jk.toUpperCase() === 'L').length;
  const totalP = filledStudents.filter(s => s.jk && s.jk.toUpperCase() === 'P').length;

  // Generate rows — only for filled students, no padding
  const rows = filledStudents.map((s) => {
    let nameClass = 'ls-nama';
    if (s.nama && s.nama.length > 30) nameClass += ' ls-xs';
    else if (s.nama && s.nama.length > 22) nameClass += ' ls-sm';

    const dateCols = Array(31).fill('<td></td>').join('');
    const siaCols = Array(3).fill('<td></td>').join('');

    return `<tr>
        <td class="ls-center">${s.noAbsen || ''}</td>
        <td class="ls-center">${s.nis || ''}</td>
        <td class="${nameClass}">${s.nama || ''}</td>
        <td class="ls-center">${s.jk || ''}</td>
        ${dateCols}
        ${siaCols}
        <td></td>
      </tr>`;
  }).join('');

  // No font shrinking for wali kelas name — aligned to col 23 gives enough space

  const tanggalHeader = Array.from({ length: 31 }, (_, i) =>
    `<th class="ls-tgl">${i + 1}</th>`
  ).join('');

  // Count how many date columns before col 23 => columns 1..22 = 22 cols
  // NO + NIS + NAMA + JK = 4 cols, then date cols 1-22 = 22 cols => total 26 cols before col 23
  // We want Semester/Wali Kelas to start at col 23 area
  // Colspan for left side (NO + NIS + NAMA + JK + dates 1..22) = 4 + 22 = 26
  // Colspan for right side (dates 23..31 + S + I + A + Ket) = 9 + 3 + 1 = 13

  return `
    <div class="doc-print-area ls-wrap">
      <!-- Header -->
      <div class="ls-header">
        <div class="ls-title">PRESENSI KEHADIRAN PESERTA DIDIK</div>
        <div class="ls-sub">SMK NEGERI 1 WADASLINTANG</div>
        <div class="ls-sub">TAHUN AJARAN 2026/2027</div>
      </div>

      <!-- Meta — uses table layout so Semester/Wali Kelas align with col 23 -->
      <table class="ls-meta-table">
        <tr>
          <td class="ls-mt-left"><span class="ls-lbl">Kelas</span>&nbsp;:&nbsp;${selectedClass}</td>
          <td class="ls-mt-right"><span class="ls-lbl">Semester</span>&nbsp;:&nbsp;${selectedSemester || 'Gasal'}</td>
        </tr>
        <tr>
          <td class="ls-mt-left"><span class="ls-lbl">Bulan</span>&nbsp;:&nbsp;................................</td>
          <td class="ls-mt-right"><span class="ls-lbl">Wali Kelas</span>&nbsp;:&nbsp;${waliKelas?.nama || '-'}</td>
        </tr>
      </table>

      <!-- Table -->
      <table class="ls-table">
        <thead>
          <tr>
            <th rowspan="2" class="ls-no">NO</th>
            <th rowspan="2" class="ls-nis">NIS</th>
            <th rowspan="2" class="ls-nama-col">NAMA SISWA</th>
            <th class="ls-jk-h">JK</th>
            <th colspan="31" class="ls-tgl-h">TANGGAL</th>
            <th colspan="3" class="ls-sia-h">Ketidak<br>hadiran</th>
            <th rowspan="2" class="ls-ket">Ket</th>
          </tr>
          <tr>
            <th class="ls-lp">L/P</th>
            ${tanggalHeader}
            <th class="ls-sia">S</th>
            <th class="ls-sia">I</th>
            <th class="ls-sia">A</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Footer: L/P counts aligned with NAMA & JK columns -->
      <table class="ls-footer-table">
        <tr>
          <td class="ls-ft-no"></td>
          <td class="ls-ft-nis"></td>
          <td class="ls-ft-nama ls-ft-label">L&nbsp;&nbsp;:&nbsp;&nbsp;${totalL}</td>
          <td class="ls-ft-jk"></td>
          <td colspan="35" class="ls-ft-spacer"></td>
        </tr>
        <tr>
          <td class="ls-ft-no"></td>
          <td class="ls-ft-nis"></td>
          <td class="ls-ft-nama ls-ft-label">P&nbsp;&nbsp;:&nbsp;&nbsp;${totalP}</td>
          <td class="ls-ft-jk"></td>
          <td colspan="35" class="ls-ft-spacer"></td>
        </tr>
      </table>

      <!-- Signatures -->
      <div class="ls-sigs">
        <div class="ls-sig">
          <div>Mengetahui,</div>
          <div>Kepala Sekolah</div>
          <div class="ls-sig-space"></div>
          <div class="ls-sig-name">Agus Surono, S.Pd.,M.M.,Gr.</div>
          <div>NIP 198411032011011007</div>
        </div>
        <div class="ls-sig">
          <div>Wonosobo, <span class="fill-line fill-line--sm"></span></div>
          <div>Wali Kelas</div>
          <div class="ls-sig-space"></div>
          <div class="ls-sig-name">${waliKelas?.nama || '<span class="fill-line"></span>'}</div>
          <div>NIP ${waliKelas?.nip || '<span class="fill-line"></span>'}</div>
        </div>
      </div>
    </div>
  `;
}
