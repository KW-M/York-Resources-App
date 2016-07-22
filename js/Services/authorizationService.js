/*Define the authorizationService service for Angular */ /*global angular*/ /*global gapi*/ /*global app*/
app.service('authorizationService', ['GoogleDriveService', '$q', authService]);

//The function used in the authorizationService service also called by the google api framwork when it loads.
function authService(GoogleDriveService, $q) {
    var self = this;
    var clientId = '475444543746-e3r02g1o1o71kliuoohah04ojqbmo22e.apps.googleusercontent.com';
    var apiKey = 'AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo';
    var scopes = 'https://www.googleapis.com/auth/drive';

    var signinButton = angular.element(document.getElementById('signin_button'));
    console.log(signinButton)
    var signinSpiner = angular.element(document.getElementById('signin_spinner'));
    var signinDialog = angular.element(document.getElementById('overlay_background'));
    var signoutButton = angular.element(document.getElementById('signout_button'));

    this.initilize = function(callback) {
        gapi.client.setApiKey(apiKey);
        gapi.auth2.init({
            client_id: clientId,
            scope: scopes,
        }).then(function() {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

            signinButton[0].addEventListener("click", handleSigninClick);
            signoutButton[0].addEventListener("click", handleSignoutClick);
        });

        function updateSigninStatus(isSignedIn) {
            if (isSignedIn) {
                console.log('signed in')
                callback();
                self.hideSigninButton();
            }
            else {
                self.showSigninButton()
            }
        }
    }

    this.showSigninButton = function() {
        signinSpiner.addClass('fadeOut');
        setTimeout(function() {
            signinButton.addClass('fadeIn');
        }, 500);
    };
    
    this.hideSigninButton = function() {
        signinSpiner.removeClass('fadeOut');
        setTimeout(function() {
            signinButton.removeClass('fadeIn');
        }, 500);
    };
    
    this.hideSigninDialog = function() {
        signinSpiner.addClass('fadeOut');
    };
    
    this.showSigninDialog = function() {
        signinSpiner.removeClass('fadeOut');
    };

    function handleSigninClick(event) {
        gapi.auth2.getAuthInstance().signIn();
    }

    function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
    }
}