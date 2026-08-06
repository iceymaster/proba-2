var AdatbazisModule = (function () {

  var SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
  var LOG_SHEET_NAME = "Eseménynapló (Adatbázis)"; 
  var FINANCE_SHEET_NAME = "Penzugy";

  // BIZTONSÁGOS SHEET KERESŐ: Soha nem hoz létre névtelen/felesleges új munkalapot!
  function getSheet(sheetName) {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      if (sheetName === LOG_SHEET_NAME) {
        // Ha nem találja meg a megadott néven a fő naplót, felhasználja a legelső létező munkalapot
        sheet = ss.getSheets()[0];
      } else if (sheetName === FINANCE_SHEET_NAME) {
        // A Penzugy lapot csak akkor hozza létre, ha még egyáltalán nem létezik
        sheet = ss.insertSheet(FINANCE_SHEET_NAME);
        sheet.appendRow([
          "Dátum / Idő", 
          "Munkás Neve", 
          "Farm Neve", 
          "Művelet Típusa", 
          "Növény Típusa", 
          "Érintett Parcellák", 
          "Érték (Ft)", 
          "Megjegyzés / Részletek"
        ]);
      }
    }
    return sheet;
  }

  function readSheetRows(sheet) {
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    var range = sheet.getRange(2, 1, lastRow - 1, 8);
    var values = range.getValues();
    var normalizedData = [];

    values.forEach(function(row) {
      var dateVal = row[0];
      var workerVal = String(row[1] || '').trim();
      var farmVal = String(row[2] || '').trim();
      var actionVal = String(row[3] || '').trim();
      var cropVal = String(row[4] || '').trim();
      var colF = row[5];
      var colG = row[6];
      var colH = row[7];

      var parcels = "-";
      var val = 0;
      var note = "";

      if (typeof colF === 'number' || (typeof colF === 'string' && !isNaN(Number(colF)) && colF.trim() !== "" && colF.indexOf(',') === -1)) {
        parcels = "-";
        val = Number(colF) || 0;
        note = String(colG || '');
      } else {
        parcels = String(colF || '-').trim();
        val = Number(colG) || 0;
        note = String(colH || '');
      }

      normalizedData.push([
        dateVal,   // A: Dátum
        workerVal, // B: Munkás
        farmVal,   // C: Farm
        actionVal, // D: Művelet
        cropVal,   // E: Növény
        parcels,   // F: Parcellák
        val,       // G: Érték (Ft)
        note       // H: Megjegyzés
      ]);
    });

    return normalizedData;
  }

  function getRawData() {
    var logSheet = getSheet(LOG_SHEET_NAME);
    var financeSheet = getSheet(FINANCE_SHEET_NAME);

    var logRows = readSheetRows(logSheet);
    var financeRows = readSheetRows(financeSheet);

    var allRows = logRows.concat(financeRows);

    allRows.sort(function(a, b) {
      var dateA = new Date(String(a[0]).replace(/\./g, '-'));
      var dateB = new Date(String(b[0]).replace(/\./g, '-'));
      return dateA - dateB;
    });

    return allRows;
  }

  function addLogRow(user, farm, action, crop, parcels, value, note) {
    var isFinanceAction = (action === "Kifizetés" || action === "Eladás" || action === "Vásárlás" || String(note).indexOf("ADMIN EGYENLEG KORREKCIÓ") !== -1);
    var targetSheetName = isFinanceAction ? FINANCE_SHEET_NAME : LOG_SHEET_NAME;
    
    var sheet = getSheet(targetSheetName);
    var nowStr = Utilities.formatDate(new Date(), "GMT+3", "yyyy.MM.dd HH:mm");

    var cleanParcels = String(parcels || "-").trim();
    if (cleanParcels !== "-" && cleanParcels.indexOf("'") !== 0) {
      cleanParcels = "'" + cleanParcels.replace(/'/g, '');
    }

    var numericValue = Number(value) || 0;
    if (action === "Kifizetés" && numericValue > 0) {
      numericValue = -numericValue;
    }

    var rowData = [
      nowStr,                // A: Dátum/Idő
      String(user || "-"),   // B: Munkás Neve
      String(farm || "-"),   // C: Farm Neve
      String(action || "-"), // D: Művelet Típusa
      String(crop || "-"),   // E: Növény Típusa
      cleanParcels,          // F: Érintett Parcellák
      numericValue,          // G: Érték (Ft)
      String(note || "")     // H: Megjegyzés / Részletek
    ];

    sheet.appendRow(rowData);

    try {
      if (typeof DiscordModule !== 'undefined' && typeof DiscordModule.sendEmbedNotification === 'function') {
        DiscordModule.sendEmbedNotification(user, farm, action, crop, parcels, numericValue, note);
      }
    } catch(e) {
      Logger.log("Discord értesítési hiba: " + e.message);
    }

    return "✅ Sikeresen rögzítve!";
  }

  function saveData(formData) {
    if (!formData) return "❌ Érvénytelen adatok!";

    var user = formData.userName || formData.workerSelect || "-";
    var action = formData.actionType || "-";
    var farm = (action === "FarmHozzaadas") ? formData.newFarmName : (formData.farmSelect || "-");
    var crop = formData.cropSelect || "-";
    var parcels = formData.selectedParcelsList || "-";
    var val = Number(formData.value) || 0;
    var note = formData.note || "";

    if (action === "Kifizetés" && formData.workerSelect) {
      user = formData.workerSelect;
      note = "Kifizetés dolgozónak: " + user + (note ? " | " + note : "");
    }

    return addLogRow(user, farm, action, crop, parcels, val, note);
  }

  return {
    getRawData: getRawData,
    addLogRow: addLogRow,
    saveData: saveData,
    getSheet: getSheet
  };

})();

function getRawData() { 
  return AdatbazisModule.getRawData(); 
}

function addLogRow(user, farm, action, crop, parcels, value, note) { 
  return AdatbazisModule.addLogRow(user, farm, action, crop, parcels, value, note); 
}

function saveData(formData) {
  return AdatbazisModule.saveData(formData);
}