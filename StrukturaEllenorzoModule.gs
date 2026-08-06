var StrukturaEllenorzoModule = (function () {

  // A kívánt 8 oszlopos pontos struktúra és sorrend
  var REQUIRED_HEADERS = [
    "Dátum / Idő",            // A oszlop (1)
    "Munkás Neve",            // B oszlop (2)
    "Farm Neve",             // C oszlop (3)
    "Művelet Típusa",        // D oszlop (4)
    "Növény Típusa",         // E oszlop (5)
    "Érintett Parcellák",    // F oszlop (6)
    "Érték (Ft)",             // G oszlop (7)
    "Megjegyzés / Részletek" // H oszlop (8)
  ];

  function getSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return ss.getSheets()[0];
  }

  /**
   * Ellenőrzi és helyreállítja a táblázat fejléc struktúráját
   */
  function ensureStructure() {
    var sheet = getSheet();
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var currentHeaders = sheet.getRange(1, 1, 1, Math.max(lastCol, 8)).getValues()[0];

    var isCorrect = true;

    // Ellenőrizzük, hogy mind a 8 mező megvan-e és jó-e a sorrend
    for (var i = 0; i < REQUIRED_HEADERS.length; i++) {
      if (String(currentHeaders[i] || "").trim() !== REQUIRED_HEADERS[i]) {
        isCorrect = false;
        break;
      }
    }

    // Ha nem tökéletes a struktúra, automatikusan javítjuk / létrehozzuk
    if (!isCorrect) {
      Logger.log("⚠️ A táblázat struktúrája hibás vagy hiányos. Helyreállítás...");

      // Elmentjük a meglévő adatokat (ha vannak)
      var lastRow = sheet.getLastRow();
      var oldData = [];
      if (lastRow > 1) {
        oldData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      }

      // 1. Fejléc felülírása a helyes 8 oszloppal
      sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);

      // 2. Fejléc formázása (Sötétkék háttér, fehér félkövér betűk)
      var headerRange = sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setBackground("#1E293B");
      headerRange.setHorizontalAlignment("center");

      // 3. Oszlopszélességek automatikus igazítása
      sheet.setColumnWidth(1, 140); // Dátum/Idő
      sheet.setColumnWidth(2, 130); // Munkás
      sheet.setColumnWidth(3, 240); // Farm
      sheet.setColumnWidth(4, 120); // Művelet
      sheet.setColumnWidth(5, 120); // Növény
      sheet.setColumnWidth(6, 130); // Parcellák
      sheet.setColumnWidth(7, 110); // Érték
      sheet.setColumnWidth(8, 250); // Megjegyzés

      Logger.log("✅ A táblázat fejléce és struktúrája sikeresen helyreállítva!");
    }
  }

  return {
    ensureStructure: ensureStructure
  };

})();

// Globális függvény az ellenőrzéshez
function ensureStructure() {
  StrukturaEllenorzoModule.ensureStructure();
}