//Define the GoogleDriveController controller for Angular.
app.service('GoogleDriveService', ['$q', '$http', function($q, $http) {
    var self = this;
    //----------------------------------------------------
    //---------------- Initialization --------------------

    this.readGAppsScript = function(scriptFunction, payload) {
        return function() {
            return gapi.client.script.scripts.run({
                'scriptId': 'MuWC0NB4CLnMdc_XDwj7F_PA9VMeL9Grb',
                'function': scriptFunction,
                'parameters': [JSON.stringify(payload)],
            //         'devMode': true,
            }));
        }
    }

    this.writeGAppsScript = function(scriptFunction, payload, remoteId) {
                return function() {
            return gapi.client.script.scripts.run({
                'scriptId': 'MuWC0NB4CLnMdc_XDwj7F_PA9VMeL9Grb',
                'function': scriptFunction,
                'parameters': [JSON.stringify(payload)],
            //         'devMode': true,
            }));
        }
        return ();
    }


    this.deleteDriveFile = function(fileId) {
        return (gapi.client.drive.files.delete({
            'fileId': fileId
        }));
    };

    this.updateDriveFile = function(id, metadata) {
        return (gapi.client.drive.files.update({
            'fileId': id,
            'resource': metadata,
        }));
    };

    this.updateFlagged = function(id, value) {
        return (gapi.client.drive.files.update({
            'fileId': id,
            'resource': {
                properties: {
                    Flagged: value,
                },
            },
        }));
    };

    this.shareFileDomain = function(fileID, role) {
        return (gapi.client.drive.permissions.create({
            fileId: fileID,
            type: 'domain',
            role: role,
            sendNotificationEmail: false,
            allowFileDiscovery: false,
            domain: 'york.org',
        }));
    };

    //----------------------------------------------------
    //------------------ Other Stuff ---------------------

    this.getWebsiteScreenshot = function(url) {
        return (gapi.client.request({
            'root': 'https://www.googleapis.com',
            'path': 'pagespeedonline/v2/runPagespeed?url=' + encodeURIComponent(url) + '&rule=AvoidLandingPageRedirects&screenshot=true&strategy=desktop&fields=screenshot(data%2Cheight%2Cwidth)&key=AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo',
            'method': 'GET',
        }));
    }

}]);
window.HelloWorld = 'FUNCTION()'
