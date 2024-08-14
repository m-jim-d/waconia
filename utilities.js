/*
Copyright 2022 James D. Miller

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

// Utilities (uT) module
// utilities.js 
   console.log('uT _*-*_');
// 11:25 AM Sat December 9, 2023

/*
gwModule.js has an alphabetical list of all modules and their nicknames as added to the windows namespace.
*/

window.uT = (function() {
   "use strict";
   
   // Returns the default if the value is undefined.
   function setDefault( theValue, theDefault) {
      return (typeof theValue !== "undefined") ? theValue : theDefault;
   }
   
   function setDefaultVector( theValue, theDefault, mode="noCopy") {
      let theResult = null;
      if (typeof theValue !== "undefined") {
         if ((theValue.constructor.name == "Vec2D") && (mode == "copy"))  {
            theResult = theValue.copy();
         } else {
            gW.messages['help'].newMessage('Warning: failed attempt to copy a vector.', 2.0);
            theResult = theValue;
         }
      } else {  
         theResult = theDefault;
      }
      return theResult;
   }
   
   function isPrimitive( val) {
      if (val === Object(val)) {
         return false;
      } else {
         return true;
      }
   }   
   
   function fixed( numberValue, nDigits, padding=(nDigits+5) ) {
      let absValue = Math.abs( numberValue);
      
      let paddedStringValue;
      
      // scientific notation
      if (absValue > 999.9) {
         paddedStringValue = numberValue.toExponential(1).padStart( padding, " ");
         
      } else {
         let stringValue = absValue.toFixed( nDigits);
         let signChar;
         let small = 1/Math.pow(10,nDigits+1);
         if (numberValue < (-small)) {
            signChar = "-"; //String.fromCharCode(8722);
         } else if (numberValue > (+small)) {
            signChar = "+";
         } else {
            signChar = " ";
         }
         stringValue = signChar + stringValue;
         paddedStringValue = stringValue.padStart( padding, ' ');
      }
      
      return paddedStringValue;
   }
   
   function oneOfThese( demoList, captureName) {
      // "demoList" is an array of substrings, usually a list of demos.
      // "captureName" is a demo name or corresponding capture name with an extension in the name.
      // The map array method applies the includes string method to see if any of the strings in the array is a 
      // substring of the capture name. Map returns an array (of boolean results) which is then
      // checked for any True values.
      // This can be used to check if a capture name has a match against a list of demos.
      return demoList.map( (nameInList) => captureName.includes( nameInList) ).includes(true);
   }
   
   function oneOfTheseV2( listOfSubstrings, theString) {
      // This is similar to oneOfThese, except, uses a for loop and startsWith.
      let oneInThere = false;
      for (let substring of listOfSubstrings) {
         if (theString.startsWith( substring)) oneInThere = true;
      }
      return oneInThere;
   }
   
   function allOfThese( listOfSubstrings, theString) {
      let allInThere = true;
      for (let substring of listOfSubstrings) {
         if ( ! theString.includes( substring)) allInThere = false;
      }
      return allInThere;
   }
   
   function toggleElementDisplay( id, displayStyle) {
      var e = document.getElementById( id);
      // Use ternary operator (?):   condition ? expr1 : expr2
      // If the current style isn't equal to the incoming displayStyle, set it to be displayStyle. 
      // If it is equal, set it to 'none'. When the value is 'none', the element is hidden.
      // The effect of this function is that repeated calls to it, with the same displayStyle value, will
      // toggle the style between 'none' and the specified style value.
      e.style.display = (e.style.display != displayStyle) ? displayStyle : 'none';
   }
   function setElementDisplay( id, displayStyle) {
      var e = document.getElementById( id);
      e.style.display = displayStyle;
   }
   function toggleSpanValue( id, value1, value2) {
      var e = document.getElementById( id);
      e.innerText = (e.innerText == value1) ? value2 : value1; 
   }
   function getSpanValue( id) {  
      var e = document.getElementById( id);
      return e.innerText;
   }
   
   function RunningAverage( n_target) {
      this.n_target = n_target;
      this.reset();
   }
   RunningAverage.prototype.reset = function() {
      this.n_in_avg = 0;
      this.result = 0.0;
      this.values = [];
      this.total = 0.0;
      this.totalSinceReport = 0.0;
   }
   RunningAverage.prototype.update = function( new_value) {
      // Only process good stuff.
      if (new_value && isFinite( new_value)) {
         if (this.n_in_avg < this.n_target) {
            this.total += new_value;
            this.n_in_avg += 1;
         } else {
            // Add the new value and subtract the oldest.
            this.total += new_value - this.values[0];
            // Discard the oldest value.
            this.values.shift();
         }   
         this.values.push( new_value);

         this.totalSinceReport += new_value;
         
         this.result = this.total / this.n_in_avg;
         return this.result;
         
      } else {
         return new_value;
      }
   }
   
   
   
   function HSLColor( pars = {}) {
      this.hue = setDefault( pars.hue, 180); // 0 to 360
      this.saturation = setDefault( pars.saturation, 50); // 0 to 100 (%)
      this.lightness = setDefault( pars.lightness, 50); // 0 to 100 (%)
      this.stepDirection = 1; // or -1
      this.stepSize = setDefault( pars.stepSize, 2);
      this.steppingKey = setDefault( pars.steppingKey, 'lightness');
      this.stepping = setDefault( pars.stepping, true);
   }
   HSLColor.prototype.parse = function( hslString) {
      // example hsl string:  'hsl(162, 11%, 81%)'
      let regexp = /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/g;
      let result = regexp.exec( hslString).slice(1);
      this.hue =        Number( result[0]);
      this.saturation = Number( result[1].slice(0,-1)); // remove the % sign at the end.
      this.lightness =  Number( result[2].slice(0,-1)); // and here too...
   }
   HSLColor.prototype.step = function() {
      if (this.stepping) {
         if (this.steppingKey == 'hue') {
            if ((this.hue < 0) || (this.hue > 360)) this.stepDirection *= -1;
            this.hue += this.stepSize * this.stepDirection;
            
         } else if (this.steppingKey == 'saturation') {
            if ((this.saturation < 0) || (this.saturation > 100)) this.stepDirection *= -1;
            this.saturation += this.stepSize * this.stepDirection;
            
         } else if (this.steppingKey == 'lightness') {
            if ((this.lightness < 0) || (this.lightness > 100)) this.stepDirection *= -1;
            this.lightness += this.stepSize * this.stepDirection;
         }
      }
   }
   HSLColor.prototype.colorString = function() {
      let hslString = "hsl(" + this.hue + ", " + this.saturation + "%, " + this.lightness + "%)";
      return String( hslString);
   }
   
   
   
   function HelpMessage( pars) {
      this.message = setDefault( pars.message, "");
      this.timeLimit_s = setDefault( pars.timeLimit_s, 2.0);
      
      this.font = setDefault( pars.font, "20px Arial");
      this.lineHeight_px = parseInt(this.font.substring(0,3)) * 1.20;

      this.color = setDefault( pars.color, 'yellow');
      this.loc_px = setDefault( pars.loc_px, {x:30, y:40});
      
      this.messageSeries = null;
      this.index = 0;
      
      this.timeType = setDefault( pars.timeType, 'system'); //'game'
      
      this.birthTime = window.performance.now();
      this.time_s = 0.0;
      
      this.popAtEnd = setDefault( pars.popAtEnd, false);
   }
   HelpMessage.prototype.setFont = function( fontString) {
      this.font = fontString;
      this.lineHeight_px = parseInt(this.font.substring(0,3)) * 1.20;
   }
   HelpMessage.prototype.resetMessage = function() {
      this.message = "";
      this.messageSeries = null;
   }
   HelpMessage.prototype.newMessage = function( message, timeLimit_s) {
      this.time_s = 0.0;
      this.birthTime = window.performance.now();
      this.timeLimit_s = setDefault( timeLimit_s, this.timeLimit_s)
      this.message = message;
   }
   HelpMessage.prototype.newMessageSeries = function( message) {
      this.messageSeries = message;
      // Initialize the first message.
      this.time_s = 0.0;
      this.birthTime = window.performance.now();
      this.index = 1;
      this.message = this.messageSeries[this.index].message;
      this.timeLimit_s = this.messageSeries[this.index].tL_s;
   }
   HelpMessage.prototype.getDurationOfSeries_s = function() {
      let seriesTimeTotal_s = 0;
      for (let index in this.messageSeries) {
         let messageObj = this.messageSeries[ index];
         seriesTimeTotal_s += messageObj.tL_s;
      }
      return seriesTimeTotal_s;
   }
   HelpMessage.prototype.addToIt = function( moreText, pars = {}) {
      this.timeLimit_s += setDefault( pars.additionalTime_s, 0);
      this.message += moreText;
   }
   HelpMessage.prototype.yMax_px = function() {
      var nLines = this.message.split("\\").length;
      var yMax_px = this.loc_px.y + (nLines * this.lineHeight_px);
      return yMax_px;
   }
   HelpMessage.prototype.displayIt = function( deltaT_s, drawingContext) {
      if (this.timeType == 'system') {
         this.time_s = (window.performance.now() - this.birthTime)/1000.0;
      } else {
         this.time_s += deltaT_s;
      }
      
      if ((this.message != "") && (this.time_s < this.timeLimit_s)) {         
         // Split each message into multiple lines.
         // Then, split each line on the formatting [code] pattern.
         // e.g. this message has two lines. \\In this second line, the word [25px Arial,red]special[base] is highlighted by larger font and red color.
         // e.g. the word [base,pink]special[base]  has no font size change and a  color change...
         // e.g. the word [30px Arial]special[base] has a  font size change and no color change...
         // e.g. these [20px Arial]words [25px Arial]have [30px Arial]larger fonts [base]and then go back to normal... 
         var lines = this.message.split("\\");
         // regular expression for finding a formatting code surrounded by brackets
         var formatPattern = /(\[.*?\])/;  
         for (var line_index in lines) {
            var formatZones = lines[ line_index].split( formatPattern);
            var x_px = this.loc_px.x;
            var zoneFont = this.font;
            var zoneColor = this.color;
            for (var zone_index in formatZones) {
               // Check each zone for the [code] pattern and determine the code without the surrounding brackets.               
               var formatCodeMatch = formatZones[ zone_index].match( formatPattern);
               if (formatCodeMatch) {
                  var formatCode = formatCodeMatch[0].slice(1,-1); // strip off the brackets
                  if (formatCode == "base") {
                     zoneFont = this.font;
                     zoneColor = this.color;
                  } else {
                     // check if color is specified
                     var formatParts = formatCode.split(",");
                     if (formatParts.length == 2) {
                        var zoneFont =  (formatParts[0] == "base") ? this.font  : formatParts[0];
                        var zoneColor = (formatParts[1] == "base") ? this.color : formatParts[1];
                     } else {
                        var zoneFont = formatCode;
                        var zoneColor = this.color;
                     }
                  }
               } else {
                  drawingContext.font = zoneFont;
                  drawingContext.fillStyle = zoneColor;
                  var y_px = this.loc_px.y + (line_index * this.lineHeight_px);
                  
                  drawingContext.textAlign = "left";
                  drawingContext.fillText( formatZones[ zone_index], x_px, y_px);
                  
                  // Move the position pointer to the right after rendering the zone string.
                  x_px += drawingContext.measureText( formatZones[ zone_index]).width;
               } 
            }
         }
         
      } else {
         // Before ending the message, make an optional pop sound.
         if (this.popAtEnd && (this.message != "")) gW.sounds['lowPop'].play();
         
         this.message = "";
         this.time_s = 0;
         
         // If it's a series, check to see if there's another message...
         if (this.messageSeries) {
            this.index += 1;
            if (this.messageSeries[this.index]) {
               // Update the characteristics of the text if changes have been supplied in the series.
               if (this.messageSeries[this.index].loc_px) this.loc_px = this.messageSeries[this.index].loc_px;
               if (this.messageSeries[this.index].font) this.font = this.messageSeries[this.index].font;
               this.popAtEnd = setDefault( this.messageSeries[this.index].popAtEnd, false);
               
               this.message = this.messageSeries[this.index].message;
               this.timeLimit_s = this.messageSeries[this.index].tL_s;
               this.time_s = 0;
               this.birthTime = window.performance.now();
            }
         }
      }
   }
   
   
   
   function SoundEffect( filePath, nCopies, volumeBase = 1.00) {      
      // The copies allow the same sound to be called repeatedly and thereby played in overlapping sequences. 
      // This is useful for the clack sound in the calculating pi demos.
      this.copies = [];
      this.nCopies = nCopies;
      this.index = 0;
      this.volumeBase = volumeBase;

      for (var i = 0; i < nCopies; i++) {
         this.copies.push(new Audio( filePath));
      }      
   }
   SoundEffect.prototype.play = function( volumeChangeFraction = 1.00) {
      let oneSound = this.copies[this.index];
      
      oneSound.volume = this.volumeBase * volumeChangeFraction;
      if (oneSound.volume < 0) oneSound.volume = 0;
      if (oneSound.volume > 1) oneSound.volume = 1;
      
      // A demo the plays directly from a URL, will not play sound until the user clicks somewhere.
      // So the error message is translated to the following advice.
      var playPromise = oneSound.play();
      playPromise.then( function() {
      }).catch( function(error) {
         console.log(error.name + ': ' + error.message);
         if (error.name == 'NotAllowedError') {
            gW.messages['help2'].newMessage('Sound effects are disabled until you type or click.\\  Go ahead; interact.', 2.0);
         }
      });
      
      if (this.index < this.nCopies - 1) {
         this.index++;
      } else {
         this.index = 0;
      }  
   }
  
   /* 
   Iterative functions for finding roots...
   The following serve to guess the value which return 0 from the supplied function. 
   */
   function betterGuess( theFunc, guess) {
      // Use Newtons method to estimate a better guess.
      // Find the slope of the Error function at the guess point and use that slope to calculate a new guess.
      
      let slope, currentError, betterGuess;
      
      currentError = theFunc( guess);
      slope = (currentError - theFunc( guess + 0.00005)) / 0.00005;
      
      if (slope == 0) {
         betterGuess = "bad";
      } else {
         // To lose y amount of rise must move delta_x = y/slope from current position.
         betterGuess = guess + (currentError / slope);
      }
      return betterGuess;
   }
   function keepGuessing( theFunction, initialGuess) {
      let previousEstimate, estimate;

      previousEstimate = initialGuess;

      // Repeat until error on estimate less than criteria.
      for (let i = 0; i < 20; i++) { 
         estimate = betterGuess( theFunction, previousEstimate);
         if (estimate == "bad") {
            console.log("bad from betterGuess");
            return initialGuess;
         } else {
            if (Math.abs( theFunction( estimate)) < 0.01) {
               //console.log("solved in " + i + ", x=" + estimate + ", rootError=" + theFunction( estimate));
               console.log("solved in " + i);
               return estimate;
            }
         }
         previousEstimate = estimate;
      }  
      console.log("out of guesses");
      return initialGuess;
   }
  
   // Public references to objects, variables, and methods
   
   return {
      // Objects
      'RunningAverage': RunningAverage,
      'HelpMessage': HelpMessage,
      'HSLColor': HSLColor,
      'SoundEffect': SoundEffect,
      
      // Variables
      
      // Methods
      'setDefault': setDefault,
      'setDefaultVector': setDefaultVector,
      'isPrimitive': isPrimitive,
      'oneOfThese': oneOfThese,
      'oneOfTheseV2': oneOfTheseV2,
      'allOfThese': allOfThese,
      'fixed': fixed,
      'toggleElementDisplay': toggleElementDisplay,
      'setElementDisplay': setElementDisplay,
      'toggleSpanValue': toggleSpanValue,
      'getSpanValue': getSpanValue,
      'keepGuessing': keepGuessing,
      
   };   
   
})();