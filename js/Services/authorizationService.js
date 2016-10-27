/*Define the authorizationService service for Angular */ /*global angular*/ /*global gapi*/ /*global app*/
app.service('authorizationService', authService);
function authService($mdDialog) {
    var self = this;
   // var apiKey = 'AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo';

    var signinButton = angular.element(document.getElementById('signin_button'));
    var signinSpinner = angular.element(document.getElementById('signin_spinner'));
    var signinDialog = angular.element(document.getElementById('overlay_background'));
    var datButton =                    document.getElementById('dat_button');
    var signoutButton = angular.element(document.getElementById('signout_button'));

    this.initilize = function(callback) {
        //gapi.client.setApiKey(apiKey);
        gapi.auth2.init({
            client_id: '475444543746-e3r02g1o1o71kliuoohah04ojqbmo22e.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/drive email',
            fetch_basic_profile: false,
            hosted_domain: 'york.org'
        }).then(function(googleauth) {
            var authinstance = gapi.auth2.getAuthInstance()
            console.log(googleauth)
            console.log(authinstance)
            // Listen for sign-in state changes.
            authinstance.isSignedIn.listen(updateSigninStatus);
            // Handle the initial sign-in state.
            updateSigninStatus(authinstance.isSignedIn.get());
            gapi.auth2.getAuthInstance().signIn()
            //datButton.style.display = 'inline-block';
            //authinstance.attachClickHandler(signinButton[0],null, self.handleSigninClick, function(error){console.log(error)})
        });

        function updateSigninStatus(isSignedIn) {
            console.log('signed in testing')
            if (isSignedIn) {
                console.log('signed in 2')
                var authInstance = gapi.auth2.getAuthInstance()
                var currentUser = authInstance.currentUser.get()
                var accountDomain = currentUser.getHostedDomain()
                console.log(currentUser)
                                    callback();
                    self.hideSigninButton();
                // if (accountDomain === 'york.org') {
                //     console.log("User's Domain: " + accountDomain);

                //     callback();
                //     self.hideSigninButton();
                // }
                // else {
                //     $mdDialog.show($mdDialog.alert({
                //         title: 'Sorry.',
                //         htmlContent: "<p>York Study Resources only works with York Google accounts right now.</p><p>If you have an email account ending with @york.org, please login with it, or ask Mr.Brookhouser if you don't have one.<p>",
                //         ok: 'Ok'
                //     })).then(function() {
                //         gapi.auth2.getAuthInstance().signOut();
                //         angular.element(document.querySelector('#login_spinner')).addClass('fadeOut');
                //         setTimeout(function() {
                //             angular.element(document.querySelector('#auth_button')).addClass('fadeIn');
                //         }, 500);
                //     });
                // }
            }
            else {
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

    this.handleSigninClick = function() {
        console.log('signing in')
         gapi.auth2.getAuthInstance().signIn()
        //.then(function() {
        //     console.log('signed in 1')
        // },function(error){
        //     console.log(error)
        //      gapi.auth2.getAuthInstance().signOut();
        //     if(error.hasOwnProperty('expectedDomain')) {
        //                 $mdDialog.show($mdDialog.alert({
        //                 title: 'Sorry.',
        //                 htmlContent: "<p>York Study Resources only works with York Google accounts right now.</p><p>If you have an email account ending with @york.org, please login with it, or ask Mr.Brookhouser if you don't have one.<p>",
        //                 ok: 'Ok'
        //             })).then(function() {
        //                 angular.element(document.querySelector('#login_spinner')).addClass('fadeOut');
        //                 setTimeout(function() {
        //                     angular.element(document.querySelector('#auth_button')).addClass('fadeIn');
        //                 }, 500);
        //             });
        //     }
        // });
    }

    this.handleSignoutClick = function(event) {
        gapi.auth2.getAuthInstance().signOut();
    }

    this.getAuthToken = function() {
        return(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse(true).access_token)
    }
}