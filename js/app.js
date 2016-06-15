//define the root angular module (app) as a variable named "app"
var app = angular.module('YorkResourcesApp', ['ngMaterial', 'ngRoute', 'angularGrid', 'ngSanitize']);

//universaly applying configurations/options for the angular module (app) named "app" above
app.config(function($mdThemingProvider, $mdIconProvider, $routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    //routing:
    $routeProvider
        .when("/all-posts", {
            templateUrl: "templates/html/all-posts.html",
        })
        .when("/my-posts", {
            templateUrl: "templates/html/my-posts.html",
        })
        .when("/flaged", {
            templateUrl: "templates/html/flaged.html",
        })
        .when("/:class", {
            templateUrl: "templates/html/class.html",
        })
        .otherwise({
            redirectTo: "/all-posts",
        });

    //defining icons
    $mdIconProvider
        .icon("accountpic", "./assets/svg/avatar-1.svg", 128)
        .icon("driveIcon", "./assets/drive-icon.svg", 18);

    //theming stuff
    $mdThemingProvider.definePalette('YorkRed', {
        '50': '#fbb9c0',
        '100': '#f6717f',
        '200': '#f33d4f',
        '300': '#db0e22',
        '400': '#be0c1d',
        '500': '#a10a19',
        '600': '#840815',
        '700': '#670610',
        '800': '#4b050c',
        '900': '#2e0307',
        'A100': '#fbb9c0',
        'A200': '#f6717f',
        'A400': '#be0c1d',
        'A700': '#670610',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': '50 100 A100 A200'
    });

    $mdThemingProvider.definePalette('YorkBlue', {
        '50': '#ffffff',
        '100': '#fcfdfe',
        '200': '#d5e0ed',
        '300': '#a3bbd7',
        '400': '#8dacce',
        '500': '#789cc5',
        '600': '#638cbc',
        '700': '#4d7db3',
        '800': '#446e9d',
        '900': '#3a5f88',
        'A100': '#ffffff',
        'A200': '#fcfdfe',
        'A400': '#8dacce',
        'A700': '#4d7db3',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': '50 100 200 300 400 500 600 A100 A200 A400'
    });

    $mdThemingProvider.definePalette('YorkGreen', {
        '50': '#f3f4da',
        '100': '#dfe2a0',
        '200': '#d1d575',
        '300': '#bfc43e',
        '400': '#aaae35',
        '500': '#93972e',
        '600': '#7c8027',
        '700': '#656820',
        '800': '#4e5119',
        '900': '#383911',
        'A100': '#f3f4da',
        'A200': '#dfe2a0',
        'A400': '#aaae35',
        'A700': '#656820',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': '50 100 200 300 400 500 A100 A200 A400'
    });

    $mdThemingProvider.definePalette('YorkOrange', {
        '50': '#ffffff',
        '100': '#f7e2d5',
        '200': '#eec1a6',
        '300': '#e2976a',
        '400': '#dd8551',
        '500': '#d87337',
        '600': '#c96427',
        '700': '#b05722',
        '800': '#964a1d',
        '900': '#7c3e18',
        'A100': '#ffffff',
        'A200': '#f7e2d5',
        'A400': '#dd8551',
        'A700': '#b05722',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': '50 100 200 300 400 500 A100 A200 A400'
    });
    $mdThemingProvider.theme('default').accentPalette('blue').primaryPalette('YorkRed')
});