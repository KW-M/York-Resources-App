/*Define the authorizationService service for Angular */ /*global angular*/ /*global gapi*/ /*global app*/
app.service('authorizationService', authService);

function authService($mdDialog) {
    var self = this;
    // var apiKey = 'AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo';

    var signinButton = angular.element(document.getElementById('signin_button'));
    var signinSpinner = angular.element(document.getElementById('signin_spinner'));
    var signinDialog = angular.element(document.getElementById('overlay_background'));
    var datButton = document.getElementById('dat_button');
    var signoutButton = angular.element(document.getElementById('signout_button'));

    this.initilize = function(callback) {
        gapi.auth2.init({
            client_id: '632148950209-60a3db9qm6q31sids128mvstddg2qme7.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/drive email',
            fetch_basic_profile: false,
            hosted_domain: 'york.org'
        })
        .then(function() {
            var authinstance = gapi.auth2.getAuthInstance()
            // Listen for sign-in state changes.
            authinstance.isSignedIn.listen(updateSigninStatus);
            // Handle the initial sign-in state.
            updateSigninStatus(authinstance.isSignedIn.get());
            // show sign in prompt if sign in button is clicked
            authinstance.attachClickHandler('signin_button', null, null, handleError)
            datButton.style.display = 'inline-block';
        });

        function updateSigninStatus(isSignedIn) {
            if (isSignedIn) {
                var authInstance = gapi.auth2.getAuthInstance()
                var currentUser = authInstance.currentUser.get()
                var accountDomain = currentUser.getHostedDomain()
                if (accountDomain === 'york.org') {
                    if (callback){
                        callback();
                    };
                    self.hideSigninButton();
                } else {

                }
            } else {
                window.clearUserInfo();
                self.showSigninDialog();
                self.showSigninButton();
            }
        }
    }

    this.showSigninButton = function() {
        signinSpinner.addClass('fadeOut');
        setTimeout(function() {
            signinButton.addClass('fadeIn');
            datButton.style.display = 'none';
        }, 500);
    };

    this.hideSigninButton = function() {
        signinSpinner.removeClass('fadeOut');
        setTimeout(function() {
            signinButton.removeClass('fadeIn');
            datButton.style.display = 'inline-block';
        }, 500);
    };

    this.hideSigninDialog = function() {
        signinDialog.addClass('fadeOut');
    };

    this.showSigninDialog = function() {
        signinDialog.removeClass('fadeOut');
    };

    this.handleSigninClick = function(callback) {
        gapi.auth2.getAuthInstance().signIn(function () {
            if (callback) {
                callback()
            }
        })
    }

    this.handleSignoutClick = function() {
        gapi.auth2.getAuthInstance().signOut();
        var logout = document.createElement("img");
        logout.setAttribute("src", "https://mail.google.com/mail/u/0/?logout&hl=en");
        logout.style.display = "none";
        var logoutImg = document.body.appendChild(logout);
        logoutImg.onload = function(){
        }
    }

    this.getAuthToken = function() {
        return (gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse(true).access_token)
    }

    this.showNonYorkDialog = function() {
        gapi.auth2.getAuthInstance().signOut();
        $mdDialog.show($mdDialog.alert({
            title: 'Sorry.',
            htmlContent: "<p>York Study Resources only works with York Google accounts right now.</p><p>If you have an email account ending with @york.org, please login with it, or ask Mr.Brookhouser if you don't have one.<p>",
            ok: 'Ok'
        })).then(function() {
            angular.element(document.querySelector('#login_spinner')).addClass('fadeOut');
            setTimeout(function() {
                angular.element(document.querySelector('#auth_button')).addClass('fadeIn');
            }, 500);
        });
    }

    function handleError(error) {
        console.log(error)
        if(error.hasOwnProperty('expectedDomain')) {
            self.showNonYorkDialog();
        }
    }
}
