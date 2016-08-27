/*Define the authorizationService service for Angular */ /*global angular*/ /*global gapi*/ /*global app*/
app.service('authorizationService', ['$mdDialog', authService]);

//The function used in the authorizationService service also called by the google api framwork when it loads.
function authService($mdDialog) {
    var self = this;
    var clientId = '475444543746-e3r02g1o1o71kliuoohah04ojqbmo22e.apps.googleusercontent.com';
    var apiKey = 'AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo';
    var scopes = 'https://www.googleapis.com/auth/drive';

    var signinButton = angular.element(document.getElementById('signin_button'));
    var signinSpinner = angular.element(document.getElementById('signin_spinner'));
    var signinDialog = angular.element(document.getElementById('overlay_background'));
    var datButton =                    document.getElementById('dat_button');
    var signoutButton = angular.element(document.getElementById('signout_button'));

    this.initilize = function(callback) {
        gapi.client.setApiKey(apiKey);
        gapi.auth2.init({
            client_id: clientId,
            scope: scopes,
            fetch_basic_profile: false,
            hosted_domain: 'york.org'
        }).then(function() {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            datButton.style.display = 'inline-block';
            signinButton[0].addEventListener("click", handleSigninClick);
        });

        function updateSigninStatus(isSignedIn) {
            if (isSignedIn) {
                var authInstance = gapi.auth2.getAuthInstance()
                var currentUser = authInstance.currentUser.get()
                var accountDomain = currentUser.getHostedDomain()
                console.log('signed in')
                if (accountDomain = 'york.org') {
                    console.log("User's Domain: " + accountDomain);
                    callback();
                    self.hideSigninButton();
                }
                else {
                    $mdDialog.show($mdDialog.alert({
                        title: 'Sorry.',
                        htmlContent: "<p>York Study Resources only works with York Google accounts right now.</p><p>If you have an email account ending with @york.org, please login with it, or ask Mr.Brookhouser if you don't have one.<p>",
                        ok: 'Ok'
                    })).then(function() {
                        gapi.auth2.getAuthInstance().signOut();
                        angular.element(document.querySelector('#login_spinner')).addClass('fadeOut');
                        setTimeout(function() {
                            angular.element(document.querySelector('#auth_button')).addClass('fadeIn');
                        }, 500);
                    });
                }
            }
            else {
                self.showSigninDialog();
                self.showSigninButton();
            }
        }
    }

    this.showSigninButton = function() {
        signinSpinner.addClass('fadeOut');
        datButton.style.display = "initial";
        setTimeout(function() {
            signinButton.addClass('fadeIn');
        }, 500);
    };

    this.hideSigninButton = function() {
        signinSpinner.removeClass('fadeOut');
        setTimeout(function() {
            signinButton.removeClass('fadeIn');
        }, 500);
    };

    this.hideSigninDialog = function() {
        signinDialog.addClass('fadeOut');
    };

    this.showSigninDialog = function() {
        signinDialog.removeClass('fadeOut');
    };

    function handleSigninClick(event) {
        gapi.auth2.getAuthInstance().signIn();
    }

    this.handleSignoutClick = function(event) {
        gapi.auth2.getAuthInstance().signOut();
    }
}