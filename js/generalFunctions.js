  var theQueue = [];
  var timer = null;

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
      var runPromise = function() {
        var thePromise = item.Promise;
        thePromise.then(item.Action).catch(function(error) {
          console.log({Error: error, backoffCount: delay})
          if (delay < 8) {
            setTimeout(function() {
              runPromise();
            }, (delay = Math.max(delay *= 2, 1)) * 1000);
          }
          else {
            item.Err(error);
          }
        });
      }
    }
    if (theQueue.length === 0) {
      clearInterval(timer), timer = null;

    }
  }

  function formatArrayResponse(rawArrayResponse, idArray) {
    var arrayOfPosts = [];
    for (var i = 0; i < rawArrayResponse.length; i++) {
      if (idArray != null) {
        rawArrayResponse[i].result.ID = idArray[i];
      }
      arrayOfPosts.push(rawArrayResponse[i].result);
    }
    return (arrayOfPosts);
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
   * Copyright (c) 2010 Paul GALLAGHER http://tardate.com
   * Licensed under the MIT license:
   * http://www.opensource.org/licenses/mit-license.php
   */

  /*
   * Date.parseRFC3339
   * extend Date with a method parsing ISO8601 / RFC 3339 date strings.
   * Usage: var d = Date.parseRFC3339( "2010-07-20T15:00:00Z" );
   */

  Date.prototype.parseRFC3339 = function(dString) {
    var utcOffset, offsetSplitChar;
    var offsetMultiplier = 1;
    var dateTime = dString.split("T");
    var date = dateTime[0].split("-");
    var time = dateTime[1].split(":");
    var offsetField = time[time.length - 1];
    var offsetString;
    offsetFieldIdentifier = offsetField.charAt(offsetField.length - 1);
    if (offsetFieldIdentifier == "Z") {
      utcOffset = 0;
      time[time.length - 1] = offsetField.substr(0, offsetField.length - 2);
    }
    else {
      if (offsetField[offsetField.length - 1].indexOf("+") != -1) {
        offsetSplitChar = "+";
        offsetMultiplier = 1;
      }
      else {
        offsetSplitChar = "-";
        offsetMultiplier = -1;
      }
      offsetString = offsetField.split(offsetSplitChar);
      time[time.length - 1] == offsetString[0];
      offsetString = offsetString[1].split(":");
      utcOffset = (offsetString[0] * 60) + offsetString[1];
      utcOffset = utcOffset * 60 * 1000;
    }
    this.setTime(Date.UTC(date[0], date[1] - 1, date[2], time[0], time[1], time[2]) + (utcOffset * offsetMultiplier));
    return this;

  };

  /*
   * Number.prototype.toPaddedString
   * Number instance method used to left-pad numbers to the specified length
   * Used by the Date.prototype.toRFC3339XXX methods
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

  /*
   * Date.prototype.toRFC3339UTCString
   * Date instance method to format the date as ISO8601 / RFC 3339 string (in UTC format).
   * Usage: var d = new Date().toRFC3339UTCString();   =>   "2010-07-25T11:51:31.427Z"
   * Parameters:
   *  supressFormating : if supplied and 'true', will force to remove date/time separators
   *  supressMillis : if supplied and 'true', will force not to include milliseconds
   */
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