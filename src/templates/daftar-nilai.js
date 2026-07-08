/**
 * EduDocs — Daftar Nilai Template
 * Format: F4 Portrait (210mm × 330mm), 36 baris
 */

export function generateDaftarNilai(data) {
  const { students, waliKelas, selectedClass, selectedSemester } = data;

  // Only include students that have actual data (non-empty rows)
  const filledStudents = students.filter((s) => s.nama || s.nis || s.noAbsen);

  // Generate rows — pad to exactly 36 rows
  const rows = [];
  for (let i = 0; i < 36; i++) {
    const s = filledStudents[i] || {};
    const isFilled = !!(s.nama || s.nis || s.noAbsen);

    let nameClass = "dn-nama";
    if (s.nama && s.nama.length > 32) nameClass += " dn-xxs";
    else if (s.nama && s.nama.length > 25) nameClass += " dn-xs";
    else if (s.nama && s.nama.length > 18) nameClass += " dn-sm";

    rows.push(`<tr>
        <td class="dn-center">${s.noAbsen || i + 1}</td>
        <td class="dn-center">${s.nis || ""}</td>
        <td class="${isFilled ? nameClass : "dn-nama"}">${s.nama || ""}</td>
        <td class="dn-center">${s.jk || ""}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>`);
  }

  return `
    <div class="doc-print-area dn-wrap">
      <!-- Header -->
      <div class="dn-header">
        <div class="dn-title">DAFTAR NILAI</div>
      </div>

      <!-- Meta -->
      <table class="dn-meta-table">
        <tr>
          <td class="dn-mt-label">Mata Pelajaran</td>
          <td class="dn-mt-colon">:</td>
          <td class="dn-mt-value">...............................................</td>
        </tr>
        <tr>
          <td class="dn-mt-label">Kelas/Fase/Semester</td>
          <td class="dn-mt-colon">:</td>
          <td class="dn-mt-value"><strong>${selectedClass}</strong> &nbsp;&nbsp;&nbsp;/.............../${selectedSemester || "Gasal"}</td>
        </tr>
        <tr>
          <td class="dn-mt-label">Tahun Ajaran</td>
          <td class="dn-mt-colon">:</td>
          <td class="dn-mt-value"><strong>2026/2027</strong></td>
        </tr>
      </table>

      <!-- Table -->
      <table class="dn-table">
        <thead>
          <tr>
            <th rowspan="3" class="dn-col-no">NO</th>
            <th rowspan="3" class="dn-col-nis">NIS</th>
            <th rowspan="3" class="dn-col-nama">NAMA SISWA</th>
            <th rowspan="2" class="dn-col-jk">JK</th>
            <th colspan="4">SUMATIF LINGKUP MATERI</th>
            <th colspan="5">SUMATIF AKHIR</th>
            <th rowspan="3" class="dn-col-raport">Nilai Raport<br/>(3*S+2*SAS)<br/>/5</th>
          </tr>
          <tr>
            <th class="dn-col-sm">BAB/<br/>MATERI</th>
            <th class="dn-col-sm">BAB/<br/>MATER</th>
            <th class="dn-col-sm">BAB/<br/>MATER</th>
            <th class="dn-col-sm">BAB/<br/>MATER</th>
            <th class="dn-col-sm">BAB/<br/>MATER</th>
            <th rowspan="2" class="dn-col-sm">NA<br/>Sumatif<br/>(S)</th>
            <th rowspan="2" class="dn-col-sm">Non<br/>Tes</th>
            <th rowspan="2" class="dn-col-sm">Tes</th>
            <th rowspan="2" class="dn-col-sm">NA Sumatif<br/>Akhir<br/>Semester<br/>(SAS)</th>
          </tr>
          <tr>
            <th class="dn-col-sm">L/P</th>
            <th class="dn-col-sm">Sumatif 1</th>
            <th class="dn-col-sm">Sumatif 2</th>
            <th class="dn-col-sm">Sumatif 3</th>
            <th class="dn-col-sm">Sumatif 4</th>
            <th class="dn-col-sm">Sumatif</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join("")}
        </tbody>
      </table>

      <!-- Summary Footer -->
      <div class="dn-summary-area">
        <div class="dn-summary-left" style="padding-left: 60px;">
          <div class="dn-sig-block" style="text-align: left;">
            <div class="dn-sig-title">Mengetahui,<br/>Kepala Sekolah</div>
            <div class="dn-sig-name">
              <strong><u>Agus Surono, S.Pd., M.M., Gr.</u></strong><br/>
              NIP. 19841103 201101 1 007
            </div>
          </div>
        </div>

        <div class="dn-summary-right">
          <div class="dn-sig-block" style="text-align: left;">
            <div class="dn-sig-title" style="margin-bottom: 30px;">Wonosobo, <br/>Guru Mata Pelajaran</div>
            <div class="dn-sig-name">
              <strong><u><span class="fill-line"></span></u></strong><br/>
              NIP. 
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
