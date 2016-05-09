// Put any directives you make here and the html template in a file in the directives/html/ folder

// ----Outer UI----
app.directive('toolbarTop', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/toolbarTop.html'
    };
});
app.directive('toolbarTopMobile', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/toolbarTopMobile.html'
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
        scope.getFiles = function(pageToken) {
         queue(scope.GoogleDriveService.multiRequest(pageToken),function(combinedResponse) {
            console.log(combinedResponse);
            if (combinedResponse.pageToken) {
               scope.getFiles(combinedResponse.pageToken);
            }
            handleFiles(combinedResponse);
         });
      }

      function handleFiles(combinedResponse) {
         combinedResponse.files.then(function(fileResponse) {
            scope.unfilteredPosts = scope.unfilteredPosts.concat(formatArrayResponse(fileResponse, combinedResponse.ids));
            console.log(scope.unfilteredPosts)
            scope.filterPosts(scope.searchTxt);
            scope.$apply();
         });
      }
    }
  };
});
