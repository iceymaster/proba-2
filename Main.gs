function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('SeeRPG Farm System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Ez a segédfüggvény tölti be a Styles, Scripts, AuthModal, EditModal fájlokat az Index.html-be!
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ==========================
   ADATBÁZIS
========================== */

function saveData(formData) {
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

/* ==========================
   PÉNZÜGY
========================== */

function getUserBalances() {
  return PenzugyModule.getUserBalances();
}

function getFarmSummaries() {
  return PenzugyModule.getFarmSummaries();
}

/* ==========================
   RAKTÁR
========================== */

function getSeedInventory() {
  return RaktarModule.getSeedInventory();
}

/* ==========================
   IDŐZÍTŐ
========================== */

function getFarmTimers() {
  return IdozitoModule.getFarmTimers();
}

/* ==========================
   BEÁLLÍTÁSOK
========================== */

function getSettings() {
  return BeallitasokModule.getSettings();
}

function saveSettings(settings) {
  return BeallitasokModule.saveSettings(settings);
}

function tesztDashboard(){
  Logger.log(
    AdatbazisModule.getRawData()
  );

  Logger.log(
    PenzugyModule.getFarmSummaries()
  );

  Logger.log(
    RaktarModule.getSeedInventory()
  );

  Logger.log(
    IdozitoModule.getFarmTimers()
  );
}

/* ==========================
   FARM MODUL
========================== */

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
  return FarmModule.getDashboardStats();
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

function tesztAdminMentesHibakereso() {
  Logger.log("--- Teszt indítása ---");
  try {
    var eredmeny = updateParcelStateAdmin(
      "Robert Forian (Üvegház:5. / 11. emelet) [#1]", 
      1, 
      "Málna", 
      "water", 
      "Admin", 
      new Date()
    );
    Logger.log("✅ Sikeres futás! Eredmény: " + eredmeny);
  } catch (e) {
    Logger.log("❌ HIBA ELKAPVA: " + e.message);
    Logger.log("Hiba típusa: " + e.name);
    Logger.log("Hiba helye (stack): " + e.stack);
  }
}