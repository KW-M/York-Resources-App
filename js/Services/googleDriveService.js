//Define the GoogleDriveController controller for Angular
app.service('GoogleDriveService', ['$q', function($q) {
    var self = this;

    this.initiateAuthLoadDrive = function(driveCallback, pickerCallback) {
        $('#overlay_background').fadeOut(500);
        gapi.load('picker', {'callback': pickerCallback});
        gapi.client.load('drive', 'v3', driveCallback);
    };

    this.getUserInfo = function() {
        return (gapi.client.drive.about.get({
            'fields': 'user'
        }));
    };

    this.getFileContent = function(fileId) {
        return (gapi.client.drive.files.get({
            'fileId': fileId,
            'alt': 'media'
        }));
    };

    this.getListOfFlies = function(query, pageToken) {
        return (gapi.client.drive.files.list({
            pageSize: 9,
            pageToken: pageToken,
            q: "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false and " + query,
            fields: 'nextPageToken, files(id, name)',
        }));
    };

    // this.batchRequest = function() { //do this one
    //     var batch = gapi.client.newBatch();
    //     return (self.getListOfFlies().then(function(fileArray) {
    //         for (var count = 0; count < fileArray.result.files.length; count++) {
    //             var file = fileArray.result.files[count];
    //             console.log(file.id);
    //             //batch.add(self.getFileContent(file.id));
    //             gapi.client.request({
    //                 'path': '/download/drive/v3/files/0B5NVuDykezpkLW5zZmhmLUoxNEE?alt=media',
    //                 'method': 'GET',
    //             }).then(function (resu) {
    //                 console.log(resu);
    //             });
    //         };
    //         return (batch)
    //     }));
    // };

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

    this.deleteDriveFile = function(fileId) {
        console.log(fileId);
        return (gapi.client.drive.files.delete({
            'fileId': fileId
        }));
    };

    this.sendDriveFile = function(content, title) {
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

    this.sendRequest = function(request, callback) {
        request.execute(function(response) {
            callback(response);
        });
    };
}]);