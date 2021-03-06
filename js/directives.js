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

var resizeListenElm = document.getElementById("content_container");
app.directive('descriptionOverflow', ['$timeout', function ($timeout) {
    return {
        link: function (scope, elm) {
            elm = elm[0]
            var likeClickTimer = null;
            detectOverflow()
            addResizeListener(resizeListenElm, detectOverflow);

            function detectOverflow() {
                if (typeof (likeClickTimer) == 'number') clearTimeout(likeClickTimer);
                likeClickTimer = setTimeout(function () {
                    $timeout(function () {
                        scope.post.isOverflowed = elm.clientHeight < elm.scrollHeight;
                    })
                }, 1000)
            }
        }
    }
}]);
