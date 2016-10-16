//Define the GoogleDriveController controller for Angular.
app.service('GoogleDriveService', ['$q', function($q) {
    var self = this;
    var URLs = {
        databaseFolderId: '0B5NVuDykezpkbUxvOUMyNnRsUGc',
        userSpreadsheetId: '1_ncCoG3lzplXNnSevTivR5bdJaunU2DOQOA0-KWXTU0',
    }
    
    this.loadAPIs = function(APILoadedCallback) {
        gapi.client.load('drive', 'v3', function() {
            APILoadedCallback("drive");
        });
        gapi.client.load('sheets', 'v4', function() {
            APILoadedCallback("sheets");
        });
        gapi.load('picker', {
            'callback': function(){
              APILoadedCallback("picker")  
            }
        });
    };

    this.getUserInfo = function() {
        return (gapi.client.drive.about.get({
            'fields': 'user(displayName,emailAddress,photoLink),appInstalled'
        }));
    };

    this.getSpreadsheetRange = function(id, range) {
        //gets a named range in a google spreadsheet (in this case each row is created with a named range of its email).
        return (gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: id,
            range: range,
        }));
    }

    this.updateSpreadsheetRange = function(id, range, dataToBeInserted, append) {
        if (append === true) {
            return (gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: URLs.userSpreadsheetId,
                range: range,
                valueInputOption: "USER_ENTERED",
                values: [dataToBeInserted],
            }));
        }
        else {
            return (gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: URLs.userSpreadsheetId,
                range: range,
                valueInputOption: "USER_ENTERED",
                values: dataToBeInserted,
            }));
        }
    }

    this.runGAppsScript = function(functionToRun) {
        return (gapi.client.request({
            method: 'GET',
            root: 'https://script.google.com',
            path: 'macros/s/AKfycbwAVKcfa8Lzf_iyFlQpllMAn5kx0e37QSIKxsiE-51yYFOTDg0r/exec',
            params: {
                test1: "testing ... 1, 2, 3",
                test2: 34,
                test3: false,
            },
        }));
    }

    this.getWebsiteScreenshot = function(url) {
        return (gapi.client.request({
            'root': 'https://www.googleapis.com',
            'path': 'pagespeedonline/v2/runPagespeed?url=' + encodeURIComponent(url) + '&rule=AvoidLandingPageRedirects&screenshot=true&strategy=desktop&fields=screenshot(data%2Cheight%2Cwidth)&key=AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo',
            'method': 'GET',
        }));
    }

    this.getListOfFlies = function(query, pageToken, pageSize) {
        var query = query || "";
        return (gapi.client.drive.files.list({
            pageSize: pageSize,
            pageToken: pageToken,
            q: query,
            fields: 'files(name,id,modifiedTime,createdTime,properties,iconLink,thumbnailLink,description,starred,viewedByMe,owners(displayName,emailAddress),permissions(displayName,emailAddress)),nextPageToken', //
        }));
    };

    this.deleteDriveFile = function(fileId) {
        return (gapi.client.drive.files.delete({
            'fileId': fileId
        }));
    };

    this.updateDriveFile = function(id, metadata) {
        return (gapi.client.drive.files.update({
            'fileId': id,
        }));
    };

    this.createDriveFile = function(metadata) {
        metadata.parents = [URLs.databaseFolderId];
        return (gapi.client.drive.files.create(metadata));
    };
    
    this.getFileThumbnail = function(id) {
        return (gapi.client.drive.files.get({
            fileId: id,
            fields: 'name,thumbnailLink,iconLink', //
        }));
    }

    this.getFileContent = function(fileId) {
        return (gapi.client.drive.files.get({
            'fileId': fileId,
            'alt': 'media'
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

    this.updateBookmarked = function(id, value) {
        return (gapi.client.drive.files.update({
            'fileId': id,
            'resource': {
                starred: value,
            },
        }));
    };

    this.updateFileMetadata = function(id, metadata) {
        return (gapi.client.drive.files.update({
            'fileId': id,
            'resource': metadata,
        }));
    };

    this.likeFile = function(fileID, email) {
        return (gapi.client.drive.permissions.create({
            sendNotificationEmail: false,
            emailMessage: 'Please ignore this error from York Study Resources.',
            fileId: fileID,
            emailAddress: email,
            role: 'writer',
            type: "user",
        }));
    };

    this.unLikeFile = function(fileID, permissionID) {
        return (gapi.client.drive.permissions.delete({
            fileId: fileID,
            permissionId: permissionID,
        }));
    };

    // --not used functions--

    this.sendDriveFileWContent = function(content, title) {
        return (gapi.client.request({
            'path': 'https://www.googleapis.com/upload/drive/v3/files',
            'method': 'POST',
            'params': {
                'uploadType': 'multipart',
                'useContentAsIndexableText': true,
                'alt': 'json',
            },
            'addParents': URLs.databaseFolderId,
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="675849302theboundary"'
            },
            'body': "\r\n--675849302theboundary\r\n" +
                "Content-Type: application/json\r\n\r\n" +
                JSON.stringify({
                    name: title,
                    parents: [URLs.databaseFolderId]
                }) +
                "\r\n--675849302theboundary\r\n" +
                "Content-Type: application/json\r\n\r\n" +
                JSON.stringify(content) +
                "\r\n--675849302theboundary--"
        }));
    };

    this.sendRequest = function(request, callback) {
        request.execute(function(response) {
            callback(response);
        });
    };
}]);


// this.addNamedRangeUserSettings = function(range, name) {
//     return (gapi.client.sheets.spreadsheets.batchUpdate({
//         spreadsheetId: '1_ncCoG3lzplXNnSevTivR5bdJaunU2DOQOA0-KWXTU0',
//         "requests": [{
//             "addNamedRange": {
//                 "namedRange": {
//                     "name": name,
//                     "range": {
//                         "startRowIndex": 1,
//                         "endRowIndex": 1,
//                         "startColumnIndex": 1,
//                     }
//                 }
//             }
//         }]
//     }));
// }