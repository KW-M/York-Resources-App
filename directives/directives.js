// Put any directives you make here and the html template in a file in the directives/html/ folder
app.directive('postCard', function () {
    return {
        restrict: 'EA',
        templateUrl: 'directives/html/postCard.html'
    };
});