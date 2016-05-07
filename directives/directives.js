// Put any directives you make here and the html template in a file in the directives/html/ folder

// ----Outer UI----
app.directive('toolbarTop', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/toolbarTop.html'
    };
});
app.directive('sideNav', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/sideNav.html'
    };
});
app.directive('addLowerButton', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/addLowerButton.html'
    };
});

// ----Posts layout pieces----
app.directive('postCard', function () {
    return {
        restrict: 'EA',
        templateUrl: 'directives/html/postCard.html'
    };
});

app.directive('addBarTop', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/addBarTop.html'
    };
});

app.directive('getPosts', function() {
  return {
    restrict: 'AE',
    link: function(scope, elem, attrs) {
        console.log(attrs);
    }
  };
});
