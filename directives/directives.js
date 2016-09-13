// Put any directives you make here and the html template in a file in the directives/html/ folder

// ----Outer UI----
app.directive('toolbarTopContent', function() {
    return {
        restrict: 'EA',
        templateUrl: 'directives/html/toolbarTopContent.html'
    };
});
app.directive('searchBar', function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/searchBar.html'
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
app.directive('postCard', function() {
    return {
        restrict: 'EA',
        templateUrl: 'directives/html/postCard.html'
    };
});

app.directive('addBarTop', function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/addBarTop.html'
    };
});

app.directive('newPostContent', function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/newPostContent.html'
    };
});

app.directive("showMoreOnOverflow",function(){
  return{
    link:function(scope,element){
        if(element[0].scrollHeight > element[0].clientHeight || element[0].scrollWidth > element[0].clientWidth) {
            console.log("oveerflow")
            element[0].nextElementSibling.style.display = "initial";
        } else {
            console.log("nonoverflow")
            //element[0].nextElementSibling.style.display = "none"; 
        }
    }        
  }      
});

appdirective('contenteditable', ['$sce', function($sce) {
  return {
    restrict: 'A', // only activate on element attribute
    require: '?ngModel', // get a hold of NgModelController
    link: function(scope, element, attrs, ngModel) {
      if (!ngModel) return; // do nothing if no ng-model

      // Specify how UI should be updated
      ngModel.$render = function() {
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