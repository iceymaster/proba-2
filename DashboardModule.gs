var DashboardModule = (function () {

  function getDashboardStats() {
    var totalIncome = 0;
    var totalCost = 0;
    var rawData = [];

    // 1. Adatbázis lekérése hibakezeléssel
    try {
      if (typeof AdatbazisModule !== 'undefined' && typeof AdatbazisModule.getRawData === 'function') {
        rawData = AdatbazisModule.getRawData() || [];
      }
    } catch (e) {
      Logger.log("❌ Hiba az adatok lekérésekor: " + e.message);
    }

    rawData.forEach(function (row) {
      if (!row || row.length === 0) return;

      var action = String(row[3] || '').trim();   // D oszlop: Művelet Típusa

      var val = 0;
      var rawVal = row[6]; // G oszlop (Érték)

      if (typeof rawVal === 'number') {
        val = rawVal;
      } else if (rawVal && !isNaN(parseFloat(String(rawVal).replace(/[^0-9.-]+/g, "")))) {
        val = Number(String(rawVal).replace(/[^0-9.-]+/g, "")) || 0;
      } else {
        for (var i = 4; i < row.length; i++) {
          var checkVal = Number(String(row[i]).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(checkVal) && checkVal > 0) {
            val = checkVal;
            break;
          }
        }
      }

      if (action === "Eladás" || action === "Termény eladás") {
        totalIncome += val;
      } else if (action === "Kifizetés") {
        totalCost += Math.abs(val);
      } else if (action === "Locsolás" || action === "Ültetés" || action === "Kapálás" || action === "Ásás") {
        totalCost += val;
      } else if (val > 0) {
        totalCost += val;
      }
    });

    var totalProfit = totalIncome - totalCost;

    // 2. RAKTÁR KÉSZLET LEKÉRÉSE
    var stockList = [];
    try {
      if (typeof RaktarModule !== 'undefined' && typeof RaktarModule.getSeedInventory === 'function') {
        var inv = RaktarModule.getSeedInventory();

        if (inv && inv.global) {
          Object.keys(inv.global).forEach(function (crop) {
            if (inv.global[crop] > 0) {
              stockList.push({
                location: "🌐 Központi Mag Raktár",
                crop: crop,
                qty: inv.global[crop]
              });
            }
          });
        }

        if (inv && inv.ladas) {
          Object.keys(inv.ladas).forEach(function (farmName) {
            Object.keys(inv.ladas[farmName]).forEach(function (crop) {
              if (inv.ladas[farmName][crop] > 0) {
                stockList.push({
                  location: "📦 " + farmName,
                  crop: crop,
                  qty: inv.ladas[farmName][crop]
                });
              }
            });
          });
        }
      }
    } catch (e) {
      Logger.log("❌ Raktár lekérési hiba: " + e.message);
    }

    // 3. IDŐZÍTŐK ÉS TÉRKÉP LEKÉRÉSE
    var timersData = { timers: [], mapData: {} };
    try {
      if (typeof IdozitoModule !== 'undefined' && typeof IdozitoModule.getActiveTimers === 'function') {
        timersData = IdozitoModule.getActiveTimers() || { timers: [], mapData: {} };
      }
    } catch (e) {
      Logger.log("❌ Időzítő lekérési hiba: " + e.message);
    }

    // 4. FARMAK ÉS BÉRLETEK LEKÉRÉSE
    var farms = [];
    var ownFarmsRent = [];
    var rentedFarmsPayable = [];
    var expiringAlerts = [];

    var now = new Date();
    var warningWindowMs = 48 * 60 * 60 * 1000; // 2 nap (48 óra)

    try {
      if (typeof FarmModule !== 'undefined' && typeof FarmModule.getFarmsList === 'function') {
        var rawFarms = FarmModule.getFarmsList() || [];
        
        farms = rawFarms.map(function(farm) {
          var fObj = (typeof farm === 'object') ? farm : { name: farm };

          var farmData = {
            name: fObj.name || fObj.fullName || String(farm),
            fullName: fObj.fullName || fObj.name || String(farm),
            size: Number(fObj.size || 80),
            type: fObj.type || 'sajat',
            systemRentExpiry: fObj.systemRentExpiry || fObj.leaseExpireDate || '',
            playerRentDueDate: fObj.playerRentDueDate || '',
            rentPrice: fObj.rentPrice || 0,
            contactIgName: fObj.contactIgName || fObj.ownerIgName || '',
            contactDiscord: fObj.contactDiscord || '',
            contactPhone: fObj.contactPhone || ''
          };

          if (farmData.type === 'sajat' && farmData.systemRentExpiry) {
            ownFarmsRent.push({
              farmName: farmData.name,
              expiry: farmData.systemRentExpiry
            });
          }

          if (farmData.type === 'berelt') {
            rentedFarmsPayable.push({
              farmName: farmData.name,
              dueDate: farmData.playerRentDueDate,
              price: farmData.rentPrice,
              contactIgName: farmData.contactIgName,
              contactDiscord: farmData.contactDiscord,
              contactPhone: farmData.contactPhone
            });
          }

          // 2 napos lejárati ellenőrzés
          var expStr = farmData.systemRentExpiry || farmData.playerRentDueDate;
          if (expStr) {
            var cleanDateStr = String(expStr).replace(/\./g, '-').replace('T', ' ');
            var expDate = new Date(cleanDateStr);

            if (!isNaN(expDate.getTime())) {
              var diff = expDate.getTime() - now.getTime();
              if (diff > 0 && diff <= warningWindowMs) {
                expiringAlerts.push({
                  farmName: farmData.name,
                  type: farmData.type,
                  expiry: expStr,
                  hoursLeft: Math.round(diff / (1000 * 60 * 60)),
                  contactIgName: farmData.contactIgName,
                  contactDiscord: farmData.contactDiscord,
                  contactPhone: farmData.contactPhone
                });
              } else if (diff <= 0 && diff >= - (24 * 60 * 60 * 1000)) {
                expiringAlerts.push({
                  farmName: farmData.name,
                  type: 'EXPIRED',
                  expiry: expStr,
                  hoursLeft: 0
                });
              }
            }
          }

          return farmData;
        });
      }
    } catch (e) {
      Logger.log("❌ Farm lista lekérési hiba: " + e.message);
    }

    return {
      totals: {
        income: totalIncome,
        cost: totalCost,
        profit: totalProfit
      },
      stock: stockList,
      timersData: timersData,
      farms: farms,
      ownFarmsRent: ownFarmsRent,
      rentedFarmsPayable: rentedFarmsPayable,
      expiringAlerts: expiringAlerts
    };
  }

  return { getDashboardStats: getDashboardStats };

})();

function getDashboardStats() {
  return DashboardModule.getDashboardStats();
}