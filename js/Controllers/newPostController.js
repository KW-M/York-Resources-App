    /* we don't define the "new post controller" here because it was alredy
                                                       defined by the $md-dialog in the newPost function on mainController.   */
    function newPostController($scope, $mdDialog, GoogleDriveService, $mdToast, postObj, operation) {
        //database variables
        // $scope.post.Type = 'noLink';
        // $scope.Flagged = false;
        // $scope.Title = '';
        // $scope.CreationDate = new Date();
        // $scope.UpdateDate = new Date();
        // $scope.Tags = [];
        // $scope.Description = '';
        // $scope.Class = {Name:''};
        // $scope.post.Link = '';
        // $scope.AttachmentId = '';
        // $scope.LikeUsers = [];
        // $scope.HeaderImage = '';

        $scope.post = {
                Type: 'noLink',
                Flagged: false,
                Title: null,
                CreationDate: new Date(),
                UpdateDate: new Date(),
                Tags: [],
                Description: '',
                Class: {
                    Name: '',
                },
                Link: '',
                AttachmentId: '',
                Likes: 0,
                HeaderImage: '',
            }
            // fillInValues();

        //temproary variables
        $scope.operation = operation;
        $scope.previewThumbnail = "";
        $scope.previewLoading = false;
        $scope.classSearch = "";
        var request = new XMLHttpRequest();
        // var canvas = document.getElementById('image_renderer');
        // var ctx = canvas.getContext('2d');
        // var dataURL;

        $scope.findType = function() {
            $scope.previewLoading = true;
            if ($scope.post.Link === '') {
                $scope.post.Type = 'NoLink';
                $scope.post.HeaderImage = ''; // will be the down arrow photo
                $scope.previewLoading = false;
            }
            else if ($scope.post.Link.match(/(?:http|https):\/\/.{2,}/)) {
                var isgdrive = $scope.post.Link.match(/\/(?:d|file|folder|folders)\/([-\w]{25,})/)
                if (isgdrive) {
                    $scope.post.Type = 'gDrive';
                    $scope.post.HeaderImage = "https://drive.google.com/thumbnail?authuser=0&sz=w400&id=" + $scope.AttachmentId;
                }
                else {
                    $scope.post.Type = 'Link';
                    request.open('HEAD', 'https://crossorigin.me/' + $scope.post.Link, true); // to implement: img checking and icon for non existant thumnail drive docs
                    request.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                            console.log(this)
                            var type = this.getResponseHeader('content-type')
                            if (this.getResponseHeader('content-type').indexOf('image') != -1) {
                                $scope.post.HeaderImage = $scope.post.Link
                            } else {
                                GoogleDriveService.getWebsiteScreenshot($scope.post.Link).then(function(response){
                                    console.log("data:image/jpeg;base64," + response.result.screenshot.data);
                                    $scope.post.HeaderImage = "data:image/jpeg;base64," + response.result.screenshot.data;   
                                })
                                
                            }
                        }
                    };
                    request.send();
                }
            }
            else if ($scope.post.Link.length > 9) {
                $scope.post.Link = "http://" + $scope.post.Link;
                $scope.post.Type = 'Link';
            }
            else {
                $scope.post.Type = 'Link';
            }

        };

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
                    if ($scope.post.Type === "gDrive") {
                        $mdToast.show({
                            template: '<md-toast style="width: 100%;"><div style="flex-direction: column; height: 100%;" class="md-toast-content"><p style="margin-top:10px">This will allow people at York to view the linked file.</p><span flex layout="row" style="width:100%"><md-button style="width:100%" ng-click="checkHeaderImg()">Got It</md-button></span><div></md-toast>',
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
                template: '<md-toast><span style="font-size:18px; max-width: 200px">Posting...</span><span flex></span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right: -12px;" md-diameter="36"></md-progress-circular></md-toast>',
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
            $scope.closeDialog();
            if (operation === 'new') {
                var metadata = $scope.compilePostToMetadata();
                queue(GoogleDriveService.createDriveFile(metadata), function(reply) {
                    console.log(reply.result);
                    $mdToast.hide();
                }, function(err) {
                    console.log(err);
                });
            }
            else if (operation === 'update') {
                var metadata = $scope.compileUpdateToMetadata();
                queue(GoogleDriveService.updateFileMetadata(postObj.Id, metadata), function(reply) {
                    console.log(reply.result);
                    $mdToast.hide();
                }, function(err) {
                    console.log(err);
                });
            }
        }

        // function fillInValues() {
        //     console.log("postObj");
        //     console.log(postObj);
        //     if (postObj !== undefined) {
        //         if (postObj.Type !== undefined && postObj.Type !== "") {
        //             $scope.post.Type = postObj.Type;
        //         }

        //         if (postObj.Flagged === true) {
        //             $scope.Flagged = true;
        //         }

        //         if (postObj.Title !== undefined) {
        //             $scope.post.Title = postObj.Title;
        //         }

        //         if (postObj.CreationDate !== undefined) {
        //             $scope.post.CreationDate = postObj.CreationDate;
        //         }

        //         if (postObj.UpdateDate !== undefined) {
        //             $scope.UpdateDate = postObj.UpdateDate;
        //         }

        //         if (postObj.Tags) {
        //             $scope.Tags = postObj.Tags;
        //         }
        //         else {
        //             $scope.Tags = [];
        //         }

        //         if (postObj.Description) {
        //             $scope.Description = postObj.Description;
        //         }

        //         if (postObj.Class) {
        //             console.log(postObj.Class)
        //             $scope.Class = postObj.Class
        //         }

        //         if (postObj.Link !== undefined) {
        //             $scope.post.Link = postObj.Link;
        //         }

        //         if (postObj.AttachmentId !== undefined) {
        //             $scope.AttachmentId = postObj.AttachmentId;
        //         }

        //         if (postObj.LikeUsers !== undefined) {
        //             $scope.LikeUsers = postObj.LikeUsers;
        //         }

        //         if (postObj.HeaderImage !== undefined) {
        //             $scope.HeaderImage = postObj.HeaderImage;
        //         }
        //     }
        //     console.log($scope.Tags);
        // }

        $scope.compilePostToMetadata = function() {
            var metadata = {
                properties: {},
                contentHints: {
                    thumbnail: {},
                },
            }

            var tagString = JSON.stringify($scope.Tags).replace(/[\[\]"]+/g, '').match(/[\s\S]{1,116}/g) || [];

            metadata.properties.Tag1 = tagString[0] || "";
            metadata.properties.Tag2 = tagString[1] || "";

            metadata.name = $scope.Title + "{]|[}" + ($scope.post.Link || "") + "{]|[}";

            metadata.properties.Type = $scope.post.Type;
            metadata.properties.Flagged = $scope.Flagged;

            metadata.description = $scope.Description;

            metadata.properties.ClassName = $scope.Class.Name;
            metadata.properties.ClassCatagory = $scope.Class.Catagory;
            metadata.properties.ClassColor = $scope.Class.Color;

            metadata.properties.attachmentId = $scope.AttachmentId;

            metadata.mimeType = "application/octet-stream"

            metadata.contentHints.indexableText = " class: " + $scope.Class.Name + " class-catagory: " + $scope.Class.Catagory + " tags: " + tagString + " attachmentId: " + $scope.AttachmentId;

            metadata.contentHints.thumbnail.image = getImagePreview(true);
            metadata.contentHints.thumbnail.mimeType = "image/png";

            console.log(metadata);

            return metadata;
        }

        $scope.compileUpdateToMetadata = function() {
            var metadata = {
                properties: {},
                contentHints: {
                    thumbnail: {},
                },
            }

            if (postObj.Type !== $scope.post.Type) {
                metadata.properties.Type = $scope.post.Type;
            }

            if (postObj.Flagged !== $scope.Flagged) {
                metadata.properties.Flagged = $scope.Flagged;
            }

            if (postObj.Title !== $scope.Title) {
                metadata.name = $scope.Title + "{]|[}" + ($scope.post.Link || "") + "{]|[}";
            }

            if (postObj.Tags !== $scope.Tags) {
                var tagString = JSON.stringify($scope.Tags).replace(/[\[\]"]+/g, '').match(/[\s\S]{1,116}/g) || [];
                metadata.properties.Tag1 = tagString[0] || "";
                metadata.properties.Tag2 = tagString[1] || "";
            }

            if (postObj.Description !== $scope.Description) {
                metadata.description = $scope.Description;
            }

            if (postObj.Class.Name !== $scope.Class.Name) {
                metadata.properties.ClassName = $scope.Class.Name;
                metadata.properties.ClassCatagory = $scope.Class.Catagory;
                metadata.properties.ClassColor = $scope.Class.Color;
            }

            if (postObj.Link !== $scope.post.Link) {
                metadata.name = $scope.Title + "{]|[}" + ($scope.post.Link || "") + "{]|[}";
                metadata.contentHints.thumbnail.image = getImagePreview(true);
                metadata.contentHints.thumbnail.mimeType = "image/png";
            }

            if (postObj.AttachmentId !== $scope.AttachmentId) {
                metadata.properties.attachmentId = $scope.AttachmentId;
            }
            metadata.contentHints.indexableText = " class: " + $scope.Class.Name + " class-catagory: " + $scope.Class.Catagory + " tags: " + tagString + " attachmentId: " + $scope.AttachmentId;
            console.log(metadata);

            return metadata;
        }

        function getImagePreview(isSubmit) {
            if (isSubmit) {
                if ($scope.post.Type === "Link") {
                    var base64 = convertImg($scope.newPostHeaderImg)
                    var base64url = base64.substring(22).replace(/\+/g, '-').replace(/\//g, '_');;
                    return base64url;
                }
                else {
                    return "";
                }
            }
            else {
                if ($scope.post.Type === "Link") {
                    $scope.previewThumbnail = 'https://crossorigin.me/https://api.pagelr.com/capture/javascript?uri=' + encodeURIComponent($scope.post.Link) + '&width=400&height=260&maxage=7884000&key=Ca7GOVe9BkGefE_rvwN2Bw';
                }
                else if ($scope.post.Type === "gDrive") {
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

        $scope.closeDialog = function() {
            $mdDialog.hide();
        };
    }