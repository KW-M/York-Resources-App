/* we don't define the "new post controller" here because it was alredy
   defined by the $md-dialog in the newPost function on mainController.   */
function newPostController($scope, $mdDialog, GoogleDriveService, $mdToast, postObj, operation) {
    fillInValues();
    headerImg = document.getElementById("header_image");
    console.log(headerImg);
    $scope.driveThumbnail = "";
    $scope.classSearch = "";

    $scope.close = function() {
        $mdDialog.hide();
    };

    $scope.classSelected = function(inputClass) {
        $scope.Class = inputClass.class;
    };

    $scope.Preview = function() {
        if ($scope.Type === "Link") {
            return 'https://api.pagelr.com/capture?uri=' + $scope.Link + '&width=400&height=260&key=Ca7GOVe9BkGefE_rvwN2Bw'
        }
        else if ($scope.Type === "gDrive") {
            return $scope.driveThumbnail;
        }
    };

    function convertImgToDataURLviaCanvas(callback, outputFormat) {
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var dataURL;
        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
        canvas = null;
    }

    $scope.submit = function() {
        GoogleDriveService.getUserInfo().then(function(userInfo) {
            console.log(userInfo.result);
            var description = document.querySelector('#DescriptionTxt').textContent;
            var response = ({
                "Type": "noLink",
                "Flagged": false,
                "Title": $scope.Title,
                "Tags": $scope.Tags,
                "Description": description,
                "Class": {
                    "Name": $scope.class,
                },
                "Link": $scope.Link,
                "FileId": $scope.id,
                "ImageURL": "https://api.pagelr.com/capture?uri=" + $scope.Link + "&width=400&height=260&key=Ca7GOVe9BkGefE_rvwN2Bw",
                "LikeUsers": [],
            });
            console.log(response);
            if ($scope.Type === "gDrive") {
                var confirm = $mdDialog.confirm()
                    .title('This will enable view only link sharing for the file, \n so other students can see it.')
                    .textContent('continue?           (not really right now)')
                    .ariaLabel('continue?')
                    .ok('Ok')
                    .cancel('Cancel');
                $mdDialog.show(confirm).then(function() {
                    sendFile();
                }, function() {
                    alert("um, that's not going to work") //cancel
                });
            }
            else {
                sendFile();
            }

            function sendFile() {
                $mdToast.show({
                    template: '<md-toast><span style="font-size:18px">Posting...</span><span flex></span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right:-20px"></md-progress-circular></md-toast>',
                    hideDelay: 30000,
                });
                GoogleDriveService.sendDriveFile(response, $scope.Title).then(function(reply) {
                    console.log(reply.result);
                    $mdToast.hide();
                    $scope.close();
                });
            }
        });
    };

    $scope.findType = function() {
        if ($scope.Link === '') {
            $scope.Type = 'NoLink';
        }
        else {
            console.log("reached2");

            if ($scope.Link.match(/(?:http|https):\/\/.{2,}/)) {
                var isgdrive = $scope.Link.match(/\/(?:d|file|folder|folders)\/([-\w]{25,})/)
                if (isgdrive) {
                    $scope.Type = 'gDrive';
                    alert("Hey, that's a Google Drive link with and ID of :" + isgdrive[1]);
                }
                else {
                    $scope.Type = 'Link';
                    alert("hey, that is a link");
                }
            }
            else {
                if ($scope.Link.length > 9) {
                    $scope.Link = "http://" + $scope.Link
                }
                $scope.Type = 'Link';
            }
        }
    };

    function fillInValues() {
        if (postObj != undefined) {
            if (postObj.Type != undefined || "") {
                $scope.Type = postObj.Type;
            }
            else {
                $scope.Type = "noLink";
            }

            if (postObj.Flagged = true) {
                $scope.Flagged = true;
            }
            else {
                $scope.Flagged = false;
            }

            if (postObj.Title != undefined || "") {
                $scope.Title = postObj.Title;
            }
            else {
                $scope.Title = "";
            }

            if (postObj.CreationDate != undefined || "") {
                $scope.CreationDate = postObj.CreationDate;
            }
            else {
                $scope.CreationDate = new Date();
            }

            if (postObj.UpdateDate != undefined || "") {
                $scope.UpdateDate = postObj.UpdateDate;
            }
            else {
                $scope.UpdateDate = new Date();
            }

            if (postObj.Tags != undefined || []) {
                $scope.Tags = postObj.Tags;
            }
            else {
                $scope.Tags = [];
            }

            if (postObj.Description != undefined || "") {
                $scope.Description = postObj.Description;
            }
            else {
                $scope.Description = "";
            }

            if (postObj.Class != undefined || "") {
                $scope.Class = postObj.Class;
            }
            else {
                $scope.Class = "";
            }
        }
    }
}