var AdminModule = (function () {

  // Regisztrált dolgozók kigyűjtése biztonságosan
  function getRegisteredWorkersList() {
    var registeredWorkers = [];

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Elfogadott_Users") || ss.getSheetByName("Users");

      if (sheet && sheet.getLastRow() > 1) {
        var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
        values.forEach(function(row) {
          var igName = String(row[2] || row[1] || row[0] || '').trim();
          if (igName && igName !== "IG Neve" && igName !== "" && registeredWorkers.indexOf(igName) === -1) {
            registeredWorkers.push(igName);
          }
        });
      }
    } catch (e) {
      Logger.log("Hiba a regisztrált userek beolvasásakor: " + e.message);
    }

    // Ha a felhasználói sheet üres vagy nem található, tartalékként a Naplóból vesszük a neveket
    if (registeredWorkers.length === 0) {
      var rawData = AdatbazisModule.getRawData();
      var namesMap = {};
      rawData.forEach(function(r) {
        var w = String(r[1] || '').trim();
        if (w && w !== "-" && w !== "Admin") {
          namesMap[w] = true;
        }
      });
      registeredWorkers = Object.keys(namesMap);
    }

    return registeredWorkers.sort();
  }

  // Regisztrált dolgozók kifizetetlen egyenlegének kiszámítása
  function getUnpaidBalancesList() {
    var rawData = AdatbazisModule.getRawData();
    var registeredWorkers = getRegisteredWorkersList();
    var balances = {};

    registeredWorkers.forEach(function(w) {
      balances[w] = 0;
    });

    rawData.forEach(function(row) {
      var worker = String(row[1] || '').trim();
      var value = Number(row[6]) || 0;

      if (balances.hasOwnProperty(worker)) {
        balances[worker] += value;
      }
    });

    var result = [];
    Object.keys(balances).forEach(function(w) {
      if (balances[w] !== 0) {
        result.push({
          worker: w,
          balance: balances[w]
        });
      }
    });

    return result;
  }

  // Admin egyenleg felülírása / korrekciója
  function adjustWorkerBalance(workerName, newTargetBalance, adminUser) {
    if (!workerName) return "❌ Kérlek válaszd ki a dolgozót!";

    var rawData = AdatbazisModule.getRawData();
    var currentBalance = 0;

    rawData.forEach(function(row) {
      var w = String(row[1] || '').trim();
      var val = Number(row[6]) || 0;
      if (w === workerName) {
        currentBalance += val;
      }
    });

    var targetNum = Number(newTargetBalance) || 0;
    var difference = targetNum - currentBalance;

    if (difference === 0) {
      return "ℹ️ A megadott összeg megegyezik a jelenlegi egyenleggel (" + currentBalance.toLocaleString('hu-HU') + " Ft).";
    }

    var action = "Infó";
    var farm = "- Global / Raktár";
    var crop = "-";
    var parcels = "-";
    var note = "ADMIN EGYENLEG KORREKCIÓ | Előző: " + currentBalance + " Ft -> Új: " + targetNum + " Ft";

    AdatbazisModule.addLogRow(workerName, farm, action, crop, parcels, difference, note);

    return "✅ " + workerName + " egyenlege sikeresen módosítva: " + targetNum.toLocaleString('hu-HU') + " Ft-ra!";
  }

  return {
    getRegisteredWorkersList: getRegisteredWorkersList,
    getUnpaidBalancesList: getUnpaidBalancesList,
    adjustWorkerBalance: adjustWorkerBalance
  };

})();

function getRegisteredWorkersList() { 
  return AdminModule.getRegisteredWorkersList(); 
}

function getUnpaidBalancesList() { 
  return AdminModule.getUnpaidBalancesList(); 
}

function adjustWorkerBalance(workerName, newTargetBalance, adminUser) {
  return AdminModule.adjustWorkerBalance(workerName, newTargetBalance, adminUser);
}