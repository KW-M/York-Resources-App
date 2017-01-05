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

    this.getWholeSpreadsheet = function(range) {
        return (gapi.client.sheets.spreadsheets.get({
            spreadsheetId: URLs.classSpreadsheetId,
            fields: 'sheets(data/rowData/values/formattedValue,properties/title)',
        }));
    }

    this.getSpreadsheetRange = function(range) {
        return (gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: URLs.userSpreadsheetId,
            range: range,
        }));
    }

    this.updateSpreadsheetRange = function(range, dataToBeInserted) {
        return (gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: URLs.userSpreadsheetId,
            range: range,
            includeValuesInResponse: true,
            valueInputOption: "USER_ENTERED",
            values: [dataToBeInserted],
        }));
    }

    this.appendSpreadsheetRange = function(range, dataToBeInserted, spreadsheetName) {
        console.log(dataToBeInserted);
        return gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetName == 'user' ? URLs.userSpreadsheetId : URLs.classSpreadsheetId,
            range: range,
            includeValuesInResponse: true,
            valueInputOption: "USER_ENTERED",
            values: [dataToBeInserted],
        })
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

    this.shareFileDomain = function(fileID,role) {
        return (gapi.client.drive.permissions.create({
            fileId: fileID,
            type: 'domain',
            role: role,
            sendNotificationEmail: false,
            allowFileDiscovery: false,
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


