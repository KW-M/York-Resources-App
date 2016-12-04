//Define the GoogleDriveController controller for Angular.
app.service('GoogleDriveService', ['$q', '$http', function($q, $http) {
    var self = this;
    var URLs = {
        databaseFolderId: '0B5NVuDykezpkbUxvOUMyNnRsUGc',
        userSpreadsheetId: '1_ncCoG3lzplXNnSevTivR5bdJaunU2DOQOA0-KWXTU0',
        classSpreadsheetId: '1DfFUn8sgnFeLLijtKvWsd90GNcnEG6Xl5JTSeApX3bY'
    }

    //----------------------------------------------------
    //---------------- Initialization --------------------

    this.loadAPIs = function(APILoadedCallback) {
        gapi.client.load('drive', 'v3', function() {
            APILoadedCallback("drive");
        });
        gapi.client.load('sheets', 'v4', function() {
            APILoadedCallback("sheets");
        });
        gapi.load('picker', {
            'callback': function() {
                APILoadedCallback("picker")
            }
        });
    };

    this.getUserInfo = function() {
        return (gapi.client.drive.about.get({
            'fields': 'user(displayName,emailAddress,photoLink),appInstalled'
        }));
    };

    //----------------------------------------------------
    //----------------- Spreadsheets ---------------------

    this.getSpreadsheetRange = function(range, classSheet) {
        if (classSheet) {
            var spreadsheetId = URLs.classSpreadsheetId;
        } else {
             var spreadsheetId = URLs.userSpreadsheetId;
        }
        return (gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range,
        }));
    }

    this.updateSpreadsheetRange = function(range, dataToBeInserted) {
        return (gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: URLs.userSpreadsheetId,
            range: range,
            valueInputOption: "USER_ENTERED",
            values: [dataToBeInserted],
        }));
    }

    this.appendSpreadsheetRange = function(range, dataToBeInserted) {
        var range1 = gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: URLs.userSpreadsheetId,
            range: 'Sheet1!A1:A',
            valueInputOption: "USER_ENTERED",
            values: [[dataToBeInserted[0],dataToBeInserted[1]]],
        })
        var range2 = gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: URLs.userSpreadsheetId,
            range: 'Sheet1!D1:D',
            valueInputOption: "USER_ENTERED",
            values: [[dataToBeInserted[0],dataToBeInserted[1]]],
        })
        return $q.all([range1,range2])
    }

    //----------------------------------------------------
    //----------------- Getting Files --------------------

    this.getListOfFlies = function(query, pageToken, pageSize) {
        return (gapi.client.drive.files.list({
            pageSize: pageSize,
            pageToken: pageToken,
            q: query || null,
            fields: 'files(name,id,modifiedTime,createdTime,properties,description,owners(displayName,emailAddress)),nextPageToken', //
        }));
    };

    this.getFileThumbnail = function(id) {
        return (gapi.client.drive.files.get({
            fileId: id,
            fields: 'name,thumbnailLink,iconLink', //
        }));
    }

    //----------------------------------------------------
    //---------------- Modifying Files -------------------

    this.AppsScriptNewFile = function() {
        return $http({
            method: 'GET',
            url: 'https://script.google.com/macros/s/AKfycbwAVKcfa8Lzf_iyFlQpllMAn5kx0e37QSIKxsiE-51yYFOTDg0r/exec'
        });
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

    this.shareFileLink = function(fileID) {
        return (gapi.client.drive.permissions.create({
            fileId: fileID,
            type: "domain",
            role: 'reader',
            sendNotificationEmail: false,
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
