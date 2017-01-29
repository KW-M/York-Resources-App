//Define the APIService for Angular.
app.service('APIService', ['$q', '$http', function ($q, $http) {
    var self = this;

    //-------------- Run a Google Apps Script Function ------------------
    this.runGAScript = function (scriptFunction, payload, stringify, remoteId) {
        return function () {
            return gapi.client.script.scripts.run({
                'scriptId': 'MuWC0NB4CLnMdc_XDwj7F_PA9VMeL9Grb',
                'function': scriptFunction,
                'parameters': [(stringify) ? JSON.stringify(payload) : payload, remoteId || "AKfycbxME_4iEULk_guUMF4uEQrumAiLsFaxyFt407wg9ANJHuQ4_kU"],
                //'devMode': true,
            });
        }
    }

    //---------------- Share a Drive File in the domain -----------------
    this.shareFile = function (fileID, role) {
        return function () {
            return gapi.client.drive.permissions.create({
                fileId: fileID,
                type: 'domain',
                role: role,
                sendNotificationEmail: false,
                allowFileDiscovery: false,
                domain: 'york.org',
            });
        }
    };
}]);
