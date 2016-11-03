    /* we don't define the "new post controller" here because it was alredy
                                                                                                               defined by the $md-dialog in the newPost function on mainController.   */
    function newPostController($scope, $timeout, $http, $mdDialog, GoogleDriveService, $mdToast, Post, operation) {
        var linkChangeTimer = null;
        console.log(Post);
        Post.title = 'now now'
        
        $timeout(function() {
                Post.Title: postObj.Title || '',
                Post.Description: postObj.Description || '',
                Post.Link: postObj.Link || '',
                Post.Tags: postObj.Tags || [],
                Post.Type: postObj.Type || 'noLink',
                Post.Flagged: postObj.Flagged || false,
                Post.CreationDate: postObj.CreationDate || new Date(),
                Post.UpdateDate: postObj.UpdateDate || new Date(),
                Post.Class: postObj.Class || {
                    Name: '',
                    Catagory: '',
                    Color: '#ffffff',
                },
                Post.Creator: postObj.Creator || {
                    ClassOf: '',
                    Email: '',
                    Me: null,
                    Name: '',
                },
                Post.Id: postObj.Id || '',
                Post.AttachmentId: postObj.AttachmentId || '',
                Post.AttachmentName: postObj.AttachmentName || '',
                Post.AttachmentIcon: postObj.AttachmentIcon || '',
                Post.Likes: postObj.Likes || [],
                Post.PreviewImage: postObj.PreviewImage || '',
                Post.Bookmarked: postObj.Bookmarked || false,
            }
            $scope.findType();
        })

        //temproary variables
        $scope.operation = operation;
        $scope.previewThumbnail = "";
        $scope.previewLoading = false;
        $scope.classSearch = "";

        $scope.findType = function() {
            console.log('findingType')
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
                if (driveId) {
                    $scope.Post.Type = 'gDrive';
                    $scope.Post.AttachmentId = driveId[1]
                    queue('drive',GoogleDriveService.getFileThumbnail($scope.Post.AttachmentId), function(response) {
                        var thumbnail = response.result.thumbnailLink;
                        $timeout(function() {
                            console.log(response);
                            if (response.result.thumbnailLink) {
                                $scope.Post.PreviewImage = thumbnail.replace("=s220", "=s400");
                            } else {
                                "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
                            }
                            $scope.Post.AttachmentName = response.result.name;
                            $scope.Post.AttachmentIcon = response.result.iconLink;
                            //response.result.thumbnailLink.replace("=s220","=s400");
                            $scope.previewLoading = false;
                            document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                        }, function(error) {
                            console.log(error);
                            $scope.Post.Type = 'Link';
                            queue('screenshot',GoogleDriveService.getWebsiteScreenshot($scope.Post.Link),function(response) {
                                console.log(response)
                                $timeout(function() {
                                    $scope.Post.PreviewImage = "data:image/jpeg;base64," + response.result.screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
                                    $scope.previewLoading = false;
                                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                                })
                            }, function(error) {
                                console.log(error)
                                $timeout(function() {
                                    $scope.Post.PreviewImage = "https://www.techtricksworld.com/wp-content/uploads/2015/12/Error-404.png"
                                    $scope.previewLoading = false;
                                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                                })
                            },10);
                        });
                    }, null, 150);
                } else {
                    $scope.Post.Type = 'Link';
                    $http.head('https://jsonp.afeld.me/?url=' + $scope.Post.Link).then(function(result) {
                        console.log(result)
                        if (result.headers()['content-type'].indexOf('image') != -1) {
                            $timeout(function() {
                                $scope.Post.PreviewImage = $scope.Post.Link;
                                $scope.previewLoading = false;
                                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                            })
                        } else {
                            console.log('notImage')
                            GoogleDriveService.getWebsiteScreenshot($scope.Post.Link).then(function(response) {
                                console.log(response)
                                $timeout(function() {
                                    $scope.Post.PreviewImage = "data:image/jpeg;base64," + response.result.screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
                                    $scope.previewLoading = false;
                                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                                })
                            }, function(error) {
                                console.log(error)
                                $timeout(function() {
                                    $scope.Post.PreviewImage = "https://www.techtricksworld.com/wp-content/uploads/2015/12/Error-404.png"
                                    $scope.previewLoading = false;
                                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                                })
                            })
                        }
                    }, function(error) {
                        console.log(error)
                        queue('screenshot',GoogleDriveService.getWebsiteScreenshot($scope.Post.Link),function(response) {
                            $timeout(function() {
                                $scope.Post.PreviewImage = "data:image/jpeg;base64," + response.result.screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
                                $scope.previewLoading = false;
                                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                            })
                        }, function(error) {
                            console.log(error)
                            $timeout(function() {
                                $scope.Post.PreviewImage = "https://www.techtricksworld.com/wp-content/uploads/2015/12/Error-404.png"
                                $scope.previewLoading = false;
                                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                            })
                        },10)
                    })
                }
            } else if ($scope.Post.Link.length > 9) {
                $scope.Post.Link = "http://" + $scope.Post.Link;
                $scope.Post.Type = 'Link';
                //$scope.findType();
            } else {
                $scope.Post.Type = 'NoLink';
            }
        };

        $scope.$watch('Post.Link', function() {
            if (typeof(linkChangeTimer) == 'number') {
                console.log('clearingtimer')
                clearTimeout(linkChangeTimer);
            }
            linkChangeTimer = setTimeout($scope.findType(), 500)
        })

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
                queue('other',GoogleDriveService.AppsScriptNewFile(),function(response) {
                    console.log(response)
                    console.log(metadata)
                    queue('drive',GoogleDriveService.updateFileMetadata(response.data, metadata), function(reply) {
                        console.log(reply.result);
                        $mdToast.hide();
                    }, function(error) {
                        console.warn(error);
                    },150);
                }, function(error) {
                    console.warn(error)
                },2);
            } else if (operation === 'update') {
                var metadata = $scope.compileUpdateToMetadata();
                queue('drive',GoogleDriveService.updateFileMetadata(postObj.Id, metadata), function(reply) {
                    console.log(reply.result);
                    $mdToast.hide();
                }, function(error) {
                    console.warn(error);
                },150);
            }
        }

        $scope.clearLink = function() {
            $timeout(function() {
                $scope.Post.Link = ""
                $scope.Post.Type = "NoLink"
            })
        }

        $scope.closeDialog = function() {
            $mdDialog.hide();
        };
    }