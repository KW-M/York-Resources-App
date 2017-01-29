//Define the GoogleDriveController controller for Angular.
app.service('APIService', ['$q', '$http', function($q, $http) {
    var self = this;

    //------------------------------------------------------------------
    //---------------- Google Apps Script Functions --------------------
    this.userGAScript = function(scriptFunction, payload) {
        return function() {
            return gapi.client.script.scripts.run({
                'scriptId': 'MuWC0NB4CLnMdc_XDwj7F_PA9VMeL9Grb',
                'function': scriptFunction,
                'parameters': [JSON.stringify(payload)],
                //         'devMode': true,
            });
        }
    }

    this.remoteGAScript = function(scriptFunction, payload, remoteId) {
        return function() {
            return gapi.client.script.scripts.run({
                'scriptId': 'MuWC0NB4CLnMdc_XDwj7F_PA9VMeL9Grb',
                'function': scriptFunction,
                'parameters': [JSON.stringify(payload), remoteId],
                'devMode': true,
            });
        }
    }

    //----------------------------------------------------
    //------------------ File Sharing -------------------
    this.shareFile = function(fileID, role) {
        return (gapi.client.drive.permissions.create({
            fileId: fileID,
            type: 'domain',
            role: role,
            sendNotificationEmail: false,
            allowFileDiscovery: false,
            domain: 'york.org',
        }));
    };
}]);
