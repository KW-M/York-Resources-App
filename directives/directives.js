// Put any directives you make here and the html template in a file in the directives/html/ folder

// ----Outer UI----
app.directive('toolbarTopContent', function() {
    return {
        restrict: 'EA',
        templateUrl: 'directives/html/toolbarTopContent.html'
    };
});
app.directive('sideNavInsides', function() {
    return {
        restrict: 'AE',
        templateUrl: 'directives/html/sideNavInsides.html'
    };
});
app.directive('addLowerButton', function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/addLowerButton.html'
    };
});

// ----Posts layout pieces----

app.directive('newPostContent', function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/newPostContent.html'
    };
});

app.directive("calculateCardHeight", function($timeout) {
    return {
        scope: false,
        link: function(scope, element) {
            console.log(element)
            console.log({clientHeight:element[0].clientHeight, scrollHeight:element[0].scrollHeight, time:0});
            $timeout(function(){
                console.log({clientHeight:element[0].clientHeight, scrollHeight:element[0].scrollHeight, time:'$timeout'});
            })
            $timeout(function(){
                console.log({clientHeight:element[0].clientHeight, scrollHeight:element[0].scrollHeight, time:'$timeout5000'});
            }, 5000)
            //  $timeout(function(){
            //      console.log('-------');
            //     console.log(element[0].offsetHeight);
            //     console.log(element[0].scrollHeight);
            //     console.log(element[0].clientHeight);
            //     scope.Post.cardHeight = element[0].scrollHeight/13;
            // }, 1000)

            // console.log(element[0].children[0].children[0].offsetHeight);
            // console.log(element[0].scrollHeight);
            // console.log(element[0].children[0].children[0].offsetHeight)
        }
    }
})

app.directive("gridLayout", function() {
    return {
        scope: false,
        link: function(scope, element) {
            //function to get column width and number of columns
            console.log(element)
            function getColWidth() {
                var gridOptions = {
                    gridWidth: 300, //minumum width of a grid, this may increase to take whole space of container
                    gutterSize: 10, //spacing between two grid,
                    gridNo: 'auto', // grid number, by default calculate auto matically
                }
                var contWidth = domElm.offsetWidth;
                var colWidth = gridOptions.gridNo == 'auto' ? gridOptions.gridWidth : Math.floor(contWidth / gridOptions.gridNo) - gridOptions.gutterSize;
                var cols = gridOptions.gridNo == 'auto' ? Math.floor((contWidth + gridOptions.gutterSize) / (colWidth + gridOptions.gutterSize)) : gridOptions.gridNo;
                var remainingSpace = ((contWidth + gridOptions.gutterSize) % (colWidth + gridOptions.gutterSize));
                colWidth = colWidth + Math.floor(remainingSpace / cols);
                console.log({
                    no: cols,
                    width: colWidth
                })
                return {
                    no: cols,
                    width: colWidth
                };
            }
        }
    }
});

app.directive('contenteditable', ['$sce', function($sce) {
  return {
    restrict: 'A', // only activate on element attribute
    require: '?ngModel', // get a hold of NgModelController
    link: function(scope, element, attrs, ngModel) {
      if (!ngModel) return; // do nothing if no ng-model
    //     console.log('viewModel0:')
    //       console.log(ngModel)
    //       console.log(scope.Post.Description)
    //   // Update UI on first run
    //   element.html($sce.getTrustedHtml(scope.Post.Description || ''));

      // Specify how UI should be updated
      ngModel.$render = function() {
          console.log('viewModel:')
          console.log(ngModel.$viewValue)
        element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
      };

      // Listen for change events to enable binding
      element.on('blur keyup change', function() {
        scope.$evalAsync(read);
      });
      read(); // initialize

      // Write data to the model
      function read() {
        var html = element.html();
        // When we clear the content editable the browser leaves a <br> behind
        // If strip-br attribute is provided then we strip this out
        if (attrs.stripBr && html === '<br>') {
          html = '';
        }
        ngModel.$setViewValue(html);
      }
    }
  };
}]);

// app.directive('getPosts', function() {
//     return {
//         restrict: 'AE',
//         link: function(scope, elem, attrs) {
//             scope.$parent.getQueryProperties = function() {
//                 scope.$parent.queryProperties.Flagged = attrs.flagged;
//                 scope.$parent.queryProperties.Class = attrs.class;
//                 scope.$parent.queryProperties.CreatorEmail = attrs.creatorEmail;
//                 scope.$parent.queryProperties.Type = attrs.type;
//                 //scope.$parent.queryProperties.Bookmarked = attrs.bookmarked;
//             }
//         }
//     };
// });

// ----New post pieces----
app.directive('classSelectMenu', function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/classSelectMenu.html'
    };
});