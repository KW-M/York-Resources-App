var headerImg = document.getElementById("header_image");
var description = document.querySelector('#DescriptionTxt')
    /* we don't define the "new post controller" here because it was alredy
       defined by the $md-dialog in the newPost function on mainController.   */
function newPostController($scope, $mdDialog, GoogleDriveService, $mdToast, postObj, operation) {
    fillInValues();
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

    function convertImg() {
        if (headerImg.complete = true) {
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            var dataURL;
            canvas.height = this.height;
            canvas.width = this.width;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.toDataURL('png');
            callback(dataURL);
            canvas = null;
            return dataURL;
        }
        else {
            headerImg.onload = function() {
                convertImg();
            }
        }
    }
    
    $scope.isReadyToSubmit = function (){}

    $scope.submit = function() {
        if (headerImg.complete !== true) {
            headerImg.onload = function() {
                $scope.submit();
                return 'retrying'
            }
        }
        var description = document.querySelector('#DescriptionTxt').textContent;
        console.log(description);
        var response = ({
            "Type": "noLink",
            "Flagged": false,
            "Title": $scope.Title,
            "Tags": $scope.Tags,
            "Description": description.textContent,
            "Class": {
                "Name": $scope.Class,
            },
            "Link": $scope.Link,
            "FileId": $scope.Id,
            "ImageURL": convertImg(),
            "LikeUsers": [],
        });
        console.log(response);
        if ($scope.Type === "gDrive") {
            var toast = $mdToast.simple()
                .textContent('')
                .action('OK')
                .highlightAction(true)
                .highlightClass('md-primary') // Accent is used by default, this just demonstrates the usage.
            $mdToast.show(toast).then(function(response) {
                if (response == 'ok') {
                    
                }
            });
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
                hideDelay: 3000000,
            });
            GoogleDriveService.sendDriveFile(response, $scope.Title).then(function(reply) {
                console.log(reply.result);
                $mdToast.hide();
                $scope.close();
            });
        }
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

            if (postObj.Class.Name != undefined || "") {
                $scope.Class.Name = postObj.Class.Name;
            }
            else {
                $scope.Class.Name = '';
            }

            if (postObj.Link != undefined || "") {
                $scope.Link = postObj.Link;
            }
            else {
                $scope.Link = "";
            }

            if (postObj.FileId != undefined || "") {
                $scope.FileId = postObj.FileId;
            }
            else {
                $scope.FileId = "";
            }

            if (postObj.ImageURL != undefined || "") {
                $scope.ImageURL = postObj.ImageURL;
            }
            else {
                $scope.ImageURL = "";
            }

            if (postObj.LikeUsers != undefined || "") {
                $scope.LikeUsers = postObj.LikeUsers;
            }
            else {
                $scope.LikeUsers = [];
            }
        }
    }
}