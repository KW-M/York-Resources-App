// Put any directives you make here and the html template in a file in the directives/html/ folder
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
