//define the root angular module (app) as a variable named "app"
var app = angular.module('YorkResourcesApp', ['ngMaterial', 'ngRoute', 'angularGrid', 'ngSanitize']);

//universaly applying configurations/options for the angular module (app) named "app" above
app.config(function($mdThemingProvider, $mdIconProvider, $routeProvider, $locationProvider) {
    //$locationProvider.html5Mode(true);
    //routing:
    $routeProvider.otherwise({
        redirectTo: "/all-posts",
    });

    //defining icons
    $mdIconProvider
        .icon("accountpic", "./assets/svg/avatar-1.svg", 128)
        .icon("driveIconNot", "./assets/drive-icon.svg", 18)
        .icon("driveIcon", "./images/drive_icon.svg", 18);

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

    $mdThemingProvider.definePalette('YorkGreenBlue', {
        '50': '#b4d9df',
        '100': '#7ebec9',
        '200': '#57aab8',
        '300': '#3b808c',
        '400': '#326d76',
        '500': '#295961',
        '600': '#20454b',
        '700': '#173136',
        '800': '#0e1e20',
        '900': '#050a0b',
        'A100': '#b4d9df',
        'A200': '#7ebec9',
        'A400': '#326d76',
        'A700': '#173136',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': '50 100 200 A100 A200'
    });

    $mdThemingProvider.definePalette('YorkBlue', {
        '50': '#abbce4',
        '100': '#728ed1',
        '200': '#486cc3',
        '300': '#304d93',
        '400': '#29417c',
        '500': '#213565',
        '600': '#19294e',
        '700': '#121d37',
        '800': '#0a1120',
        '900': '#030509',
        'A100': '#abbce4',
        'A200': '#728ed1',
        'A400': '#29417c',
        'A700': '#121d37',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': '50 100 A100 A200'
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
    $mdThemingProvider.theme('default')
            .primaryPalette('YorkRed')

            //.accentPalette('YorkBlue')
            .accentPalette('YorkGreenBlue')
            //.accentPalette('YorkGreen')
            //.accentPalette('blue')

            //.warnPalette('YorkOrange')
            .warnPalette('deep-orange')
});


