    /* we don't define the "new post controller" here because it was alredy
                       defined by the $md-dialog in the newPost function on mainController.   */
    function newPostController($scope, $mdDialog, GoogleDriveService, $mdToast, postObj, operation) {
        operation = 'new'
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
        $scope.LikeUsers = [];
        $scope.HeaderImage = '';
        fillInValues();
        
        //temproary variables
        $scope.driveThumbnail = "";
        $scope.classSearch = "";
        var canvas = document.getElementById('image_renderer');
        var ctx = canvas.getContext('2d');
        var dataURL;
        

        $scope.ImagePreview = function() {
            if ($scope.Type === "Link") {
                return convertImg($scope.newPostHeaderImg);
            }
            else if ($scope.Type === "gDrive") {
                 $scope.driveThumbnail;
            } else {
                return "";
            }
        };

        function convertImg(ImageElement)  {
            canvas.height = ImageElement.height;
            canvas.width = ImageElement.width;
            ctx.drawImage(ImageElement, 0, 0);
            dataURL = canvas.toDataURL('jpg');
            canvas = null;
            console.log(dataURL);
            return dataURL;
        }

        $scope.isReadyToSubmit = function() {
             console.log($scope.Class);
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
            if (operation === 'new') {
                Queue(GoogleDriveService.sendDriveFile(response, $scope.Title), function(reply) {
                    console.log(reply.result);
                    $mdToast.hide();
                    $scope.close();
                }));
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

                if (postObj.LikeUsers !== undefined) {
                    $scope.LikeUsers = postObj.LikeUsers;
                }

                if (postObj.HeaderImage !== undefined) {
                    $scope.HeaderImage = postObj.HeaderImage;
                }

            }
        }
        
    $scope.compilePostToMetadata = function() {
      var metadata = {}
      var tagString = JSON.stringify($scope.Tags);
      
      metadata.properties.Tag1 = tagString.match(/[\s\S]{1,3}/g) || "[]";
      metadata.properties.Tag2 = tagString.match(/[\s\S]{1,3}/g) || "[]";
      metadata.properties.Tag3 = tagString.match(/[\s\S]{1,3}/g) || "[]";
      metadata.properties.Tag4 = tagString.match(/[\s\S]{1,3}/g) || "[]";
      metadata.properties.Tag5 = tagString.match(/[\s\S]{1,3}/g) || "[]";
      
      metadata.name = $scope.Title+"|%9]{_7^/|"+$scope.Link;
     
      metadata.properties.Type = $scope.Type;
      metadata.properties.Flagged = $scope.Flagged;
      
      metadata.description = $scope.newPostDescription.innerHTML;
      
      metadata.properties.ClassName = $scope.Class.Name;
      metadata.properties.ClassCatagory = $scope.Class.Catagory;
      metadata.properties.ClassColor = $scope.Class.Color;
      
      metadata.properties.attachmentId = $scope.FileId;

      metadata.contentHints.thumbnail = $scope.ImagePreview();
      metadata.contentHints.mimeType = "image/png";
      
      console.log(metadata);
      
      return metadata;
   }
        
    $scope.close = function() {
        $mdDialog.hide();
    };
}