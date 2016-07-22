//Define the authorizationService service for Angular
app.service('authorizationService', ['GoogleDriveService', '$q', authService]);

//The function used in the authorizationService service also called by the google api framwork when it loads.
function authService(GoogleDriveService, $q) {
    var self = this;
    var clientId = '475444543746-e3r02g1o1o71kliuoohah04ojqbmo22e.apps.googleusercontent.com';
    var apiKey = 'AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo';
    var scopes = 'https://www.googleapis.com/auth/drive';
    
    var signinButton = document.getElementById('signin_button');
    var signoutButton = document.getElementById('signout_button');

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

            signinButton.addEventListener("click", handleSigninClick);
            signoutButton.addEventListener("click", handleSignoutClick);
        });

        function updateSigninStatus(isSignedIn) {
            console.log('listening')
            if (isSignedIn) {
                angular.element(document.querySelector('#login_spinner')).removeClass('fadeOut');
                setTimeout(function() {
                    angular.element(document.querySelector('#auth_button')).removeClass('fadeIn');
                });
                console.log(gapi.auth2.getAuthInstance());
                 console.log(gapi.auth2.getAuthInstance().getBasicProfile());
                callback();
                console.log('not signed in')
            }
            else {
                console.log('not signed in')
                // signinButton.style.display = 'block';
                // signoutButton.style.display = 'none';
            }
        }
    }

    this.buildAuthRequest = function(immediateMode) {
        var promise = $q.defer();
        var request = {
            hd: 'york.org',
            scope: ['https://www.googleapis.com/auth/drive'],
            client_id: CLIENT_ID,
            immediate: immediateMode,
        };
        gapi.auth.authorize(request, function(authResult) {
            if (authResult && !authResult.error) {
                promise.resolve(authResult);
                console.log('authorized');
            }
            else {
                promise.reject(authResult);
            }
        });
        return (promise.promise);
    };



    function isTokenValid() {
        var promiseVar = $q.defer();
        var token = gapi.auth.getToken();
        if (token && Date.now() < token.expires_at) {
            promiseVar.resolve();
        }
        else {
            gapi.auth.authorize(request);
        }
    }

    function handleSigninClick(event) {
        gapi.auth2.getAuthInstance().signIn()
            console.log('logged in')
            console.log(gapi.auth2.getAuthInstance());
            console.log({basicprofile:gapi.auth2.getAuthInstance().getBasicProfile()});
    }

    function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
    }
}