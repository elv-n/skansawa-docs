/**
 * EduDocs — Google Apps Script Backend
 * =====================================
 * 
 * INSTRUKSI DEPLOY:
 * 1. Buka Google Sheet Anda
 * 2. Menu Extensions → Apps Script
 * 3. Hapus semua code default, paste SELURUH code di bawah ini
 * 4. Klik Save (Ctrl+S)
 * 5. Deploy → New deployment
 * 6. Type: Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Klik Deploy, copy URL-nya
 * 10. Paste URL ke file .env di project EduDocs:
 *     VITE_API_URL=https://script.google.com/macros/s/XXXXX/exec
 * 
 * STRUKTUR SHEET YANG DIBUTUHKAN:
 * 
 * Sheet "Data":
 * | No | No Absen | NIS | Nama | JK | NISN | Kelas |
 * 
 * Sheet "Wali Kelas":
 * | No | Nama | NIP | Wali Kelas |
 */

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let result;
  
  try {
    switch(action) {
      case 'getClasses':
        result = getClasses(ss);
        break;
      case 'getStudents':
        result = getStudents(ss, e.parameter.kelas);
        break;
      case 'getWaliKelas':
        result = getWaliKelas(ss, e.parameter.kelas);
        break;
      case 'getDocumentData':
        result = {
          students: getStudents(ss, e.parameter.kelas),
          waliKelas: getWaliKelas(ss, e.parameter.kelas)
        };
        break;
      case 'getAllDocumentData':
        result = getAllDocumentData(ss);
        break;
      default:
        result = { error: 'Invalid action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ambil daftar kelas unik dari sheet Data, diurutkan
 */
function getClasses(ss) {
  var sheet = ss.getSheetByName('Data');
  var data = sheet.getDataRange().getValues();
  var header = data[0];
  var kelasIdx = header.indexOf('Kelas');
  
  if (kelasIdx === -1) {
    throw new Error('Kolom "Kelas" tidak ditemukan di sheet "Data"');
  }
  
  var classSet = {};
  for (var i = 1; i < data.length; i++) {
    var kelas = data[i][kelasIdx];
    if (kelas && String(kelas).trim() !== '') {
      classSet[String(kelas).trim()] = true;
    }
  }
  
  var classes = Object.keys(classSet).sort();
  return classes;
}

/**
 * Ambil data siswa berdasarkan kelas
 */
function getStudents(ss, kelas) {
  if (!kelas) {
    throw new Error('Parameter "kelas" diperlukan');
  }
  
  var sheet = ss.getSheetByName('Data');
  var data = sheet.getDataRange().getValues();
  var header = data[0];
  
  var keys = ['No', 'No Absen', 'NIS', 'Nama', 'JK', 'NISN', 'Kelas'];
  var camelKeys = ['no', 'noAbsen', 'nis', 'nama', 'jk', 'nisn', 'kelas'];
  
  var indices = [];
  for (var k = 0; k < keys.length; k++) {
    var searchKey = keys[k].toUpperCase().replace(/[\s\.\/]+/g, ''); // Remove spaces, dots, slashes
    var foundIdx = -1;
    for (var h = 0; h < header.length; h++) {
      var headStr = String(header[h]).toUpperCase().replace(/[\s\.\/]+/g, '');
      if (headStr === searchKey || (searchKey === 'NIS' && (headStr === 'NOINDUK' || headStr === 'NOMORINDUK'))) {
        foundIdx = h;
        break;
      }
    }
    indices.push(foundIdx);
  }
  
  var kelasIdx = header.indexOf('Kelas');
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][kelasIdx]).trim() === String(kelas).trim()) {
      var obj = {};
      for (var j = 0; j < indices.length; j++) {
        obj[camelKeys[j]] = indices[j] >= 0 ? data[i][indices[j]] : '';
      }
      result.push(obj);
    }
  }
  
  return result;
}

/**
 * Ambil data wali kelas
 */
