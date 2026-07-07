/**
 * EduDocs — Presensi Guru Template
 * Men-generate HTML untuk format Cetak Presensi Kehadiran Peserta Didik
 */

export function generatePresensiGuru(data) {
  const { students, waliKelas, selectedClass, selectedSemester } = data;

  // Calculate L and P totals
  const totalL = students.filter((s) => s.jk && s.jk.toUpperCase() === "L").length;
  const totalP = students.filter((s) => s.jk && s.jk.toUpperCase() === "P").length;

  // Dynamic name sizing for Wali Kelas
  let wkClass = "";
  if (waliKelas && waliKelas.nama && waliKelas.nama.length > 35) {
    wkClass = "text-xs";
  } else if (waliKelas && waliKelas.nama && waliKelas.nama.length > 25) {
    wkClass = "text-sm";
  }

  // Generate student rows
  // Minimum 36 rows to maintain the table height on F4, pad with empty rows if needed
  const rows = [];

  for (let i = 0; i < students.length; i++) {
    const s = students[i] || { noAbsen: "", nis: "", nama: "", jk: "" };

    // Pertemuan columns (20)
    const pertemuanCols = Array(20).fill('<td class="text-center col-pertemuan"></td>').join("");

    // S I A cols (3)
    const siaCols = Array(3).fill('<td class="text-center col-absen"></td>').join("");

    // Dynamic name sizing to prevent truncation
    let nameClass = "text-left";
    if (s.nama && s.nama.length > 27) {
      nameClass += " text-xs";
    } else if (s.nama && s.nama.length > 21) {
      nameClass += " text-sm";
    }

    rows.push(`
      <tr>
        <td class="text-center">${s.noAbsen || ""}</td>
        <td class="text-center">${s.nis || ""}</td>
        <td class="${nameClass}">${s.nama || ""}</td>
        <td class="text-center">${s.jk || ""}</td>
        ${pertemuanCols}
        ${siaCols}
        <td></td>
      </tr>
    `);
  }

  return `
    <div class="doc-print-area">
      <div class="doc-header">
        <div class="doc-title">PRESENSI KEHADIRAN PESERTA DIDIK</div>
        <div class="doc-subtitle">SMK NEGERI 1 WADASLINTANG</div>
        <div class="doc-subtitle">TAHUN AJARAN 2026/2027</div>
      </div>
      
      <div class="doc-meta">
        <div class="doc-meta-col">
          <div class="doc-meta-row">
            <span class="doc-meta-label">Kelas</span>
            <span>: ${selectedClass}</span>
          </div>
          <div class="doc-meta-row">
            <span class="doc-meta-label">Bulan</span>
            <span>: .....................................................</span>
          </div>
        </div>
        <div class="doc-meta-col">
          <div class="doc-meta-row">
            <span class="doc-meta-label">Semester</span>
            <span>: ${data.selectedSemester || "Gasal"}</span>
          </div>
          <div class="doc-meta-row">
            <span class="doc-meta-label">Wali Kelas</span>
            <span class="${wkClass}">: ${waliKelas?.nama || "-"}</span>
          </div>
        </div>
      </div>
      
      <table class="doc-table">
        <thead>
          <tr>
            <th rowspan="2" class="col-no">No</th>
            <th rowspan="2" class="col-nis">NIS</th>
            <th rowspan="2" class="col-nama">NAMA SISWA</th>
            <th class="col-jk">JK</th>
            <th colspan="20">PERTEMUAN</th>
            <th colspan="3">Ketidak<br>hadiran</th>
            <th rowspan="2" class="col-ket">Ket</th>
          </tr>
          <tr>
            <th>L/P</th>
            ${Array.from({ length: 20 }, (_, i) => `<th class="col-pertemuan">${i + 1}</th>`).join("")}
            <th class="col-absen">S</th>
            <th class="col-absen">I</th>
            <th class="col-absen">A</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join("")}
        </tbody>
      </table>
      
      <div class="doc-summary">
        <div class="doc-summary-stats">
          <div>L &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${totalL}</div>
          <div>P &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${totalP}</div>
        </div>
        
        <div class="doc-signature">
          <br>
          <div>Wonosobo, <span class="fill-line fill-line--sm"></span></div>
          <div>Guru Mata Pelajaran</div>
          <div class="doc-signature-spacer"></div>
          <div><span class="fill-line"></span></div>
          <div>NIP <span class="fill-line"></span></div>
        </div>
      </div>
    </div>
  `;
}
