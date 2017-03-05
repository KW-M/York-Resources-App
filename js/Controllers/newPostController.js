//   We don't define the "new post controller" here because it was alredy
//   defined by the $md-dialog in the newPost function on mainController.
function newPostController($scope, $timeout, $http, $mdDialog, APIService, authorizationService, $mdToast, postObj, operation) {
    console.log(postObj)
    var linkChangeTimer = null;
    var originalPost = angular.copy(postObj);
    console.log(originalPost)
    $scope.post = postObj;
    $scope.otherClass = {
        name: 'Other',
        catagory: 'Other',
        color: 'hsla(230, 70%, 75%,',
        stared: null
    };
    if ($scope.myInfo != undefined) {
        $timeout(initializePost)
    } else {
        document.addEventListener('userInitializatinDone', function (argument) {
            $timeout(initializePost)
        })
    }

    function initializePost() {
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
        $scope.post.previewImage = $scope.post.previewImage || $scope.getMaterialBackground() || '';
        $scope.findType();
        $scope.sortLabels()
        hideSelectedLabels();
        $mdToast.hide()
        $scope.$watch('post.link', function () {
            if (typeof (linkChangeTimer) == 'number') clearTimeout(linkChangeTimer);
            linkChangeTimer = setTimeout($scope.findType, 1000)
        })
    }

    //temproary variables
    $scope.operation = operation;
    $scope.previewThumbnail = "";
    $scope.previewLoading = false;
    $scope.labelSearch = "";
    $scope.classSearch = "";

    $scope.findType = function () {
        if ($scope.operation != 'view') {
            $timeout(function () {
                $scope.post.attachmentName = '';
                $scope.post.attachmentIcon = '';
                $scope.post.attachmentId = '';
                if ($scope.post.link == '') {
                    $scope.previewLoading = false;
                    $scope.post.type = 'NoLink';
                } else if (($scope.post.link || '').match(/(?:http|https):\/\/.{2,}/)) {
                    $scope.previewLoading = true;
                    $scope.post.type = 'link';
                    promiseQueue.addPromise('drive', APIService.runGAScript('getLinkPreview', $scope.post.link), function (data) {
                        console.log(data)
                        var previewObj = JSON.parse(data.result.response.result);
                        if (previewObj.error) {
                            $scope.post.attachmentName = 'Link Error'
                            $scope.post.previewImage = 'https://iread50shades.files.wordpress.com/2015/02/deadlink.png'
                            $scope.showInfoPopup('Problem showing link, is your attachment link a valid website URL?', 'Below is the returned error:', previewObj, true)
                            $scope.previewLoading = false;
                        } else {
                            $timeout(function () {
                                $scope.post.previewImage = previewObj.image
                                $scope.post.attachmentIcon = previewObj.icon
                                $scope.post.attachmentName = previewObj.title
                                $scope.post.attachmentId = previewObj.attachmentId
                                $scope.post.type = previewObj.type
                                if ($scope.post.title == '') $scope.post.title = previewObj.title;
                                $scope.previewLoading = false;
                                document.dispatchEvent(new Event('linkPreviewLoaded'));
                            })
                        }
                    }, function(){
                        $scope.previewLoading = false;
                        $scope.post.previewImage = 'https://iread50shades.files.wordpress.com/2015/02/deadlink.png'
                    }, 150, 'Problem showing link preview, is your attachment link a valid URL?', 1);
                } else if ($scope.post.link && $scope.post.link.length > 4 && $scope.post.link.substring(0, 3) != 'htt') {
                    $scope.post.link = "http://" + $scope.post.link;
                    $scope.post.type = 'link';
                    $scope.previewLoading = false;
                } else {
                    $scope.previewLoading = false;
                    $scope.post.type = 'noLink';
                }
            })
        }
    };

    $scope.isReadyToSubmit = function () {
        var dialogElement = document.getElementById('new_post_dialog')
        if ($scope.post.class.name === '' || $scope.post.class === undefined) {
            $mdToast.show($mdToast.simple().textContent('Chose a class for this post.').hideDelay(1500).parent(dialogElement));
        } else if (($scope.post.title === '' || $scope.post.title === undefined) && ($scope.post.description === '' || $scope.post.description === undefined)) {
            $mdToast.show($mdToast.simple().textContent('Posts must have a title or description.').hideDelay(1500).parent(dialogElement));
        } else if ($scope.post.type === "GDrive") {
            $mdToast.show({
                template: '<md-toast> <div class="md-toast-content" style="justify-content: center;"> <div> <div class="md-toast-text" style="padding: 6px 0 0 0px;">How should the attached file be shared?</div> <div style="display:flex"> <md-select ng-model="shareSelect"> <md-option value="reader"> York students can view </md-option> <md-option value="commenter"> York students can comment </md-option> <md-option value="writer"> York students can edit </md-option> <md-option value="none"> I\'ve already shared the file </md-option> </md-select> <md-button style="color:rgb(68,138,255)" ng-click="shareFile()">Share</md-button> </div></div></div></md-toast>',
                toastClass: 'shareLevelToast',
                hideDelay: false,
                parent: angular.element(dialogElement),
                controller: function (scope) {
                    scope.shareSelect = 'reader';
                    scope.shareFile = function () {
                        if (scope.shareSelect != 'none') {
                            promiseQueue.addPromise('drive', APIService.shareFile($scope.post.attachmentId, scope.shareSelect), $scope.submit, $scope.submit, 150, "The attached file couln't be shared, please share it manualy.", 2);
                        } else {
                            $scope.submit()
                        }
                    }
                },
            })
        } else if ($scope.previewLoading == true || $scope.myInfo == undefined) {
            $scope.dialog_container.style.opacity = 0.8;
            $scope.dialog_container.style.pointerEvents = 'none';
            document.addEventListener('linkPreviewLoaded', $scope.submit)
        } else {
            $scope.submit()
        }
    }

    $scope.submit = function () {
        $mdToast.hide();
        $scope.dialog_container.style.opacity = 0.8;
        $scope.dialog_container.style.pointerEvents = 'none';
        $timeout(function () {
            $mdToast.show({
                template: '<md-toast><span style="font-size:18px;" flex>Posting</span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right: -12px;" md-diameter="32"></md-progress-circular></md-toast>',
                hideDelay: false,
            });
        }, 1000)
        console.log('Sent Post:', $scope.post)
        promiseQueue.addPromise('drive', APIService.runGAScript('savePost', {
                operation: 'savePost',
                postId: $scope.post.id,
                content: $scope.post,
            }), function (postData) {
                var createdPost = JSON.parse(postData.result.response.result);
                console.log('Created Post:', createdPost)
                addFireDatabaseRef(createdPost).then(function () {
                    $mdDialog.hide();
                    resetAllLabels();
                    $scope.dialog_container.style.opacity = 1;
                    $scope.dialog_container.style.pointerEvents = 'all'
                    $mdToast.hide();
                })
            },
            onError, 150, 'Error posting, try again.', 2);
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
                classes: [{
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
            $scope.sortedLabels[labelCount].active = false;
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
        $timeout(function () {
            $scope.sortedLabels = $scope.sortedLabels;
        })
    }

    function onError(error) {
        $scope.dialog_container.style.opacity = 1;
        $scope.dialog_container.style.pointerEvents = 'all';
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
            $scope.previewLoading = false;
            $scope.post.link = null;
            $scope.post.type = "noLink";
            $scope.post.previewImage = $scope.getMaterialBackground();
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
