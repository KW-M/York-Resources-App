  var devMode = false;
  var theQueue = [];
  var timer = null;

  function log(input, logWithoutDevMode) {
    if (devMode === true) {
      console.log(input)
    }
    else if (logWithoutDevMode === true) {
      console.log(input)
    }
    else {
      //tough luck
    }

  }

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };
  
  function chooseRandom (inputArray) {
    var number = (Math.floor(Math.random() * (inputArray.length - 0)));
    return inputArray[number]
  }

  // Take a promise.  Queue 'action'.  On 'action' faulure, run 'error' and continue.
  function queue(promise, action, error) {
    theQueue.push({
      Promise: promise,
      Action: action,
      Err: error
    });
    if (!timer) {
      processTheQueue(); // start immediately on the first invocation
      timer = setInterval(processTheQueue, 150);
    }
  };

  function processTheQueue() {
    var item = theQueue.shift();
    if (item) {
      var delay = 0;
      runPromise();

      function runPromise() {
        var thePromise = item.Promise;
        // console.log({
        //   'Exicuting Promise': thePromise.hg.hg
        // })
        thePromise.then(item.Action, function(error) {
          if (item.Err) {
            console.log({
              'Error': error
            })
            item.Err(error);
          }
          else {
            console.log({
              'Error': error,
              'BackOffCount': delay
            })
            if (delay < 8) {
              setTimeout(function() {
                runPromise();
              }, (delay = Math.max(delay *= 2, 1)) * 1000);
            }
            else {
              item.Err(error) || "";
            }
          }
        });
      }
    }
    if (theQueue.length === 0) {
      clearInterval(timer), timer = null;

    }
  }
  
  function decriptURL (Input) {
      return decodeURIComponent(Array.prototype.map.call(atob(Input.reverse), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  }

  function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // function RateLimit(fn, delay, context) {
  //   var queue = [],
  //     timer = null;

  //   function processQueue() {
  //     var item = queue.shift();
  //     if (item)
  //       fn.apply(item.context, item.arguments);
  //     if (queue.length === 0)
  //       clearInterval(timer), timer = null;
  //   }

  //   return function limited() {
  //     queue.push({
  //       context: context || this,
  //       arguments: [].slice.call(arguments)
  //     });
  //     if (!timer) {
  //       processQueue(); // start immediately on the first invocation
  //       timer = setInterval(processQueue, delay);
  //     }
  //   }
  // }



  /*
   * rfc3339date.js version 0.1.3
   *
   * Adds ISO 8601 / RFC 3339 date parsing to the Javascript Date object.
   * Copyright (c) 2010 Paul GALLAGHER http://tardate.com
   * Licensed under the MIT license:
   * http://www.opensource.org/licenses/mit-license.php
   * Usage:
   *   var d = Date.parseISO8601( "2010-07-20T15:00:00Z" );
   *   var d = Date.parse( "2010-07-20T15:00:00Z" );
   *   var d = new Date().toRFC3339LocaleString();  =>  "2010-07-25T19:51:31.427+08:00"
   */

  Number.prototype.toPaddedString = function(len, fillchar) {
    var result = this.toString();
    if (typeof(fillchar) == 'undefined') {
      fillchar = '0'
    };
    while (result.length < len) {
      result = fillchar + result;
    };
    return result;
  }

  Date.prototype.toRFC3339UTCString = function(supressFormating, supressMillis) {
    var dSep = (supressFormating ? '' : '-');
    var tSep = (supressFormating ? '' : ':');
    var result = this.getUTCFullYear().toString();
    result += dSep + (this.getUTCMonth() + 1).toPaddedString(2);
    result += dSep + this.getUTCDate().toPaddedString(2);
    result += 'T' + this.getUTCHours().toPaddedString(2);
    result += tSep + this.getUTCMinutes().toPaddedString(2);
    result += tSep + this.getUTCSeconds().toPaddedString(2);
    if ((!supressMillis) && (this.getUTCMilliseconds() > 0)) result += '.' + this.getUTCMilliseconds().toPaddedString(3);
    return result + 'Z';
  }

  Date.prototype.toRFC3339LocaleString = function(supressFormating, supressMillis) {
    var dSep = (supressFormating ? '' : '-');
    var tSep = (supressFormating ? '' : ':');
    var result = this.getFullYear().toString();
    result += dSep + (this.getMonth() + 1).toPaddedString(2);
    result += dSep + this.getDate().toPaddedString(2);
    result += 'T' + this.getHours().toPaddedString(2);
    result += tSep + this.getMinutes().toPaddedString(2);
    result += tSep + this.getSeconds().toPaddedString(2);
    if ((!supressMillis) && (this.getMilliseconds() > 0)) result += '.' + this.getMilliseconds().toPaddedString(3);
    var tzOffset = -this.getTimezoneOffset();
    result += (tzOffset < 0 ? '-' : '+')
    result += (tzOffset / 60).toPaddedString(2);
    result += tSep + (tzOffset % 60).toPaddedString(2);
    return result;
  }

  Date.parseRFC3339 = function(dString) {
    if (typeof dString != 'string') return;
    var result;
    var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)?(:)?(\d\d)?([\.,]\d+)?($|Z|([+-])(\d\d)(:)?(\d\d)?)/i;
    var d = dString.match(new RegExp(regexp));
    if (d) {
      var year = parseInt(d[1], 10);
      var mon = parseInt(d[3], 10) - 1;
      var day = parseInt(d[5], 10);
      var hour = parseInt(d[7], 10);
      var mins = (d[9] ? parseInt(d[9], 10) : 0);
      var secs = (d[11] ? parseInt(d[11], 10) : 0);
      var millis = (d[12] ? parseFloat(String(1.5).charAt(1) + d[12].slice(1)) * 1000 : 0);
      if (d[13]) {
        result = new Date(0);
        result.setUTCFullYear(year);
        result.setUTCMonth(mon);
        result.setUTCDate(day);
        result.setUTCHours(hour);
        result.setUTCMinutes(mins);
        result.setUTCSeconds(secs);
        result.setUTCMilliseconds(millis);
        if (d[13] && d[14]) {
          var offset = (d[15] * 60)
          if (d[17]) offset += parseInt(d[17], 10);
          offset *= ((d[14] == '-') ? -1 : 1);
          result.setTime(result.getTime() - offset * 60 * 1000);
        }
      }
      else {
        result = new Date(year, mon, day, hour, mins, secs, millis);
      }
    }
    return result;
  };

  if (typeof Date.parse != 'function') {
    Date.parse = Date.parseRFC3339;
  }
  else {
    var oldparse = Date.parse;
    Date.parse = function(d) {
      var result = Date.parseRFC3339(d);
      if (!result && oldparse) {
        result = oldparse(d);
      }
      return result;
    }
  }