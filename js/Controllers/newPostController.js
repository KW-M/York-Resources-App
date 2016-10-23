    /* we don't define the "new post controller" here because it was alredy
                                                                                               defined by the $md-dialog in the newPost function on mainController.   */
    function newPostController($scope, $timeout, $mdDialog, GoogleDriveService, $mdToast, postObj, operation) {
        $timeout(function() {
            $scope.Post = {
                Title: postObj.Title || '',
                Description: postObj.Description || '',
                Link: postObj.Link || '',
                Tags: postObj.Tags || [],
                Type: postObj.Type || 'noLink',
                Flagged: postObj.Flagged || false,
                CreationDate: postObj.CreationDate || new Date(),
                UpdateDate: postObj.UpdateDate || new Date(),
                Class: postObj.Class || {
                    Name: '',
                    Catagory: '',
                    Color: '#ffffff',
                },
                Creator: postObj.Creator || {
                    ClassOf: '',
                    Email: '',
                    Me: null,
                    Name: '',
                },
                Id: postObj.Id || '',
                AttachmentId: postObj.AttachmentId || '',
                AttachmentName: postObj.AttachmentName || '',
                AttachmentIcon: postObj.AttachmentIcon || '',
                Likes: postObj.Likes || [],
                PreviewImage: postObj.PreviewImage || '',
                Bookmarked: postObj.Bookmarked || false,
            }
            $scope.findType();
        })

        //temproary variables
        $scope.operation = operation;
        $scope.previewThumbnail = "";
        $scope.previewLoading = false;
        $scope.classSearch = "";
        var request = new XMLHttpRequest();

        $scope.findType = function() {
            $scope.Post.PreviewImage = '';
            $scope.Post.AttachmentId = '';
            $scope.Post.AttachmentName = '';
            $scope.Post.AttachmentIcon = '';
            if ($scope.Post.Link === '') {
                $scope.Post.Type = 'NoLink';
                $timeout(function() {
                    $scope.Post.PreviewImage = ''; // will be the down arrow photo
                    $scope.previewLoading = false;
                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                })
            } else if ($scope.Post.Link.match(/(?:http|https):\/\/.{2,}/)) {
                $scope.previewLoading = true;
                var driveId = $scope.Post.Link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=))([-\w]{25,})/);
                console.log(driveId)
                if (driveId) {
                    $scope.Post.Type = 'gDrive';
                    $scope.Post.AttachmentId = driveId[1]
                    queue(GoogleDriveService.getFileThumbnail($scope.Post.AttachmentId), function(response) {
                        var thumbnail = response.result.thumbnailLink;
                        $timeout(function() {
                            console.log(response);
                            $scope.Post.PreviewImage = thumbnail;
                            $scope.Post.AttachmentIcon = response.result.iconLink;
                            // response.result.thumbnailLink.replace("=s220","=s400");
                            $scope.previewLoading = false;
                            document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                        });
                    });
                } else {
                    $scope.Post.Type = 'Link';
                    request.open('HEAD', 'https://jsonp.afeld.me/?url=' + $scope.Post.Link, true); // to implement: img checking and icon for non existant thumnail drive docs
                    request.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                            console.log(this)
                            var type = this.getResponseHeader('content-type')
                            if (this.getResponseHeader('content-type').indexOf('image') != -1) {
                                $timeout(function() {
                                    $scope.Post.PreviewImage = $scope.Post.Link;
                                    $scope.previewLoading = false;
                                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                                })
                            } else {
                                GoogleDriveService.getWebsiteScreenshot($scope.Post.Link).then(function(response) {
                                    $timeout(function() {
                                        $scope.Post.PreviewImage = "data:image/jpeg;base64," + response.result.screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
                                        $scope.previewLoading = false;
                                        document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                                    })
                                })
                            }
                        }
                    };
                    request.send();
                }
            } else if ($scope.Post.Link.length > 9) {
                $scope.Post.Link = "http://" + $scope.Post.Link;
                $scope.Post.Type = 'Link';
                $scope.findType();
            } else {
                $scope.Post.Type = 'NoLink';
            }
        };

        $scope.isReadyToSubmit = function() {
            if ($scope.Post.Class.Name === '' || $scope.Post.Class === undefined) {
                $mdToast.show({
                    template: '<md-toast><div class="md-toast-content">Please select a class for this post.</div><md-toast>',
                    hideDelay: 1500,
                    parent: document.getElementById('new_post_dialog'),
                });
            } else {
                if ($scope.Post.Title === '' || $scope.Post.Title === undefined) {
                    $mdToast.show({
                        template: '<md-toast><div class="md-toast-content">Posts must have a title.</div></md-toast>',
                        hideDelay: 1500,
                        parent: document.getElementById('new_post_dialog'),
                    });
                } else {
                    if ($scope.Post.Type === "gDrive") {
                        $mdToast.show({
                            template: '<md-toast style="width: 100%;"><div style="flex-direction: column; height: 100%;" class="md-toast-content"><p style="margin-top:10px">This will allow people at York to view the linked file.</p><span flex layout="row" style="width:100%"><md-button style="width:100%" ng-click="checkHeaderImg()">Got It</md-button></span><div></md-toast>',
                            hideDelay: 3000000,
                            parent: document.getElementById('new_post_dialog'),
                        });
                    } else {
                        $mdToast.show({
                            template: '<md-toast><span style="font-size:18px; max-width: 200px">Posting...</span><span flex></span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right: -12px;" md-diameter="36"></md-progress-circular></md-toast>',
                            hideDelay: 3000000,
                        });
                        if ($scope.previewLoading) {
                            document.addEventListener('urlPreviewLoaded', function() {
                                $scope.submit();
                            });
                        } else {
                            $scope.submit();
                        }
                    }
                }
            }
        }

        $scope.submit = function() {
            if (operation === 'new') {
                var metadata = $scope.convertPostToDriveMetadata($scope.Post);
                console.log({
                    Post: $scope.Post,
                    Metadata: metadata
                });
                GoogleDriveService.AppsScriptNewFile().then(function(response) {
                    console.log(response)
                    console.log(metadata)
                    queue(GoogleDriveService.updateFileMetadata(response.data, metadata), function(reply) {
                        console.log(reply.result);
                        $mdToast.hide();
                    }, function(error) {
                        console.warn(error);
                    });
                }, function(error) {
                    console.warn(error)
                });
            } else if (operation === 'update') {
                var metadata = $scope.compileUpdateToMetadata();
                queue(GoogleDriveService.updateFileMetadata(postObj.Id, metadata), function(reply) {
                    console.log(reply.result);
                    $mdToast.hide();
                }, function(error) {
                    console.warn(error);
                });
            }
        }

        $scope.closeDialog = function() {
            $mdDialog.hide();
        };
    }