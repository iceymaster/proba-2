var FarmModule = (function() {

  function getFarmsList() {
    var rawData = AdatbazisModule.getRawData();
    var farmMap = {};

    rawData.forEach(function(row) {
      var farmName = String(row[2] || '').trim();
      var note = String(row[7] || '');

      if (farmName && farmName !== '- Global / Raktár' && farmName !== 'Farm') {
        if (!farmMap[farmName]) {
          farmMap[farmName] = {
            fullName: farmName,
            leaseExpireDate: ""
          };
        }

        if (note.indexOf('Bérlet lejár: ') !== -1) {
          var parts = note.split('Bérlet lejár: ');
          if (parts[1]) {
            var dateStr = parts[1].split(' | ')[0].trim();
            farmMap[farmName].leaseExpireDate = dateStr;
          }
        }
      }
    });

    var farms = [];
    for (var key in farmMap) {
      farms.push(farmMap[key]);
    }

    return farms;
  }

  function getWorkersList() {
    if (typeof AdminModule !== 'undefined' && typeof AdminModule.getRegisteredWorkersList === 'function') {
      return AdminModule.getRegisteredWorkersList();
    }

    var rawData = AdatbazisModule.getRawData();
    var workersSet = {};

    rawData.forEach(function(row) {
      var name = String(row[1] || '').trim();
      if (name && name !== 'Rendszer' && name.indexOf('(Kifizető Admin)') === -1 && name.indexOf('(ADMIN MÓDOSÍTÁS)') === -1) {
        workersSet[name] = true;
      }
    });

    return Object.keys(workersSet);
  }

  // 👑 ADMIN: Parcella állapotának felülírása (0 Ft pénzmozgással, támogatva az ültetést és locsolást)
  function updateParcelStateAdmin(farmName, parcelNum, crop, status, user, customDate) {
    if (!farmName || !parcelNum) return "❌ Érvénytelen farm vagy parcella szám!";

    var action = "Locsolás";
    var note = "Locsolva (Admin módosítás)";
    var value = 0; // 0 Ft, hogy senkinek ne írjon jóvá semmit!

    // Ha az admin ültetve/növekedésben lévő állapotot választ
    if (status === "planting" || status === "growing") {
      action = "Ültetés";
      note = "Beültetve (Admin módosítás)";
    } else if (status === "harvest") {
      action = "Aratás";
      note = "Aratva (Admin módosítás)";
    }

    if (customDate) {
      var d = new Date(customDate);
      if (!isNaN(d.getTime())) {
        var dateFormatted = Utilities.formatDate(d, "GMT+3", "yyyy.MM.dd HH:mm");
        note += " | Időpont: " + dateFormatted;
      }
    }

    var logUser = user || "Isido Maestro";
    var cleanParcels = String(parcelNum).replace(/'/g, '').trim();
    var parcels = "'" + cleanParcels;

    return AdatbazisModule.addLogRow(logUser, farmName, action, crop || "Málna 🍇", parcels, value, note);
  }

  function saveData(formData) {
    var action = formData.actionType;

    if (typeof RaktarModule !== 'undefined' && (action === "Vásárlás" || action === "LádaÁthelyezés")) {
      return RaktarModule.processInventory(formData);
    }

    var farm = formData.farmSelect || "- Global / Raktár";
    var defaultUser = formData.userName || "Ismeretlen";
    var crop = formData.cropSelect || "-";
    var note = formData.note || "";
    var totalValue = Number(formData.value) || 0;
    
    var rawParcels = formData.selectedParcelsList ? String(formData.selectedParcelsList).trim() : "-";
    var parcels = (rawParcels !== "-" && rawParcels !== "") ? "'" + rawParcels.replace(/'/g, '') : "-";

    if (action === "FarmHozzaadas") {
      farm = formData.newFarmName || "Új Farm";
      action = "Infó";
      crop = "-";
      parcels = "-";
      note = "Új farm regisztrálva! | Bérlet lejár: " + (formData.leaseExpireDate || "Nincs megadva");
      return AdatbazisModule.addLogRow(defaultUser, farm, action, crop, parcels, 0, note);
    } 
    
    else if (action === "BérletHosszabbítás") {
      action = "Infó";
      crop = "-";
      parcels = "-";
      note = "Bérlet meghosszabbítva! | Bérlet lejár: " + (formData.leaseExpireDate || "Nincs megadva") + (note ? " | " + note : "");
      return AdatbazisModule.addLogRow(defaultUser, farm, action, crop, parcels, 0, note);
    }

    else if (action === "Kifizetés") {
      var adminUser = defaultUser + " (Kifizető Admin)";
      var worker = formData.workerSelect || "Kifizetett Dolgozó";
      note = "Kifizetve: " + worker + (note ? " | " + note : "");
      farm = "- Global / Raktár";
      crop = "-";
      parcels = "-";
      var payValue = -Math.abs(totalValue);
      return AdatbazisModule.addLogRow(adminUser, farm, action, crop, parcels, payValue, note);
    } 

    else if (action === "Ültetés") {
      var parcelsArr = (rawParcels !== "-" && rawParcels !== "") ? rawParcels.split(',').filter(Boolean) : [];
      var parcelCount = parcelsArr.length || 1;

      var planterNames = [];
      Object.keys(formData).forEach(function(key) {
        if (key.indexOf('planterName_') === 0 && formData[key]) {
          var valName = String(formData[key]).trim();
          if (valName !== "") {
            planterNames.push(valName);
          }
        }
      });

      if (planterNames.length === 0) {
        planterNames.push(defaultUser);
      }

      var splitValue = Math.round(totalValue / planterNames.length);
      var isUltetesDone = (formData.stageUltetes === true || formData.stageUltetes === "true");

      var baseNote = "";
      if (isUltetesDone) {
        var seedCount = parcelCount * 20;
        baseNote = parcelCount + " parcella beültetve (" + seedCount + " db mag levonva)";
      } else {
        baseNote = "Előkészítés / Kapálás (Nincs mag levonás)";
      }

      if (note) baseNote += " | " + note;
      if (planterNames.length > 1) {
        baseNote += " (Megosztva " + planterNames.length + " ültető között: " + planterNames.join(', ') + ")";
      }

      for (var i = 0; i < planterNames.length; i++) {
        var currentWorkerName = planterNames[i];
        AdatbazisModule.addLogRow(currentWorkerName, farm, action, crop, parcels, splitValue, baseNote);
      }

      return "✅ Sikeresen rögzítve " + planterNames.length + " ültetőnek! (" + splitValue.toLocaleString('hu-HU') + " Ft / fő)";
    } 

    else if (action === "Locsolás") {
      var locsNote = "Locsolva" + (note ? " | " + note : "");
      return AdatbazisModule.addLogRow(defaultUser, farm, action, crop, parcels, totalValue, locsNote);
    }

    else if (action === "Aratás") {
      var hQty = formData.harvestQty ? "Betakarított mennyiség: " + formData.harvestQty + " db" : "";
      var aratasNote = hQty + (note ? (hQty ? " | " : "") + note : "");
      return AdatbazisModule.addLogRow(defaultUser, farm, action, crop, parcels, totalValue, aratasNote);
    } 

    else {
      return AdatbazisModule.addLogRow(defaultUser, farm, action, crop, parcels, totalValue, note);
    }
  }

  return {
    getFarmsList: getFarmsList,
    getWorkersList: getWorkersList,
    updateParcelStateAdmin: updateParcelStateAdmin,
    saveData: saveData
  };

})();

function getFarmsList() { return FarmModule.getFarmsList(); }
function getWorkersList() { return FarmModule.getWorkersList(); }
function updateParcelStateAdmin(farmName, parcelNum, crop, status, user, customDate) { 
  return FarmModule.updateParcelStateAdmin(farmName, parcelNum, crop, status, user, customDate); 
}
function saveData(formData) { return FarmModule.saveData(formData); }