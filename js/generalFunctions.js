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
      var thePromise = item.Promise
      thePromise.then(item.Action);
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
  
   function formatGoogleDate(dString){ var utcOffset, offsetSplitChar; var offsetMultiplier = 1; var dateTime = dString.split("T"); var date = dateTime[0].split("-"); var time = dateTime[1].split(":"); var offsetField = time[time.length - 1]; var offsetString; offsetFieldIdentifier = offsetField.charAt(offsetField.length - 1); if (offsetFieldIdentifier == "Z") { utcOffset = 0; time[time.length - 1] = offsetField.substr(0, offsetField.length - 2); } else { if (offsetField[offsetField.length - 1].indexOf("+") != -1) { offsetSplitChar = "+"; offsetMultiplier = 1; } else { offsetSplitChar = "-"; offsetMultiplier = -1; } offsetString = offsetField.split(offsetSplitChar); time[time.length - 1] == offsetString[0]; offsetString = offsetString[1].split(":"); utcOffset = (offsetString[0] * 60) + offsetString[1]; utcOffset = utcOffset * 60 * 1000; } this.setTime(Date.UTC(date[0], date[1] - 1, date[2], time[0], time[1], time[2]) + (utcOffset * offsetMultiplier )); return this; };

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