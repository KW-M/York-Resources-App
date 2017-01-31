var devMode = false;

//------- Utility Functions ---------

function log(input, logWithoutDevMode) {
  if (devMode === true) {
    console.log(input)
  } else if (logWithoutDevMode === true) {
    console.log(input)
  }
}

function chooseRandom(inputArray) {
  var number = (Math.floor(Math.random() * (inputArray.length - 0)));
  return inputArray[number]
}

//------- Prototype Additions ---------

Date.prototype.addDays = function (days) {
  this.setDate(this.getDate() + parseInt(days));
  return this;
};

//------- Event Listeners ---------

document.addEventListener('touchmove', function (e) {
  //e.preventDefault();
}, false);
