function formatArrayResponse (rawArrayResponse,idArray) {
      var arrayOfPosts = [];
     for (var i = 0; i < rawArrayResponse.length; i++) {
        if(idArray != null){
          rawArrayResponse[i].result.ID = idArray[i].id
        }
         arrayOfPosts.push(rawArrayResponse.result);
      }
    return (arrayOfPosts);
}

function RateLimit(fn, delay, context) {
  var queue = [], timer = null;

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
      processQueue();  // start immediately on the first invocation
      timer = setInterval(processQueue, delay);
    }
  }
}