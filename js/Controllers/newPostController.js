//   We don't define the "new post controller" here because it was alredy
//   defined by the $md-dialog in the newPost function on mainController.
function newPostController($scope, $timeout, $http, $mdDialog, APIService, authorizationService, $mdToast, postObj, operation) {
    console.log(postObj)
    var linkChangeTimer = null;
    var originalPost = angular.copy(postObj);
    console.log(originalPost)
    $scope.post = postObj;
    $timeout(function () {
        $scope.post.title = $scope.post.title || ''
        $scope.post.description = $scope.post.description || ''
        $scope.post.link = $scope.post.link || ''
        $scope.post.labels = $scope.post.labels || []
        $scope.post.teachers = $scope.post.teachers || []
        $scope.post.type = $scope.post.type || 'noLink'
        $scope.post.flagged = $scope.post.flagged || false
        $scope.post.creationDate = $scope.post.creationDate || new Date()
        $scope.post.updateDate = $scope.post.updateDate || new Date();
        $scope.post.class = $scope.post.class || {
            name: '',
                catagory: '',
                color: 'ff00ff'
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
        $scope.sortLabels();
        hideSelectedLabels();
    })

    //temproary variables
    $scope.operation = operation;
    $scope.previewThumbnail = "";
    $scope.previewLoading = false;
    $scope.labelSearch = "";
    $scope.classSearch = "";
    $scope.shareSelect = "view"

    $scope.findType = function () {
        if ($scope.operation != 'view') {
            $timeout(function () {
                $scope.post.attachmentName = '';
                $scope.post.attachmentIcon = '';
                $scope.post.attachmentId = '';
                $scope.post.previewImage = '';
                if ($scope.post.link == '') {
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
                    if ($scope.post.link.match(/(?:http|https):\/\/.{2,}/)) {
                        promiseQueue().addPromise('drive', APIService.runGAScript('getLinkPreview', $scope.post.link, false), function (data) {
                            console.log(data)
                            var previewObj = JSON.parse(data.result.response.result);
                            $timeout(function () {
                                $scope.post.previewImage = previewObj.image
                                $scope.post.attachmentIcon = previewObj.icon
                                $scope.post.attachmentName = previewObj.title
                                $scope.previewLoading = false;
                                if ($scope.post.title == '') $scope.post.title = previewObj.title;
                            })
                        }, console.warn, 150);

                    }
                }
            })
        }
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
        $scope.dialog_container.style.opacity = 0.8;
        $scope.dialog_container.style.pointerEvents = 'none';
        $mdToast.show({
            template: '<md-toast><span style="font-size:18px; max-width: 200px">Posting...</span><span flex></span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right: -12px;" md-diameter="36"></md-progress-circular></md-toast>',
            hideDelay: 3000000,
        });
        promiseQueue().addPromise('drive', APIService.runGAScript('savePost', {
                operation: 'savePost',
                postId: $scope.post.id,
                content: $scope.post,
            }, true), function (postData) {
                console.log(postData)
                var createdPost = JSON.parse(postData.result.response.result);
                console.log(createdPost)
                addFireDatabaseRef(createdPost).then(function () {
                    $mdToast.hide();
                    $mdDialog.hide();
                    $scope.dialog_container.style.opacity = 1;
                    $scope.dialog_container.style.pointerEvents = 'all';
                    resetAllLabels();
                })
            },
            onError, 150);
    }

    function addFireDatabaseRef(post) {
        var fireObj = {
            F: post.flagged,
            C: post.class.name,
            LC: post.likeCount,
            E: post.creator.email,
            L: $scope.post.labels,
            T: $scope.post.teachers,
            DU: firebase.database.ServerValue.TIMESTAMP,
            DC: post.creationDate,
        }
        return authorizationService.FireDatabase.ref('posts/' + post.id).set(fireObj);
    }

    $scope.shareFile = function () {
        if ($scope.shareSelect == 'view') var role = 'reader';
        if ($scope.shareSelect == 'comment') var role = 'commenter';
        if ($scope.shareSelect == 'edit') var role = 'writer';
        promiseQueue().addPromise('drive', APIService.shareFile($scope.post.attachmentId, role), null, console.warn, 150);
        $mdToast.hide();
    }

    //----------------------------------------------------
    //------------------Handleing Labels------------------------
    $scope.addLabel = function (labelName) {
        $timeout(function () {
            $scope.labelSearch = "";
            $scope.post.labels.push(labelName);
            $scope.sortedLabels.push({
                name: labelName,
                type: 'Label',
                active: true,
                linkedClasses: [{
                    name: $scope.post.class.name,
                    usage: 1,
                }],
                totalUsage: 1
            });
        })
    }

    $scope.moveLabelToPostLabels = function (labelName) {
        $timeout(function () {
            $scope.labelSearch = "";
            var labelObj = $scope.sortedLabels[findLabelIndex(labelName)]
            if (labelObj.type == 'Label') $scope.post.labels.push(labelObj.name);
            if (labelObj.type == 'Teacher') $scope.post.teachers.push(labelObj.name);
            labelObj.active = true;
        });
    }

    $scope.moveLabelToSortedLabels = function (array, labelIndex) {
        $timeout(function () {
            var labelName = array.splice(labelIndex, 1)[0]
            $scope.sortedLabels[findLabelIndex(labelName)].active = false;
        });
    }

    function findLabelIndex(labelName) {
        var max = $scope.sortedLabels.length
        for (var labelCount = 0; labelCount < max; labelCount++) {
            if ($scope.sortedLabels[labelCount].name == labelName) return labelCount
        }
    }

    function resetAllLabels() {
        var max = $scope.sortedLabels.length
        for (var labelCount = 0; labelCount < max; labelCount++) {
            $scope.sortedLabels[labelCount].active == false;
        }
    }

    function hideSelectedLabels() {
        var refrenceObj = {}
        var maxLabels = $scope.post.labels.length
        for (var labelCount = 0; labelCount < maxLabels; labelCount++) {
           refrenceObj[$scope.post.labels[labelCount]] = true;
        }
        var maxTeachers = $scope.post.teachers.length
        for (var labelCount = 0; labelCount < maxTeachers; labelCount++) {
            refrenceObj[$scope.post.teachers[labelCount]] = true;
        }
        var max = $scope.sortedLabels.length;
        for (var labelCount = 0; labelCount < max; labelCount++) {
            if (refrenceObj[$scope.sortedLabels[labelCount].name] == true) $scope.sortedLabels[labelCount].active = true;
        }
        $timeout(function() {
            $scope.sortedLabels = $scope.sortedLabels;
        })
    }

    function onError(error) {
        console.warn(error);
        $scope.dialog_container.style.opacity = 1;
        $scope.dialog_container.style.pointerEvents = 'all';
        $mdToast.show($mdToast.simple().textContent('Error Posting, try again.').hideDelay(5000));
    }

    $scope.closeDialog = function () {
        resetAllLabels();
        $scope.post.title = originalPost.title || ''
        $scope.post.description = originalPost.description || ''
        $scope.post.link = originalPost.link || ''
        $scope.post.labels = originalPost.labels || []
        $scope.post.type = originalPost.type || 'noLink'
        $scope.post.updateDate = originalPost.updateDate || new Date()
        $scope.post.class = originalPost.class || {
            Name: '',
                Catagory: '',
                Color: '#ffffff',
        }
        $scope.post.id = originalPost.id || $scope.post.id || ''
        $scope.post.attachmentId = originalPost.attachmentId || ''
        $scope.post.attachmentName = originalPost.attachmentName || ''
        $scope.post.attachmentIcon = originalPost.attachmentIcon || ''
        $scope.post.previewImage = originalPost.previewImage || ''
        $mdDialog.hide();
    };

    $scope.clearLink = function () {
        $timeout(function () {
            $scope.post.link = null;
            $scope.post.type = "noLink";
            $scope.post.previewImage = null;
            $scope.post.attachmentName = null;
            $scope.post.attachmentIcon = null;
        })
    }

    $scope.classSelectDone = function () {
        $timeout(function () {
            $scope.sortedLabels = $scope.sortLabels();
            $scope.classSelectSearch = '';
        });
    }
    $scope.hideToast = function () {
        $mdToast.hide()
    }
}
