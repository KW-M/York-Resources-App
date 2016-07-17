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
            'fields': 'user(displayName,emailAddress,photoLink),appInstalled'
        }));
    };

    this.getListOfFlies = function(query, pageToken, pageSize) {
        var query = query || "";
        return (gapi.client.drive.files.list({
            pageSize: pageSize,
            pageToken: pageToken,
            q: "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false" + query,
            fields: 'files(name,id,modifiedTime,appProperties,properties,iconLink,thumbnailLink,createdTime,description,fullFileExtension,owners(displayName,emailAddress),permissions(displayName,emailAddress)),nextPageToken',//
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
    
    this.updateFileProperty = function(id, property) {
        property.fileId = id;
        return (gapi.client.drive.files.update(property));
    };
    
    this.createDriveFile = function(metadata) {
        metadata.parents = ['0B5NVuDykezpkbUxvOUMyNnRsUGc'];
        return (gapi.client.drive.files.create(metadata));
    };
    
    
    
    this.getFileContent = function(fileId) {
        return (gapi.client.drive.files.get({
            'fileId': fileId,
            'alt': 'media'
        }));
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

    this.sendRequest = function(request, callback) {
        request.execute(function(response) {
            callback(response);
        });
    };
}]);