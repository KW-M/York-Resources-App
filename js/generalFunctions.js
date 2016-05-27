  var theQueue = [];
  var timer = null;

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


  function processTheQueue() {
    var item = theQueue.shift();
    if (item) {
      var thePromise = item.Promise
      thePromise.then(item.Action);
    }
    if (queue.length === 0) {
      clearInterval(timer), timer = null;
    }
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
      timer = setInterval(processTheQueue, 200);
    }
  };

  function RateLimit(fn, delay, context) {
    var queue = [],
      timer = null;

    function processQueue() {
      var item = queue.shift();
      if (item)
        fn.apply(item.context, item.arguments);
      if (queue.length === 0)
        clearInterval(timer), timer = null;
    }

    return function limited() {
      queue.push({
        context: context || this,
        arguments: [].slice.call(arguments)
      });
      if (!timer) {
        processQueue(); // start immediately on the first invocation
        timer = setInterval(processQueue, delay);
      }
    }
  }