    /* we don't define the "new post controller" here because it was alredy
                       defined by the $md-dialog in the newPost function on mainController.   */
    function newPostController($scope, $mdDialog, GoogleDriveService, $mdToast, postObj, operation) {
        //database variables
        $scope.Type = 'noLink';
        $scope.Flagged = false;
        $scope.Title = '';
        $scope.CreationDate = new Date();
        $scope.UpdateDate = new Date();
        $scope.Tags = [];
        $scope.Description = '';
        $scope.Class = '';
        $scope.Link = '';
        $scope.FileId = '';
        $scope.HeaderImage = '';
        $scope.LikeUsers = [];
        fillInValues();
        
        //temproary variables
        $scope.driveThumbnail = "";
        $scope.classSearch = "";
        

        $scope.Preview = function() {
            if ($scope.Type === "Link") {
                $scope.HeaderImage = 'https://crossorigin.me/https://api.pagelr.com/capture/javascript?uri=' + $scope.Link + '&width=400&height=260&ads=0&format=png&maxage=32000000&key=Ca7GOVe9BkGefE_rvwN2Bw'
            }
            else if ($scope.Type === "gDrive") {
                 $scope.HeaderImage = $scope.driveThumbnail;
            }
        };

        function convertImg(ImageElement)  {
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            var dataURL;
            canvas.height = ImageElement.height;
            canvas.width = ImageElement.width;
            ctx.drawImage(ImageElement, 0, 0);
            dataURL = canvas.toDataURL('png');
            canvas = null;
            console.log(dataURL);
            return dataURL;
        }

        $scope.isReadyToSubmit = function() {
            convertImg($scope.newPostHeaderImg)
            console.log($scope.dialogElement);
            console.log(document.getElementById('header_image'));
            if ($scope.Class === '' || $scope.Class === undefined) {
                $mdToast.show({
                    template: '<md-toast><div class="md-toast-content">Please select a class for this post.</div><md-toast>',
                    hideDelay: 1500,
                    parent: document.getElementById('new_post_dialog'),
                });
            } else {
                if ($scope.Title === '' || $scope.Title === undefined) {
                    $mdToast.show({
                        template: '<md-toast><div class="md-toast-content">Posts must have a title.</div></md-toast>',
                        hideDelay: 1500,
                        parent: document.getElementById('new_post_dialog'),
                    });
                }else {
                    if ($scope.Type === "gDrive") {
                        $mdToast.show({
                            template: '<md-toast style="width: 100%;"><div style="flex-direction: column; height: 100%;" class="md-toast-content"><p style="margin-top:10px">This will allow people at York to view the linked file.</p><span flex layout="row" style="width:100%"><md-button style="width:100%" ng-click="checkHeaderImg()">Ok</md-button></span><div></md-toast>',
                            hideDelay: 3000000,
                            parent: $scope.dialogElement,
                        });
                    }
                    else {
                        $scope.checkHeaderImg();
                    }
                }
            }
        }
        
        $scope.checkHeaderImg = function () {
                $mdToast.show({
                    template: '<md-toast><span style="font-size:18px; max-width: 200px">Posting...</span><span flex></span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right:-20px"></md-progress-circular></md-toast>',
                    hideDelay: 3000000,
                });
                if ($scope.newPostHeaderImg.complete === true) {
                    $scope.submit();
                }
                else {
                    $scope.newPostHeaderImg.onload = function() {
                        $scope.submit();
                    }
                }
        };

        $scope.submit = function() {
            var response = ({
                "Type": $scope.Type,
                "Flagged": false,
                "Title": $scope.Title,
                "Tags": $scope.Tags,
                "Description": $scope.newPostDescription.textContent,
                "Class": {
                    "Name": $scope.Class,
                },
                "Link": $scope.Link,
                "FileId": $scope.Id,
                "HeaderImage": convertImg($scope.newPostHeaderImg),
                "LikeUsers": [],
            });
            if (operation === 'new') {
            // GoogleDriveService.sendDriveFile(response, $scope.Title).then(function(reply) {
            //     console.log(reply.result);
            //     $mdToast.hide();
            //     $scope.close();
            // });
            } else if (operation === 'update') {
                
            }
        }

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
                    }
                    else {
                        $scope.Type = 'Link';
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
            if (postObj !== undefined) {
                if (postObj.Type !== undefined && postObj.Type !== "") {
                    $scope.Type = postObj.Type;
                }

                if (postObj.Flagged === true) {
                    $scope.Flagged = true;
                }

                if (postObj.Title !== undefined) {
                    $scope.Title = postObj.Title;
                }

                if (postObj.CreationDate !== undefined) {
                    $scope.CreationDate = postObj.CreationDate;
                }

                if (postObj.UpdateDate !== undefined) {
                    $scope.UpdateDate = postObj.UpdateDate;
                }

                if (postObj.Tags !== undefined) {
                    $scope.Tags = postObj.Tags;
                }

                if (postObj.Description !== undefined) {
                    $scope.newPostDescription = postObj.Description;
                }

                if (postObj.Class.Name !== undefined) {
                    $scope.Class = postObj.Class;
                }

                if (postObj.Link !== undefined) {
                    $scope.Link = postObj.Link;
                }

                if (postObj.FileId !== undefined) {
                    $scope.FileId = postObj.FileId;
                }

                if (postObj.HeaderImage !== undefined) {
                    $scope.HeaderImage = postObj.HeaderImage;
                }

                if (postObj.LikeUsers !== undefined) {
                    $scope.LikeUsers = postObj.LikeUsers;
                }
            }
        }
}