var EditModule = (function () {

  function updateParcelStateAdmin(farmName, parcelNum, newCrop, newStatus, user, customDateStr) {
    if (!farmName || !parcelNum) return "❌ Hiányzó adatok!";

    var action = "Ültetés";
    var note = "Admin korrekció (Újraállítva UI-ról)";
    var crop = newCrop || "Málna 🍇";
    var value = 0;

    if (newStatus === "empty") {
      action = "Aratás";
      note = "Admin törlés / Üresre állítás";
      crop = "-";
    } else if (newStatus === "planting" || newStatus === "growing") {
      action = "Ültetés";
      note = "Admin korrekció (Ültetve / Friss növény)";
    } else if (newStatus === "water") {
      action = "Locsolás";
      note = "Admin korrekció (Locsolandó állapot)";
    } else if (newStatus === "watered") {
      action = "Locsolás";
      note = "Admin korrekció (Frissen locsolva)";
    } else if (newStatus === "harvest") {
      action = "Locsolás";
      note = "Admin korrekció (Aratásra kész)";
    }

    var parcels = String(parcelNum);
    var worker = (user || "Admin") + " (Admin Korrekció)";

    var logDateStr = "";
    if (customDateStr) {
      if (typeof customDateStr === 'string') {
        logDateStr = customDateStr.replace('T', ' ');
      } else if (customDateStr instanceof Date && !isNaN(customDateStr.getTime())) {
        logDateStr = Utilities.formatDate(customDateStr, "GMT+3", "yyyy.MM.dd HH:mm");
      }
    }

    if (!logDateStr) {
      logDateStr = Utilities.formatDate(new Date(), "GMT+3", "yyyy.MM.dd HH:mm");
    }

    AdatbazisModule.addLogRow(worker, farmName, action, crop, parcels, value, note + " | Időpont: " + logDateStr);

    return "✅ Parcella #" + parcelNum + " adminisztrátori módosítása rögzítve! (" + logDateStr + ")";
  }

  return {
    updateParcelStateAdmin: updateParcelStateAdmin
  };

})();

function updateParcelStateAdmin(farmName, parcelNum, newCrop, newStatus, user, customDateStr) {
  return EditModule.updateParcelStateAdmin(farmName, parcelNum, newCrop, newStatus, user, customDateStr);
}