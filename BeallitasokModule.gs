var BeallitasokModule = (function () {


  /* ==========================
      ALAP BEÁLLÍTÁSOK
  ========================== */


  var DEFAULT_SETTINGS = {


    seedPrices: {

      "Paradicsom 🍅": 3000,
      "Málna 🍇": 3000,
      "Eper 🍓": 3000,
      "Sütőtök 🎃": 3000,
      "Görögdinnye 🍉": 3000,
      "Sárgadinnye 🍈": 3000,
      "Uborka 🥒": 3000,
      "TV paprika 🫑": 3000,
      "Chilipaprika 🌶️": 3000,
      "Almapaprika 🫑": 3000

    },


    sellEfficiency: 100

  };





  function cloneDefault() {

    return JSON.parse(
      JSON.stringify(DEFAULT_SETTINGS)
    );

  }





  /*
  ==========================
      BEÁLLÍTÁS LEKÉRÉS
  ==========================
  */


  function getSettings() {


    var props =
      PropertiesService
      .getScriptProperties();



    var saved =
      props.getProperty(
        "FARM_SETTINGS"
      );



    if (!saved) {

      return cloneDefault();

    }




    try {


      var settings =
        JSON.parse(saved);



      if (!settings.seedPrices) {

        settings.seedPrices = {};

      }



      /*
        Hiányzó árak pótlása
      */


      Object.keys(
        DEFAULT_SETTINGS.seedPrices
      )
      .forEach(function(seed){


        if (
          settings.seedPrices[seed] == null
        ) {


          settings.seedPrices[seed] =
            DEFAULT_SETTINGS.seedPrices[seed];


        }


      });





      if (
        settings.sellEfficiency == null
      ) {


        settings.sellEfficiency =
          DEFAULT_SETTINGS.sellEfficiency;


      }



      return settings;



    }
    catch(e){


      Logger.log(
        "Beállítás JSON hiba: "
        + e
      );


      return cloneDefault();


    }


  }





  /*
  ==========================
      MENTÉS
  ==========================
  */


  function saveSettings(newSettings){



    if (!newSettings) {

      return "❌ Nincs mentendő adat!";

    }



    var settings =
      getSettings();





    if (
      newSettings.seedPrices
    ){


      Object.keys(
        newSettings.seedPrices
      )
      .forEach(function(seed){


        var price =
          Number(
            newSettings.seedPrices[seed]
          );



        if (!isNaN(price)) {


          settings.seedPrices[seed] =
            price;


        }


      });


    }





    if (
      newSettings.sellEfficiency != null
    ){


      var efficiency =
        Number(
          newSettings.sellEfficiency
        );



      if (!isNaN(efficiency)) {


        settings.sellEfficiency =
          efficiency;


      }


    }





    PropertiesService
      .getScriptProperties()
      .setProperty(
        "FARM_SETTINGS",
        JSON.stringify(settings)
      );



    return "✅ Beállítások sikeresen elmentve!";


  }





  /*
  ==========================
      ÚJ MAG HOZZÁADÁS
  ==========================
  */


  function addSeed(seedName, price){


    var settings =
      getSettings();



    if (!seedName){

      return "❌ Hiányzó magnév!";

    }



    settings.seedPrices[seedName] =
      Number(price || 3000);



    saveSettings(settings);



    return "✅ Új mag hozzáadva!";


  }





  return {


    getSettings:
      getSettings,


    saveSettings:
      saveSettings,


    addSeed:
      addSeed


  };


})();





/*
==========================
  KÜLSŐ FUNKCIÓK
==========================
*/


function getSettings(){

  return BeallitasokModule.getSettings();

}



function saveSettings(settings){

  return BeallitasokModule.saveSettings(settings);

}