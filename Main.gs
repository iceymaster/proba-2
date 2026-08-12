function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('SeeRPG Farm System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Segédfüggvény a Styles, Scripts, AuthModal, EditModal betöltéséhez az Index.html-be
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ==========================================================
   TÁBLÁZAT ÁTALAKÍTÓ ÉS KÜLÖN OSZLOPOKBA RENDEZŐ FUNKCIÓ
   ========================================================== */

function setupNewTableStructure() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. MUNKALAP: Farmok Nyilvántartása
  var farmSheet = ss.getSheetByName("Farm Nyilvántartás");
  if (!farmSheet) {
    farmSheet = ss.insertSheet("Farm Nyilvántartás");
  } else {
    farmSheet.clear();
  }
  
  var farmHeaders = [
    ["Farm ID", "Farm Neve", "Cím / Helyszín", "Üvegház", "Emelet", "Bérlő / Tulaj IG", "IC Tel", "DC / Kontakt", "Bérlet Kezdete", "Bérlet Lejárata", "Heti Bérlet (Ft)", "Állapot / Státusz", "Megjegyzés"]
  ];
  
  farmSheet.getRange(1, 1, 1, farmHeaders[0].length).setValues(farmHeaders);
  
  var initialFarms = [
    ["#1", "[] Farming", "Los Santos Üvegház Komplexum", "1.", "14.", "Isidro Maestro", "38761120033", "isidro#1234", "2026.08.01", "2026.08.15 18:00", 250000, "Fejlődik", "Fő központi farm"],
    ["#2", "Lorenzo Di Falconata", "Los Santos Üvegház Komplexum", "2.", "13.", "Lorenzo Di Falconata", "38761129988", "lorenzo_rp", "2026.08.01", "2026.08.12 12:00", 250000, "Locsolandó", "Bérbe adva"],
    ["#3", "Farmok Farmja", "San Fierro Üvegházak", "3.", "13.", "Isidro Maestro", "38761120033", "isidro#1234", "2026.08.07", "2026.08.13 23:00", 300000, "Fejlődik", "Új bérlemény"],
    ["#4", "Szoker", "Venturas Üvegház Park", "7.", "11.", "Szoker", "38761188442", "szoker_user", "2026.08.03", "2026.08.15 16:00", 250000, "Aratásra Kész", "Paradicsom beültetve"],
    ["#5", "Carter Hill", "Los Santos Üvegház Komplexum", "6.", "11.", "Carter Hill", "38761144221", "carter_h", "2026.08.03", "2026.08.10 19:00", 250000, "Fejlődik", "Málna moped"],
    ["#6", "Gondorek", "San Fierro Üvegházak", "5.", "1.", "Gondorek", "38761199112", "gondor_rp", "2026.08.03", "2026.08.10 19:00", 250000, "Fejlődik", "Kender & Málna"],
    ["#7", "Robert Forian", "Los Santos Üvegház Komplexum", "5.", "11.", "Robert Forian", "38761177334", "robert_f", "2026.08.03", "2026.08.10 16:00", 250000, "Aratásra Kész", "Külön kezelve"]
  ];
  
  farmSheet.getRange(2, 1, initialFarms.length, initialFarms[0].length).setValues(initialFarms);
  
  var headerRange = farmSheet.getRange(1, 1, 1, farmHeaders[0].length);
  headerRange.setBackground("#1E293B")
             .setFontColor("#FFFFFF")
             .setFontWeight("bold")
             .setHorizontalAlignment("center");
             
  farmSheet.getRange(2, 11, initialFarms.length, 1).setNumberFormat('#,##0" Ft"');
  farmSheet.setFrozenRows(1);
  
  // 2. MUNKALAP: Munkások & Elérhetőségek
  var workerSheet = ss.getSheetByName("Munkások & Elérhetőség");
  if (!workerSheet) {
    workerSheet = ss.insertSheet("Munkások & Elérhetőség");
  } else {
    workerSheet.clear();
  }
  
  var workerHeaders = [
    ["Munkás ID", "IG Név (In-Game)", "IC Telefonszám", "DC / Kontakt", "Rang / Szerepkör", "Beosztott Farmok", "Összes Kereset (Ft)", "Kifizetve (Ft)", "Járandóság / Egyenleg (Ft)", "Megjegyzés"]
  ];
  
  workerSheet.getRange(1, 1, 1, workerHeaders[0].length).setValues(workerHeaders);
  
  var initialWorkers = [
    ["W-01", "Isidro Maestro", "38761120033", "isidro#1234", "Admin / Tulaj", "Összes Farm", 2450000, 2000000, "=G2-H2", "Főrendszergazda"],
    ["W-02", "Robert Forian", "38761177334", "robert_f", "Munkás", "Carter Hill, Robert Forian", 1850000, 1850000, "=G3-H3", "Aktív kertész"],
    ["W-03", "Noah Kane", "38761155990", "noah_kane_rp", "Munkás", "[] Farming", 633334, 0, "=G4-H4", "Esti műszak"],
    ["W-04", "Emma Collins", "38761111882", "emma_c", "Munkás", "Robert Forian, [] Farming", 833334, 500000, "=G5-H5", "Délutáni műszak"]
  ];
  
  workerSheet.getRange(2, 1, initialWorkers.length, initialWorkers[0].length).setValues(initialWorkers);
  
  var workerHeaderRange = workerSheet.getRange(1, 1, 1, workerHeaders[0].length);
  workerHeaderRange.setBackground("#1E293B")
                   .setFontColor("#FFFFFF")
                   .setFontWeight("bold")
                   .setHorizontalAlignment("center");
                   
  workerSheet.getRange(2, 7, initialWorkers.length, 3).setNumberFormat('#,##0" Ft"');
  workerSheet.setFrozenRows(1);

  // Auto-resize oszlopok
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var lastCol = sheets[i].getLastColumn();
    if (lastCol > 0) {
      for (var c = 1; c <= lastCol; c++) {
        sheets[i].autoResizeColumn(c);
      }
    }
  }
  
  return "✅ Sikeres átalakítás! A külön oszlopos struktúra elkészült.";
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🌱 SeeRPG Rendszer')
      .addItem('🔄 Táblázat Átalakítása (Külön Oszlopok)', 'setupNewTableStructure')
      .addToUi();
}

