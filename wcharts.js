/*
Copyright 2023 James D. Miller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Weather Charts (wC) module
// wCharts.js
// 8:47 PM Thu March 30, 2023

/*
Dependencies:
   jQuery
   google charts
*/

var wC = (function() {
   "use strict";
   
   google.charts.load('current', {'packages':['corechart']});
   google.charts.load('current', {'packages':['table']});
   
   google.charts.setOnLoadCallback( queryGoogleSheet);
   
   // Names starting with m_ indicate module-scope globals.
   var m_version = 1.9;
   console.log('wC version ' + m_version);
   
   var m_temperatureChart = null;
   var m_windChart = null;
   var m_rawVisTable = null;
   var m_smoothedVisTable = null;
   
   var m_dataTable = null;
   var m_editedDataTable = null;
   
   var m_chartArea = {left:100, top:40, width:"70%", height:"83%"};
   
   var m_stationName = null;
   var m_problemWithURLSearch = false;
   
   var m_selectRegions = null;
   var m_selectStations = null;
   var m_selectEndDate = null;
   var m_endDateAtQuery = null;
   var m_selectDays = null;
   var m_selectDaysValueAtQuery = null;
   var m_nDays = null;
   var m_nDaysAtQuery = null;
   
   var m_alreadySmoothed = false;
   var m_annotated = false;
   
   var m_width_px = 700;
   var m_hAxis_format = 'haa';
   var m_hAxis_gridLineCount = 9;
   
   var m_ticks = null;
   var m_temperatureTicks = null;
   var m_pressureTicks = null;
   
   var m_db_allNull, m_dp_allNull, m_bp_allNull;
   var m_legendPosition = null;
   
   var m_readyForNewQuery = null;
   var m_retry_count = null;
   
   var m_populateEndDate; // function
   var m_endDateFromResponse;
   var m_epochMax;
   var m_isToday = null;
/*
*/
   var m_timeShiftFromCentral = {
      "H":  -4,
      "AK": -3,
      "P":  -2,
      "M":  -1,
      "C":   0,
      "E":   1,
      "J":  15,
      "NZ": 18   
   }

   var m_months = {
     Jan: '01',
     Feb: '02',
     Mar: '03',
     Apr: '04',
     May: '05',
     Jun: '06',
     Jul: '07',
     Aug: '08',
     Sep: '09',
     Oct: '10',
     Nov: '11',
     Dec: '12',
   }

   var m_dayNames =     ["Sun",   "Mon",   "Tue",    "Wed",      "Thu",     "Fri",   "Sat"];
   var m_dayNamesLong = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

   var m_station_map = {
      //==================================================
      // Stations from the Meso JSON gleaner
      //==================================================
      // Washington
      'KRLD':{'longName':'Richland, WA', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},      
      'KMWH':{'longName':'Moses Lake, WA', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},    
      'KEAT':{'longName':'Wenatchee, WA', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},     
      'KNOW':{'longName':'Port Angeles, WA', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},  
      'K0S9':{'longName':'Port Townsend, WA', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'}, 
      
      // Alaska
      //'PABR.2':{'longName':'Utqiagvik/Barrow (Meso)', 'tz':'AK', 'dst':true, 'region':'ak', 'sheet':'meso'},      
      //'PAWI':{'longName':'Wainwright AP',             'tz':'AK', 'dst':true, 'region':'ak', 'sheet':'meso'},
      'PAQT':{'longName':'Nuiqsut AP',                'tz':'AK', 'dst':true, 'region':'ak', 'sheet':'meso'},
      'PASI':{'longName':'Sitka',                     'tz':'AK', 'dst':true, 'region':'ak', 'sheet':'meso'},
      'PAFA':{'longName':'Fairbanks Int AP',          'tz':'AK', 'dst':true, 'region':'ak', 'sheet':'meso'},
      'PATQ':{'longName':'Atqasuk',                   'tz':'AK', 'dst':true, 'region':'ak', 'sheet':'meso'},
      'PANC':{'longName':'Anchorage',                 'tz':'AK', 'dst':true, 'region':'ak', 'sheet':'meso'},
      
      // BC Canada
      'CYAZ':{'longName':'Tofino, BC', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},
      
      // Oregon
      'HOXO':{'longName':'Hood River, OR', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},    
      'KOTH':{'longName':'North Bend, OR', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},  
      
      // Columbia River (for delta-p chart)
      'KDLS':{'longName':'The Dalles, OR', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},        
      'KTTD':{'longName':'Troutdale, OR', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},     
      'KHRI':{'longName':'Hermiston, OR ', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'meso'},   
         
      // Fritz's sites on the cape...
      'KHSE.2':{'longName':'Cape Hatteras, NC (Meso)', 'tz':'E', 'dst':true, 'region':'misc', 'sheet':'meso'}, 
      'KCQX.2':{'longName':'Chatham, MA (Meso)', 'tz':'E', 'dst':true, 'region':'misc', 'sheet':'meso'},       
      
      // Hawaii
      'PHOG':{'longName':'Maui Airport', 'tz':'H', 'dst':false, 'region':'Hawaii', 'sheet':'meso'},                   
      'PHJR':{'longName':'Oahu, Kalaeloa Airport', 'tz':'H', 'dst':false, 'region':'Hawaii', 'sheet':'meso'},         
      'PHBK':{'longName':'Kauai, Barking Sands Airport', 'tz':'H', 'dst':false, 'region':'Hawaii', 'sheet':'meso'}, 
      
      // Kansas
      'KOJC':{'longName':'Olathe, KS', 'tz':'C', 'dst':true, 'region':'misc', 'sheet':'meso'},
      
      // Missouri
      'KSTL':{'longName':'Saint Louis, MO', 'tz':'C', 'dst':true, 'region':'misc', 'sheet':'meso'},   
      'KJLN':{'longName':'Joplin Regional AP, MO', 'tz':'C', 'dst':true, 'region':'misc', 'sheet':'meso'},   
      
      // MN
      'KMKT.2':{'longName':'Mankato Airport (Meso)', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'meso'},       
      'KSOM5':{'longName':'Kasota Prairie', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'meso'},
      'MN073':{'longName':'Mankato HW169-BER', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'meso'},
      
      // Peg's home (Laurie's friend)
      'KAPF':{'longName':'Naples, FL', 'tz':'E', 'dst':true, 'region':'misc', 'sheet':'meso'},       
      'KSRQ':{'longName':'Sarasota, FL', 'tz':'E', 'dst':true, 'region':'misc', 'sheet':'meso'},       
            
      //==================================================
      // Stations from the AW XML gleaner
      //==================================================
      // Sites near Saint Peter.                  
      'KMKT':{'longName':'Mankato Airport (AW)', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'}, 
      'KMML':{'longName':'Marshall', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'}, 
      'KFRM':{'longName':'Fairmont', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'}, 
      'KHCD':{'longName':'Hutchinson', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'}, 
      'KULM':{'longName':'New Ulm', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},   
      
      'KFBL':{'longName':'Faribault', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},  
      'KAEL':{'longName':'Albert Lea', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'}, 
      'KOWA':{'longName':'Owatonna', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},   

      // Sites near Waconia.                                                       
      'KLVN':{'longName':'Lakeville', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},  
      'KGYL':{'longName':'Glencoe', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},    
      'KLJF':{'longName':'Litchfield', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'}, 
      'KBDH':{'longName':'Willmar', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},    
      'KPEX':{'longName':'Paynesville', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},

      // Sites near Worthington.
      'KOTG':{'longName':'Worthington', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},
      'KSPW':{'longName':'Spencer, IA', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},
      
      // Sites near Mille Lacs (Aitkin).
      'KAIT':{'longName':'Aitkin', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},      
      'KJMR':{'longName':'Mora', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},        
      
      // MN Sites in general.
      'KFGN':{'longName':'Flag Island', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'}, 
      'KDYT':{'longName':'Duluth', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},      
      'KLSE':{'longName':'La Crosse, WI', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},   
      'KONA':{'longName':'Winona', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},      
      'KRGK':{'longName':'Red Wing', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},    
                            
      'KCFE':{'longName':'Buffalo Muni', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},
      'KAXN':{'longName':'Alexandria', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},  
      'KFFM':{'longName':'Fergus Falls', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},
      'KADC':{'longName':'Wadena Muni', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'}, 
      'KGHW':{'longName':'Glenwood', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},    
      
      'KBRD':{'longName':'Brainerd', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},    
      'KLXL':{'longName':'Little Falls', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},
      
      // Sites near White Bear and Saint Croix River.
      'KRNH':{'longName':'New Richmond, WI', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},
      'KANE':{'longName':'Blaine', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},      
      'KSTP':{'longName':'Saint Paul', 'tz':'C', 'dst':true, 'region':'mn', 'sheet':'aw'},  
      
      // Fritz's site on the cape...
      'KCQX':{'longName':'Chatham, MA (AW)', 'tz':'E', 'dst':true, 'region':'misc', 'sheet':'aw'},
      
      // Alaska...
      'PABR':{'longName':'Utqiagvik', 'tz':'AK', 'dst':true, 'region':'ak', 'sheet':'aw'},      
      
      // Hatteras
      'KHSE':{'longName':'Cape Hatteras, NC (AW)', 'tz':'E', 'dst':true, 'region':'misc', 'sheet':'aw'},

      // Pasco,WA airport...
      'KPSC':{'longName':'Pasco, WA', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'aw'},         

      // Antarctica
      'NZSP':{'longName':'Amundsen-Scott', 'tz':'NZ', 'dst':false, 'region':'misc', 'sheet':'aw'}, 

      // Japan
      'RJTT':{'longName':'Tokyo INTL Airport', 'tz':'J', 'dst':false, 'region':'misc', 'sheet':'aw'}, 

      // Bob Douglas winter home
      'KSSI':{'longName':'St. Simons Island, GA', 'tz':'E', 'dst':true, 'region':'misc', 'sheet':'aw'}, 
      
      //==================================================
      // Stations in Hanford
      //==================================================
      'IDF': {'longName':'200E - IDF', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      '233S':{'longName':'233S S-Plant', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'HAMR':{'longName':'Hammer', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'VSTA':{'longName':'Kennewick Vista Field', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'VERN':{'longName':'Vernita Bridge', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      '100F':{'longName':'100 F Area', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'GABW':{'longName':'Gable West', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'PASC':{'longName':'Pasco', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'HMS': {'longName':'Met Station', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'RMTN':{'longName':'Rattlesnake Mtn', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'PFP': {'longName':'200 West, PFP', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'RING':{'longName':'Ringold', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      'GABL':{'longName':'Gable Mountain', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      'FRNK':{'longName':'Franklin County', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      'WPPS':{'longName':'WNP-2', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      '100N':{'longName':'100 N Area', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      'WYEB':{'longName':'Wye Barricade', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      '300A':{'longName':'300 Area', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      'YAKB':{'longName':'Yakima Barricade', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      'FFTF':{'longName':'Fast Flux Test Facility', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      'BVLY':{'longName':'Beverely', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      '200W':{'longName':'200 West Area', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},
      '200E':{'longName':'200 East Area', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      '100K':{'longName':'100 K Area', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'EDNA':{'longName':'Edna Railroad Crossing', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'RSPG':{'longName':'Rattlesnake Springs', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'ARMY':{'longName':'Army Loop Road', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'EOC': {'longName':'Emergency Operations', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'}, 
      'PROS':{'longName':'Prosser Barricade', 'tz':'P', 'dst':true, 'region':'hanford', 'sheet':'hanford'},   

      //==================================================
      // NOAA stations in OR and WA
      //==================================================
      'NBend':{'longName':'North Bend, OR (NOAA)', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'noaa'},   
      'MLake':{'longName':'Moses Lake, WA (NOAA)', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'noaa'},   
      'EBurg':{'longName':'Ellensburg, WA', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'noaa'},   
      'Walla':{'longName':'Walla Walla, WA', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'noaa'},   
      'Hermi':{'longName':'Hermiston, OR (NOAA)', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'noaa'},   
      'Pasco':{'longName':'Pasco, WA (NOAA)', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'noaa'},   
      'Dalle':{'longName':'The Dalles, OR (NOAA)', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'noaa'},   
      'PLand':{'longName':'Portland, OR', 'tz':'P', 'dst':true, 'region':'pnw', 'sheet':'noaa'},         
   }
   
   // Create an array of key-value pairs: key, longName.
   var m_stations_sorted = Object.keys( m_station_map).map( key => [key, m_station_map[ key].longName] );
   // Sort the array by longName, a string (second element).
   m_stations_sorted.sort( (a, b) => ( a[1].localeCompare(b[1]) ) ); // numeric sort::: items.sort((a, b) => a[1] - b[1]);

   // module globals for objects brought in by initializeModule
   // (none)
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   function getSheetURL( station) {
      let workBook_python = "https://docs.google.com/spreadsheets/d/1o6-x2GLbAt3XbBRaMEcGkO7e7gGcCdIu-uwHy5PybwI/edit?usp=sharing";
      let workBook_perl =   "https://docs.google.com/spreadsheets/d/1WIhBWjSpB7atJ3_k0-rR93e7AQ_fZib2aeTvnI0DRXQ/edit?usp=sharing";
      let bookMap = {'meso':workBook_python, 'aw':workBook_python, 'hanford':workBook_perl, 'noaa':workBook_perl};
      
      let sheetName = m_station_map[ station].sheet;
      // note: adding "&headers=1" would return a header row.
      let sheetURL = bookMap[ sheetName] + "&sheet=" + sheetName;
      
      return sheetURL;
   }
   
   function initializeModule() {
      // This gets called after page loads.
      
      let initialRegion, initialStation, initialDays;
      let mainCause = "";
      let searchString = window.location.search.slice(1);
      if (searchString) {
         try {
            let segments = searchString.split("&");
            initialStation = segments[0].split("=")[1];
            
            m_problemWithURLSearch = true;
            if (segments.length < 2) {
               mainCause = 'The query must have one "&" and segments for "station" and number of "days."';
               
            } else if (searchString.split("=").length < 3) {
               mainCause = 'There should be an "=" for each part of the query.';
               
            } else if ( ! searchString.includes('station')) {
               mainCause = 'No word "station" in the URL query.';
               
            } else if (initialStation == "") {
               mainCause = 'There is no "station" value in the URL query.';
               
            } else if ( ! searchString.includes('days')) {
               mainCause = 'No word "days" in the URL query.';
               
            } else if ( ! ['24h','1','2','5','10'].includes( segments[1].split("=")[1])) {
               mainCause = 'The "days" value should be 24h, 1, 2, 5 or 10';
               
            } else if ( ! m_station_map[ initialStation]) {
               mainCause = 'Station "' + initialStation + '" is not recognized. ';
               mainCause += "It may help to <a href='"+ window.location +"'>reload</a> the page (the station may be in the latest update).";
               
            } else {
               m_problemWithURLSearch = false;
            }
            
            if (m_problemWithURLSearch) {
               let queryString = "Query submitted: " + window.location.search + "<br>";
               let warningMessage = queryString + mainCause + "<BR>A working example has been put in the URL above.<BR><BR>";
               document.getElementById("statusSpan").innerHTML = warningMessage;
               // Give them a working example.
               initialStation = 'PABR';
               initialRegion = m_station_map[ initialStation].region;
               initialDays = "1";
               
            } else {
               initialRegion = m_station_map[ initialStation].region;
               initialDays = segments[1].split("=")[1];               
            }
           
         } catch (error) {
            console.error( error);
            initialRegion = "mn";
            initialStation = "KMKT.2";
            initialDays = "24h";
         }         
        
      } else {
         initialRegion = "mn";
         initialStation = "KMKT.2";
         initialDays = "24h";
      }
      
      m_readyForNewQuery = true;
      m_retry_count = 0;
      
      m_selectRegions = document.getElementById("regions");
      m_selectRegions.addEventListener('change', regionChange);
      function regionChange() {
         populateSelectStations( m_selectRegions.value);
         if (m_selectRegions.value == "mn") {
            m_selectStations.value = "KMKT.2";
            
         } else if (m_selectRegions.value == "pnw") {
            m_selectStations.value = "KRLD";
            
         } else if (m_selectRegions.value == "Hawaii") {
            m_selectStations.value = "PHOG";
            
         } else if (m_selectRegions.value == "ak") {
            m_selectStations.value = "PASI";
            
         } else if (m_selectRegions.value == "hanford") {
            m_selectStations.value = "RMTN";
            
         } else if (m_selectRegions.value == "misc") {
            m_selectStations.value = "RJTT";
         }
         m_stationName = m_selectStations.value;
         queryGoogleSheet();
      }
      
      m_selectStations = document.getElementById("stations");
      function populateSelectStations( region) {
         $("#stations").empty();
         for (let index in m_stations_sorted) {
            let key = m_stations_sorted[ index][0];
            let station = m_station_map[ key];
            if (station.region == region) {
               let element = document.createElement("option");
               element.text = station.longName;
               element.value = key;
               m_selectStations.add( element);
            }
         };
      }
      m_selectRegions.value = initialRegion;
      populateSelectStations( initialRegion);
      m_stationName = initialStation;
      m_selectStations.value = m_stationName;
      
      m_selectStations.addEventListener('change', stationChange);
      function stationChange() {
         console.log( m_selectStations.value);
         m_stationName = m_selectStations.value;
         queryGoogleSheet();
      }
      
      m_selectEndDate = document.getElementById("endDate");
      m_populateEndDate = function() {
         $("#endDate").empty();
         let oneDayShift = 24 * 3600*1000;
         let epochDate = Date.now(); // + oneDayShift
         for (var i = 0; i < 200; i++) {
            let shiftedDate = new Date( epochDate).toDateString();
            let element = document.createElement("option");
            element.text = shiftedDate;
            element.value = shiftedDate;
            m_selectEndDate.add( element);
            epochDate -= oneDayShift;
         } 
      }
      m_populateEndDate();
      
      m_selectEndDate.addEventListener('change', dateChange);
      function dateChange() {
         console.log( m_selectEndDate.value);
         queryGoogleSheet();
      }
            
      m_selectDays = document.getElementById("nDays");
      m_selectDays.value = initialDays;
      m_selectDays.addEventListener('change', changeDays);
            
      function changeDays( submitQuery=true) {
         m_nDays = (m_selectDays.value == "24h") ? 1 : Number( m_selectDays.value);
         //console.log( "days=" + m_nDays);
         if (submitQuery) queryGoogleSheet();
      }
      changeDays( false); // "false" initializes the chart settings without submitting the query.
   }
   
   function changeUpdateButton( state) {
      if (state == "wait") {
         $("#updateButton").html("Wait");
         $("#updateButton").css("background-color", "#505050");
         $("#updateButton").css("color", "white");
         $("#updateButton").css("border-width", "0px");
      } else if (state == "update") {
         $("#updateButton").html("Update");
         $("#updateButton").css("background-color", "#F0F0F0");
         $("#updateButton").css("color", "black");
         $("#updateButton").css("border-width", "1px");
      } else {
         // nothing
      }
   }
   
   function queryGoogleSheet() {
      
      let endTimeLocal;
      
      if ( ! m_readyForNewQuery) return;
      
      // Keep track of these in case user has changed select values while waiting for the response.
      m_endDateAtQuery = m_selectEndDate.value;
      m_selectDaysValueAtQuery = m_selectDays.value;
      m_nDaysAtQuery = m_nDays;
      
      changeUpdateButton("wait");
      m_readyForNewQuery = false;
      if ( ! m_problemWithURLSearch) document.getElementById("statusSpan").textContent="";
      
      let query = new google.visualization.Query( getSheetURL( m_stationName));
      
      let nowLocal = new Date();
      
      // Check the first date in the endDate select list. If old, repopulate the list.
      let firstDate = new Date( Date.parse( $("#endDate").find("option:first-child").val() ));
      var firstIsToday = ( firstDate.toDateString() == nowLocal.toDateString() );
      if ( ! firstIsToday) m_populateEndDate();
      
      let endDate = new Date( Date.parse( m_selectEndDate.value + " 23:59:59"));
      m_isToday = (nowLocal.toDateString() == endDate.toDateString());
      //console.log(m_isToday + ": " + nowLocal.toDateString() + "===" + endDate.toDateString());
      
      if ((m_selectDaysValueAtQuery == "24h") && (m_isToday)) {
         endTimeLocal = nowLocal;
         
      } else {
         //let tz_shift_hr = hoursFromUTC( m_stationName, endDate);
         //console.log("tz_shift_hr="+tz_shift_hr);
         endTimeLocal = dateTimeWithTZ( m_stationName, m_selectEndDate.value + " 23:59:59", true);
         //console.log("endTimeLocal=" + endTimeLocal.toString());
         
         //tz_shift_hr = 0;
         //endTimeLocal = new Date( endDate.getTime() + (tz_shift_hr * 3600*1000));
      }
      
      //let endTimeLocal = (m_isToday) ? nowLocal: endDate;
      
      //console.log("UTC = " + endTimeLocal.toUTCString());
      
      let endTime_UTCstring = endTimeLocal.toISOString();
      //console.log("ISO = " + endTime_UTCstring);
      let endTime_queryString = endTime_UTCstring.replace("T", " ").slice(0, 19);
      
      
      // Maybe modify for DLS: shave off one hour from the shift if the startTimeLocal falls outside of DLS.
      // Then recalculate the startTimeLocal.
      
      // The following two calculations of startTimeLocal work equivalently.
      //let startTimeLocal = new Date( endTimeLocal.setHours( endTimeLocal.getHours() - (m_nDaysAtQuery*24 - 0)));
      let adder_h = ([1,2].includes( m_nDaysAtQuery)) ? (10/60) : 0; // back up another nn/60 minutes for the 1 and 2 day plots.
      let startTimeLocal = new Date( endTimeLocal.getTime() - (m_nDaysAtQuery * (24+adder_h)*3600*1000));
      
      // 2023-02-04T00:57:01.634Z
      let startTime_UTCstring = startTimeLocal.toISOString();
      //console.log("UTC = " + startTime_UTCstring);
      // 2023-02-04 00:40:51
      let startTime_queryString = startTime_UTCstring.replace("T", " ").slice(0, 19);
      //console.log("UTC = " + startTime_queryString);
      
      query.setQuery("select B, C, D, F, G, E, H, A where (A = '" + m_stationName + "') and " + 
                     "(B >= datetime '" + startTime_queryString + "') and (B <= datetime '" + endTime_queryString + "')" + 
                     "order by B desc");  //2023-02-3 10:00:00
      
      query.send( handleQueryResponse);
      
      pS.logEntry( m_station_map[ m_stationName].longName + ", " + m_selectDaysValueAtQuery + ", " + m_endDateAtQuery + " v" + m_version);
   }
   
   function dayLightSavingsTime( dateString) {
      // This determines if the supplied date is within daylight savings time.
      // It does this by comparing the timezone offset in winter to the offset
      // of the supplied date.
      let nowLocal = new Date();
      let winterDate = new Date( nowLocal.setMonth( 1));
      let tz_diff_midWinter = winterDate.getTimezoneOffset()/60;
      
      let dateObjectToCheck = new Date( dateString);
      let tz_diff_dateToCheck = dateObjectToCheck.getTimezoneOffset()/60;
      //console.log('dst--now: ' + tz_diff_dateToCheck + ', winter: ' + tz_diff_midWinter);
      let dst = (tz_diff_dateToCheck != tz_diff_midWinter);
      return dst;
   }
   
   function hoursFromUTC( stationName, dateString, useDST=true) {
      // Shift for station timezone difference from UTC.
      let shift_from_CST = m_timeShiftFromCentral[ m_station_map[ stationName].tz];
      let shift_from_UTC = 6 - shift_from_CST; // not considering dst
      // Establish DST: use the supplied date AND whether the station is in a timezone that follows daylight savings time.
      let dst = (dayLightSavingsTime( dateString) && m_station_map[ stationName].dst);
      let shift_dst = (dst && useDST) ? -1:0; // -1:0;
      //console.log('shift_dst='+shift_dst);
      let shift_total = shift_from_UTC + shift_dst;
      return shift_total;
   }
   
   function dateTimeWithTZ( stationName, dateString, useDST=true) {
      // expected format of dateString:  Mon Mar 06 2023 23:59:59
      //console.log("dateString="+dateString);
      
      let dateParts = dateString.split(" ");
      // format of cleanDateString:  YYYY-MM-DD HH:MM:SS
      let cleanDateString = dateParts[3] + "-" + m_months[ dateParts[1]] + "-" + dateParts[2] + " " + dateParts[4];
      //console.log("cleanDateString="+cleanDateString);
      
      let shift_total = -hoursFromUTC( stationName, dateString, useDST);
      let shiftAbs = String( Math.abs( shift_total)).padStart(2,"0");
      let tz_string = (shift_total >= 0 ) ? "+"+shiftAbs : "-"+shiftAbs; // example: -02 or +14 
      let total_dateString = cleanDateString + tz_string;
      //console.log('total_dateString='+total_dateString);
      
      let dT_withTZ = new Date( Date.parse( total_dateString));
      return dT_withTZ;
   }
   
   function setChartOptionsByDays( nDays) {
      let cA_height = "78%";
      if (nDays == 1) {
         m_width_px = 700;
         m_chartArea.width = "75%";
         m_chartArea.height = cA_height;
         m_hAxis_format = 'haa';
         m_hAxis_gridLineCount = 9; // 9
         m_legendPosition = "top";
         
      } else if (nDays == 2) {
         m_width_px = 800;
         m_chartArea.width = "80%";
         m_chartArea.height = cA_height; // 83
         m_hAxis_format = 'EEE d'; // haa  hh aa  EEE d
         m_hAxis_gridLineCount = 6; // 3
         m_legendPosition = "top";
         
      } else if (nDays == 5) {
         m_width_px = 800;
         m_chartArea.width = "80%";
         m_chartArea.height = cA_height;
         m_hAxis_format = 'EEE d'; //  hh aa
         m_hAxis_gridLineCount = 5; // 3
         m_legendPosition = "top";
         
      } else if (nDays == 10) {
         m_width_px = 1400; // 1400
         m_chartArea.width = "86%";
         m_chartArea.height = cA_height; //75 83
         m_hAxis_format = 'EEE d';
         m_hAxis_gridLineCount = 8; // 8
         m_legendPosition = "in"; // in or top
      }
   }
   
   function handleQueryResponse( response) {
      
      // Update URL and query string.
      let base_URL = window.location.href.split("?")[0];
      let searchString = "?station=" + m_stationName + "&days=" + m_selectDaysValueAtQuery;
      window.history.replaceState(null, null, base_URL + searchString);
      
      // Make table...
      m_dataTable = response.getDataTable();
      
      // long names for the columns, used in both the raw and smoothed tables
      let ln = {db:"dry bulb", dp:"dew point", bp:"barometer", ws:"speed", wg:"gust", wd:"direction"};
      
      // set (header) labels corresponding to the columns in the query
      m_dataTable.setColumnLabel( 1, ln.db);
      m_dataTable.setColumnLabel( 2, ln.dp);
      m_dataTable.setColumnLabel( 3, ln.ws);
      m_dataTable.setColumnLabel( 4, ln.wg);
      m_dataTable.setColumnLabel( 5, ln.wd);
      m_dataTable.setColumnLabel( 6, ln.bp);
      
      if (m_dataTable.getNumberOfRows() < 3) {
         document.getElementById("statusSpan").textContent="No data returned for this date and station. Please try again.";
         changeUpdateButton("update");
         m_readyForNewQuery = true;
         if (m_temperatureChart) m_temperatureChart.clearChart();
         if (m_windChart) m_windChart.clearChart();
         document.getElementById('tableDiv').innerHTML = "";
         document.getElementById('editedTableDiv').innerHTML = "";
         return
      } else {
         if ( ! m_problemWithURLSearch) document.getElementById("statusSpan").textContent="";
      }
      
      //console.log( "response=" + JSON.stringify( response));
      
      // header row with column labels
      let editedArray = [["shiftdate", "shifted epoch", ln.db, ln.dp, ln.bp, ln.ws, ln.wg, ln.wd]];
      
      // Use the end-date used in the query to establish dst.
      let nowLocal = new Date( m_endDateAtQuery + " 12:00:00");  // m_selectEndDate.value + " 23:59:59"
      let shift_total = hoursFromUTC( m_stationName, nowLocal);
      
      function aN( value, sensor) {
         // check if sensor has any non-null values (i.e. can be plotted)
         if (value) {
            if (sensor == "db") {
               m_db_allNull = false;
            } else if (sensor == "dp") {
               m_dp_allNull = false;
            } else if (sensor == "bp") {
               m_bp_allNull = false;
            }
         }
         return value;
      }
      
      m_db_allNull = true; m_dp_allNull = true; m_bp_allNull = true;
      let tempRange = {min:200, max:-200};
      let pressureRange = {min:200, max:-200};
      m_epochMax = 0;
      for (var i = 0; i < m_dataTable.getNumberOfRows(); i++) {
         let UTC_date = m_dataTable.getValue(i, 0);
         
         // This is one way to force the time values in the spreadsheet to be interpreted as UTC.
         let epoch_true = Date.parse( m_dataTable.getValue(i, 0).toString().slice(0,24) + ' UTC');
         let UTC_date_true = new Date( epoch_true);
         
         // Keep track of the max value for use in calculating the lag of the latest record behind current time.
         if (epoch_true > m_epochMax) m_epochMax = epoch_true;
         
         //shift_total = hoursFromUTC( m_stationName, UTC_date);
         //console.log('shift_total='+shift_total);

         //console.log("UTC_date=" + UTC_date);
         
         // Beware!! This is not really an epoch. There is some assumption of timezone associated with the
         // spreadsheet values (in UTC_date). This is not equivalent to the epoch_true values above. 
         // However, this shifting effectively works, apparently because getTime() and 
         // new Date() both assume the same timezone (the browser).
         let epoch_msec = UTC_date.getTime();
         let shifted_epoch_msec = epoch_msec - (shift_total * 3600*1000);
         let shifted_date = new Date( shifted_epoch_msec);
         //console.log("shift=" + shifted_date);
         //console.log("")
         
         // Shift the date to local (station timezone) in the raw data table.
         m_dataTable.setValue(i, 0, shifted_date);
         
         let dryBulb    = m_dataTable.getValue(i, 1);
         let dewPoint   = m_dataTable.getValue(i, 2);
         let pressure   = m_dataTable.getValue(i, 6);
         let wind_speed = m_dataTable.getValue(i, 3);
         let wind_gust  = m_dataTable.getValue(i, 4);
         let wind_dir   = m_dataTable.getValue(i, 5);
         
         if (dryBulb) { 
            tempRange.min = Math.min( dryBulb,  tempRange.min);
            tempRange.max = Math.max( dryBulb,  tempRange.max);
         }
         if (dewPoint) {
            tempRange.min = Math.min( dewPoint, tempRange.min);
            tempRange.max = Math.max( dewPoint, tempRange.max);
         }
         if (pressure) {
            pressureRange.min = Math.min( pressure,  pressureRange.min);
            pressureRange.max = Math.max( pressure,  pressureRange.max);
         }
         
         // Populate the array (of row arrays) that will be the source for the smoothing operations.
         editedArray = editedArray.concat( [[shifted_date, shifted_epoch_msec, 
            aN( dryBulb, "db"), 
            aN( dewPoint, "dp"),
            aN( pressure, "bp"), 
            wind_speed, 
            wind_gust, 
            wind_dir
         ]]);
         
      } 
      
      m_endDateFromResponse = m_dataTable.getValue(0, 0);
      //console.log('end_date==='+m_endDateFromResponse);
      
      function yTicks( sensorMin, sensorMax, stepSize, decimalPlaces) {
         let tickMin = Math.floor( sensorMin/stepSize) * stepSize;
         let tickMax = Math.ceil( sensorMax/stepSize) * stepSize;
         
         let tickRange = tickMax - tickMin;
         let n_ticks = Math.round( tickRange/stepSize);
         let ticks = [];
         let tickValue = tickMin;
         
         for (var i = 0; i <= n_ticks; i++) {
            ticks.push( tickValue.toFixed( decimalPlaces));
            tickValue += stepSize;
         }
         
         return ticks;
      }
      
      m_temperatureTicks = yTicks( tempRange.min, tempRange.max, 10, 0);
      if (m_temperatureTicks.length <= 2) m_temperatureTicks = yTicks( tempRange.min, tempRange.max, 5, 0);
      m_pressureTicks = yTicks( pressureRange.min, pressureRange.max, 0.2, 1);
      if (m_pressureTicks.length <= 2) m_pressureTicks = yTicks( pressureRange.min, pressureRange.max, 0.04, 2);
      
      //console.log( tempRange.min + " to " + tempRange.max + ", " + m_temperatureTicks);
      //console.log( pressureRange.min + " to " + pressureRange.max + ", " + m_pressureTicks);
      
      //console.log("all null = " + m_dp_allNull + ", " + m_bp_allNull);
      
      m_editedDataTable = new google.visualization.arrayToDataTable( editedArray);
      
      // Format for the date-time values.
      var dateFormat = new google.visualization.DateFormat({pattern: "MMM/dd/yyyy h:mm aa"});  // h:mm aa  MMM/dd/yyyy   ZZZZ  , timeZone: -6   pattern: "MM:dd:yyyy HH:mm ZZZZ"   formatType: 'long'
      // Apply this format to the first column.
      dateFormat.format( m_dataTable, 0);

      m_alreadySmoothed = false;
      m_annotated = false;
      
      handleSmootherThenDraw();
   }


   function RunningAverage( tableColumn) {
      this.queue = [];
      this.tableColumn = tableColumn;
      this.n_rowCount = m_editedDataTable.getNumberOfRows();
      this.direction = (tableColumn == 7) ? true:false;
      this.average = null;
   }
   RunningAverage.prototype.reset = function() {
      this.queue = [];
   }
   RunningAverage.prototype.normalAverage = function() {
      var total = 0;
      var n_count = 0;
      
      //Sum and average the non-null values in the queue.
      for (var i in this.queue) {
         if (this.queue[i]) {
            total += this.queue[i];
            n_count++;
         }
      }
      let average = (n_count > 0) ? total / n_count : null;
      return average;
   }
   RunningAverage.prototype.directionAverage = function() {
      let x_total = 0;
      let y_total = 0;
      let n_count = 0;
      let averageDir_deg_corrected = null;
      
      for (var i in this.queue) {
         if (this.queue[i]) {
            x_total += Math.cos( this.queue[i] * (Math.PI/180.0) );
            y_total += Math.sin( this.queue[i] * (Math.PI/180.0) );
            n_count++;
         }
      }
      
      // Determine the angle average from the component averages.
      let averageDir_deg = Math.atan2( y_total/n_count, x_total/n_count) * (180.0/Math.PI);
      
      // Transform the output so that all directions are positive.
      if (averageDir_deg < 0) {
         averageDir_deg_corrected = averageDir_deg + 360.0;
      } else {
         averageDir_deg_corrected = averageDir_deg +   0.0;
      }
      let average = (n_count > 0) ? averageDir_deg_corrected : null;
      return average;
   }
   RunningAverage.prototype.nullZero = function( rowIndex) {
      // Null if wind speed is zero
      let value = m_editedDataTable.getValue( rowIndex, this.tableColumn);
      
      if (this.direction) {
         let speed = m_editedDataTable.getValue( rowIndex, this.tableColumn-2);
         if (speed == 0) value = null;
      }
      
      return value;
   }
   RunningAverage.prototype.update = function( tableRowIndex) {
      // Use raw values for the first row.
      if (tableRowIndex == 0) {
         this.queue[0] = this.nullZero( tableRowIndex);
      
      // Initialize the queue in second row, where previous and next values are available.
      } else if (tableRowIndex == 1) {
         this.queue[0] = this.nullZero( tableRowIndex - 1);
         this.queue[1] = this.nullZero( tableRowIndex);
         this.queue[2] = this.nullZero( tableRowIndex + 1);         
      
      // Raw for the last row.
      } else if (tableRowIndex == (this.n_rowCount-1)) {
         this.queue = [];
         this.queue[0] = this.nullZero( tableRowIndex);
      
      // All the middle rows get the first two raw values from the raw values in the previous queue.
      //  0-1-2
      //    0-1-2
      } else {
         this.queue[0] = this.queue[1];
         this.queue[1] = this.queue[2];
         this.queue[2] = this.nullZero( tableRowIndex + 1);
      }
      
      if (this.direction) {
         this.average = this.directionAverage();
      } else {
         this.average = this.normalAverage();
      }
      
      return this.average;
   }
   
   
   function smoothTheData( smoothDirection=true) {
      // Each index is zero-based and refers to a column in m_editedDataTable.
      let odb_RA = new RunningAverage(2); 
      let odp_RA = new RunningAverage(3);
      let bp_RA = new RunningAverage(4);
      
      let dir_RA = new RunningAverage(7);
      
      for (var i = 0; i < m_editedDataTable.getNumberOfRows(); i++) {
         m_editedDataTable.setValue(i, 2, odb_RA.update( i));
         m_editedDataTable.setValue(i, 3, odp_RA.update( i));
         m_editedDataTable.setValue(i, 4, bp_RA.update( i));
         
         if (smoothDirection) m_editedDataTable.setValue(i, 7, dir_RA.update( i));
      }
   }

   function handleSmootherThenDraw() {
      let smoother_CB_state = document.getElementById( "chkSmoother").checked;
      
      // Smooth if checked. Run the smoother more on the ambient data.
      if (smoother_CB_state && ( ! m_alreadySmoothed)) {
         smoothTheData(true);
         smoothTheData(true);
         smoothTheData(false);
         m_alreadySmoothed = true;
      }
      
      setChartOptionsByDays( m_nDaysAtQuery);
      m_ticks = makeTicks();
      
      chartAmbientConditions( smoother_CB_state);
      chartWind( smoother_CB_state);
      //displayTables();
   }
   
   function stepByDays( direction) {
      let selectEndDate = document.getElementById("endDate");
      let stepIncrement = m_nDays;
      
      let initialIndex = selectEndDate.selectedIndex;
      
      if (direction == 'backward') {
         let targetIndex = initialIndex + (stepIncrement * 1.0);
         if (targetIndex > (selectEndDate.length - 1)) {
            selectEndDate.selectedIndex = selectEndDate.selectedIndex;
         } else {
            selectEndDate.selectedIndex = targetIndex;
         }
      } else if (direction == 'forward') {
         let targetIndex = initialIndex - (stepIncrement * 1.0);
         if (targetIndex < 0) {
            selectEndDate.selectedIndex = 0;
         } else {
            selectEndDate.selectedIndex = targetIndex;
         }      
      }
      if (selectEndDate.selectedIndex != initialIndex) queryGoogleSheet();
   }

   function addAnotationLines() {
      let annotationDate, dayOfWeek;
      //console.log("m_isToday=" + m_isToday);
      if ((m_selectDaysValueAtQuery == "24h") && (m_isToday)) {
         m_editedDataTable.addColumn({type: 'string', role: 'annotation', label: 'vertLines'});
         
         // row for start of prior day
         let previousDay = m_selectEndDate.options[ m_selectEndDate.selectedIndex + 1].text;
         //console.log('previousDay=' + previousDay);
         annotationDate = new Date( Date.parse( previousDay + " 00:00:00"));
         dayOfWeek = m_dayNamesLong[ annotationDate.getDay()];
         m_editedDataTable.addRows([[annotationDate,,,,,,,,dayOfWeek]]);
         
         // row for noon, prior day
         annotationDate = new Date( Date.parse( previousDay + " 12:00:00"));
         m_editedDataTable.addRows([[annotationDate,,,,,,,,'noon']]);
         
         // Row for midnight this day
         annotationDate = new Date( Date.parse( m_selectEndDate.value + " 00:00:00"));
         dayOfWeek = m_dayNamesLong[ annotationDate.getDay()];
         m_editedDataTable.addRows([[annotationDate,,,,,,,,dayOfWeek]]);
         
         // Row for noon this day
         annotationDate = new Date( Date.parse( m_selectEndDate.value + " 12:00:00"));
         m_editedDataTable.addRows([[annotationDate,,,,,,,,'noon']]);
         
         // Row for next-day midnight
         annotationDate = new Date( Date.parse( m_selectEndDate.value + " 24:00:00"));
         dayOfWeek = m_dayNamesLong[ annotationDate.getDay()];
         m_editedDataTable.addRows([[annotationDate,,,,,,,,dayOfWeek]]);
         
         m_annotated = true;
      }
   }

   function makeTicks() {
      let xTicks = [];  
      
      if (m_nDaysAtQuery == 1) {
         if ((m_selectDaysValueAtQuery == "24h") && (m_isToday)) {
            if (( ! m_annotated) && m_alreadySmoothed) addAnotationLines();
            
            /*
            // This is an initial attempt at making x-axis ticks for the 24h plot.
            // Decided annotation lines were enough.
            return [
                    {v:new Date('March/10/2023 9:00 PM'), f:'9pm'}, 
                    {v:new Date('March/11/2023 0:00 AM'), f:'Sat'}, 
                    {v:new Date('March/11/2023 3:00 AM'), f:'3am'}, 
                    {v:new Date('March/11/2023 6:00 AM'), f:'6am'}, 
                    {v:new Date('March/11/2023 9:00 AM'), f:'9am'},
                    {v:new Date('March/11/2023 12:00 PM'), f:'noon'},
            ];
            
            function findNearest3HourPoints(date) {
              const hours = date.getHours();
              const nearestBefore = new Date(date);
              nearestBefore.setHours(hours - hours % 3, 0, 0, 0);
              const nearestAfter = new Date(date);
              nearestAfter.setHours(hours + (3 - hours % 3), 0, 0, 0);
              return [nearestBefore, nearestAfter];
            }

            const epochDate = Date.now();
            const nowdate = new Date(epochDate);
            
            //let endDateWTZ = dateTimeWithTZ( m_stationName, date.toString().slice(0,24));
            
            nowdate.setHours( nowdate.getHours() + (+15));
            
            const [nearestBefore, nearestAfter] = findNearest3HourPoints( nowdate);

            console.log(`For current time ${nowdate}: ${nearestBefore.getHours()} and ${nearestAfter.getHours()}.`);
            
            
            console.log("nearest after = " + nearestAfter.toString().slice(0,24));
     
            
            
            let hourMap = {0:'12M',3:'3am',6:'6am',9:'9am',12:'12N',15:'3pm',18:'6pm',21:'9pm',24:'12M'};
            
            let tick_date = new Date( nearestAfter.getTime());  // new Date(date.getTime());
            
            console.log("tick_date="+tick_date.getHours());
            
            for (let i = 0; i <= 7; i++) {
               tick_date.setHours( tick_date.getHours() - 3);
               let tick_string = hourMap[ tick_date.getHours()];
               console.log( 'tick_date=' + tick_date);
               console.log( 'tick_string=' + tick_string + ',' + tick_date.getHours());
               
               xTicks.push({
                  v: new Date( tick_date),
                  f: tick_string
               });
               
            }
            */
            
            //console.log( JSON.stringify( xTicks));
            
            //return xTicks;
            return null;
            
         // normal 1-day plot
         } else {
            let tickName = ["12M","3am","6am","9am","12N","3pm","6pm","9pm","12M"];
            
            let end_epoch = Date.parse( m_endDateAtQuery + " 24:00"); // 23:59:59.999 24:00
            let start_epoch = end_epoch - (1 * 24*3600*1000);
            
            for (let i = 0; i <= 8; i++) {
               // 3 hour steps
               let date_epoch = start_epoch + (i * 3*3600*1000);
               let tick_date = new Date( date_epoch);
               let tick_string = tickName[i];
               xTicks.push({
                  v: tick_date,
                  f: tick_string
               });
            }
            return xTicks;
         }
         
      } else if (m_nDaysAtQuery > 1) {
         // Set X-Axis Labels
         //console.log("end=" + m_selectEndDate.value);
         let end_epoch = Date.parse( m_endDateAtQuery); // + " 23:59:59" m_selectEndDate.value
         
         //console.log("end_epoch="+end_epoch);
         
         let start_epoch = end_epoch - (m_nDaysAtQuery * 24*3600*1000);
         //console.log("start epoch=" + start_epoch);
         //console.log("start=" + new Date( start_epoch));
         //let epoch_msec = UTC_date.getTime();
         
         for (let i = 1; i <= (m_nDaysAtQuery + 1); i++) {
            let date_epoch = start_epoch + (i * 24*3600*1000);
            let tick_date = new Date( date_epoch); // .toDateString()
            //console.log(tick_date.toDateString());
            
            // To avoid issues surrounding the transition in and out of DLS, use a midday epoch to establish the tick label.
            let midday_epoch = date_epoch + 12*3600*1000;
            let midday_date = new Date( midday_epoch);
            let tick_string = m_dayNames[ midday_date.getDay()] + " " + midday_date.getDate().toString();
            xTicks.push({
               v: tick_date,
               f: tick_string
            });
            
            // Add 6am to 6pm ticks for the 2-day plot.
            if ((m_nDaysAtQuery == 2) && (i <= m_nDaysAtQuery)) {
               let t06AM_date = new Date( date_epoch +  6*3600*1000);
               let t08AM_date = new Date( date_epoch +  8*3600*1000);
               let t10AM_date = new Date( date_epoch + 10*3600*1000);
               let t02PM_date = new Date( date_epoch + 14*3600*1000);
               let t04PM_date = new Date( date_epoch + 16*3600*1000);
               let t06PM_date = new Date( date_epoch + 18*3600*1000);
               
               xTicks.push(
                  {v: t06AM_date,  f: "6a"},
                  {v: t08AM_date,  f: "8"},
                  {v: t10AM_date,  f: "10"},
                  {v: midday_date, f: "N"},
                  {v: t02PM_date,  f: "2"},
                  {v: t04PM_date,  f: "4"},
                  {v: t06PM_date,  f: "6p"},
               );
            }
         }
         return xTicks;
      } 
   }

   function chartAmbientConditions( smoothed=true) {
      // Don't chart dewpoint and/or pressure sensors that have all null values.      
      let viewArray = [];
      let dataTable = (smoothed) ? m_editedDataTable : m_dataTable;
      let dataView = new google.visualization.DataView( dataTable);
         
      if (( ! m_db_allNull) && m_dp_allNull && ( ! m_bp_allNull)) {
         viewArray = (smoothed) ? [0,2,  4] : [0,1,  6]; // time, drybulb, ________, bp
      } else if (( ! m_db_allNull) && ( ! m_dp_allNull) && m_bp_allNull) {
         viewArray = (smoothed) ? [0,2,3  ] : [0,1,2  ]; // time, drybulb, dewpoint, __
      } else if (( ! m_db_allNull) && m_dp_allNull && m_bp_allNull) {
         viewArray = (smoothed) ? [0,2    ] : [0,1    ]; // time, drybulb, ________, __
      } else if (m_db_allNull && m_dp_allNull && ( ! m_bp_allNull)) {
         viewArray = (smoothed) ? [0,    4] : [0,    6]; // time, _______, ________, bp              
      } else {
         viewArray = (smoothed) ? [0,2,3,4] : [0,1,2,6]; // time, drybulb, dewpoint, bp
      }
            
      let viewArrayPlus = [];
      let annotation = {sourceColumn: 8, type: 'string', role: 'annotation'};
      for (let i = 0; i < viewArray.length; i++) {
         viewArrayPlus.push( viewArray[i]);
         if ((i == 0) && smoothed && m_annotated) viewArrayPlus.push( annotation);
      }
      dataView.setColumns( viewArrayPlus);
      
      // Establish dst for the x-axis label. Use end-date in the query AND zone info for the station.
      let dst = (dayLightSavingsTime( new Date( m_endDateAtQuery + " 12:00:00")) && m_station_map[ m_stationName].dst);
      let dst_string = (dst) ? "DT":"ST";
      let tz_string = m_station_map[ m_stationName].tz + dst_string;
      let haxis_title = 'Time and Date (' + tz_string + ')';
      
      let drybulb_line  = { lineWidth: 2, color: 'red',  targetAxisIndex: 0};
      let dewpoint_line = { lineWidth: 2, color: 'green', targetAxisIndex: 0};
      let pressure_line = { pointShape: 'circle',  lineWidth: 1, pointSize: 0, color: 'gray', targetAxisIndex: 1};
      
      let stationName = m_dataTable.getValue(0,7);
      let longName_clean = m_station_map[ stationName].longName.split("(")[0];
      let titleString = "" + longName_clean; // + " (" + stationName + ")";
      // Show the horizontal pressure lines if pressure is the only trace. Otherwise, hide them (transparent). 
      let pressureColorMode = (m_db_allNull && m_dp_allNull && ( ! m_bp_allNull)) ? 'lightgray' : 'transparent';
      let options = {
         title: titleString,
         chartArea: m_chartArea,
         'width': m_width_px,
         'height':475,
         legend: {
            position: m_legendPosition, // in out
            alignment: 'start',
            maxLines: 1,
         },
         titleTextStyle: {
            fontName: 'Helvetica, Arial, sans-serif',
            color: 'black',
            fontSize: 20,
            bold: false
         },         
         hAxis: {title: haxis_title, 
            titleTextStyle: {color: 'black', fontSize: 16, italic: false},
            textStyle: {fontSize: 13},
            format: m_hAxis_format,
            gridlines: {count: m_hAxis_gridLineCount},
            ticks: m_ticks,
            //minorTicks: 5,
         },
         series: {
            0: drybulb_line,
            1: dewpoint_line,
            2: pressure_line,
         },
         vAxes: {
            0: {title: 'Temperature (F)', 
               textStyle: {fontSize: 12}, 
               titleTextStyle: {fontSize: 16, italic: false},
               //gridlines: {color: 'gray'},
               //minValue:30, maxValue:50,
               ticks: m_temperatureTicks,
            },
            1: {title: 'Pressure (Inches Hg)', 
               textStyle: {fontSize: 12}, 
               titleTextStyle: {fontSize: 16, italic: false}, 
               gridlines: {color: pressureColorMode}, // hide (transparent) if db and dp plotted 
               //minValue:29.6, maxValue:30.2, //minValue:29.9, maxValue:29.9,
               ticks: m_pressureTicks,
            }, 
         },
         annotations: {
            stem: {
               color: 'gray'
            },
            style: 'line'
         }, 
      }
      
      if (( ! m_db_allNull) && m_dp_allNull && ( ! m_bp_allNull)) {
         options.series[1] = pressure_line;
         options.series[2] = null;
      } else if (m_bp_allNull) {
         options.series[1] = dewpoint_line;
         options.series[2] = null;
      } else if (m_db_allNull && m_dp_allNull) {
         options.series[0] = pressure_line;
         options.series[1] = null;
         options.series[2] = null;
      } else if (m_dp_allNull && m_bp_allNull) {
         options.series[1] = null;
         options.series[2] = null;
      } else {
         // no changes to the options
      }    
      
      if ( ! m_temperatureChart) { 
         m_temperatureChart = new google.visualization.LineChart( document.getElementById( "chartDivA"));
         
         google.visualization.events.addListener(m_temperatureChart, 'ready', readyHandler);
         function readyHandler() {
            changeUpdateButton("update");
            m_readyForNewQuery = true;
            let stationCheck = (m_dataTable.getValue(0,7) != m_stationName);
            let endDateCheck = (m_selectEndDate.value != m_endDateAtQuery);
            let nDaysCheck = (m_selectDaysValueAtQuery != m_selectDays.value);
            if ((stationCheck || endDateCheck || nDaysCheck) && (m_retry_count <= 3)) {
               queryGoogleSheet();
               console.log("retry count = " + m_retry_count);
               m_retry_count++;
            } else {
               m_retry_count = 0;
            }
            m_problemWithURLSearch = false;
         }
         
         google.visualization.events.addListener(m_temperatureChart, 'error', errorHandler);
         function errorHandler() {
            //console.log("from errorHandler");
            if (m_temperatureChart) m_temperatureChart.clearChart();
            document.getElementById("statusSpan").textContent="Temperature chart for this station has an error. Please try again.";
            changeUpdateButton("update");
            m_readyForNewQuery = true;
         }
      }
      m_temperatureChart.draw( dataView, options);
   }
   
   function chartWind( smoothed=true) {
      // Note that the gust data is put first in these dataviews. That way the regular wind speed,
      // paints over the thinner gust line during periods where they are equal.
      if (smoothed) {
         var dataView = new google.visualization.DataView( m_editedDataTable);
         dataView.setColumns([0,6,5,7]);
         
      } else {
         var dataView = new google.visualization.DataView( m_dataTable);
         dataView.setColumns([0,4,3,5]);
      }
      
      let dateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      let dateString = m_endDateFromResponse.toLocaleDateString( undefined, dateFormat);      
      
      let timeString;
      if ((m_selectDaysValueAtQuery == "24h") && (m_isToday)) {
         timeString = ", latest: " + new Date( m_endDateFromResponse).toString().split(" ")[4]; // .slice(0,5)
         //console.log('m_epochMax='+m_epochMax);
         //console.log('Date.now()='+Date.now());
         let deltaTime_m = ((Date.now() - m_epochMax) / (60*1000)); // .toFixed(1)
         let deltaMin = Math.floor( deltaTime_m);
         let deltaSec = (60*(deltaTime_m - deltaMin)).toFixed(0);
         //let okForDelay = ((m_selectDaysValueAtQuery == "24h") && (m_isToday));
         let delayString =  " (-" + String( deltaMin).padStart(2,"0") + ":" + String( deltaSec).padStart(2,"0") + ")";
         timeString += delayString;
      } else {
         timeString = "";
      }
      
      let explainString = (m_nDaysAtQuery > 1) ? m_nDaysAtQuery + " days ending " : "";
      let titleString = explainString + dateString + "" + timeString;
      
      let options = {
         title: titleString,
         chartArea: m_chartArea,
         'width': m_width_px,
         'height':475,
         legend: {
            position: m_legendPosition, // in out
            alignment: 'start'
         },
         titleTextStyle: {
            fontName: 'Helvetica, Arial, sans-serif',
            color: 'black',
            fontSize: 20,
            bold: false
         },      
         hAxis: {title: null, // 'Time and Date (CDT)'
            titleTextStyle: {fontSize: 15, italic: false},
            textStyle: {fontSize: 13},
            textPosition: 'out',   // 'in' 'out' 'none'
            format: m_hAxis_format,
            gridlines: {count: m_hAxis_gridLineCount},
            ticks: m_ticks
         },
         series: {
            0: { lineWidth: 1, color: 'red',  targetAxisIndex: 0},  // gust
            1: { lineWidth: 2, color: 'black', targetAxisIndex: 0}, // speed
            2: { pointShape: 'triangle',  lineWidth: 0, pointSize: 4,  color: 'gray', targetAxisIndex: 1}, // direction
         },
         vAxes: {
            0: {title: 'Wind Speed (mph)', 
               textStyle: {fontSize: 12}, 
               titleTextStyle: {fontSize: 16, italic: false}, 
               minValue:0 , maxValue:40,
               minorGridlines: {count:0},
            },
            1: {title: 'Direction (degrees)', 
               textStyle: {fontSize: 12}, 
               titleTextStyle: {fontSize: 16, italic: false}, 
               gridlines: {color: 'transparent'}, // gridlines: {color: 'transparent'},
               minValue:0 , maxValue:360,
               ticks: [{v:  0, f:"N 0"}, //
                       {v: 45, f:"NE"},  // (45)
                       {v: 90, f:"E 90"},  // (90)
                       {v:135, f:"SE"}, // (135)
                       {v:180, f:"S 180"},  //
                       {v:225, f:"SW"}, // (225)
                       {v:270, f:"W 270"},  // (270)
                       {v:315, f:"NW"}, // (315)
                       {v:360, f:"N 360"}]  //
            }
         },
      }
      
      if ( ! m_windChart) m_windChart = new google.visualization.LineChart( document.getElementById( "chartDivB"));
      m_windChart.draw( dataView, options);
   }
   
   function displayTables() {
      /*
      Note that I sometimes comment out the DIVs, the "containers" for these tables. 
      So, might have to uncomment them (on the weather.html) page before running this.
      */
      if ( ! m_rawVisTable) m_rawVisTable = new google.visualization.Table( document.getElementById('tableDiv'));
      m_rawVisTable.draw( m_dataTable, null);
      
      if ( ! m_smoothedVisTable) m_smoothedVisTable = new google.visualization.Table( document.getElementById('editedTableDiv'));
      m_smoothedVisTable.draw( m_editedDataTable, null);
   }
   
   return {
      // Objects
      
      // Variables

      // Methods
      stepByDays: stepByDays,
      init: initializeModule,
      queryGoogleSheet: queryGoogleSheet,
      handleSmootherThenDraw: handleSmootherThenDraw

   };

})();