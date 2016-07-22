//Define the authorizationService service for Angular
app.service('authorizationService', ['GoogleDriveService', '$q', authService]);

//The function used in the authorizationService service also called by the google api framwork when it loads.
function authService(GoogleDriveService, $q) {
    var self = this;
    var CLIENT_ID = '475444543746-e3r02g1o1o71kliuoohah04ojqbmo22e.apps.googleusercontent.com';
    
    this.logIn = function(callback) {

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

    this.authorizeSilent = function() {
        return (buildAuthRequest(true));
    };


    this.authorizePopup = function() {
        return (buildAuthRequest(false));
    };
}