/**
 * EduDocs — Presensi Kelas Portrait Template
 * Format: F4 Portrait (210mm × 330mm), kolom tanggal 1–31
 */

export function generatePresensiKelasPortrait(data) {
  const { students, waliKelas, selectedClass, selectedSemester } = data;

  // Only include students that have actual data (non-empty rows)
  const filledStudents = students.filter(s => s.nama || s.nis || s.noAbsen);

  const totalL = filledStudents.filter(s => s.jk && s.jk.toUpperCase() === 'L').length;
  const totalP = filledStudents.filter(s => s.jk && s.jk.toUpperCase() === 'P').length;

  // Generate rows — pad to exactly 36 rows
  const rows = [];
  for (let i = 0; i < 36; i++) {
    const s = filledStudents[i] || {};
    const isFilled = !!(s.nama || s.nis || s.noAbsen);
    
    let nameClass = 'pt-nama';
    if (s.nama && s.nama.length > 25) nameClass += ' pt-xs';
    else if (s.nama && s.nama.length > 18) nameClass += ' pt-sm';

    const dateCols = Array(31).fill('<td></td>').join('');
    const siaCols = Array(3).fill('<td></td>').join('');

    rows.push(`<tr>
        <td class="pt-center">${s.noAbsen || (i + 1)}</td>
        <td class="pt-center">${s.nis || ''}</td>
        <td class="${isFilled ? nameClass : 'pt-nama'}">${s.nama || ''}</td>
        <td class="pt-center">${s.jk || ''}</td>
        ${dateCols}
        ${siaCols}
        <td></td>
      </tr>`);
  }

  const tanggalHeader = Array.from({ length: 31 }, (_, i) =>
    `<th class="pt-tgl">${i + 1}</th>`
  ).join('');

  return `
    <div class="doc-print-area pt-wrap">
      <!-- Header -->
      <div class="pt-header">
        <div class="pt-title">PRESENSI KEHADIRAN PESERTA DIDIK</div>
        <div class="pt-sub">SMK NEGERI 1 WADASLINTANG</div>
        <div class="pt-sub">TAHUN AJARAN 2026/2027</div>
      </div>

      <!-- Meta -->
      <table class="pt-meta-table">
        <tr>
          <td class="pt-mt-left"><span class="pt-lbl">Kelas</span>&nbsp;:&nbsp;${selectedClass}</td>
          <td class="pt-mt-right"><span class="pt-lbl">Semester</span>&nbsp;:&nbsp;${selectedSemester || 'Gasal'}</td>
        </tr>
        <tr>
          <td class="pt-mt-left"><span class="pt-lbl">Bulan</span>&nbsp;:&nbsp;........................................</td>
          <td class="pt-mt-right"><span class="pt-lbl">Wali Kelas</span>&nbsp;:&nbsp;${waliKelas?.nama || ''}</td>
        </tr>
      </table>

      <!-- Table -->
      <table class="pt-table">
        <thead>
          <tr>
            <th rowspan="2" class="pt-no">NO</th>
            <th rowspan="2" class="pt-nis">NIS</th>
            <th rowspan="2" class="pt-nama-col">NAMA SISWA</th>
            <th class="pt-jk">JK</th>
            <th colspan="31">TANGGAL</th>
            <th colspan="3">Ketidak<br/>hadiran</th>
            <th rowspan="2" class="pt-ket">Ket</th>
          </tr>
          <tr>
            <th class="pt-sia">L/P</th>
            ${tanggalHeader}
            <th class="pt-sia">S</th>
            <th class="pt-sia">I</th>
            <th class="pt-sia">A</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>

      <!-- Summary Footer -->
      <div class="pt-summary-area" style="display: block;">
        <!-- L and P aligned with columns -->
        <div style="display: flex; width: 100%; font-size: 7pt; margin-top: 4px;">
          <div style="width: 21%;"></div>
          <div style="width: 2.5%; text-align: center;">L</div>
          <div style="width: 2.1%; text-align: center;">${totalL}</div>
        </div>
        <div style="display: flex; width: 100%; font-size: 7pt;">
          <div style="width: 21%;"></div>
          <div style="width: 2.5%; text-align: center;">P</div>
          <div style="width: 2.1%; text-align: center;">${totalP}</div>
        </div>

        <!-- Signatures -->
        <div class="pt-signatures" style="display: flex; justify-content: space-between; margin-top: 15px;">
          <div class="pt-sig-block" style="text-align: left;">
            <div class="pt-sig-title">Mengetahui,<br/>Kepala Sekolah</div>
            <div class="pt-sig-name">
              <strong><u>Agus Surono, S.Pd., M.M., Gr.</u></strong><br/>
              NIP. 19841103 201101 1 007
            </div>
          </div>
          <div class="pt-sig-block" style="text-align: left;">
            <div class="pt-sig-title">Wonosobo, <span class="fill-line fill-line--sm"></span><br/>Wali Kelas</div>
            <div class="pt-sig-name">
              <strong><u>${waliKelas?.nama || '<span class="fill-line"></span>'}</u></strong><br/>
              NIP. ${waliKelas?.nip || '<span class="fill-line"></span>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
