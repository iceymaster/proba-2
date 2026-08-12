var FarmModule = (function () {

  // 1. Farmok listájának kiolvasása és összefűzése
  function getFarmsList() {
    var rawData = [];
    try {
      rawData = AdatbazisModule.getRawData() || [];
    } catch(e) {
      Logger.log("Hiba a farmok kiolvasásakor: " + e.message);
      return [];
    }

    var farmMap = {};

    rawData.forEach(function(row) {
      if (!row || row.length < 3) return;
      
      var farmName = String(row[2] || '').trim();
      var note = String(row[7] || '');

      if (farmName && farmName !== '- Global / Raktár' && farmName !== 'Farm' && farmName !== '-') {
        if (!farmMap[farmName]) {
          farmMap[farmName] = {
            fullName: farmName,
            name: farmName,
            size: 80,
            type: 'sajat',
            leaseExpireDate: "",
            systemRentExpiry: "",
            playerRentDueDate: "",
            rentPrice: 0,
            contactIgName: "",
            contactDiscord: "",
            contactPhone: ""
          };
        }

        // Bérleti idő kiolvasása a megjegyzésekből
        if (note.indexOf('Bérlet lejár: ') !== -1) {
          var parts = note.split('Bérlet lejár: ');
          if (parts[1]) {
            var dateStr = parts[1].split(' | ')[0].trim();
            farmMap[farmName].leaseExpireDate = dateStr;
            farmMap[farmName].systemRentExpiry = dateStr;
          }
        }

        // Részletes farm adatok kiolvasása
        if (note.indexOf('FARM SZERKESZTÉS') !== -1) {
          if (note.indexOf('Méret: 120') !== -1) farmMap[farmName].size = 120;
          if (note.indexOf('Típus: berelt') !== -1) farmMap[farmName].type = 'berelt';
          if (note.indexOf('Discord: ') !== -1) farmMap[farmName].contactDiscord = note.split('Discord: ')[1].split(' | ')[0].trim();
          if (note.indexOf('Tel: ') !== -1) farmMap[farmName].contactPhone = note.split('Tel: ')[1].split(' | ')[0].trim();
          if (note.indexOf('Ár: ') !== -1) farmMap[farmName].rentPrice = Number(note.split('Ár: ')[1].split(' | ')[0].replace(/[^0-9]/g, '')) || 0;
        }
      }
    });

    var farms = [];
    for (var key in farmMap) {
      farms.push(farmMap[key]);
    }

    return farms;
  }

  // 2. Lejáró bérletek ellenőrzése (48 óra / 2 nap)
  function checkExpiringRentals() {
    var rawData = [];
    try {
      rawData = AdatbazisModule.getRawData() || [];
    } catch(e) {
      return [];
    }

    var now = new Date();
    var warningWindow = 48 * 60 * 60 * 1000; // 48 óra

    var warnings = [];

    rawData.forEach(function (row) {
      if (!row || row.length < 8) return;
      var farmName = String(row[2] || '').trim();
      var note = String(row[7] || '');

      if (note.indexOf('Bérlet lejár: ') !== -1) {
        var dateStr = note.split('Bérlet lejár: ')[1].split(' | ')[0].trim();
        var expiryDate = new Date(dateStr.replace(/\./g, '-'));

        if (!isNaN(expiryDate.getTime())) {
          var diff = expiryDate.getTime() - now.getTime();

          if (diff > 0 && diff <= warningWindow) {
            var hoursLeft = Math.round(diff / (1000 * 60 * 60));
            warnings.push({
              farm: farmName,
              expiry: dateStr,
              hoursLeft: hoursLeft,
              type: 'WARNING_2_DAYS'
            });
          } else if (diff <= 0 && diff >= - (24 * 60 * 60 * 1000)) {
            warnings.push({
              farm: farmName,
              expiry: dateStr,
              hoursLeft: 0,
              type: 'EXPIRED'
            });
          }
        }
      }
    });

    return warnings;
  }

  // 3. Farm adatok rögzítése / frissítése
  function updateFarmDetails(formData) {
    if (!formData) return "❌ Hibás adatok!";

    var fullName = "";
    if (formData.ownerIgName && formData.farmOwnership === 'berelt') {
      fullName = formData.ownerIgName + " (Üvegház: " + formData.greenhouseNum + ". / " + formData.floorNum + ". emelet) [" + formData.doorNum + "]";
    } else {
      fullName = "[] Farming (Üvegház: " + formData.greenhouseNum + ". / " + formData.floorNum + ". emelet) [" + formData.doorNum + "]";
    }

    var expiryDate = (formData.farmOwnership === 'sajat') ? formData.systemRentExpiry : formData.playerRentDueDate;
    var formattedExpiry = expiryDate ? expiryDate.replace('T', ' ') : '';

    var note = "FARM SZERKESZTÉS | Méret: " + (formData.size || 80) + " ültetőhely" +
               " | Típus: " + (formData.farmOwnership || 'sajat') +
               (formattedExpiry ? " | Bérlet lejár: " + formattedExpiry : "") +
               (formData.contactDiscord ? " | Discord: " + formData.contactDiscord : "") +
               (formData.contactPhone ? " | Tel: " + formData.contactPhone : "") +
               (formData.rentPrice ? " | Ár: " + formData.rentPrice + " Ft" : "");

    AdatbazisModule.addLogRow("Rendszer", fullName, "Infó", "-", "-", 0, note);

    return "✅ Farm adatai sikeresen elmentve!";
  }

  // 4. Dolgozók listája
  function getWorkersList() {
    if (typeof AdminModule !== 'undefined' && typeof AdminModule.getRegisteredWorkersList === 'function') {
      return AdminModule.getRegisteredWorkersList();
    }

    var rawData = AdatbazisModule.getRawData() || [];
    var workersSet = {};

    rawData.forEach(function(row) {
      var name = String(row[1] || '').trim();
      if (name && name !== 'Rendszer' && name.indexOf('(Kifizető Admin)') === -1 && name.indexOf('(ADMIN MÓDOSÍTÁS)') === -1) {
        workersSet[name] = true;
      }
    });

    return Object.keys(workersSet);
  }

  return {
    getFarmsList: getFarmsList,
    checkExpiringRentals: checkExpiringRentals,
    updateFarmDetails: updateFarmDetails,
    getWorkersList: getWorkersList
  };

})();

function getFarmsList() {
  return FarmModule.getFarmsList();
}

function checkExpiringRentals() {
  return FarmModule.checkExpiringRentals();
}

function updateFarmDetails(formData) {
  return FarmModule.updateFarmDetails(formData);
}

function getWorkersList() {
  return FarmModule.getWorkersList();
}