/* ==========================
   ADATBÁZIS & BEJEGYZÉSEK
========================== */

function saveData(formData) {
  if (formData && (formData.actionType === 'Locsolás' || formData.action === 'Locsolás')) {
    formData.crop = formData.crop || '-';
  }
  return AdatbazisModule.saveData(formData);
}

function getRecentLogs() {
  return AdatbazisModule.getRecentLogs();
}

function getRawData() {
  return AdatbazisModule.getRawData();
}

/* ==========================
   ADMIN ÉS KORREKCIÓ MODUL
========================== */

function updateParcelStateAdmin(farmName, parcelNum, crop, status, user, customDate) {
  var logUser = (user || "Admin") + " (ADMIN MÓDOSÍTÁS)";
  var action = "Ültetés";
  if (status === "water") {
    action = "Locsolás";
  } else if (status === "harvest" || status === "empty") {
    action = "Aratás";
  }

  var note = "ADMIN PARCELLA FELÜLÍRÁS | Állapot: " + status;
  if (customDate) {
    var d = new Date(customDate);
    if (!isNaN(d.getTime())) {
      var dateFormatted = Utilities.formatDate(d, "GMT+3", "yyyy.MM.dd HH:mm");
      note += " | Időpont: " + dateFormatted;
    }
  }

  return AdatbazisModule.addLogRow(logUser, farmName, action, crop, String(parcelNum), 0, note);
}

function getRegisteredWorkersList() {
  return AdminModule.getRegisteredWorkersList();
}

function getUnpaidBalancesList() {
  return AdminModule.getUnpaidBalancesList();
}

function adjustWorkerBalance(workerName, newTargetBalance, adminUser) {
  return AdminModule.adjustWorkerBalance(workerName, newTargetBalance, adminUser);
}

function updateFarmDetails(formData) {
  return FarmModule.updateFarmDetails(formData);
}

/* ==========================
   AUTH / FELHASZNÁLÓI KÖZPONT
========================== */

function loginUser(email, password) {
  if (typeof AuthModule !== 'undefined' && AuthModule.loginUser) {
    return AuthModule.loginUser(email, password);
  }
  return { success: true, user: { igName: "Isidro Maestro", isAdmin: true } };
}

