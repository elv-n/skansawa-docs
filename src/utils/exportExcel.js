import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Generate Excel file matching the PDF layout.
 */
export async function downloadExcel(docType, pagesData, options = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduDocs';
  workbook.created = new Date();

  const filename = options.filename || 'dokumen-edudocs.xlsx';

  if (docType === 'presensi-guru') {
    generateExcelPresensiGuru(workbook, pagesData);
  } else if (docType === 'presensi-kelas-landscape') {
    generateExcelPresensiKelasLandscape(workbook, pagesData);
  } else if (docType === 'presensi-kelas-portrait') {
    generateExcelPresensiKelasPortrait(workbook, pagesData);
  } else if (docType === 'daftar-nilai') {
    generateExcelDaftarNilai(workbook, pagesData);
  } else {
    throw new Error(`Export Excel untuk dokumen "${docType}" belum didukung.`);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), filename);
}

// --- Implementation for Presensi Guru (Portrait) ---
function generateExcelPresensiGuru(workbook, pagesData) {
  pagesData.forEach((data, index) => {
    const { students, waliKelas, selectedClass } = data;
    const sheetName = selectedClass ? `Kelas ${selectedClass}` : `Sheet ${index + 1}`;
    const sheet = workbook.addWorksheet(sheetName.substring(0, 31));

    // Basic setup for F4 Portrait (210x330mm)
    // 14 is the standard code for Folio/F4 (8.5 x 13 inches) in Excel
    sheet.pageSetup.paperSize = 14; 
    sheet.pageSetup.orientation = 'portrait';
    sheet.pageSetup.margins = { left: 0.6, right: 0.6, top: 0.6, bottom: 0.6, header: 0, footer: 0 };
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0; // Don't constrain height, let it flow to next page if needed

    // Column Widths
    sheet.columns = [
      { width: 4 },    // A: NO
      { width: 8 },    // B: NIS
      { width: 30 },   // C: NAMA
      { width: 4 },    // D: JK
      ...Array(20).fill({ width: 3 }), // E-X: Pertemuan 1-20
      { width: 3 }, { width: 3 }, { width: 3 }, // Y-AA: S, I, A
      { width: 5 }     // AB: Ket
    ];

    // Header
    sheet.mergeCells('A1:AB1');
    sheet.getCell('A1').value = 'PRESENSI KEHADIRAN PESERTA DIDIK';
    sheet.getCell('A1').font = { name: 'Times New Roman', bold: true, size: 13 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:AB2');
    sheet.getCell('A2').value = 'SMK NEGERI 1 WADASLINTANG';
    sheet.getCell('A2').font = { name: 'Times New Roman', bold: true, size: 13 };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.mergeCells('A3:AB3');
    sheet.getCell('A3').value = 'TAHUN AJARAN 2026/2027';
    sheet.getCell('A3').font = { name: 'Times New Roman', bold: true, size: 13 };
    sheet.getCell('A3').alignment = { horizontal: 'center' };

    // Meta
    sheet.getCell('A5').value = `Kelas`;
    sheet.getCell('C5').value = `: ${selectedClass}`;
    sheet.getCell('Q5').value = `Semester`;
    sheet.getCell('T5').value = `: ${data.selectedSemester || 'Gasal'}`;

    sheet.getCell('A6').value = `Bulan`;
    sheet.getCell('C6').value = `: .....................................................`;
    sheet.getCell('Q6').value = `Wali Kelas`;
    sheet.getCell('T6').value = `: ${waliKelas?.nama || '-'}`;

    // Table Header
    let row = 8;
    const borderAll = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    const alignCenter = { horizontal: 'center', vertical: 'middle' };
    const fontBold = { name: 'Times New Roman', bold: true, size: 10 };

    sheet.mergeCells(`A${row}:A${row+1}`); sheet.getCell(`A${row}`).value = 'No';
    sheet.mergeCells(`B${row}:B${row+1}`); sheet.getCell(`B${row}`).value = 'NIS';
    sheet.mergeCells(`C${row}:C${row+1}`); sheet.getCell(`C${row}`).value = 'NAMA SISWA';
    sheet.getCell(`D${row}`).value = 'JK'; sheet.getCell(`D${row+1}`).value = 'L/P';
    
    sheet.mergeCells(`E${row}:X${row}`); sheet.getCell(`E${row}`).value = 'PERTEMUAN';
    for(let i=0; i<20; i++) {
        const col = sheet.getColumn(5 + i).letter;
        sheet.getCell(`${col}${row+1}`).value = i+1;
    }

    sheet.mergeCells(`Y${row}:AA${row}`); sheet.getCell(`Y${row}`).value = 'Ketidakhadiran';
    sheet.getCell(`Y${row+1}`).value = 'S';
    sheet.getCell(`Z${row+1}`).value = 'I';
    sheet.getCell(`AA${row+1}`).value = 'A';

    sheet.mergeCells(`AB${row}:AB${row+1}`); sheet.getCell(`AB${row}`).value = 'Ket';

    // Apply styles to headers
    for(let r=row; r<=row+1; r++) {
        for(let c=1; c<=28; c++) {
            const cell = sheet.getCell(r, c);
            cell.border = borderAll;
            cell.alignment = alignCenter;
            cell.font = fontBold;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        }
    }

    row += 2;

    // Table Data
    students.forEach((s) => {
        sheet.getCell(row, 1).value = s.noAbsen || "";
        sheet.getCell(row, 2).value = s.nis || "";
        sheet.getCell(row, 3).value = s.nama || "";
        sheet.getCell(row, 4).value = s.jk || "";
        
        for(let c=1; c<=28; c++) {
            const cell = sheet.getCell(row, c);
            cell.border = borderAll;
            cell.font = { name: 'Times New Roman', size: 10 };
            if (c === 3) {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
        }
        sheet.getRow(row).height = 20; // Matches PDF padding
        row++;
    });

    // Summary
    row += 1;
    const totalL = students.filter((s) => s.jk && s.jk.toUpperCase() === "L").length;
    const totalP = students.filter((s) => s.jk && s.jk.toUpperCase() === "P").length;
    
    sheet.getCell(`D${row}`).value = `L       ${totalL}`;
    sheet.getCell(`D${row+1}`).value = `P       ${totalP}`;

    // Signature
    row += 1;
    sheet.getCell(`T${row}`).value = `Wonosobo, ...........................................`;
    sheet.getCell(`T${row+1}`).value = `Guru Mata Pelajaran`;
    sheet.getCell(`T${row+4}`).value = `____________________________________`;
    sheet.getCell(`T${row+5}`).value = `NIP .............................................................`;
  });
}

// --- Implementation for Presensi Kelas Landscape ---
function generateExcelPresensiKelasLandscape(workbook, pagesData) {
  pagesData.forEach((data, index) => {
    const { students, waliKelas, selectedClass } = data;
    const sheetName = selectedClass ? `Kelas ${selectedClass}` : `Sheet ${index + 1}`;
    const sheet = workbook.addWorksheet(sheetName.substring(0, 31));

    sheet.pageSetup.paperSize = 14; 
    sheet.pageSetup.orientation = 'landscape';
    sheet.pageSetup.margins = { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0, footer: 0 };
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;

    // Column widths
    sheet.columns = [
      { width: 4 },   // A: NO
      { width: 8 },   // B: NIS
      { width: 30 },  // C: NAMA
      { width: 4 },   // D: JK
      ...Array(31).fill({ width: 3 }), // E-AI: Tgl 1-31
      { width: 3 }, { width: 3 }, { width: 3 }, // AJ-AL: S, I, A
      { width: 5 }    // AM: Ket
    ];

    // Header
    sheet.mergeCells('A1:AM1');
    sheet.getCell('A1').value = 'PRESENSI KEHADIRAN PESERTA DIDIK';
    sheet.getCell('A1').font = { name: 'Times New Roman', bold: true, size: 12 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:AM2');
    sheet.getCell('A2').value = 'SMK NEGERI 1 WADASLINTANG';
    sheet.getCell('A2').font = { name: 'Times New Roman', bold: true, size: 12 };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.mergeCells('A3:AM3');
    sheet.getCell('A3').value = 'TAHUN AJARAN 2026/2027';
    sheet.getCell('A3').font = { name: 'Times New Roman', bold: true, size: 12 };
    sheet.getCell('A3').alignment = { horizontal: 'center' };

    // Meta
    sheet.getCell('A4').value = `Kelas`;
    sheet.getCell('B4').value = `: ${selectedClass}`;
    sheet.getCell('V4').value = `Semester`;
    sheet.getCell('X4').value = `: ${data.selectedSemester || 'Gasal'}`;

    sheet.getCell('A5').value = `Bulan`;
    sheet.getCell('B5').value = `: ................................`;
    sheet.getCell('V5').value = `Wali Kelas`;
    sheet.getCell('X5').value = `: ${waliKelas?.nama || '-'}`;

    // Table Header
    let row = 7;
    const borderAll = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    const alignCenter = { horizontal: 'center', vertical: 'middle' };
    const fontBold = { name: 'Times New Roman', bold: true, size: 9 };

    sheet.mergeCells(`A${row}:A${row+1}`); sheet.getCell(`A${row}`).value = 'NO';
    sheet.mergeCells(`B${row}:B${row+1}`); sheet.getCell(`B${row}`).value = 'NIS';
    sheet.mergeCells(`C${row}:C${row+1}`); sheet.getCell(`C${row}`).value = 'NAMA SISWA';
    sheet.getCell(`D${row}`).value = 'JK'; sheet.getCell(`D${row+1}`).value = 'L/P';
    
    sheet.mergeCells(`E${row}:AI${row}`); sheet.getCell(`E${row}`).value = 'TANGGAL';
    for(let i=0; i<31; i++) {
        const colNum = 5 + i;
        const cell = sheet.getCell(row+1, colNum);
        cell.value = i+1;
    }

    sheet.mergeCells(`AJ${row}:AL${row}`); sheet.getCell(`AJ${row}`).value = 'Ketidakhadiran';
    sheet.getCell(`AJ${row+1}`).value = 'S';
    sheet.getCell(`AK${row+1}`).value = 'I';
    sheet.getCell(`AL${row+1}`).value = 'A';

    sheet.mergeCells(`AM${row}:AM${row+1}`); sheet.getCell(`AM${row}`).value = 'Ket';

    // Apply styles to headers
    for(let r=row; r<=row+1; r++) {
        for(let c=1; c<=39; c++) {
            const cell = sheet.getCell(r, c);
            cell.border = borderAll;
            cell.alignment = alignCenter;
            cell.font = fontBold;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        }
    }

    row += 2;

    // Table Data
    const filledStudents = students.filter(s => s.nama || s.nis || s.noAbsen);
    filledStudents.forEach((s) => {
        sheet.getCell(row, 1).value = s.noAbsen || "";
        sheet.getCell(row, 2).value = s.nis || "";
        sheet.getCell(row, 3).value = s.nama || "";
        sheet.getCell(row, 4).value = s.jk || "";
        
        for(let c=1; c<=39; c++) {
            const cell = sheet.getCell(row, c);
            cell.border = borderAll;
            cell.font = { name: 'Times New Roman', size: 9 };
            if (c === 3) {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
        }
        sheet.getRow(row).height = 17; // Matches PDF padding
        row++;
    });

    // Summary & Signatures
    const totalL = filledStudents.filter(s => s.jk && s.jk.toUpperCase() === 'L').length;
    const totalP = filledStudents.filter(s => s.jk && s.jk.toUpperCase() === 'P').length;
    
    row += 1;
    sheet.getCell(`D${row}`).value = 'L';
    sheet.getCell(`E${row}`).value = totalL;
    sheet.getCell(`D${row}`).alignment = { horizontal: 'center' };
    sheet.getCell(`E${row}`).alignment = { horizontal: 'center' };
    sheet.getCell(`D${row}`).font = { name: 'Times New Roman', size: 9, bold: true };
    sheet.getCell(`E${row}`).font = { name: 'Times New Roman', size: 9, bold: true };

    sheet.getCell(`D${row+1}`).value = 'P';
    sheet.getCell(`E${row+1}`).value = totalP;
    sheet.getCell(`D${row+1}`).alignment = { horizontal: 'center' };
    sheet.getCell(`E${row+1}`).alignment = { horizontal: 'center' };
    sheet.getCell(`D${row+1}`).font = { name: 'Times New Roman', size: 9, bold: true };
    sheet.getCell(`E${row+1}`).font = { name: 'Times New Roman', size: 9, bold: true };

    row += 3;
    sheet.getCell(`C${row}`).value = `Mengetahui,`;
    sheet.getCell(`AG${row}`).value = `Wonosobo,`;
    
    row += 1;
    sheet.getCell(`C${row}`).value = `Kepala Sekolah`;
    sheet.getCell(`AG${row}`).value = `Wali Kelas`;
    
    row += 4;
    sheet.getCell(`C${row}`).value = `Agus Surono, S.Pd., M.M., Gr.`;
    sheet.getCell(`C${row}`).font = { name: 'Times New Roman', size: 10, bold: true, underline: true };
    sheet.getCell(`AG${row}`).value = `${waliKelas?.nama || '______________________________'}`;
    sheet.getCell(`AG${row}`).font = { name: 'Times New Roman', size: 10, bold: true, underline: true };
    
    row += 1;
    sheet.getCell(`C${row}`).value = `NIP. 19841103 201101 1 007`;
    sheet.getCell(`AG${row}`).value = `NIP. ${waliKelas?.nip || '.............................................................'}`;
  });
}

// --- Implementation for Presensi Kelas Portrait ---
function generateExcelPresensiKelasPortrait(workbook, pagesData) {
  pagesData.forEach((data, index) => {
    const { students, waliKelas, selectedClass } = data;
    const filledStudents = students.filter(s => s.nama || s.nis || s.noAbsen);
    const sheetName = selectedClass ? `Kelas ${selectedClass}` : `Sheet ${index + 1}`;
    const sheet = workbook.addWorksheet(sheetName.substring(0, 31));

    sheet.pageSetup.paperSize = 14; 
    sheet.pageSetup.orientation = 'portrait';
    sheet.pageSetup.margins = { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0, footer: 0 };
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;

    // Proportional column widths (will be scaled down by fitToWidth)
    sheet.columns = [
        { width: 4 },    // A: No
        { width: 7 },    // B: NIS
        { width: 25 },   // C: Nama
        { width: 4 },    // D: JK
        ...Array(31).fill({ width: 3 }), // 31 days
        { width: 3 },  // S
        { width: 3 },  // I
        { width: 3 },  // A
        { width: 5 }     // Ket
    ];

    const borderAll = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    sheet.mergeCells('A1:AM1');
    sheet.getCell('A1').value = 'PRESENSI KEHADIRAN PESERTA DIDIK';
    sheet.getCell('A1').font = { name: 'Times New Roman', size: 10, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:AM2');
    sheet.getCell('A2').value = 'SMK NEGERI 1 WADASLINTANG';
    sheet.getCell('A2').font = { name: 'Times New Roman', size: 9, bold: true };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.mergeCells('A3:AM3');
    sheet.getCell('A3').value = 'TAHUN AJARAN 2026/2027';
    sheet.getCell('A3').font = { name: 'Times New Roman', size: 9, bold: true };
    sheet.getCell('A3').alignment = { horizontal: 'center' };

    sheet.mergeCells('A5:C5');
    sheet.getCell('A5').value = `Kelas : ${selectedClass}`;
    sheet.getCell('A5').font = { name: 'Times New Roman', size: 8, bold: true };

    sheet.mergeCells('W5:AM5');
    sheet.getCell('W5').value = `Semester : ${data.selectedSemester || 'Gasal'}`;
    sheet.getCell('W5').font = { name: 'Times New Roman', size: 8, bold: true };

    sheet.mergeCells('A6:C6');
    sheet.getCell('A6').value = `Bulan : `;
    sheet.getCell('A6').font = { name: 'Times New Roman', size: 8, bold: true };

    sheet.mergeCells('W6:AM6');
    sheet.getCell('W6').value = `Wali Kelas : ${waliKelas?.nama || ''}`;
    sheet.getCell('W6').font = { name: 'Times New Roman', size: 8, bold: true };

    let row = 8;
    const headerFont = { name: 'Times New Roman', size: 7, bold: true };
    
    sheet.mergeCells(`A${row}:A${row+1}`); sheet.getCell(`A${row}`).value = 'NO';
    sheet.mergeCells(`B${row}:B${row+1}`); sheet.getCell(`B${row}`).value = 'NIS';
    sheet.mergeCells(`C${row}:C${row+1}`); sheet.getCell(`C${row}`).value = 'NAMA SISWA';
    
    sheet.getCell(`D${row}`).value = 'JK';
    sheet.getCell(`D${row+1}`).value = 'L/P';
    
    sheet.mergeCells(`E${row}:AI${row}`); sheet.getCell(`E${row}`).value = 'TANGGAL';
    sheet.mergeCells(`AJ${row}:AL${row}`); sheet.getCell(`AJ${row}`).value = 'Ketidak\nhadiran';
    sheet.mergeCells(`AM${row}:AM${row+1}`); sheet.getCell(`AM${row}`).value = 'Ket';

    for(let i=0; i<31; i++) {
        sheet.getCell(9, 5 + i).value = i + 1;
    }
    sheet.getCell('AJ9').value = 'S';
    sheet.getCell('AK9').value = 'I';
    sheet.getCell('AL9').value = 'A';

    for(let r=8; r<=9; r++) {
        for(let c=1; c<=39; c++) {
            const cell = sheet.getCell(r, c);
            cell.font = headerFont;
            cell.border = borderAll;
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
    }

    row = 10;
    // Pad to 36 rows
    for(let i = 0; i < 36; i++) {
        const s = filledStudents[i] || {};
        
        sheet.getCell(row, 1).value = s.noAbsen || (i + 1);
        sheet.getCell(row, 2).value = s.nis || "";
        sheet.getCell(row, 3).value = s.nama || "";
        sheet.getCell(row, 4).value = s.jk || "";
        
        for(let c=1; c<=39; c++) {
            const cell = sheet.getCell(row, c);
            cell.border = borderAll;
            cell.font = { name: 'Times New Roman', size: 7 };
            if (c === 3) {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
        }
        sheet.getRow(row).height = 16;
        row++;
    }

    // Summary
    const totalL = filledStudents.filter(s => s.jk && s.jk.toUpperCase() === 'L').length;
    const totalP = filledStudents.filter(s => s.jk && s.jk.toUpperCase() === 'P').length;
    
    row += 1;
    sheet.getCell(`D${row}`).value = 'L';
    sheet.getCell(`E${row}`).value = totalL;
    sheet.getCell(`D${row}`).alignment = { horizontal: 'center' };
    sheet.getCell(`E${row}`).alignment = { horizontal: 'center' };
    sheet.getCell(`D${row}`).font = { name: 'Times New Roman', size: 7, bold: true };
    sheet.getCell(`E${row}`).font = { name: 'Times New Roman', size: 7, bold: true };

    sheet.getCell(`D${row+1}`).value = 'P';
    sheet.getCell(`E${row+1}`).value = totalP;
    sheet.getCell(`D${row+1}`).alignment = { horizontal: 'center' };
    sheet.getCell(`E${row+1}`).alignment = { horizontal: 'center' };
    sheet.getCell(`D${row+1}`).font = { name: 'Times New Roman', size: 7, bold: true };
    sheet.getCell(`E${row+1}`).font = { name: 'Times New Roman', size: 7, bold: true };

    row += 3;
    sheet.getCell(`C${row}`).value = `Mengetahui,`;
    sheet.getCell(`AE${row}`).value = `Wonosobo,`;
    
    row += 1;
    sheet.getCell(`C${row}`).value = `Kepala Sekolah`;
    sheet.getCell(`AE${row}`).value = `Wali Kelas`;
    
    row += 4;
    sheet.getCell(`C${row}`).value = `Agus Surono, S.Pd., M.M., Gr.`;
    sheet.getCell(`C${row}`).font = { name: 'Times New Roman', size: 8, bold: true, underline: true };
    sheet.getCell(`AE${row}`).value = `${waliKelas?.nama || '______________________________'}`;
    sheet.getCell(`AE${row}`).font = { name: 'Times New Roman', size: 8, bold: true, underline: true };
    
    row += 1;
    sheet.getCell(`C${row}`).value = `NIP. 19841103 201101 1 007`;
    sheet.getCell(`AE${row}`).value = `NIP. ${waliKelas?.nip || '.............................................................'}`;
  });
}

// --- Implementation for Daftar Nilai (Portrait) ---
function generateExcelDaftarNilai(workbook, pagesData) {
  pagesData.forEach((data, index) => {
    const { students, waliKelas, selectedClass } = data;
    const filledStudents = students.filter(s => s.nama || s.nis || s.noAbsen);
    const sheetName = selectedClass ? `Kelas ${selectedClass}` : `Sheet ${index + 1}`;
    const sheet = workbook.addWorksheet(sheetName.substring(0, 31));

    // Basic setup for F4 Portrait (210x330mm)
    sheet.pageSetup.paperSize = 14; 
    sheet.pageSetup.orientation = 'portrait';
    sheet.pageSetup.margins = { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0, footer: 0 };
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;

    // Column Widths
    sheet.columns = [
      { width: 4 },    // A: NO
      { width: 7 },    // B: NIS
      { width: 28 },   // C: NAMA
      { width: 4 },    // D: JK
      { width: 5 },    // E: Sumatif 1
      { width: 5 },    // F: Sumatif 2
      { width: 5 },    // G: Sumatif 3
      { width: 5 },    // H: Sumatif 4
      { width: 5 },    // I: Sumatif
      { width: 5 },    // J: NA Sumatif
      { width: 5 },    // K: Non Tes
      { width: 5 },    // L: Tes
      { width: 6 },    // M: NA SAS
      { width: 8 }     // N: Nilai Raport
    ];

    const borderAll = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    const headerFont = { name: 'Times New Roman', size: 7, bold: true };
    const alignCenter = { horizontal: 'center', vertical: 'middle', wrapText: true };

    // Header
    sheet.mergeCells('A1:N1');
    sheet.getCell('A1').value = 'DAFTAR NILAI';
    sheet.getCell('A1').font = { name: 'Times New Roman', bold: true, size: 12 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Meta
    sheet.getCell('B3').value = `Mata Pelajaran`;
    sheet.getCell('C3').value = `: ...............................................`;
    
    sheet.getCell('B4').value = `Kelas/Fase/Semester`;
    sheet.getCell('C4').value = `: ${selectedClass} /.............../${data.selectedSemester || 'Gasal'}`;
    sheet.getCell('C4').font = { name: 'Times New Roman', size: 10, bold: true };
    
    sheet.getCell('B5').value = `Tahun Ajaran`;
    sheet.getCell('C5').value = `: 2025-2026`;
    sheet.getCell('C5').font = { name: 'Times New Roman', size: 10, bold: true };

    // Table Header Structure
    let row = 7;
    
    sheet.mergeCells(`A${row}:A${row+2}`); sheet.getCell(`A${row}`).value = 'NO';
    sheet.mergeCells(`B${row}:B${row+2}`); sheet.getCell(`B${row}`).value = 'NIS';
    sheet.mergeCells(`C${row}:C${row+2}`); sheet.getCell(`C${row}`).value = 'NAMA SISWA';
    sheet.mergeCells(`D${row}:D${row+1}`); sheet.getCell(`D${row}`).value = 'JK';
    sheet.getCell(`D${row+2}`).value = 'L/P';

    sheet.mergeCells(`E${row}:H${row}`); sheet.getCell(`E${row}`).value = 'SUMATIF LINGKUP MATERI';
    sheet.getCell(`E${row+1}`).value = 'BAB/\nMATERI';
    sheet.getCell(`F${row+1}`).value = 'BAB/\nMATER';
    sheet.getCell(`G${row+1}`).value = 'BAB/\nMATER';
    sheet.getCell(`H${row+1}`).value = 'BAB/\nMATER';
    sheet.getCell(`E${row+2}`).value = 'Sumatif 1';
    sheet.getCell(`F${row+2}`).value = 'Sumatif 2';
    sheet.getCell(`G${row+2}`).value = 'Sumatif 3';
    sheet.getCell(`H${row+2}`).value = 'Sumatif 4';

    sheet.mergeCells(`I${row}:M${row}`); sheet.getCell(`I${row}`).value = 'SUMATIF AKHIR';
    sheet.getCell(`I${row+1}`).value = 'BAB/\nMATER';
    sheet.getCell(`I${row+2}`).value = 'Sumatif';
    
    sheet.mergeCells(`J${row+1}:J${row+2}`); sheet.getCell(`J${row+1}`).value = 'NA\nSumatif\n(S)';
    sheet.mergeCells(`K${row+1}:K${row+2}`); sheet.getCell(`K${row+1}`).value = 'Non\nTes';
    sheet.mergeCells(`L${row+1}:L${row+2}`); sheet.getCell(`L${row+1}`).value = 'Tes';
    sheet.mergeCells(`M${row+1}:M${row+2}`); sheet.getCell(`M${row+1}`).value = 'NA Sumatif\nAkhir\nSemester\n(SAS)';

    sheet.mergeCells(`N${row}:N${row+2}`); sheet.getCell(`N${row}`).value = 'Nilai Raport\n(3*S+2*SAS)\n/5';

    // Apply header styles
    for(let r=row; r<=row+2; r++) {
        for(let c=1; c<=14; c++) {
            const cell = sheet.getCell(r, c);
            cell.font = headerFont;
            cell.border = borderAll;
            cell.alignment = alignCenter;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        }
    }

    // Data Rows
    row += 3;
    for(let i = 0; i < 36; i++) {
        const s = filledStudents[i] || {};
        
        sheet.getCell(row, 1).value = s.noAbsen || (i + 1);
        sheet.getCell(row, 2).value = s.nis || "";
        sheet.getCell(row, 3).value = s.nama || "";
        sheet.getCell(row, 4).value = s.jk || "";
        
        for(let c=1; c<=14; c++) {
            const cell = sheet.getCell(row, c);
            cell.border = borderAll;
            cell.font = { name: 'Times New Roman', size: 8 };
            if (c === 3) {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
        }
        sheet.getRow(row).height = 17;
        row++;
    }

    // Signatures
    row += 2;
    sheet.getCell(`C${row}`).value = `Mengetahui,`;
    sheet.getCell(`L${row}`).value = `Wonosobo,`;
    
    row += 1;
    sheet.getCell(`C${row}`).value = `Kepala Sekolah`;
    sheet.getCell(`L${row}`).value = `Guru Mata Pelajaran`;
    
    row += 4;
    sheet.getCell(`C${row}`).value = `Agus Surono, S.Pd., M.M., Gr.`;
    sheet.getCell(`C${row}`).font = { name: 'Times New Roman', size: 9, bold: true, underline: true };
    sheet.getCell(`L${row}`).value = `...............................................`;
    sheet.getCell(`L${row}`).font = { name: 'Times New Roman', size: 9, bold: true, underline: true };
    
    row += 1;
    sheet.getCell(`C${row}`).value = `NIP. 19841103 201101 1 007`;
    sheet.getCell(`L${row}`).value = `NIP.`;
  });
}
