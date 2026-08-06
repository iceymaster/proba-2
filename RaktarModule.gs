var RaktarModule = (function () {

  function cleanSeedName(str) {
    if (!str) return "";
    return String(str).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, "").trim().toLowerCase();
  }

  function processInventory(formData) {
    var action = formData.actionType;
    var crop = formData.cropSelect || "Mag";
    var qty = Number(formData.buyQty) || 1;
    var farm = (formData.farmSelect || "").trim();
    
    // Itt állítjuk be, hogy ne a te személyes neved (formData.userName) legyen a logoló,
    // hanem a "Rendszer", így ez központi raktári/bevételezési sorként fog látszódni!
    var user = "Rendszer"; 

    var targetFarm = "- Global / Raktár";
    var actionName = action === "Vásárlás" ? "Vásárlás" : "Ládába áthelyezés";
    
    if (action === "LádaÁthelyezés") {
      if (!farm || farm === "" || farm.indexOf("--") !== -1) {
        return "❌ Hiba: Kérlek, válaszd ki a célfarmot!";
      }
      targetFarm = farm;
      note = "Ládába tette: " + qty + " db mag";
    } else {
      var note = "Vásárolva: " + qty + " db mag";
    }

    // 8 paraméteres hívás az új struktúra szerint:
    // (user, farm, action, crop, parcels, value, note)
    AdatbazisModule.addLogRow(user, targetFarm, actionName, crop, "-", 0, note);
    
    if (action === "Vásárlás") {
      return "✅ Sikeresen rögzítve! " + qty + " db " + crop + " megvásárolva a Központi Mag Raktárba.";
    } else {
      return "✅ Sikeresen rögzítve! " + qty + " db " + crop + " áthelyezve a(z) " + farm + " ládájába.";
    }
  }

  function getSeedInventory() {
    var values = AdatbazisModule.getRawData();
    var globalInventory = {};
    var farmLadas = {};

    values.forEach(function (row) {
      var farm = String(row[2] || "").trim();    // C: Farm Neve
      var action = String(row[3] || "").trim();   // D: Művelet
      var crop = String(row[4] || "").trim();    // E: Növény Típusa
      var parcels = String(row[5] || "").trim(); // F: Érintett Parcellák
      var note = String(row[7] || "").trim();    // H: Megjegyzés / Részletek

      // 1. Vásárlás (Központi magtárba)
      if (action.indexOf("Vásárlás") !== -1) {
        var qtyMatch = note.match(/(\d+)\s*db/i);
        if (qtyMatch) {
          globalInventory[crop] = (globalInventory[crop] || 0) + Number(qtyMatch[1]);
        }
      }

      // 2. Ládába áthelyezés (Global -> Farm láda)
      if (action.indexOf("Ládába áthelyezés") !== -1 || action.indexOf("LádaÁthelyezés") !== -1) {
        var qtyMatchBox = note.match(/(\d+)\s*db/i);
        if (qtyMatchBox && farm) {
          var qty = Number(qtyMatchBox[1]);
          globalInventory[crop] = (globalInventory[crop] || 0) - qty;
          if (!farmLadas[farm]) farmLadas[farm] = {};
          farmLadas[farm][crop] = (farmLadas[farm][crop] || 0) + qty;
        }
      }

      // 3. Ültetés (Magok levonása)
      if (action.indexOf("Ültetés") !== -1 && note.indexOf("Nincs mag levonás") === -1) {
        var used = 0;
        var usedMatch = note.match(/(\d+)\s*db\s*mag/i);
        if (usedMatch) {
          used = Number(usedMatch[1]);
        } else if (parcels && parcels !== "-") {
          used = parcels.split(',').filter(Boolean).length * 20;
        }

        // Elsősorban a farm saját ládájából vonjuk le
        if (used > 0 && farmLadas[farm]) {
          for (var key in farmLadas[farm]) {
            if (cleanSeedName(key) === cleanSeedName(crop)) {
              var take = Math.min(farmLadas[farm][key], used);
              farmLadas[farm][key] -= take;
              used -= take;
              break;
            }
          }
        }

        // Ha a farm ládájában nem volt elég, a maradékot a Központi Raktárból vonjuk le
        if (used > 0) {
          for (var g in globalInventory) {
            if (cleanSeedName(g) === cleanSeedName(crop)) {
              globalInventory[g] -= used;
              break;
            }
          }
        }
      }
    });

    // Negatív értékek megelőzése
    Object.keys(globalInventory).forEach(function (k) {
      if (globalInventory[k] < 0) globalInventory[k] = 0;
    });

    Object.keys(farmLadas).forEach(function (f) {
      Object.keys(farmLadas[f]).forEach(function (s) {
        if (farmLadas[f][s] < 0) farmLadas[f][s] = 0;
      });
    });

    return { global: globalInventory, ladas: farmLadas };
  }

  return { 
    processInventory: processInventory, 
    getSeedInventory: getSeedInventory 
  };
})();