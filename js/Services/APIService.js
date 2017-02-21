//Define the APIService for Angular.
app.service('APIService', ['$q', '$http', function ($q, $http) {
    var self = this;

    //-------------- Run a Google Apps Script Function ------------------
    this.runGAScript = function (scriptFunction, payload, stringify, remoteId) {
        return function () {
            return gapi.client.script.scripts.run({
                'scriptId': 'MuWC0NB4CLnMdc_XDwj7F_PA9VMeL9Grb',
                'function': scriptFunction,
                'parameters': [stringify ? JSON.stringify(payload) : payload, remoteId],
                //'devMode': true,
            });
        }
    }

    //---------------- Gets A list of Drive Files That Match the Query string -----------------
    this.searchGDrive = function (query, pageToken) {
        return function () {
            return gapi.client.drive.files.list({
                q: query || null,
                fields: 'files(id),nextPageToken',
                pageToken: pageToken || null,
                pageSize: 100,
            });
        }
    };

    //---------------- Share a Drive File With the York Domain -----------------
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
