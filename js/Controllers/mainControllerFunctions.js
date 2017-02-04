/*global app*/ /*global angular*/ /*global gapi*/ /*global google*/ /*global queue*/ /*global subControllerFunctions*/
app.controller('AppController', controllerFunction)
   //controllerFunction.$inject(['$scope', '$mdDialog', '$window', '$timeout', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', '$location', 'angularGridInstance'])
function controllerFunction($scope, $rootScope, $window, $timeout, $filter, $q, $location, $http, $sce, $mdDialog, $mdToast, $mdSidenav, $mdMedia, $mdTheming, authorizationService, APIService, angularGridInstance) {
   var content_container = document.getElementById("content_container");
   var self = this;

   $scope.allLabels = [];
   $scope.visibleLabels = [];
   $scope.labelSearch = null;

   $scope.restorePost = false;
   $scope.globals = {
      sidenavIsOpen: true,
      FABisOpen: false,
      FABisHidden: true,
      addBarTopIsHidden: false,
      mobileSearchIsOpen: false,
   };

   $scope.$mdMedia = $mdMedia;
   $scope.$mdDialog = $mdDialog;
   $scope.$location = $location;
   $scope.$timeout = $timeout;

   //----------------------------------------------------
   //------------------- Routing ------------------------
   $scope.queryParams = {
      q: undefined, //undefined to make search popunder show with no text in  field
      flagged: false,
      type: null,
      classPath: 'Loading...',
      creatorEmail: null,
      id: null,
   };
   $scope.searchPlaceholder = 'Search';

   $scope.gotoRoute = function (query) {
      if (query.classPath !== undefined) {
         $scope.toggleSidebar(true);
         $location.search({
            q: null
         });
         $location.path(query.classPath.replace(/-/g, "~").replace(/ /g, "-") || query.classPath);
      }
      if (query.q !== undefined) {
         if (query.q === null || query.q == '') {
            $location.search({
               q: null
            });
         } else {
            $location.search({
               q: query.q || $scope.queryParams.q
            });
         }
      }
      //$location.hash(query.id || null);
   };

   function onLocationChange() {
      $scope.queryParams.q = $location.search().q || null;
      $scope.queryParams.classPath = $location.path().replace(/\//g, "").replace(/-/g, " ").replace(/~/g, "-") || 'All Posts';
      $scope.queryParams.id = $location.hash();
      $scope.searchInputTxt = $scope.queryParams.q;

      no_more_footer.style.display = 'none';
      no_posts_footer.style.display = 'none';
      footer_problem.style.display = 'none';
      $scope.searchPrefix = 'Search';
      if ($scope.queryParams.q !== null) {
         if ($scope.queryParams.q != $scope.previousSearch) {
            $scope.updateVisiblePosts([]);
         }
      } else {
         $scope.queryParams.flagged = null
         $scope.queryParams.type = null
         $scope.queryParams.creatorEmail = null
      }
      if ($scope.queryParams.classPath === 'All Posts') {
         $scope.queryParams.flagged = false;
      } else if ($scope.queryParams.classPath === 'Your Posts') {
         $scope.queryParams.creatorEmail = $scope.myInfo.Email;
      } else if ($scope.queryParams.classPath === 'Flagged Posts') {
         $scope.queryParams.flagged = true
      } else {
         $scope.searchPrefix = 'Search Within';
         $scope.queryParams.flagged = false
      }
      //generateQueryString();
      if ($scope.queryParams.q === null) {
         //$scope.updateVisiblePosts($scope.filterPosts($scope.allPosts), hideSpinner);
      }
      $scope.selectedClass = $scope.findClassObject($scope.queryParams.classPath);
      // console.log($scope.selectedClass)
      sortPosts();
      $timeout(function () {
         $scope.selectedClass = $scope.selectedClass
            // $scope.visibleLabels = $scope.sortLabels($scope.allLabels);
      });
      getFileTimer = setInterval(function () {
         if (conurancy_counter == 0 && content_container.scrollHeight == content_container.clientHeight) $scope.loadPosts()
      }, 1000);
   }

   function listenForURLChange() {
      onLocationChange();
      $rootScope.$on('$locationChangeSuccess', onLocationChange);
   }

   if (window.location.search) {
      var unformated = window.location.search.match(/state=([^&]+)(?:$|&)/)
      var shareInput = JSON.parse(decodeURIComponent(unformated[1]));
      if (shareInput.exportIds) {
         var id = shareInput.exportIds[0]
      } else if (shareInput.ids) {
         var id = shareInput.ids[0]
      }
      $scope.newPost({
         Link: 'https://drive.google.com/?open=' + id
      }, 'new')
   }

   //----------------------------------------------------
   //------------- Signin & Initiation ------------------
   var drivePicker, uploadPicker;
   var postIdAccumulator = [];

   authorizationService.onLoad(function () {
      var profile = authorizationService.GUser.getBasicProfile()
      $scope.myInfo = {
         email: profile.getEmail(),
         name: profile.getName(),
         profilePicture: profile.getImageUrl(),
      }

      var getStartupData = APIService.runGAScript('getStartupData')().then(function (data) {
         var dataObj = JSON.parse(data.result.response.result);
         $timeout(function () {
            for (var property in dataObj.userPrefs) {
               $scope.myInfo[property] = dataObj.userPrefs[property];
            }
            $scope.myInfo.staredClasses.push({
               name: 'Other',
               color: 'hsla(200, 70%, 75%,',
            })
            $scope.allLabels = dataObj.labels;
            $scope.classList = dataObj.classes;
            $scope.teacherList = dataObj.teachers;
         });
      }, console.warn)

      var pickerPromise = $q.defer();
      gapi.load('picker', {
         'callback': function () {
            initiateDrivePicker();
            pickerPromise.resolve();
         }
      })

      $q.all([getStartupData, pickerPromise]).then(function () {
         console.log("Everything Loaded")
         listenForURLChange();
         getDatabase();
         authorizationService.hideSigninDialog();
      })
   })

   function initiateDrivePicker() {
      var uploadView = new google.picker.DocsUploadView().setParent("0B5NVuDykezpkUGd0LTRGc2hzM2s");
      var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setParent("root");
      var sharedView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setOwnedByMe(false);
      var recentsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(false).setSelectFolderEnabled(true).setLabel('Recents');

      drivePicker = new google.picker.PickerBuilder().setDeveloperKey("AIzaSyAhXIGkYgfAG9LXhAuwbePD3z_qSVWUSNA").setOrigin(window.location.protocol + '//' + window.location.host).setOAuthToken(authorizationService.getGAuthToken()).setCallback(drivePickerCallback)
         .addView(docsView).addView(recentsView).addView(sharedView).build();
      uploadPicker = new google.picker.PickerBuilder().setDeveloperKey("AIzaSyAhXIGkYgfAG9LXhAuwbePD3z_qSVWUSNA").setOrigin(window.location.protocol + '//' + window.location.host).setOAuthToken(authorizationService.getGAuthToken()).setCallback(drivePickerCallback)
         .addView(uploadView).enableFeature(google.picker.Feature.NAV_HIDDEN).hideTitleBar().build();
   }

   function getDatabase() {
      var postsFireRef = authorizationService.FireDatabase.ref('posts')
      postsFireRef.orderByChild('D').once('value', function (snapshot) {
         snapshot.forEach(function (childSnapshot) {
            $scope.allPosts.push(convertFirePost(childSnapshot.key, childSnapshot.val(), 'notLoaded'))
         });
         postsFireRef.startAt(Date.now()).on('child_added', function (childSnapshot) {
            console.log('newChild', childSnapshot.val())
            $scope.allPosts.push(convertFirePost(childSnapshot.key, childSnapshot.val(), 'notLoaded'));
            getPosts([childSnapshot.key])
         });
         postsFireRef.on('child_removed', function (childSnapshot) {
            var id = childSnapshot.val();
            var indexes = $scope.getIdPostArrayIndex(id);
            $scope.allPosts.splice(indexes.allPosts, 1);
            $scope.sortedPosts.splice(indexes.sortedPosts, 1);
            $scope.visiblePosts.splice(indexes.visiblePosts, 1);
         });
         postsFireRef.on('child_changed', function (childSnapshot) {
            var indexes = $scope.getIdPostArrayIndex(postObj.id)
            $scope.allPosts[indexes.allPosts].loadStatus = 'Changed';
            $scope.sortedPosts[indexes.sortedPosts] = 'Changed';
            sortPosts()
         });
         if ($scope.sortedPosts.length != 0) $scope.loadPosts();
         if ($scope.sortedPosts.length == 0) $scope.sortPosts();
         console.log($scope.allPosts);
      })

      function convertFirePost(key, value, loadStatus) {
         return {
            id: key,
            title: value.T,
            class: $scope.findClassObject(value.C),
            creator: {
               email: value.E,
               classOf: value.E.match(/\d+/)[0] || '∞'
            },
            flagged: value.F,
            likeCount: value.L,
            updateDate: new Date(value.DU || value.D),
            creationDate: new Date(value.DC),
            loadStatus: loadStatus,
         }
      }
   }

   //----------------------------------------------------
   //----------- loading and sorting posts --------------
   var conurancy_counter = 0;
   var getFileTimer = null;

   $scope.allPosts = [];
   $scope.sortedPosts = [];
   $scope.searchPosts = [];
   $scope.visiblePosts = [];

   function sortPosts() {
      var filterObj = $scope.filterPosts($scope.allPosts)
      $scope.sortedPosts = $scope.sortByDateAndLikes(filterObj.filtered)
      filterObj.filteredOut.forEach(function (postObj) {
         if (postObj.loadStatus == 'Loaded') {
            var slimedObj = {
               id: postObj.id,
               title: postObj.title,
               class: postObj.class,
               creator: postObj.creator,
               flagged: postObj.flagged,
               likeCount: postObj.likes.length,
               updateDate: postObj.updateDate,
               creationDate: postObj.creationDate,
               loadStatus: 'UnLoaded',
            }
            var indexes = $scope.getIdPostArrayIndex(postObj.id)
            $scope.allPosts[indexes.allPosts] = slimedObj;
            $scope.sortedPosts[indexes.sortedPosts] = slimedObj;
            $scope.visiblePosts.splice(indexes.visiblePosts, 1);
         }
      })
      $scope.loadPosts()
   }

   function loadPosts() {
      $scope.sortedPosts.forEach(function (postObj, index) {
         if (postObj.loadStatus != 'Loaded') {
            postIdAccumulator.push(postObj.id)
            if (postIdAccumulator.length == 3) {
               getPosts(postIdAccumulator)
               postIdAccumulator = [];
            }
         }
      });
      if (postIdAccumulator.length != 0) {
         getPosts(postIdAccumulator)
         postIdAccumulator = [];
      }
   }

   function getPosts(idArray) {
      conurancy_counter++;
      promiseQueue().addPromise('drive', APIService.runGAScript('getPosts', idArray, false), function (postsData) {
         console.log(postsData)
         var postsArray = JSON.parse(postsData.result.response.result);
         $timeout(function () {
            postsArray.forEach(function function_name(postObj) {
               postObj.loadStatus = 'Loaded';
               postObj.updateDate = new Date(postObj.updateDate)
               postObj.creationDate = new Date(postObj.creationDate)
               var indexes = $scope.getIdPostArrayIndex(postObj.id)
               $scope.allPosts[indexes.allPosts] = postObj;
               $scope.sortedPosts[indexes.sortedPosts] = postObj;
               $scope.visiblePosts.push(postObj);
            })
            setTimeout(angularGridInstance.postsGrid.refresh, 1000);
            conurancy_counter--;
         })
      }, console.warn, 150);
   }

   function hideSpinner() {
      loading_spinner.style.display = 'none';
      clearInterval(getFileTimer);
      $timeout(function () {
         if ($scope.visiblePosts.length > 0) {
            no_more_footer.style.display = 'block';
         } else {
            layout_grid.style.height = '0px';
            no_posts_footer.style.display = 'block';
         }
      }, 200)
   }

   //----------------------------------------------------
   //--------------- Creating Posts ---------------------
   var layout_grid = document.getElementById("layout_grid");
   var footer_problem = document.getElementById("footer_problem");
   var no_more_footer = document.getElementById("no_more_footer");
   var no_posts_footer = document.getElementById("no_posts_footer");
   var loading_spinner = document.getElementById("loading_spinner");

   function newPost(postObj, operation, event) {
      $scope.newPostScroll = 0;
      var dialogConfig = {
            templateUrl: 'templates/createPost.html',
            controller: ['$scope', '$timeout', '$http', '$mdDialog', 'APIService', 'authorizationService', '$mdToast', "postObj", "operation", newPostController],
            locals: {
               postObj: postObj,
               operation: operation
            },
            scope: $scope,
            preserveScope: true,
            onComplete: onDialogLoaded,
            clickOutsideToClose: false,
            fullscreen: $mdMedia('xs'),
            parent: angular.element(document.body),
         }
         // openFrom: {
         //    top: rect.top,
         //    left: rect.left,
         //    height: rect.height,
         //    width: rect.width,
         // },
         // closeTo: {
         //    top: rect.top,
         //    left: rect.left,
         //    height: rect.height,
         //    width: rect.width,
         // }//('#new_post_button'),

      $mdDialog.show(dialogConfig).then(function () {
         //done
      });

      function onDialogLoaded() {
         $scope.dialog_container = document.getElementsByClassName('md-dialog-container')[0]
         var newPostScroll = document.getElementsByClassName('new_post_dialog_scroll')[0];
         var newPostHeaderImage = document.getElementById("header_image");
         var newPostHeader = document.getElementById('dialog_header');
         newPostScroll.style.opacity = 1;
         newPostScroll.onscroll = function () {
            if (newPostScroll.scrollTop < 141) {
               $timeout(function () {
                  $scope.newPostScroll = newPostScroll.scrollTop;
               })
               newPostHeaderImage.style.top = -20 - (newPostScroll.scrollTop / 5) + 'px';
            } else {
               $timeout(function () {
                  $scope.newPostScroll = 140;
               })
            }
         }

         // The md-select directive eats keydown events for some quick select logic.
         // Since we have a search input in the course selector, we don 't need that logic.
         var selectSearchInput = angular.element(document.getElementById('class_select_input'))
         selectSearchInput.on('keydown', function (ev) {
            ev.stopPropagation();
         });
      }
   };

   function showDrivePicker(type, restorePost) {
      $scope.restorePost = restorePost || false;
      if (type == "Drive") {
         drivePicker.setVisible(true);
      } else if (type == "Upload") {
         uploadPicker.setVisible(true);
      }
   };

   function drivePickerCallback(data) {
      if (data.action == google.picker.Action.PICKED) {
         if ($scope.restorePost == true) {
            $timeout(function () {
               $scope.post.attachmentId = data.docs[0].id;
               $scope.post.link = data.docs[0].url;
               $scope.post.title = $scope.post.title || data.docs[0].name;
            })
         } else {
            $scope.newPost({
               attachmentId: data.docs[0].id,
               link: data.docs[0].url,
               title: data.docs[0].name,
            }, 'new');
         }
      }
   }

   //----------------------------------------------------
   //------------------ Searching -----------------------
   var queryPropertyString = '';
   var previousSearch = undefined;

   function generateQueryString() {
      var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false"
      if ($scope.queryParams.flagged !== null && $scope.queryParams.flagged !== undefined) {
         query = query + " and properties has { key='Flagged' and value='" + $scope.queryParams.flagged + "' }";
      }
      if ($scope.queryParams.creatorEmail !== null && $scope.queryParams.creatorEmail !== undefined) {
         query = query + " and '" + $scope.queryParams.creatorEmail + "' in owners"
      }
      if ($scope.queryParams.type !== null && $scope.queryParams.type !== undefined) {
         query = query + " and properties has { key='Type' and value='" + $scope.queryParams.type + "' }"
      }
      if ($scope.queryParams.classPath !== null && $scope.queryParams.classPath !== undefined && $scope.queryParams.classPath !== 'Your Posts' && $scope.queryParams.classPath !== 'All Posts' && $scope.queryParams.classPath !== 'Flagged Posts') {
         query = query + " and properties has { key='ClassName' and value='" + $scope.queryParams.classPath + "' }"
      }
      if ($scope.queryParams.q !== null && $scope.queryParams.q !== undefined) {
         query = query + " and fullText contains '" + $scope.queryParams.q + "'";
      }
      $scope.queryPropertyString = query;
   }

   $scope.$watch('searchInputTxt', function (newValue) {
      var input = newValue || null
      var query = $scope.queryParams.q || null;
      if (input != query) $scope.gotoRoute({
         q: input
      })
   }, false);

   // $scope.getFiles = function () {
   //    var formattedFileList = [];
   //    var nextPageToken = classPageTokenSelectionIndex[$scope.queryPropertyString] || "";
   //    var queryString = $scope.queryPropertyString;
   //    if (nextPageToken !== "end") {
   //       loading_spinner.style.display = 'block';
   //       no_more_footer.style.display = 'none';
   //       no_posts_footer.style.display = 'none';
   //       footer_problem.style.display = 'none';
   //       queue('drive', GoogleDriveService.getListOfFlies($scope.queryPropertyString, nextPageToken, 3), function (fileList) {
   //          for (var fileCount = 0; fileCount < fileList.result.files.length; fileCount++) {
   //             if (!$scope.queryParams.q && deDuplicationIndex[fileList.result.files[fileCount].id] === undefined) {
   //                //if the deDuplication obj doesn't have the file's id as a key, it hasn't already been downloaded.
   //                formattedFileList[fileCount] = $scope.convertDriveToPost(fileList.result.files[fileCount]) //format and save the new post to the formatted files list array
   //                deDuplicationIndex[fileList.result.files[fileCount].id] = 1; //mark this id as used with a "1".
   //             } else if ($scope.queryParams.q) {
   //                formattedFileList[fileCount] = $scope.convertDriveToPost(fileList.result.files[fileCount]) //format and save the new post to the formatted files list array
   //             }
   //          }
   //          sortPostsByType(formattedFileList, queryString, $scope.queryParams);
   //          if (fileList.result.nextPageToken !== undefined) {
   //             classPageTokenSelectionIndex[$scope.queryPropertyString] = fileList.result.nextPageToken; //if we haven't reached the end of our search:
   //          } else {
   //             classPageTokenSelectionIndex[$scope.queryPropertyString] = "end" //if we have reached the end of our search:
   //          }
   //          hideSpinner();
   //       }, function () {
   //          no_more_footer.style.display = 'none';
   //          no_posts_footer.style.display = 'none';
   //          no_more_footer.style.display = 'none';
   //          footer_problem.style.display = 'flex';
   //          content_container.scrollTop = content_container.scrollHeight;
   //       }, 150);
   //    }
   // }

   // function sortPostsByType(formattedFileList, queryString, queryParams) {
   //    if (queryParams.q) {
   //       console.log('hasQueryParams')
   //       if (queryParams.q === $scope.previousSearch) {
   //          console.log('sameSearch')
   //          $scope.searchPosts = $scope.searchPosts.concat(formattedFileList);
   //       } else {
   //          console.log('newSearch')
   //          $scope.searchPosts = formattedFileList;
   //       }
   //       $scope.previousSearch = $scope.queryParams.q || null;
   //       $scope.updateVisiblePosts($scope.searchPosts);
   //    } else {
   //       $scope.allPosts = $scope.allPosts.concat(formattedFileList);
   //       $scope.updateVisiblePosts($scope.visiblePosts.concat($scope.filterPosts(formattedFileList)));

   //       //if ($scope.queryPropertyString == queryString) {
   //       // }
   //    }
   //    conurancy_counter = conurancy_counter - 1
   // }

   //----------------------------------------------------
   //---------------- Event Watchers --------------------
   // $scope.$watch('allPosts', function (newValue) {
   //    console.log('allPosts Changed')
   // }, true);
   content_container.onscroll = function (event) {
      var yScroll = content_container.scrollTop;
      $timeout(function () {
         if (yScroll >= 120 && $scope.globals.FABisHidden == true) {
            $scope.globals.FABisHidden = false;
         }
         if (yScroll <= 120 && $scope.globals.FABisHidden == false) {
            $scope.globals.FABisOpen = false;
            $scope.globals.FABisHidden = true;
         }
      })
   };

   window.addEventListener("resize", function () {
      if ($mdMedia('gt-sm')) $mdSidenav('sidenav_overlay').close()
   });

   document.onkeydown = function (e) {
      if (e.altKey && e.ctrlKey) {
         if (e.keyCode == 68) {
            devMode = !devMode
            $timeout(function () {
               $scope.devMode = devMode;
            })
         }
         if (e.keyCode == 75) {
            alert('handeling signin click')
            authorizationService.handleSigninClick(function () {
               alert('done')
            });
         }
         if (e.keyCode == 76) {
            alert('running siginin initialization')
            authorizationService.initilize(function () {
               alert('done')
            })
         }
         if (e.keyCode == 77) {
            alert('signing out')
            gapi.auth2.getAuthInstance().signOut();
         }
      }
   }

   //----------------------------------------------------
   //---------------- Utility Functions --------------------
   var theQueue = {};
   var timer = {};
   var delay = 0;

   // Take a promise.  Queue 'action'.  On 'action' faulure, run 'error' and continue.
   window.promiseQueue = function () {
      var queueSelf = this;
      this.addPromise = function (typeName, promiseFunc, action, error, interval) {
         typeName = typeName || 'general';
         if (!theQueue[typeName]) theQueue[typeName] = []
         theQueue[typeName].push({
            promiseFunc: promiseFunc,
            action: action,
            err: error,
         });
         if (!timer[typeName]) {
            processTheQueue(typeName); // start immediately on the first invocation
            timer[typeName] = setInterval(function () {
               processTheQueue(typeName)
            }, interval || 150);
         }
      };

      function processTheQueue(typeName) {
         var item = theQueue[typeName].shift();
         if (item) {
            var delay = 0;
            if (new Date(authorizationService.GUser.getAuthResponse(true).expires_at) > new Date()) {
               queueSelf.runPromise(item);
            } else {
               authorizationService.GUser.reloadAuthResponse().then(function (res) {
                  console.log('reloaded token')
               }, function (err) {
                  console.warn(err)
                  gapi.auth2.getAuthInstance().signOut().then(function () {
                     authorizationService.showSigninButton();
                  })
               })

            }
         }
         if (theQueue[typeName].length === 0) {
            clearInterval(timer[typeName]), timer[typeName] = null;
         }
      }

      this.runPromise = function (item) {
         var promise = item.promiseFunc();
         promise.then(item.action, function (error) {
            APIErrorHandeler(error, item);
            if (item.Err) {
               item.Err(error);
            } else if (delay < 4) {
               setTimeout(function () {
                  runPromise(item);
               }, (delay = Math.max(delay *= 2, 1)) * 1000);
            }
         });
      }
      return this
   }

   $scope.updateVisiblePosts = function (array, callback) {
      console.log(array)
      $timeout(function () {
         if (array) {
            $scope.visiblePosts = array;
         }
         if (callback) {
            callback();
         }
      })
   }

   //----------------------------------------------------
   //---------------------- dev -------------------------

   $scope.logDuplicationIndexes = function () {
         console.log({
            deDuplicationIndex: deDuplicationIndex,
            classPageTokenSelectionIndex: classPageTokenSelectionIndex
         })
      } //less important functions are delegated to another file;
   subControllerFunctions($scope, $location, $mdDialog, $mdToast, $mdMedia, $timeout, $filter, $mdSidenav, authorizationService, APIService, angularGridInstance); {}
}
