//Define the GoogleDriveController controller for Angular
app.service('GoogleDriveService', ['$q', function($q) {
    var self = this;

    this.initiateAuthLoadDrive = function(callback) {
        console.log("loading drive v3");
        $('#overlay_background').fadeOut(500);
        gapi.client.load('drive', 'v3', callback);
    };

    this.getUserInfo = function() {
        return (gapi.client.drive.about.get({
            'fields': 'user'
        }));
    };

    this.getDriveFileContent = function(fileId) {
        return (gapi.client.drive.files.get({
            'fileId': fileId,
            'alt': 'media'
        }));
    };

    this.getListOfFlies = function() {
        return (gapi.client.drive.files.list({
            maxResults: '3',
            q: "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false",
            fields: 'nextPageToken, files(id, name)',
        }));
    };

    this.getImageShot = function() {
        $.get( "https://api.pagelr.com/capture?uri=http://stackoverflow.com/questions/33033772/google-drive-sdk-batch-requests-of-get-media-results-in-httperror-303&width=400&height=260&key=Ca7GOVe9BkGefE_rvwN2Bw", function( data ) {
  console.log(data);
});

    };

    this.batchRequest = function() { //do this one
        var promiseArray = [];
        return (self.getListOfFlies().then(function(fileArray) {
            console.log(fileArray)
            for (var count = 0; count < fileArray.result.files.length; count++) {
                var file = fileArray.result.files[count];
                var fileRequest = self.getDriveFileContent(file.id);
                promiseArray.push(fileRequest);
                console.log(promiseArray);
            }
            return ($q.all(promiseArray));
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