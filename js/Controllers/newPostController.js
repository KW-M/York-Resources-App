//   We don't define the "new post controller" here because it was alredy
//   defined by the $md-dialog in the newPost function on mainController.
function newPostController($scope, $timeout, $http, $mdDialog, APIService, authorizationService, $mdToast, postObj, operation) {
    console.log(postObj)
    var linkChangeTimer = null;
    var originalPost = angular.copy(postObj);
    $scope.post = postObj;
    $timeout(function () {
        $scope.post.title = $scope.post.title || ''
        $scope.post.description = $scope.post.description || ''
        $scope.post.link = $scope.post.link || ''
        $scope.post.labels = $scope.post.labels || []
        $scope.post.type = $scope.post.type || 'noLink'
        $scope.post.flagged = $scope.post.flagged || false
        $scope.post.creationDate = $scope.post.creationDate || new Date()
        $scope.post.updateDate = $scope.post.updateDate || new Date();
        $scope.post.class = $scope.post.class || {
            //name: '',
            catagory: '',
                color: 'ff00ff',
        };
        $scope.post.creator = (operation == 'new') ? ({
            classOf: $scope.myInfo.classOf,
            email: $scope.myInfo.email,
            me: true,
            name: $scope.myInfo.name,
        }) : ($scope.post.creator || {
            classOf: '',
            email: '',
            me: null,
            name: ''
        })
        $scope.post.id = $scope.post.id || ''
        $scope.post.attachmentId = $scope.post.attachmentId || ''
        $scope.post.attachmentName = $scope.post.attachmentName || ''
        $scope.post.attachmentIcon = $scope.post.attachmentIcon || ''
        $scope.post.likes = $scope.post.likes || []
        $scope.post.previewImage = $scope.post.previewImage || ''
        $scope.findType();
    })

    //temproary variables
    $scope.operation = operation;
    $scope.previewThumbnail = "";
    $scope.previewLoading = false;
    $scope.classSearch = "";
    $scope.shareSelect = "view"

    $scope.findType = function () {
        $timeout(function () {
            $scope.post.attachmentName = '';
            $scope.post.attachmentIcon = '';
            $scope.post.attachmentId = '';
            $scope.post.previewImage = '';
            if ($scope.post.link === '') {
                $scope.previewLoading = false;
                $scope.post.type = 'NoLink';
            } else if ($scope.post.link.match(/(?:http|https):\/\/.{2,}/)) {
                $scope.previewLoading = true;
                $scope.post.type = 'link';
            } else if ($scope.post.link.length > 9) {
                $scope.post.link = "http://" + $scope.post.link;
                $scope.post.type = 'link';
            } else {
                $scope.post.type = 'noLink';
            }
            if ($scope.myInfo != undefined) getPreview();
            if ($scope.myInfo == undefined) document.addEventListener('userInfoLoaded', getPreview());

            function getPreview() {
                // body...
            }
        })
    };

    $scope.$watch('post.link', function () {
        if (typeof (linkChangeTimer) == 'number') clearTimeout(linkChangeTimer);
        linkChangeTimer = setTimeout($scope.findType, 500)
    })

    $scope.isReadyToSubmit = function () {
        var dialogElement = document.getElementById('new_post_dialog')
        if ($scope.post.class.name === '' || $scope.post.class === undefined) {
            $mdToast.show($mdToast.simple().textContent('Chose a class for this post.').hideDelay(1500).parent(dialogElement));
        } else if (($scope.post.title === '' || $scope.post.title === undefined) && ($scope.post.description === '' || $scope.post.description === undefined)) {
            $mdToast.show($mdToast.simple().textContent('Posts must have a title or description.').hideDelay(1500).parent(dialogElement));
        } else if ($scope.post.type === "gDrive") {
            $mdToast.show({
                template: '<md-toast> <div class="md-toast-content" style="justify-content: center;"> <div> <div class="md-toast-text" style="padding: 6px 0 0 0px;">How should the attached file be shared?</div> <div style="display:flex"> <md-select ng-model="shareSelect"> <md-option value="view"> York students can view </md-option> <md-option value="comment"> York students can comment </md-option> <md-option value="edit"> York students can edit </md-option> </md-select> <md-button style="color:rgb(68,138,255)" ng-click="shareFile()">Share</md-button> </div></div></div></md-toast>',
                toastClass: 'shareLevelToast',
                hideDelay: false,
                parent: dialogElement,
                scope: $scope,
            })
        } else {
            $scope.submit();
        }
    }

    $scope.submit = function () {
        $scope.dialog_container.style.opacity = 0;
        $scope.dialog_container.style.pointerEvents = 'none';
        $mdToast.show({
            template: '<md-toast><span style="font-size:18px; max-width: 200px">Posting...</span><span flex></span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right: -12px;" md-diameter="36"></md-progress-circular></md-toast>',
            hideDelay: 3000000,
        });
        promiseQueue().addPromise('drive', APIService.runGAScript('savePost', {
            operation: 'savePost',
            postId: '1PJhfrKIxE59cWRBlVL-dBp-tOuUBsrWagBDchAQrzfQ',
            content: $scope.post,
        }), function (reply) {
            console.log(reply)
            $mdToast.hide();
            $mdDialog.hide();
            $scope.dialog_container.style.opacity = 1;
            $scope.dialog_container.style.pointerEvents = 'all';
            // $timeout(function () {
            //     $scope.allPosts.push($scope.post)
            //     $scope.visiblePosts = $scope.filterPosts($scope.allPosts);
            // })
        }, onError, 150);
    }

    $scope.shareFile = function () {
        if ($scope.shareSelect == 'view') var role = 'reader';
        if ($scope.shareSelect == 'comment') var role = 'commenter';
        if ($scope.shareSelect == 'edit') var role = 'writer';
        promiseQueue().addPromise('drive', APIService.shareFile($scope.post.attachmentId, role), null, console.warn, 150);
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
            $scope.post.link = ""
            $scope.post.previewImage = ""
            $scope.post.type = "NoLink"
        })
    }

    $scope.clearClassSelectSearch = function () {
        $timeout(function () {
            $scope.classSelectSearch = '';
        });
    }

    $scope.closeDialog = function () {
        $scope.post.title = originalpost.title || ''
        $scope.post.description = originalpost.description || ''
        $scope.post.link = originalpost.link || ''
        $scope.post.labels = originalpost.labels || []
        $scope.post.type = originalpost.type || 'noLink'
        $scope.post.updateDate = originalpost.updateDate || new Date()
        $scope.post.class = originalpost.class || {
            Name: '',
                Catagory: '',
                Color: '#ffffff',
        }
        $scope.post.id = originalpost.id || $scope.post.id || ''
        $scope.post.attachmentId = originalpost.attachmentId || ''
        $scope.post.attachmentName = originalpost.attachmentName || ''
        $scope.post.attachmentIcon = originalpost.attachmentIcon || ''
        $scope.post.previewImage = originalpost.previewImage || ''
        $mdDialog.hide();
    };
    $scope.hideToast = function () {
        $mdToast.hide()
    }
}
