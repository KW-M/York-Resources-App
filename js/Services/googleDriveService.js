//Define the GoogleDriveController controller for Angular
app.service('GoogleDriveService', ['$q', function($q) {
    var self = this;
    var drivePicker;
    var UploadPicker;

    this.initiateAuthLoadDrive = function(callback) {
        console.log("loading drive v3");
        $('#overlay_background').fadeOut(500);
        gapi.load('picker', {'callback' : self.pickerLoaded});
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
            maxResults: 3,
            q: "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false",
            fields: 'nextPageToken, files(id, name)',
        }));
    };

    this.pickerLoaded = function() {
        console.log(gapi.auth.getToken().access_token);
        var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setParent("root");
        var sharedView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setOwnedByMe(false);
        var uploadView = new google.picker.DocsUploadView().setParent("0B5NVuDykezpkUGd0LTRGc2hzM2s");
        console.log("loaded my picker")


        self.showPicker = function(typ) {
            console.log ("picker");
            if (typ === "Upload"){
                console.log ("pickerup");
                        var UploadPicker = new google.picker.PickerBuilder().
              addView(uploadView).
              addView(docsView).
              addView(sharedView).
              setOAuthToken(gapi.auth.getToken().access_token).
              setDeveloperKey("AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo").
              setCallback(self.pickerCallback).
              build();
                UploadPicker.setVisible(true);
            } else if (typ === "Drive"){
                        var drivePicker = new google.picker.PickerBuilder().
              addView(docsView).
              addView(sharedView).
              addView(uploadView).
              setOAuthToken(gapi.auth.getToken().access_token).
              setDeveloperKey("AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo").
              setCallback(self.pickerCallback).
              build();
                drivePicker.setVisible(true);
            }

        };
    };

    this.pickerCallback = function (data){
        //drivePicker.dispose();
        console.log(data);
        if (data.action == google.picker.Action.PICKED) {
            var fileId = data.docs[0].id;
            alert('File: ' + data.docs[0].name  + " id:" +   fileId + " URL:" + data.docs[0].url);
        }
    }

    this.batchRequest = function() { //do this one
        var batch = gapi.client.newBatch();
        return (self.getListOfFlies().then(function(fileArray) {
            for (var count = 0; count < fileArray.result.files.length; count++) {
                var file = fileArray.result.files[count];
                console.log(file.id);
                //batch.add(self.getDriveFileContent(file.id));
                gapi.client.request({
                    'path': '/download/drive/v3/files/0B5NVuDykezpkLW5zZmhmLUoxNEE?alt=media',
                    'method': 'GET',
                }).then(function (resu) {
                    console.log(resu);
                });
            };
            return (batch)
        }));
    };

    this.multiRequest = function() { //do this one
        var promiseArray = [];
        var idArray = [];
        return (self.getListOfFlies().then(function(fileArray) {
            console.log(fileArray)
            for (var count = 0; count < fileArray.result.files.length; count++) {
                var file = fileArray.result.files[count];
                var fileRequest = self.getDriveFileContent(file.id);
                promiseArray.push(fileRequest);
                idArray.push(file.id);
                console.log(promiseArray);
            }

            return ({files:$q.all(promiseArray), ids:idArray});
        }))
    };

    this.deleteDriveFile = function(fileId) {
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