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
        $scope.AttachmentId = '';
        $scope.LikeUsers = [];
        $scope.HeaderImage = '';
        fillInValues();

        //temproary variables
        $scope.previewThumbnail = "";
        $scope.classSearch = "";
        var xhttp = new XMLHttpRequest();
        var canvas = document.getElementById('image_renderer');
        var ctx = canvas.getContext('2d');
        var dataURL;


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
            }
            else {
                if ($scope.Title === '' || $scope.Title === undefined) {
                    $mdToast.show({
                        template: '<md-toast><div class="md-toast-content">Posts must have a title.</div></md-toast>',
                        hideDelay: 1500,
                        parent: document.getElementById('new_post_dialog'),
                    });
                }
                else {
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

        $scope.checkHeaderImg = function() {
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
            $scope.close();
            var metadata = $scope.compilePostToMetadata();
            if (operation === 'new') {
                queue(GoogleDriveService.createDriveFile(metadata), function(reply) {
                    console.log(reply.result);
                    $mdToast.hide();
                });
            }
            else if (operation === 'update') {

            }
        }

        $scope.findType = function() {
            if ($scope.Link === '') {
                $scope.Type = 'NoLink';
            }
            else {
                xhttp.open('HEAD', $scope.link);
                xhttp.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        console.log(this.getResponseHeader("Content-Type"));
                    }
                };
                xhttp.send();

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
                getImagePreview(false);
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

                if (postObj.AttachmentId !== undefined) {
                    $scope.AttachmentId = postObj.AttachmentId;
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
            var metadata = {
                properties: {},
                contentHints: {
                    thumbnail: {},
                },
            }
            var tagString = JSON.stringify($scope.Tags).replace(/[\[\]"]+/g, '').match(/[\s\S]{1,116}/g) || [];
            var classObject = JSON.parse($scope.Class);

            metadata.properties.Tag1 = tagString[0] || "";
            metadata.properties.Tag2 = tagString[1] || "";

            metadata.name = $scope.Title + "{]|[}" + ($scope.Link || "");

            metadata.properties.Type = $scope.Type;
            metadata.properties.Flagged = $scope.Flagged;

            metadata.description = $scope.newPostDescription.innerHTML;

            metadata.properties.ClassName = classObject.Name;
            metadata.properties.ClassCatagory = classObject.Catagory;
            metadata.properties.ClassColor = classObject.Color;

            metadata.properties.attachmentId = $scope.AttachmentId;
            
            metadata.mimeType = "application/vnd.google-apps.unknown"
            
            metadata.contentHints.indexableText = "class: " + classObject.Name +" class-catagory: " + classObject.Catagory + " tags: " + tagString + " attachmentId: " + $scope.AttachmentId;

            metadata.contentHints.thumbnail.image = getImagePreview(true);
            metadata.contentHints.thumbnail.mimeType = "image/png";

            console.log(metadata);

            return metadata;
        }

        function getImagePreview(isSubmit) {
            if (isSubmit) {
                if ($scope.Type === "Link") {
                    var base64 = convertImg($scope.newPostHeaderImg)
                    var base64url = base64.substring(22).replace(/\+/g, '-').replace(/\//g, '_');;
                    return base64url;
                }
                else {
                    return "";
                }
            }
            else {
                if ($scope.Type === "Link") {
                    $scope.previewThumbnail = 'https://crossorigin.me/https://api.pagelr.com/capture/javascript?uri=' + encodeURIComponent($scope.Link) + '&width=400&height=260&ads=0&maxage=32000000&key=Ca7GOVe9BkGefE_rvwN2Bw';
                }
                else if ($scope.Type === "gDrive") {
                    $scope.previewThumbnail = "https://drive.google.com/thumbnail?authuser=0&sz=w400&id=" + $scope.AttachmentId;
                }
                else {
                    $scope.previewThumbnail = "";
                }
                return $scope.previewThumbnail;
            }

        };

        function convertImg(ImageElement) {
            ctx.drawImage(ImageElement, 0, 0);
            dataURL = canvas.toDataURL();
            console.log(dataURL);
            return dataURL;
        }

        $scope.close = function() {
            $mdDialog.hide();
        };
    }