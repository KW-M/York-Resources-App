// Put any directives you make here and the html template in a file in the templates folder

// ----Outer UI----
app.directive('sideNavInsides', function () {
    return {
        restrict: 'AE',
        templateUrl: 'templates/sideNavigation.html'
    };
});

app.directive('contenteditable', ['$sce', function ($sce) {
    return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function (scope, element, attrs, ngModel) {
            if (!ngModel) return; // do nothing if no ng-model

            // Specify how UI should be updated
            ngModel.$render = function () {
                element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
            };

            // Listen for change events to enable binding
            element.on('blur keyup change', function () {
                scope.$evalAsync(read);
            });
            scope.$timeout(read); // initialize

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
//var resizeListener = addResizeListener(content_container, windowResizeCallback);
app.directive('descriptionOverflow', function(){
    return {
        link: function(scope, elm){
            console.log(scope.post);
            console.log(elm);
            console.log(elm.clientHeight + " " + elm.scrollHeight)
            scope.post.isOverflowed = elm.clientHeight < elm.scrollHeight;
        }
    }
});