function runDebugCheck() {
  Logger.log("==========================================");
  Logger.log("🔍 FARM SYSTEM ADATBÁZIS ÉS DASHBOARD DEBUG");
  Logger.log("==========================================");

  // 1. TÁBLÁZAT ÉS MUNKALAPOK ELLENŐRZÉSE
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("✅ Google Táblázat sikeresen megnyitva: " + ss.getName());
    
    var sheets = ss.getSheets();
    Logger.log("📄 Megtalált munkalapok száma: " + sheets.length);
    sheets.forEach(function(s) {
      Logger.log("   - Munkalap neve: '" + s.getName() + "' | Sorok száma: " + s.getLastRow());
    });
  } catch (e) {
    Logger.log("❌ CRITICAL ERROR: Nem sikerült megnyitni a Táblázatot: " + e.message);
    return;
  }

  // 2. ADATBÁZIS MODUL OLVASÁSI TESZT
  Logger.log("\n------------------------------------------");
  Logger.log("📊 Adatbázis (AdatbazisModule.getRawData) Teszt:");
  var rawData = [];
  try {
    if (typeof AdatbazisModule !== 'undefined' && typeof AdatbazisModule.getRawData === 'function') {
      rawData = AdatbazisModule.getRawData();
      Logger.log("✅ Beolvasott sorok száma összesen: " + rawData.length);
      if (rawData.length > 0) {
        Logger.log("ℹ️ Első sor mintája: " + JSON.stringify(rawData[0]));
        Logger.log("ℹ️ Utolsó sor mintája: " + JSON.stringify(rawData[rawData.length - 1]));
      } else {
        Logger.log("⚠️ FIGYELEM: Az AdatbazisModule üres tömböt adott vissza!");
      }
    } else {
      Logger.log("❌ HIBA: AdatbazisModule nem található vagy nincs getRawData függvénye!");
    }
  } catch (e) {
    Logger.log("❌ HIBA az AdatbazisModule futásakor: " + e.message + "\nStack: " + e.stack);
  }

  // 3. RAKTÁR MODUL TESZT
  Logger.log("\n------------------------------------------");
  Logger.log("📦 Raktár (RaktarModule.getSeedInventory) Teszt:");
  try {
    if (typeof RaktarModule !== 'undefined' && typeof RaktarModule.getSeedInventory === 'function') {
      var inv = RaktarModule.getSeedInventory();
      Logger.log("✅ Raktárkészlet beolvasva:");
      Logger.log("   - Global Magok: " + JSON.stringify(inv.global));
      Logger.log("   - Farm Ládák: " + JSON.stringify(inv.ladas));
    } else {
      Logger.log("⚠️ RaktarModule nem található vagy hiányzik!");
    }
  } catch (e) {
    Logger.log("❌ HIBA a RaktarModule futásakor: " + e.message + "\nStack: " + e.stack);
  }

  // 4. FARM MODUL TESZT
  Logger.log("\n------------------------------------------");
  Logger.log("🏡 Farmok (FarmModule.getFarmsList) Teszt:");
  try {
    if (typeof FarmModule !== 'undefined' && typeof FarmModule.getFarmsList === 'function') {
      var farms = FarmModule.getFarmsList();
      Logger.log("✅ Megtalált farmok száma: " + farms.length);
      Logger.log("   - Farm lista: " + JSON.stringify(farms));
    } else {
      Logger.log("⚠️ FarmModule nem található vagy hiányzik!");
    }
  } catch (e) {
    Logger.log("❌ HIBA a FarmModule futásakor: " + e.message + "\nStack: " + e.stack);
  }

  // 5. TELJES DASHBOARD ADATCSOMAG TESZT (Ami a felületre megy)
  Logger.log("\n------------------------------------------");
  Logger.log("🚀 Dashboard (getDashboardStats) Összesített Teszt:");
  try {
    var stats = getDashboardStats();
    Logger.log("✅ Dashboard Válasz Csomag Sikeresen Elkészült!");
    Logger.log("   - Bevétel / Költség / Profit: " + JSON.stringify(stats.totals));
    Logger.log("   - Raktár tételek száma: " + (stats.stock ? stats.stock.length : 0));
    Logger.log("   - Lejáró bérletek figyelmeztető száma: " + (stats.expiringAlerts ? stats.expiringAlerts.length : 0));
  } catch (e) {
    Logger.log("❌ CRITICAL ERROR a getDashboardStats futásakor: " + e.message + "\nStack: " + e.stack);
  }

  Logger.log("\n==========================================");
  Logger.log("🏁 DEBUG FOLYAMAT VÉGET ÉRT");
  Logger.log("==========================================");
}