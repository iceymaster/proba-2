var DiscordModule = (function () {

  // 🔴 DISCORD WEBHOOK URL
  var DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1533312489545273455/FvSrUFEKErtxgN-1BekO7w27l2JH342NLGXBVvovsMkxDevkb-KLt7RsxJRwDg7gbW0M";

  function sendEmbedNotification(user, farm, action, crop, parcels, value, note) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.indexOf("http") !== 0) {
      Logger.log("⚠️ Discord Webhook URL nincs megfelelően beállítva!");
      return;
    }

    var color = 0x38BDF8; // Alapértelmezett kék
    var iconEmoji = "📝";

    if (action === "Ültetés") {
      color = 0x22C55E; // Zöld
      iconEmoji = "🌱";
    } else if (action === "Locsolás") {
      color = 0x0EA5E9; // Kék
      iconEmoji = "💧";
    } else if (action === "Aratás") {
      color = 0xEAB308; // Sárga
      iconEmoji = "🚜";
    } else if (action === "Kifizetés") {
      color = 0x10B981; // Zöld pénz
      iconEmoji = "💵";
    } else if (action === "FarmHozzaadas" || action === "Infó") {
      color = 0x8B5CF6; // Lila
      iconEmoji = "🏡";
    } else if (action === "Vásárlás" || action === "LádaÁthelyezés") {
      color = 0xF97316; // Narancs
      iconEmoji = "📦";
    }

    var fields = [
      { name: "👤 Munkás / Admin", value: String(user || "Ismeretlen"), inline: true },
      { name: "🏡 Farm", value: String(farm || "Global"), inline: true },
      { name: "📋 Művelet", value: iconEmoji + " " + String(action), inline: true }
    ];

    if (crop && crop !== "-") {
      fields.push({ name: "🌾 Növény", value: String(crop), inline: true });
    }

    if (parcels && parcels !== "-") {
      var cleanParcels = String(parcels).replace(/'/g, '');
      fields.push({ name: "🌱 Érintett Parcellák", value: "#" + cleanParcels.split(',').join(', #'), inline: true });
    }

    if (value && Number(value) !== 0) {
      fields.push({ name: "💰 Érték / Munkadíj", value: Number(value).toLocaleString('hu-HU') + " Ft", inline: true });
    }

    if (note) {
      fields.push({ name: "💬 Megjegyzés / Részletek", value: String(note), inline: false });
    }

    var payload = {
      username: "SeeRPG Farm Bot",
      avatar_url: "https://i.imgur.com/4M34hi2.png",
      embeds: [
        {
          title: iconEmoji + " Új Farm Esemény Rögzítve!",
          color: color,
          fields: fields,
          footer: {
            text: "SeeRPG Farm Dashboard Log System • " + Utilities.formatDate(new Date(), "GMT+3", "yyyy.MM.dd HH:mm")
          }
        }
      ]
    };

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
    } catch (e) {
      Logger.log("❌ Discord Webhook küldési hiba: " + e.message);
    }
  }

  // ITT EXPONÁLJUK A FÜGGVÉNYT
  return {
    sendEmbedNotification: sendEmbedNotification
  };

})();

// Globális függvény elérés
function sendEmbedNotification(user, farm, action, crop, parcels, value, note) {
  DiscordModule.sendEmbedNotification(user, farm, action, crop, parcels, value, note);
}