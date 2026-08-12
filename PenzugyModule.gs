var PenzugyModule = (function() {

  function getUserBalances() {
    var values = AdatbazisModule.getRawData();
    var balances = {};

    values.forEach(function(r) {
      var user = String(r[1] || '').trim();
      var action = String(r[3] || '').trim();
      // JAVÍTÁS: Az Érték (Ft) a 6-os indexű oszlop (7. oszlop), azaz r[6], nem r[5]!
      var val = Number(r[6] || 0);

      if (user && user !== 'Kitöltő Neve' && user !== 'Névtelen' && user !== 'Rendszer' && user !== '-') {
        if (!balances[user]) balances[user] = 0;
        
        // Az eladások, értékesítések és vásárlások összegeit nem adja hozzá a személyes egyenleghez
        if (action.indexOf('Eladás') === -1 && action.indexOf('Értékesítés') === -1 && action.indexOf('Vásárlás') === -1) {
          balances[user] += val;
        }
      }
    });

    return balances;
  }

  function getFarmSummaries() {
    var values = AdatbazisModule.getRawData();
    var farms = {};
    var globalIncome = 0;
    var globalExpense = 0;

    values.forEach(function(r) {
      var farm = String(r[2] || '').trim();
      var action = String(r[3] || '').trim();
      var details = String(r[4] || '').trim();
      // JAVÍTÁS: Itt is r[6] az érték
      var val = Number(r[6] || 0);

      if (farm && farm !== 'Farm Neve' && farm !== '-' && farm.indexOf('Global') === -1) {
        if (!farms[farm]) {
          farms[farm] = { income: 0, expense: 0, profit: 0, leaseExpire: null };
        }

        // Kinyerjük a bérlet lejárati dátumát a leírásból, ha van benne
        var leaseMatch = details.match(/Bérlet lejár:\s*([\d\-\:T\.]+)/i);
        if (leaseMatch) {
          farms[farm].leaseExpire = leaseMatch[1];
        }
      }

      if (action.indexOf('Eladás') !== -1 || action.indexOf('Értékesítés') !== -1) {
        globalIncome += Math.abs(val);
        if (farm && farm.indexOf('Global') === -1 && farms[farm]) {
          farms[farm].income += Math.abs(val);
        }
      } else if (action.indexOf('Bérmunka') !== -1 || action.indexOf('Vásárlás') !== -1) {
        globalExpense += Math.abs(val);
        if (farm && farm.indexOf('Global') === -1 && farms[farm]) {
          farms[farm].expense += Math.abs(val);
        }
      }

      if (farm && farms[farm]) {
        farms[farm].profit = farms[farm].income - farms[farm].expense;
      }
    });

    return {
      global: {
        income: globalIncome,
        expense: globalExpense,
        profit: globalIncome - globalExpense
      },
      farms: farms
    };
  }

  // BÉRLET HOSSZABBÍTÁSA GOMBHOZ (+7 NAP HOZZÁADÁSA)
  function renewFarmLease(farmName) {
    var data = getFarmSummaries();
    var currentExpire = (data.farms[farmName] && data.farms[farmName].leaseExpire) ? new Date(data.farms[farmName].leaseExpire) : new Date();
    
    // Ha már lejárt, a mai naptól számítunk 7 napot, különben a meglévőhöz adjuk hozzá
    var now = new Date();
    var baseDate = currentExpire.getTime() < now.getTime() ? now : currentExpire;
    baseDate.setDate(baseDate.getDate() + 7);

    var newIsoStr = baseDate.toISOString().slice(0, 16);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Eseménynapló (Adatbázis)');
    var timestamp = Utilities.formatDate(new Date(), "GMT+2", "yyyy.MM.dd HH:mm");
    
    sheet.appendRow([
      timestamp,
      'Rendszer',
      farmName,
      'Infó',
      '-',
      '-',
      0,
      'Bérlet meghosszabbítva +7 nappal! | Bérlet lejár: ' + newIsoStr
    ]);

    return "Sikeresen meghosszabbítva!";
  }

  return {
    getUserBalances: getUserBalances,
    getFarmSummaries: getFarmSummaries,
    renewFarmLease: renewFarmLease
  };

})();

function getUserBalances() { return PenzugyModule.getUserBalances(); }
function getFarmSummaries() { return PenzugyModule.getFarmSummaries(); }
function renewFarmLease(farmName) { return PenzugyModule.renewFarmLease(farmName); }