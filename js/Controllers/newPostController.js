    /* we don't define the "new post controller" here because it was alredy
                                                                                                                                                               defined by the $md-dialog in the newPost function on mainController.   */
    function newPostController($scope, $timeout, $http, $mdDialog, GoogleDriveService, authorizationService, $mdToast, postObj, operation) {
        console.log(postObj)
        var linkChangeTimer = null;
        var originalPost = angular.copy(postObj);
        $scope.Post = postObj;
        $timeout(function() {
            $scope.Post.Title = $scope.Post.Title || ''
            $scope.Post.Description = $scope.Post.Description || ''
            $scope.Post.Link = $scope.Post.Link || ''
            $scope.Post.Labels = $scope.Post.Labels || []
            $scope.Post.Type = $scope.Post.Type || 'noLink'
            $scope.Post.Flagged = $scope.Post.Flagged || false
            $scope.Post.CreationDate = $scope.Post.CreationDate || new Date()
            $scope.Post.UpdateDate = $scope.Post.UpdateDate || new Date()
            $scope.Post.Class = $scope.Post.Class || {
                Name: '',
                Catagory: '',
                Color: 'ff00ff',
            }
            $scope.Post.Creator = (operation == 'new') ? ({
                ClassOf: $scope.myInfo.ClassOf,
                Email: $scope.myInfo.Email,
                Me: true,
                Name: $scope.myInfo.Name,
            }) : ($scope.Post.Creator || {
                ClassOf: '',
                Email: '',
                Me: null,
                Name: ''
            })
            $scope.Post.Id = $scope.Post.Id || ''
            $scope.Post.AttachmentId = $scope.Post.AttachmentId || ''
            $scope.Post.AttachmentName = $scope.Post.AttachmentName || ''
            $scope.Post.AttachmentIcon = $scope.Post.AttachmentIcon || ''
            $scope.Post.Likes = $scope.Post.Likes || []
            $scope.Post.PreviewImage = $scope.Post.PreviewImage || ''
            runFindType();
        })

        //temproary variables
        $scope.operation = operation;
        $scope.previewThumbnail = "";
        $scope.previewLoading = false;
        $scope.classSearch = "";
        $scope.shareSelect = "view"

        $scope.findType = function() {
            if ($scope.Post.Link === '') {
                $scope.Post.PreviewImage = '';
                $scope.Post.AttachmentId = '';
                $scope.Post.AttachmentName = '';
                $scope.Post.AttachmentIcon = '';
                $scope.Post.Type = 'NoLink';
                $timeout(function() {
                    $scope.Post.PreviewImage = ''; // will be the down arrow photo
                    $scope.previewLoading = false;
                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                })
            }
            else if ($scope.Post.Link.match(/(?:http|https):\/\/.{2,}/)) {
                $scope.previewLoading = true;
                var driveId = $scope.Post.Link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/);
                console.log(driveId);
                if (driveId) {
                    $scope.Post.Type = 'gDrive';
                    $scope.Post.AttachmentId = driveId[1]
                    queue('drive', GoogleDriveService.getFileThumbnail($scope.Post.AttachmentId), function(response) {
                        var thumbnail = response.result.thumbnailLink;
                        var access_token = authorizationService.getAuthToken();
                        $timeout(function() {
                            if (response.result.thumbnailLink) {
                                console.log(response.result.thumbnailLink);
                                $scope.Post.PreviewImage = thumbnail.replace("=s220", "=s400") + (thumbnail.includes("?") ? "&" : "?") + "access_token=" + access_token;
                            }
                            else {
                                $scope.Post.PreviewImage = "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
                            }
                            $scope.Post.AttachmentName = response.result.name;
                            $scope.Post.AttachmentIcon = response.result.iconLink;
                            //response.result.thumbnailLink.replace("=s220","=s400");
                            $scope.previewLoading = false;
                            document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                        });
                    }, function(error) {
                        console.warn(error);
                        $scope.Post.Type = 'Link';
                        queue('screenshot', GoogleDriveService.getWebsiteScreenshot($scope.Post.Link), function(response) {
                            $timeout(function() {
                                $scope.Post.PreviewImage = "data:image/jpeg;base64," + response.result.screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
                                $scope.previewLoading = false;
                                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                            })
                        }, function(error) {
                            console.warn(error)
                            $timeout(function() {
                                $scope.Post.PreviewImage = "https://www.techtricksworld.com/wp-content/uploads/2015/12/Error-404.png"
                                $scope.previewLoading = false;
                                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                            })
                        }, 10);
                    }, 150);
                }
                else {
                    $scope.Post.Type = 'Link';
                    $http.head('https://jsonp.afeld.me/?url=' + $scope.Post.Link).then(function(result) {
                        if (result.headers()['content-type'].indexOf('image') != -1) {
                            $timeout(function() {
                                $scope.Post.PreviewImage = $scope.Post.Link;
                                $scope.previewLoading = false;
                                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                            })
                        }
                        else {
                            GoogleDriveService.getWebsiteScreenshot($scope.Post.Link).then(function(response) {
                                $timeout(function() {
                                    $scope.Post.PreviewImage = "data:image/jpeg;base64," + response.result.screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
                                    $scope.previewLoading = false;
                                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                                })
                            }, function(error) {
                                console.warn(error)
                                $timeout(function() {
                                    $scope.Post.PreviewImage = "https://www.techtricksworld.com/wp-content/uploads/2015/12/Error-404.png"
                                    $scope.previewLoading = false;
                                    document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                                })
                            })
                        }
                    }, function(error) {
                        console.warn(error)
                        queue('screenshot', GoogleDriveService.getWebsiteScreenshot($scope.Post.Link), function(response) {
                            $timeout(function() {
                                $scope.Post.PreviewImage = "data:image/jpeg;base64," + response.result.screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
                                $scope.previewLoading = false;
                                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                            })
                        }, function(error) {
                            console.warn(error)
                            $timeout(function() {
                                $scope.Post.PreviewImage = "https://www.techtricksworld.com/wp-content/uploads/2015/12/Error-404.png"
                                $scope.previewLoading = false;
                                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
                            })
                        }, 10)
                    })
                }
            }
            else if ($scope.Post.Link.length > 9) {
                $scope.Post.Link = "http://" + $scope.Post.Link;
                $scope.Post.Type = 'Link';
                //$scope.findType();
            }
            else {
                $scope.Post.Type = 'NoLink';
            }
        };

        $scope.$watch('Post.Link', function() {
            if (typeof(linkChangeTimer) == 'number') clearTimeout(linkChangeTimer);
            linkChangeTimer = setTimeout(function() {
                $scope.Post.PreviewImage = '';
                $scope.Post.AttachmentId = '';
                $scope.Post.AttachmentName = '';
                $scope.Post.AttachmentIcon = '';
                runFindType();
            }, 500)
        })

        function runFindType() {
            if ($scope.myInfo !== undefined) {
                $scope.findType();
            }
            else {
                document.addEventListener('userInfoLoaded', $scope.findType);
            }
        }

        $scope.isReadyToSubmit = function() {
            if ($scope.Post.Class.Name === '' || $scope.Post.Class === undefined) {
                $mdToast.show({
                    template: '<md-toast><div class="md-toast-content">Select a class for this post.</div><md-toast>',
                    hideDelay: 1500,
                    parent: document.getElementById('new_post_dialog'),
                });
            }
            else {
                if (($scope.Post.Title === '' || $scope.Post.Title === undefined) && ($scope.Post.Description === '' || $scope.Post.Description === undefined)) {
                    $mdToast.show($mdToast.simple().textContent('Posts must have a title or description.').hideDelay(1500).parent(document.getElementById('new_post_dialog')));
                }
                else {
                    if ($scope.Post.Type === "gDrive") {
                        $mdToast.show({
                                template: '<md-toast> <div class="md-toast-content" style="justify-content: center;"> <div> <div class="md-toast-text" style="padding: 6px 0 0 0px;">How should the attached file be shared?</div> <div style="display:flex"> <md-select ng-model="shareSelect"> <md-option value="view"> York students can view </md-option> <md-option value="comment"> York students can comment </md-option> <md-option value="edit"> York students can edit </md-option> </md-select> <md-button style="color:rgb(68,138,255)" ng-click="shareFile()">Share</md-button> </div></div></div></md-toast>',
                                hideDelay: false,
                                parent: document.getElementById('new_post_dialog'),
                                toastClass: 'shareLevelToast',
                                scope: $scope,
                            })
                            // $mdToast.show($mdToast.simple().action('Got It').textContent('Anyone at York will be able to view the attached file.').parent(document.getElementById('new_post_dialog')).hideDelay(300000)).then(submitCheck);
                    }
                    else {
                        submitCheck();
                    }
                }
            }

            function submitCheck() {
                $mdToast.show({
                    template: '<md-toast><span style="font-size:18px; max-width: 200px">Posting...</span><span flex></span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right: -12px;" md-diameter="36"></md-progress-circular></md-toast>',
                    hideDelay: 3000000,
                });
                if ($scope.previewLoading) {
                    document.addEventListener('urlPreviewLoaded', function() {
                        $scope.submit();
                    });
                }
                else {
                    $scope.submit();
                }
            }
        }

        $scope.submit = function() {
            $scope.dialog_container.style.opacity = 0;
            $scope.dialog_container.style.pointerEvents = 'none';
            if ($scope.operation === 'new') {
                var metadata = $scope.convertPostToDriveMetadata($scope.Post);
                console.log({
                    Post: $scope.Post,
                    Metadata: metadata
                });
                queue('other', GoogleDriveService.AppsScriptNewFile(), function(response) {
                    $scope.Post.Id = response.data;
                    $timeout(function() {
                        $scope.allPosts.push($scope.Post)
                        $scope.visiblePosts = $scope.filterPosts($scope.allPosts);
                    })
                    queue('drive', GoogleDriveService.updateDriveFile(response.data, metadata), function(reply) {
                        $scope.updateLastPosted();
                        $mdToast.hide();
                        $mdDialog.hide();
                                                            $scope.dialog_container.style.opacity = 1;
            $scope.dialog_container.style.pointerEvents = 'all';
                    }, onError, 150);
                }, onError, 2);
            }
            else if ($scope.operation === 'update') {
                var metadata = $scope.convertPostToDriveMetadata($scope.Post);
                console.log({
                    Post: $scope.Post,
                    Metadata: metadata
                });
                queue('drive', GoogleDriveService.updateDriveFile(postObj.Id, metadata), function(reply) {
                    console.log(reply.result);
                    $mdToast.hide();
                }, onError, 150);
            }
        }

        $scope.shareFile = function() {
            if ($scope.shareSelect == 'view') var role = 'reader';
            if ($scope.shareSelect == 'comment') var role = 'commenter';
            if ($scope.shareSelect == 'edit') var role = 'writer';
            queue('drive', GoogleDriveService.shareFileDomain($scope.Post.AttachmentId, role), null, function(err){
                console.warn(err)
            }, 150)
            $mdToast.hide();
        }

        function onError(error) {
            console.warn(error);
            $scope.dialog_container.style.opacity = 1;
            $scope.dialog_container.style.pointerEvents = 'all';
            $mdToast.show($mdToast.simple().textContent('Error Posting, try again.').hideDelay(5000));
        }

        $scope.clearLink = function() {
            $timeout(function() {
                $scope.Post.Link = ""
                $scope.Post.PreviewImage = ""
                $scope.Post.Type = "NoLink"
            })
        }

        $scope.clearClassSelectSearch = function() {
            $timeout(function() {
                $scope.classSelectSearch = '';
            });
        }

        $scope.closeDialog = function() {
            $scope.Post.Title = originalPost.Title || ''
            $scope.Post.Description = originalPost.Description || ''
            $scope.Post.Link = originalPost.Link || ''
            $scope.Post.Labels = originalPost.Labels || []
            $scope.Post.Type = originalPost.Type || 'noLink'
            $scope.Post.UpdateDate = originalPost.UpdateDate || new Date()
            $scope.Post.Class = originalPost.Class || {
                Name: '',
                Catagory: '',
                Color: '#ffffff',
            }
            $scope.Post.Id = originalPost.Id || $scope.Post.Id || ''
            $scope.Post.AttachmentId = originalPost.AttachmentId || ''
            $scope.Post.AttachmentName = originalPost.AttachmentName || ''
            $scope.Post.AttachmentIcon = originalPost.AttachmentIcon || ''
            $scope.Post.PreviewImage = originalPost.PreviewImage || ''
            $mdDialog.hide();
        };
        $scope.hideToast = function() {
            $mdToast.hide()
        }
    }
