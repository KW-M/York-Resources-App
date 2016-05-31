//define the root angular module (app) as a variable named "app"
var app = angular.module('YorkResourcesApp', ['ngMaterial','ngRoute','angularGrid','ngSanitize']);

//universaly applying configurations/options for the angular module (app) named "app" above
app.config(function ($mdThemingProvider, $mdIconProvider, $routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
        //routing:
    $routeProvider
        .when("/",{
            templateUrl: "templates/html/all-posts.html",
        })
        .when("/my-posts",{
            templateUrl: "templates/html/my-posts.html",
        })
        .when("/flaged",{
            templateUrl: "templates/html/flaged.html",
        })
        .when("/liked",{
            templateUrl: "templates/html/most-liked.html",
        })
        .otherwise({
            redirectTo:"/",
        });

    $mdIconProvider
        .icon("accountpic", "./assets/svg/avatar-1.svg", 128)
        .icon("driveIcon", "./assets/drive-icon.svg", 18);

    //theming stuff

    var yorkRedMap = $mdThemingProvider.extendPalette('red', {
        '500': '#640000'
    });
    var yorkGreenMap = $mdThemingProvider.extendPalette('green', {
        '100': '#9a9735'
    });
    var yorkBlueMap = $mdThemingProvider.extendPalette('blue', {
        '400': '#295b64'
    });
    // Register the new color palette map with the name yorkRed
    $mdThemingProvider.definePalette('yorkRed', yorkRedMap);
    $mdThemingProvider.definePalette('yorkGreen', yorkGreenMap);
    $mdThemingProvider.definePalette('yorkBlue', yorkBlueMap);
    // Use that theme for the primary intentions
    $mdThemingProvider.theme('default').primaryPalette('yorkGreen');
    $mdThemingProvider.theme('default').accentPalette('yorkBlue');
});