function getWaliKelas(ss, kelas) {
  if (!kelas) {
    throw new Error('Parameter "kelas" diperlukan');
  }
  
  var sheet = ss.getSheetByName('WaliKelas');
  if (!sheet) {
    throw new Error('Sheet "WaliKelas" tidak ditemukan');
  }
  var data = sheet.getDataRange().getValues();
  var header = data[0];
  
  // Robust header matching for WaliKelas
  function findCol(searchKeys) {
    for (var h = 0; h < header.length; h++) {
      var headStr = String(header[h]).toUpperCase().replace(/[\s\.\/]+/g, '');
      for (var k = 0; k < searchKeys.length; k++) {
        if (headStr === searchKeys[k].toUpperCase().replace(/[\s\.\/]+/g, '')) return h;
      }
    }
    return -1;
  }
  
  var waliKelasIdx = findCol(['Wali Kelas', 'WaliKelas']);
  var namaIdx = findCol(['Nama', 'Nama Wali Kelas', 'Nama Guru']);
  var nipIdx = findCol(['NIP', 'No Induk Pegawai']);
  
  if (waliKelasIdx === -1) {
    throw new Error('Kolom "Wali Kelas" tidak ditemukan di sheet "WaliKelas". Header yang ada: ' + header.join(', '));
  }
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][waliKelasIdx]).trim() === String(kelas).trim()) {
      return {
        nama: namaIdx >= 0 ? data[i][namaIdx] : '',
        nip: nipIdx >= 0 ? String(data[i][nipIdx]) : '',
        waliKelas: data[i][waliKelasIdx] || ''
      };
    }
  }
  
  return null;
}

/**
 * Ambil semua data (semua kelas) sekaligus dalam 1 request.
 * Jauh lebih efisien daripada N request terpisah per kelas.
 */
function getAllDocumentData(ss) {
  // Read all sheets once
  var dataSheet = ss.getSheetByName('Data');
  var wkSheet = ss.getSheetByName('WaliKelas');

  var allData = dataSheet.getDataRange().getValues();
  var header = allData[0];

  // Build column indices for student data
  var keys = ['No', 'No Absen', 'NIS', 'Nama', 'JK', 'NISN', 'Kelas'];
  var camelKeys = ['no', 'noAbsen', 'nis', 'nama', 'jk', 'nisn', 'kelas'];
  var indices = [];
  for (var k = 0; k < keys.length; k++) {
    var searchKey = keys[k].toUpperCase().replace(/[\s\.\/]+/g, '');
    var foundIdx = -1;
    for (var h = 0; h < header.length; h++) {
      var headStr = String(header[h]).toUpperCase().replace(/[\s\.\/]+/g, '');
      if (headStr === searchKey || (searchKey === 'NIS' && (headStr === 'NOINDUK' || headStr === 'NOMORINDUK'))) {
        foundIdx = h;
        break;
      }
    }
    indices.push(foundIdx);
  }
  var kelasIdx = header.indexOf('Kelas');

  // Group students by class
  var classMap = {};
  for (var i = 1; i < allData.length; i++) {
    var kelas = String(allData[i][kelasIdx] || '').trim();
    if (!kelas) continue;
    if (!classMap[kelas]) classMap[kelas] = [];
    var obj = {};
    for (var j = 0; j < indices.length; j++) {
      obj[camelKeys[j]] = indices[j] >= 0 ? allData[i][indices[j]] : '';
    }
    classMap[kelas].push(obj);
  }

  // Build wali kelas map
  var wkMap = {};
  if (wkSheet) {
    var wkData = wkSheet.getDataRange().getValues();
    var wkHeader = wkData[0];
    function findCol(searchKeys) {
      for (var h = 0; h < wkHeader.length; h++) {
        var headStr = String(wkHeader[h]).toUpperCase().replace(/[\s\.\/]+/g, '');
        for (var k = 0; k < searchKeys.length; k++) {
          if (headStr === searchKeys[k].toUpperCase().replace(/[\s\.\/]+/g, '')) return h;
        }
      }
      return -1;
    }
    var wkIdx = findCol(['Wali Kelas', 'WaliKelas']);
    var namaIdx = findCol(['Nama', 'Nama Wali Kelas', 'Nama Guru']);
    var nipIdx = findCol(['NIP', 'No Induk Pegawai']);
    if (wkIdx >= 0) {
      for (var i = 1; i < wkData.length; i++) {
        var wkKelas = String(wkData[i][wkIdx] || '').trim();
        if (wkKelas) {
          wkMap[wkKelas] = {
            nama: namaIdx >= 0 ? wkData[i][namaIdx] : '',
            nip: nipIdx >= 0 ? String(wkData[i][nipIdx]) : '',
            waliKelas: wkKelas
          };
        }
      }
    }
  }

  // Combine into result array sorted by class name
  var classes = Object.keys(classMap).sort();
  return classes.map(function(kelas) {
    return {
      kelas: kelas,
      students: classMap[kelas],
      waliKelas: wkMap[kelas] || null
    };
  });
}

