var KifizetesModule = (function () {

  function getWorkerUnpaidBalance(workerName) {
    if (!workerName) return { total: 0, details: "Nincs kiválasztva dolgozó." };

    var rawData = AdatbazisModule.getRawData();
    var totalEarned = 0;
    var totalPaid = 0;
    
    var workCounts = { ultetes: 0, locsolas: 0, aratas: 0 };

    rawData.forEach(function (row) {
      var user = String(row[1] || "").trim();
      var action = String(row[3] || "").trim();
      var details = String(row[4] || "").trim();
      var val = Math.abs(Number(row[6]) || 0);

      // Dolgozó tisztítása (ha admin utótag lenne benne)
      var cleanUser = user.replace(/\(Kifizető Admin\)/g, '').trim();

      if (cleanUser.toLowerCase() === workerName.toLowerCase()) {
        if (action === "Ültetés") {
          totalEarned += val;
          workCounts.ultetes++;
        } else if (action === "Locsolás") {
          totalEarned += val;
          workCounts.locsolas++;
        } else if (action === "Aratás") {
          totalEarned += val;
          workCounts.aratas++;
        }
      }

      // Kifizetések ellenőrzése
      if (action === "Kifizetés" && details.toLowerCase().indexOf(workerName.toLowerCase()) !== -1) {
        totalPaid += val;
      }
    });

    var unpaidBalance = totalEarned - totalPaid;
    if (unpaidBalance < 0) unpaidBalance = 0;

    var summaryText = "📋 Elvégzett munkák: " + 
      workCounts.ultetes + "x Ültetés, " + 
      workCounts.locsolas + "x Locsolás, " + 
      workCounts.aratas + "x Aratás. " +
      "(Összesen: " + totalEarned.toLocaleString('hu-HU') + " Ft | Kifizetve: " + totalPaid.toLocaleString('hu-HU') + " Ft)";

    return {
      total: unpaidBalance,
      details: summaryText
    };
  }

  return { getWorkerUnpaidBalance: getWorkerUnpaidBalance };
})();

function getWorkerUnpaidBalance(workerName) {
  return KifizetesModule.getWorkerUnpaidBalance(workerName);
}