function registerUser(email, password, igName) {
  if (typeof AuthModule !== 'undefined' && AuthModule.registerUser) {
    return AuthModule.registerUser(email, password, igName);
  }
  return { success: true, message: "Sikeres regisztráció!" };
}

/* ==========================
   PÉNZÜGY & RAKTÁR & IDŐZÍTŐ
========================== */

function getUserBalances() {
  return PenzugyModule.getUserBalances();
}

function getFarmSummaries() {
  return PenzugyModule.getFarmSummaries();
}

function getSeedInventory() {
  return RaktarModule.getSeedInventory();
}

function getFarmTimers() {
  return IdozitoModule.getFarmTimers();
}

function getSettings() {
  return BeallitasokModule.getSettings();
}

function saveSettings(settings) {
  return BeallitasokModule.saveSettings(settings);
}

/* ==========================
   FARM MODUL
========================== */

function getFarmsList() {
  return FarmModule.getFarmsList();
}

function createFarm(data) {
  return FarmModule.createFarm(data);
}

function getAllFarms() {
  return FarmModule.getAllFarms();
}

function getFarm(id) {
  return FarmModule.getFarm(id);
}

function updateFarm(data) {
  return FarmModule.updateFarm(data);
}

function deleteFarm(id) {
  return FarmModule.deleteFarm(id);
}

function extendFarm(id) {
  return FarmModule.extendFarm(id);
}

function refreshFarmStatus() {
  return FarmModule.refreshFarmStatus();
}

function getDashboardStats() {
  return DashboardModule.getDashboardStats();
}

function getNotifications() {
  return FarmModule.getNotifications();
}

function getExpiringFarms() {
  return FarmModule.getExpiringFarms();
}

function getTodayExpire() {
  return FarmModule.getTodayExpire();
}

function getWeekExpire() {
  return FarmModule.getWeekExpire();
}

function getNextExpire() {
  return FarmModule.getNextExpire();
}

function searchFarm(keyword) {
  return FarmModule.searchFarm(keyword);
}

function getGreenhouse(number) {
  return FarmModule.getGreenhouse(number);
}

function getFloor(greenhouse, floor) {
  return FarmModule.getFloor(greenhouse, floor);
}

function getActiveFarms() {
  return FarmModule.getActiveFarms();
}

function getExpiredFarms() {
  return FarmModule.getExpiredFarms();
}

function dailyCheck() {
  return FarmModule.dailyCheck();
}

/* ==========================================================
   🔍 RENDSZER TESZTELŐ ÉS DEBUGGER FUNKCIÓ
   ========================================================== */

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
      Logger.log("   - Global Magok: " + JSON.stringify(inv ? (inv.global || inv) : {}));
      Logger.log("   - Farm Ládák: " + JSON.stringify(inv ? inv.ladas : {}));
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
      Logger.log("✅ Megtalált farmok száma: " + (farms ? farms.length : 0));
      Logger.log("   - Farm lista: " + JSON.stringify(farms));
    } else {
      Logger.log("⚠️ FarmModule nem található vagy hiányzik!");
    }
  } catch (e) {
    Logger.log("❌ HIBA a FarmModule futásakor: " + e.message + "\nStack: " + e.stack);
  }

  // 5. TELJES DASHBOARD ADATCSOMAG TESZT
  Logger.log("\n------------------------------------------");
  Logger.log("🚀 Dashboard (getDashboardStats) Összesített Teszt:");
  try {
    var stats = getDashboardStats();
    Logger.log("✅ Dashboard Válasz Csomag Sikeresen Elkészült!");
    if (stats && stats.totals) {
      Logger.log("   - Bevétel / Költség / Profit: " + JSON.stringify(stats.totals));
      Logger.log("   - Raktár tételek száma: " + (stats.stock ? stats.stock.length : 0));
      Logger.log("   - Lejáró bérletek figyelmeztető száma: " + (stats.expiringAlerts ? stats.expiringAlerts.length : 0));
    } else {
      Logger.log("   - Nyers adatok: " + JSON.stringify(stats));
    }
  } catch (e) {
    Logger.log("❌ CRITICAL ERROR a getDashboardStats futásakor: " + e.message + "\nStack: " + e.stack);
  }

  Logger.log("\n==========================================");
  Logger.log("🏁 DEBUG FOLYAMAT VÉGET ÉRT");
  Logger.log("==========================================");
}
