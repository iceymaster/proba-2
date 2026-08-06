var AuthModule = (function () {
  var ADMIN_EMAIL = "netenpenz45@gmail.com";
  var USERS_SHEET_NAME = "Users";

  function getUsersSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(USERS_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(USERS_SHEET_NAME);
      sheet.appendRow(["Email", "Jelszó", "IG Karakter Név", "Szerepkör", "Regisztráció Dátuma"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#1E293B").setFontColor("#FFFFFF");
    }
    return sheet;
  }

  function hashPassword(password) {
    var digest = Uint8Array.from(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
    return digest.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  }

  function registerUser(email, password, igName) {
    email = String(email || "").trim().toLowerCase();
    igName = String(igName || "").trim();
    password = String(password || "").trim();

    if (!email || !password || !igName) {
      return { success: false, message: "❌ Minden mező kitöltése kötelező!" };
    }

    var sheet = getUsersSheet();
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === email) {
        return { success: false, message: "❌ Ez az email cím már regisztrálva van!" };
      }
    }

    var role = (email === ADMIN_EMAIL.toLowerCase()) ? "ADMIN" : "USER";
    var hashedPassword = hashPassword(password);
    var timestamp = Utilities.formatDate(new Date(), "GMT+3", "yyyy.MM.dd HH:mm");

    sheet.appendRow([email, hashedPassword, igName, role, timestamp]);

    return { 
      success: true, 
      message: "✅ Sikeres regisztráció! Most már bejelentkezhetsz.",
      user: { email: email, igName: igName, role: role }
    };
  }

  function loginUser(email, password) {
    email = String(email || "").trim().toLowerCase();
    password = String(password || "").trim();

    var sheet = getUsersSheet();
    var data = sheet.getDataRange().getValues();
    var hashedPassword = hashPassword(password);

    for (var i = 1; i < data.length; i++) {
      var rowEmail = String(data[i][0]).trim().toLowerCase();
      var rowPass = String(data[i][1]).trim();
      var rowIgName = String(data[i][2]).trim();
      var rowRole = String(data[i][3]).trim();

      if (rowEmail === email && rowPass === hashedPassword) {
        return {
          success: true,
          message: "✅ Sikeres bejelentkezés!",
          user: {
            email: rowEmail,
            igName: rowIgName,
            role: rowRole,
            isAdmin: (rowEmail === ADMIN_EMAIL.toLowerCase() || rowRole === "ADMIN")
          }
        };
      }
    }

    return { success: false, message: "❌ Hibás email cím vagy jelszó!" };
  }

  function getUnpaidBalancesList() {
    var rawData = AdatbazisModule.getRawData();
    var balances = {};

    rawData.forEach(function (row) {
      var worker = String(row[1] || '').trim();
      var action = String(row[3] || '').trim();
      var val = Number(row[6]) || 0;
      var note = String(row[7] || '');

      if (!worker || worker === 'Rendszer') return;

      if (action === "Kifizetés") {
        var match = note.match(/Kifizetve:\s*([^|]+)/i);
        var targetWorker = match ? match[1].trim() : "";
        if (targetWorker) {
          balances[targetWorker] = (balances[targetWorker] || 0) + val;
        }
      } else if (val > 0) {
        balances[worker] = (balances[worker] || 0) + val;
      }
    });

    var resultList = [];
    Object.keys(balances).forEach(function (w) {
      resultList.push({
        worker: w,
        balance: balances[w]
      });
    });

    return resultList;
  }

  return {
    registerUser: registerUser,
    loginUser: loginUser,
    getUnpaidBalancesList: getUnpaidBalancesList,
    ADMIN_EMAIL: ADMIN_EMAIL
  };
})();

function registerUser(email, password, igName) { return AuthModule.registerUser(email, password, igName); }
function loginUser(email, password) { return AuthModule.loginUser(email, password); }
function getUnpaidBalancesList() { return AuthModule.getUnpaidBalancesList(); }