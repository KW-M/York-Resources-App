//   We don't define the "new post controller" here because it was alredy
//   defined by the $md-dialog in the newPost function on mainController.
function newPostController($scope, $timeout, $http, $mdDialog, APIService, authorizationService, $mdToast, postObj, operation) {
    console.log(postObj)
    var linkChangeTimer = null;
    var originalPost = angular.copy(postObj);
    $scope.post = postObj;
    $timeout(function () {
        $scope.post.Title = $scope.post.Title || ''
        $scope.post.Description = $scope.post.Description || ''
        $scope.post.Link = $scope.post.Link || ''
        $scope.post.Labels = $scope.post.Labels || []
        $scope.post.Type = $scope.post.Type || 'noLink'
        $scope.post.Flagged = $scope.post.Flagged || false
        $scope.post.CreationDate = $scope.post.CreationDate || new Date()
        $scope.post.UpdateDate = $scope.post.UpdateDate || new Date()
        $scope.post.Class = $scope.post.Class || {
            Name: '',
            Catagory: '',
            Color: 'ff00ff',
        }
        $scope.post.Creator = (operation == 'new') ? ({
            ClassOf: $scope.myInfo.ClassOf,
            Email: $scope.myInfo.Email,
            Me: true,
            Name: $scope.myInfo.Name,
        }) : ($scope.post.Creator || {
            ClassOf: '',
            Email: '',
            Me: null,
            Name: ''
        })
        $scope.post.Id = $scope.post.Id || ''
        $scope.post.AttachmentId = $scope.post.AttachmentId || ''
        $scope.post.AttachmentName = $scope.post.AttachmentName || ''
        $scope.post.AttachmentIcon = $scope.post.AttachmentIcon || ''
        $scope.post.Likes = $scope.post.Likes || []
        $scope.post.PreviewImage = $scope.post.PreviewImage || ''
        runFindType();
    })

    //temproary variables
    $scope.operation = operation;
    $scope.previewThumbnail = "";
    $scope.previewLoading = false;
    $scope.classSearch = "";
    $scope.shareSelect = "view"

    $scope.findType = function () {
        if ($scope.post.Link === '') {
            $scope.post.PreviewImage = '';
            $scope.post.AttachmentId = '';
            $scope.post.AttachmentName = '';
            $scope.post.AttachmentIcon = '';
            $scope.post.Type = 'NoLink';
            $timeout(function () {
                $scope.post.PreviewImage = ''; // will be the down arrow photo
                $scope.previewLoading = false;
                document.dispatchEvent(new window.Event('urlPreviewLoaded'));
            })
        } else if ($scope.post.Link.match(/(?:http|https):\/\/.{2,}/)) {
            $timeout(function () {
                $scope.post.PreviewImage = ''; // will be the down arrow photo
                $scope.previewLoading = true;
                $scope.post.Type = 'link';
            })
        } else if ($scope.post.Link.length > 9) {
            $timeout(function () {
                $scope.post.Link = "http://" + $scope.post.Link;
                $scope.post.Type = 'link';
            })
        } else {
            $timeout(function () {
                $scope.post.Type = 'noLink';
            })
        }
    };

    $scope.$watch('Post.Link', function () {
        if (typeof (linkChangeTimer) == 'number') clearTimeout(linkChangeTimer);
        linkChangeTimer = setTimeout(function () {
            $scope.post.PreviewImage = '';
            $scope.post.AttachmentId = '';
            $scope.post.AttachmentName = '';
            $scope.post.AttachmentIcon = '';
            runFindType();
        }, 500)
    })

    function runFindType() {
        if ($scope.myInfo !== undefined) {
            $scope.findType();
        } else {
            document.addEventListener('userInfoLoaded', $scope.findType);
        }
    }

    $scope.isReadyToSubmit = function () {
        if ($scope.post.Class.Name === '' || $scope.post.Class === undefined) {
            $mdToast.show({
                template: '<md-toast><div class="md-toast-content">Select a class for this post.</div><md-toast>',
                hideDelay: 1500,
                parent: document.getElementById('new_post_dialog'),
            });
        } else {
            if (($scope.post.Title === '' || $scope.post.Title === undefined) && ($scope.post.Description === '' || $scope.post.Description === undefined)) {
                $mdToast.show($mdToast.simple().textContent('Posts must have a title or description.').hideDelay(1500).parent(document.getElementById('new_post_dialog')));
            } else {
                if ($scope.post.Type === "gDrive") {
                    $mdToast.show({
                        template: '<md-toast> <div class="md-toast-content" style="justify-content: center;"> <div> <div class="md-toast-text" style="padding: 6px 0 0 0px;">How should the attached file be shared?</div> <div style="display:flex"> <md-select ng-model="shareSelect"> <md-option value="view"> York students can view </md-option> <md-option value="comment"> York students can comment </md-option> <md-option value="edit"> York students can edit </md-option> </md-select> <md-button style="color:rgb(68,138,255)" ng-click="shareFile()">Share</md-button> </div></div></div></md-toast>',
                        hideDelay: false,
                        parent: document.getElementById('new_post_dialog'),
                        toastClass: 'shareLevelToast',
                        scope: $scope,
                    })
                } else {
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
                document.addEventListener('urlPreviewLoaded', function () {
                    $scope.submit();
                });
            } else {
                $scope.submit();
            }
        }
    }

    $scope.submit = function () {
        $scope.dialog_container.style.opacity = 0;
        $scope.dialog_container.style.pointerEvents = 'none';
        $scope.post.Id = response.data;
        queue('drive', GoogleDriveService.updateDriveFile(response.data, metadata), function (reply) {
            $timeout(function () {
                $scope.allPosts.push($scope.post)
                $scope.visiblePosts = $scope.filterPosts($scope.allPosts);
            })
            $scope.updateLastPosted();
            $mdToast.hide();
            $mdDialog.hide();
            $scope.dialog_container.style.opacity = 1;
            $scope.dialog_container.style.pointerEvents = 'all';
        }, onError, 150);
    } else if ($scope.operation === 'update') {
        var metadata = $scope.convertPostToDriveMetadata($scope.post);
        console.log({
            Post: $scope.post,
            Metadata: metadata
        });
        queue('drive', GoogleDriveService.updateDriveFile(postObj.Id, metadata), function (reply) {
            console.log(reply.result);
            $mdToast.hide();
        }, onError, 150);
    }
}

$scope.shareFile = function () {
    if ($scope.shareSelect == 'view') var role = 'reader';
    if ($scope.shareSelect == 'comment') var role = 'commenter';
    if ($scope.shareSelect == 'edit') var role = 'writer';
    promiseQueue.addPromise('drive', APIService.shareFile($scope.post.AttachmentId, role), null, console.warn, 150);
    $mdToast.hide();
}

function onError(error) {
    console.warn(error);
    $scope.dialog_container.style.opacity = 1;
    $scope.dialog_container.style.pointerEvents = 'all';
    $mdToast.show($mdToast.simple().textContent('Error Posting, try again.').hideDelay(5000));
}

$scope.clearLink = function () {
    $timeout(function () {
        $scope.post.Link = ""
        $scope.post.PreviewImage = ""
        $scope.post.Type = "NoLink"
    })
}

$scope.clearClassSelectSearch = function () {
    $timeout(function () {
        $scope.classSelectSearch = '';
    });
}

$scope.closeDialog = function () {
    $scope.post.Title = originalPost.Title || ''
    $scope.post.Description = originalPost.Description || ''
    $scope.post.Link = originalPost.Link || ''
    $scope.post.Labels = originalPost.Labels || []
    $scope.post.Type = originalPost.Type || 'noLink'
    $scope.post.UpdateDate = originalPost.UpdateDate || new Date()
    $scope.post.Class = originalPost.Class || {
        Name: '',
        Catagory: '',
        Color: '#ffffff',
    }
    $scope.post.Id = originalPost.Id || $scope.post.Id || ''
    $scope.post.AttachmentId = originalPost.AttachmentId || ''
    $scope.post.AttachmentName = originalPost.AttachmentName || ''
    $scope.post.AttachmentIcon = originalPost.AttachmentIcon || ''
    $scope.post.PreviewImage = originalPost.PreviewImage || ''
    $mdDialog.hide();
};
$scope.hideToast = function () {
    $mdToast.hide()
}
}
