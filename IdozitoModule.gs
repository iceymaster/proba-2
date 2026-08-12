var IdozitoModule = (function () {

  var DEFAULT_CROP_TIMES = {
    'Málna 🍇': { waterHours: 12, growHours: 24 },
    'Paradicsom 🍅': { waterHours: 12, growHours: 42 },
    'Eper 🍓': { waterHours: 12, growHours: 24 },
    'Sütőtök 🎃': { waterHours: 12, growHours: 48 },
    'Görögdinnye 🍉': { waterHours: 12, growHours: 48 },
    'Sárgadinnye 🍈': { waterHours: 12, growHours: 48 },
    'Uborka 🥒': { waterHours: 12, growHours: 24 },
    'TV paprika 🫑': { waterHours: 12, growHours: 36 },
    'Chilipaprika 🌶️': { waterHours: 12, growHours: 36 },
    'Almapaprika 🫑': { waterHours: 12, growHours: 36 },
    'Búza 🌾': { waterHours: 12, growHours: 24 },
    'Kukorica 🌽': { waterHours: 12, growHours: 36 },
    'Kender 🌿': { waterHours: 12, growHours: 48 },
    'Kókacserje 🍃': { waterHours: 12, growHours: 48 }
  };

  function parseDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    var clean = String(dateStr).replace(/\./g, '-').trim();
    var parsed = new Date(clean);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function getActiveTimers() {
    var rawData = AdatbazisModule.getRawData() || [];
    var now = new Date();
    var nowMs = now.getTime();

    var state = {};

    rawData.forEach(function (row) {
      var rowDate = parseDate(row[0]);
      var user = String(row[1] || "").trim();
      var farm = String(row[2] || "").trim();
      var action = String(row[3] || "").trim();
      var crop = String(row[4] || "").trim();
      var parcelsRaw = String(row[5] || "").trim();
      var note = String(row[7] || "").trim();

      if (!rowDate || !farm || farm === "- Global / Raktár" || farm === "-") return;
      if (action === "Infó" || action === "BérletHosszabbítás" || action === "Kifizetés" || action === "Vásárlás" || action === "LádaÁthelyezés") return;

      var parcelList = [];
      if (parcelsRaw && parcelsRaw !== "-") {
        var cleanStr = parcelsRaw.replace(/'/g, '').replace(/\./g, ',').replace(/#/g, '');
        parcelList = cleanStr.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
      }

      if (parcelList.length === 0 && action.indexOf("Ültetés") !== -1) {
        parcelList = ["1"];
      }

      if (parcelList.length === 0) return;

      parcelList.forEach(function (pNum) {
        var key = farm + " [#" + pNum + "]";

        // Admin manuális módosítások
        if (note.indexOf("Admin korrekció") !== -1 || note.indexOf("ADMIN PARCELLA FELÜLÍRÁS") !== -1 || user.indexOf("Admin") !== -1) {
          var forcedStatus = "growing";
          var forcedCrop = (crop && crop !== "-") ? crop : (state[key] ? state[key].crop : "Málna 🍇");

          if (note.indexOf("Állapot: water") !== -1 || note.indexOf("Locsolandó") !== -1) {
            forcedStatus = "water";
          } else if (note.indexOf("Állapot: harvest") !== -1 || note.indexOf("Aratásra KÉSZ") !== -1) {
            forcedStatus = "harvest";
          } else if (note.indexOf("Állapot: empty") !== -1 || note.indexOf("Üres") !== -1) {
            delete state[key];
            return;
          }

          var effectiveDate = rowDate;
          if (note.indexOf("Időpont:") !== -1) {
            var parts = note.split("Időpont:");
            if (parts[1]) {
              var customParsed = parseDate(parts[1].trim().substring(0, 16));
              if (customParsed) effectiveDate = customParsed;
            }
          }

          var plantDate = (state[key] && state[key].plantedAt) ? state[key].plantedAt : effectiveDate;

          state[key] = {
            farm: farm,
            parcel: String(pNum),
            plantedAt: plantDate,
            lastWateredAt: effectiveDate,
            status: "Admin Módosítva",
            user: user,
            crop: forcedCrop,
            forcedTileStatus: forcedStatus
          };
          return;
        }

        if (action.indexOf("Ültetés") !== -1) {
          if (note.indexOf("Nincs mag levonás") !== -1 || note.indexOf("Előkészítés") !== -1) return;

          if (!state[key] || state[key].plantedAt < rowDate) {
            state[key] = {
              farm: farm,
              parcel: String(pNum),
              plantedAt: rowDate,
              lastWateredAt: rowDate,
              status: "Ültetve / Locsolva",
              user: user,
              crop: (crop && crop !== "-") ? crop : "Málna 🍇",
              forcedTileStatus: null
            };
          }
        } else if (action.indexOf("Locsolás") !== -1 && state[key]) {
          // FONTOS: Megőrizzük az eredeti növényt (crop), csak a locsolás idejét frissítjük!
          state[key].lastWateredAt = rowDate;
          state[key].status = "Locsolva";
          state[key].user = user;
          state[key].forcedTileStatus = null;
        } else if (action.indexOf("Aratás") !== -1 && state[key]) {
          delete state[key];
        }
      });
    });

    var timerResults = [];
    var mapData = {};

    Object.keys(state).forEach(function (key) {
      var item = state[key];
      var lastWater = item.lastWateredAt;
      var planted = item.plantedAt;
      var cropName = item.crop;

      var profile = DEFAULT_CROP_TIMES[cropName] || { waterHours: 12, growHours: 24 };

      var waterSecLeft = 0;
      var harvestSecLeft = 0;

      var isWaterNeeded = false;
      var isReadyToHarvest = false;

      var waterTimeLeftStr = "⚠️ Locsolandó!";
      if (lastWater) {
        var nextWaterMs = lastWater.getTime() + (profile.waterHours * 60 * 60 * 1000);
        var diffWaterMs = nextWaterMs - nowMs;

        if (diffWaterMs > 0) {
          waterSecLeft = Math.floor(diffWaterMs / 1000);
          var wHours = Math.floor(diffWaterMs / (1000 * 60 * 60));
          var wMins = Math.floor((diffWaterMs % (1000 * 60 * 60)) / (1000 * 60));
          waterTimeLeftStr = "💧 Locsolás: " + wHours + "ó " + wMins + "p";
        } else {
          isWaterNeeded = true;
          waterSecLeft = 0;
        }
      }

      var harvestTimeLeftStr = "Ismeretlen";
      if (planted) {
        var readyMs = planted.getTime() + (profile.growHours * 60 * 60 * 1000);
        var diffHarvestMs = readyMs - nowMs;

        if (diffHarvestMs > 0) {
          harvestSecLeft = Math.floor(diffHarvestMs / 1000);
          var hDays = Math.floor(diffHarvestMs / (1000 * 60 * 60 * 24));
          var hHours = Math.floor((diffHarvestMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          harvestTimeLeftStr = "🚜 Aratás: " + (hDays > 0 ? hDays + "n " : "") + hHours + "ó múlva";
        } else {
          harvestTimeLeftStr = "🌾 Aratásra KÉSZ!";
          isReadyToHarvest = true;
          harvestSecLeft = 0;
        }
      }

      var tileStatus = item.forcedTileStatus ? item.forcedTileStatus : "growing";
      if (!item.forcedTileStatus) {
        if (isReadyToHarvest) tileStatus = "harvest";
        else if (isWaterNeeded) tileStatus = "water";
      }

      if (!mapData[item.farm]) {
        mapData[item.farm] = {};
      }

      mapData[item.farm][String(item.parcel)] = {
        crop: item.crop,
        status: tileStatus,
        waterSecLeft: waterSecLeft,
        harvestSecLeft: harvestSecLeft,
        waterTimeLeft: waterTimeLeftStr,
        harvestTimeLeft: harvestTimeLeftStr,
        lastWateredAt: item.lastWateredAt ? Utilities.formatDate(item.lastWateredAt, "GMT+3", "yyyy-MM-dd'T'HH:mm") : ""
      };

      timerResults.push({
        farm: item.farm + " [#" + item.parcel + "]",
        crop: item.crop,
        status: item.status,
        user: item.user,
        waterSecLeft: waterSecLeft,
        harvestSecLeft: harvestSecLeft,
        timeLeft: waterTimeLeftStr + " | " + harvestTimeLeftStr
      });
    });

    return {
      timers: timerResults,
      mapData: mapData
    };
  }

  return { getActiveTimers: getActiveTimers };
})();

function getActiveTimers() { return IdozitoModule.getActiveTimers(); }