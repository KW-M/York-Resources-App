//Define the GoogleDriveController controller for Angular.
app.service('GoogleDriveService', ['$q', function($q) {
    var self = this;

    this.initiateAuthLoadDrive = function(driveCallback, pickerCallback) {
        angular.element(document.querySelector('#overlay_background')).addClass('fadeOut');
        gapi.load('picker', {'callback': pickerCallback});
        gapi.client.load('drive', 'v3', driveCallback);
    };

    this.getUserInfo = function() {
        return (gapi.client.drive.about.get({
            'fields': 'user'
        }));
    };

    this.getListOfFlies = function(query, pageToken, pageSize) {
        return (gapi.client.drive.files.list({
            pageSize: pageSize,
            pageToken: pageToken,
            q: "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false",
            fields: 'files(appProperties,properties,contentHints/thumbnail,createdTime,description,fullFileExtension,id,modifiedTime,name,owners(displayName,emailAddress),permissions(displayName,emailAddress)),nextPageToken',
        }));
    };
    
    this.getFileContent = function(fileId) {
        return (gapi.client.drive.files.get({
            'fileId': fileId,
            'alt': 'media'
        }));
    };

    this.deleteDriveFile = function(fileId) {
        return (gapi.client.drive.files.delete({
            'fileId': fileId
        }));
    };
    
    this.updateDriveFile = function(content, title) {
        
    };

    this.sendDriveFileWContent = function(content, title) {
        return (gapi.client.request({
            'path': 'https://www.googleapis.com/upload/drive/v3/files',
            'method': 'POST',
            'params': {
                'uploadType': 'multipart',
                'useContentAsIndexableText': true,
                'alt': 'json',
            },
            'addParents': '0B5NVuDykezpkOXY1bDZ2ZnUxVGM',
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="675849302theboundary"'
            },
            'body': "\r\n--675849302theboundary\r\n" +
                "Content-Type: application/json\r\n\r\n" +
                JSON.stringify({
                    name: title,
                    parents: ['0B5NVuDykezpkbUxvOUMyNnRsUGc']
                }) +
                "\r\n--675849302theboundary\r\n" +
                "Content-Type: application/json\r\n\r\n" +
                JSON.stringify(content) +
                "\r\n--675849302theboundary--"
        }));
    };

    this.multithisisjustabackupRequest = function() {
                var promiseArray = [];
        var idArray = [];
        var fileslist = self.getListOfFlies(pageToken);

        return (fileslist.then(function(fileArray) {
            console.log(fileArray)
            for (var count = 0; count < fileArray.result.files.length; count++) {
                var file = fileArray.result.files[count];
                var fileRequest = self.getFileContent(file.id);
                promiseArray.push(fileRequest);
                idArray.push(file.id);
                console.log(promiseArray);
            }

            return ({
                files: $q.all(promiseArray),
                ids: idArray,
                pageToken: fileArray.result.nextPageToken
            });
        }))



        //older
        var promiseArray = [];
        var idArray = [];
        var fileslist = self.getListOfFlies();

        return (fileslist.then(function(fileArray) {
            console.log(fileArray)
            for (var count = 0; count < fileArray.result.files.length; count++) {
                var file = fileArray.result.files[count];
                var fileRequest = self.getFileContent(file.id);
                promiseArray.push(fileRequest);
                idArray.push(file.id);
                console.log(promiseArray);
            }

            return ({
                files: $q.all(promiseArray),
                ids: idArray
            });
        }))
    };

    this.sendRequest = function(request, callback) {
        request.execute(function(response) {
            callback(response);
        });
    };
}]);