/*global app*/ /*global angular*/ /*global gapi*/ /*global google*/ /*global queue*/ /*global subControllerFunctions*/
app.controller('AppController', controllerFunction)
   //controllerFunction.$inject(['$scope', '$mdDialog', '$window', '$timeout', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', '$location', 'angularGridInstance'])
function controllerFunction($scope, $rootScope, $window, $timeout, $filter, $q, $location, $http, $sce, $mdDialog, $mdPanel, $mdToast, $mdSidenav, $mdMedia, $mdTheming, authorizationService, APIService, angularGridInstance) {
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

   function listenForURLChange() {
      onLocationChange();
      $rootScope.$on('$locationChangeSuccess', onLocationChange);
      getFileTimer = setInterval(function () {
         if (conurancyCounter == 0 && content_container.scrollHeight == content_container.clientHeight) $scope.loadPosts()
      }, 1000);

      function onLocationChange() {
         $scope.queryParams.classPath = $location.path().replace(/\//g, "").replace(/-/g, " ").replace(/~/g, "-") || 'All Posts';
         $scope.selectedClass = $scope.findClassObject($scope.queryParams.classPath);
         $scope.queryParams.q = $location.search().q || null;
         $scope.searchInputTxt = $scope.queryParams.q;
         $scope.queryParams.id = $location.hash();
         $scope.searchPrefix = 'Search';

         no_more_footer.style.display = 'none';
         no_posts_footer.style.display = 'none';
         footer_problem.style.display = 'none';

         if ($scope.queryParams.q == null) {
            $scope.queryParams.flagged = null
            $scope.queryParams.type = null
            $scope.queryParams.creatorEmail = null
         }
         if ($scope.queryParams.classPath == 'All Posts') {
            $scope.queryParams.flagged = false;
         } else if ($scope.queryParams.classPath == 'Your Posts') {
            $scope.queryParams.creatorEmail = $scope.myInfo.Email;
         } else if ($scope.queryParams.classPath == 'Flagged Posts') {
            $scope.queryParams.flagged = true
         } else {
            $scope.queryParams.flagged = false;
            $scope.searchPrefix = 'Search Within';
         }
         if ($scope.allPosts.length != 0) sortPosts($scope.queryParams.q != previousSearch);
         $timeout(function () {
            $scope.selectedClass = $scope.selectedClass;
         });
      }
   }

   if (window.location.search) {
      var unformated = window.location.search.match(/state=([^&]+)(?:$|&)/)
      var shareInput = JSON.parse(decodeURIComponent(unformated[1]));
      if (shareInput.exportIds) {
         var id = shareInput.exportIds[0]
      } else if (shareInput.ids) {
         var id = shareInput.ids[0]
      }
      authorizationService.hideSigninDialog();
      $mdToast.show({
         template: '<md-toast><span style="font-size:18px; max-width: 200px">Loading</span><span flex></span><md-progress-circular class="md-accent" md-mode="indeterminate" style="margin-right: -12px;" md-diameter="32"></md-progress-circular></md-toast>',
         hideDelay: 3000000,
      });
      newPost({
         link: (id != undefined) ? 'https://drive.google.com/?open=' + id : null
      }, 'new')
   }

   //----------------------------------------------------
   //------------- Signin & Initiation ------------------
   var drivePicker, uploadPicker;

   authorizationService.onLoad(function () {
      var profile = authorizationService.GUser.getBasicProfile()
      $scope.myInfo = {
         email: profile.getEmail(),
         name: profile.getName(),
         profilePicture: profile.getImageUrl(),
      }

      var getStartupData = $q.defer();
      promiseQueue.addPromise('drive', APIService.runGAScript('getStartupData'), function (data) {
         var dataObj = JSON.parse(data.result.response.result);
         console.log(dataObj)
         $timeout(function () {
            for (var property in dataObj.userPrefs) {
               $scope.myInfo[property] = dataObj.userPrefs[property];
            }
            $scope.classList = dataObj.classes;
            $scope.sortedLabels = dataObj.labels
            $scope.sortLabels()
            getStartupData.resolve();
         });
      }, null, 150, 'Problem initializing, try reloading the page.');

      var pickerPromise = $q.defer();
      gapi.load('picker', {
         'callback': function () {
            initiateDrivePicker();
            pickerPromise.resolve();
         }
      })

      $q.all([getStartupData.promise, pickerPromise.promise]).then(function () {
         console.log("Everything Loaded")
         listenForURLChange();
         authorizationService.hideSigninDialog();
         document.dispatchEvent(new Event('userInitializatinDone'));
         getDatabase();
      })
   })

   function initiateDrivePicker() {
      var uploadView = new google.picker.DocsUploadView().setParent("0B5NVuDykezpkUGd0LTRGc2hzM2s");
      var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setParent("root");
      var sharedView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setOwnedByMe(false);
      var recentsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(false).setSelectFolderEnabled(true).setLabel('Recents');
      var staredView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setStarred(true).setLabel('Stared');

      drivePicker = new google.picker.PickerBuilder().setDeveloperKey("AIzaSyAhXIGkYgfAG9LXhAuwbePD3z_qSVWUSNA").setOrigin(window.location.protocol + '//' + window.location.host).setOAuthToken(authorizationService.getGAuthToken()).setCallback(drivePickerCallback)
         .addView(docsView).addView(sharedView).addView(recentsView).addView(staredView).build();
      uploadPicker = new google.picker.PickerBuilder().setDeveloperKey("AIzaSyAhXIGkYgfAG9LXhAuwbePD3z_qSVWUSNA").setOrigin(window.location.protocol + '//' + window.location.host).setOAuthToken(authorizationService.getGAuthToken()).setCallback(drivePickerCallback)
         .addView(uploadView).enableFeature(google.picker.Feature.NAV_HIDDEN).hideTitleBar().build();
   }

   function getDatabase() {
      var postsFireRef = authorizationService.FireDatabase.ref('posts')
      postsFireRef.orderByChild('DC').once('value', function (snapshot) {
         snapshot.forEach(function (childSnapshot) {
            $scope.allPosts.push(convertFirePost(childSnapshot.key, childSnapshot.val(), 'notLoaded'))
         });
         postsFireRef.orderByChild('DC').startAt(Date.now()).on('child_added', function (childSnapshot) {
            console.log('newChild', childSnapshot.val())
            $scope.allPosts.push(convertFirePost(childSnapshot.key, childSnapshot.val(), 'notLoaded'));
            getPosts([childSnapshot.key], sortPosts)
         });
         postsFireRef.on('child_removed', function (childSnapshot) {
            console.log('childremoved', childSnapshot)
            var indexes = getIdIndexInPostArrays(childSnapshot.key);
            $timeout(function () {
               $scope.allPosts.splice(indexes.allPosts, 1);
               $scope.sortedPosts.splice(indexes.sortedPosts, 1);
            })
         });
         postsFireRef.on('child_changed', function (childSnapshot, oldSnapshot) {
            console.log(childSnapshot)
            var indexes = getIdIndexInPostArrays(childSnapshot.key)
            var oldPost = $scope.allPosts[indexes.allPosts]
            var newSlimPost = convertFirePost(childSnapshot.key, childSnapshot.val(), 'Loaded')
            var mergedFullPost = mergeFirebasePost(oldPost, newSlimPost);
            console.log(mergedFullPost)
            $timeout(function () {
               $scope.allPosts[indexes.allPosts] = mergedFullPost;
               $scope.sortedPosts[indexes.sortedPosts] = mergedFullPost;
               if (newSlimPost.updateDate != oldPost.updateDate) {
                  console.log('fullUpdate')
                  $scope.allPosts[indexes.allPosts].loadStatus = 'Changed'
                  loadedCounter--;
                  loadPosts();
               } else if (newSlimPost.flagged != oldPost.flagged) {
                  sortPosts();
               } else if (newSlimPost.likeCount != oldPost.likeCount) {
                  console.log('reorderUpdate')
                  $scope.sortedPosts = orderPosts($scope.sortedPosts);
               }
            })
         });
         if ($scope.sortedPosts.length != 0) loadPosts();
         if ($scope.sortedPosts.length == 0) sortPosts();
         console.log($scope.allPosts);
      })

      function convertFirePost(key, value, loadStatus) {
         return {
            id: key,
            creator: {
               email: value.E,
               classOf: (value.E.match(/\d+/) || ['∞'])[0]
            },
            labels: value.L,
            flagged: value.F,
            teachers: value.T,
            likeCount: value.LC,
            updateDate: new Date(value.DU),
            creationDate: new Date(value.DC),
            class: $scope.findClassObject(value.C),
            loadStatus: loadStatus,
         }
      }
   }

   //----------------------------------------------------
   //----------- Loading and Sorting Posts --------------
   var postsFullyLoaded = false;
   var conurancyCounter = 0;
   var loadedCounter = 0;
   var getFileTimer = null;

   $scope.allPosts = [];
   $scope.sortedPosts = [];
   $scope.searchPosts = [];

   function sortPosts() {
      if ($scope.queryParams.q == null) {
         catagorizePosts(filterPosts($scope.allPosts))
      } else {
         promiseQueue.addPromise('drive', APIService.searchGDrive(generateQueryString()), function (postsData) {
            console.log(postsData)
            catagorizePosts(seperatePosts(postsData.result.files))
         }, null, 150, 'Error searching, try again')
      }

      function catagorizePosts(filterObj) {
         $timeout(function () {
            $scope.sortedPosts = orderPosts(filterObj.filtered)
            loadPosts()
         })
         var max = filterObj.filteredOut.length
         for (var count = 0; count < max; count++) {
            var postObj = filterObj.filteredOut[count];
            if (postObj.loadStatus == 'Loaded') {
               var slimedObj = {
                  id: postObj.id,
                  title: postObj.title,
                  class: postObj.class,
                  creator: postObj.creator,
                  flagged: postObj.flagged,
                  likeCount: postObj.likeCount,
                  updateDate: postObj.updateDate,
                  creationDate: postObj.creationDate,
                  loadStatus: 'UnLoaded',
               }
               var indexes = getIdIndexInPostArrays(postObj.id)
               $scope.allPosts[indexes.allPosts] = slimedObj;
               loadedCounter--;
            }
         }
      }
   }

   function orderPosts(inputSet) {
      return inputSet.sort(function (a, b) {
         return b.creationDate.addDays((b.likeCount || 0) * 2) - a.creationDate.addDays((a.likeCount || 0) * 2);
      })
   }

   function filterPosts(inputSet) {
      var filtered = [];
      var filteredOut = [];
      var max = inputSet.length;
      for (var count = 0; count < max; count++) {
         var Type = true,
            Class = true,
            Creator = true,
            Flagged = true;

         if ($scope.queryParams.classPath !== null && $scope.queryParams.classPath !== undefined) {
            if ($scope.selectedClass !== false && ($scope.queryParams.classPath == 'Other' || $scope.selectedClass.stared != null)) Class = inputSet[count].class.name == $scope.queryParams.classPath;
         } else {
            Class = inputSet[count].class.name !== 'Memes';
         }
         if ($scope.queryParams.type != null && $scope.queryParams.type !== undefined) Type = inputSet[count].type == $scope.queryParams.type;
         if ($scope.queryParams.flagged != null && $scope.queryParams.flagged !== undefined) Flagged = inputSet[count].flagged == $scope.queryParams.flagged;
         if ($scope.queryParams.creatorEmail != null && $scope.queryParams.creatorEmail !== undefined) Creator = inputSet[count].creator.email == $scope.queryParams.creatorEmail;
         console.log(Flagged + " C" + Class + " T" + Type + " CR" + Creator, inputSet[count])
         if (Flagged && Class && Type && Creator) {
            filtered.push(inputSet[count])
         } else {
            filteredOut.push(inputSet[count])
         }
      };
      return {
         filtered: filtered,
         filteredOut: filteredOut
      };
   }

   function seperatePosts(inputSet) {
      var idIndex = {}
      var filtered = [];
      var filteredOut = [];
      var max = inputSet.length;
      for (var idCount = 0; idCount < max; idCount++) {
         idIndex[inputSet[idCount].id] = true;
      };
      max = $scope.allPosts.length;
      for (var count = 0; count < max; count++) {
         if (idIndex[$scope.allPosts[count].id] == true) {
            filtered.push($scope.allPosts[count])
         } else {
            filteredOut.push($scope.allPosts[count]);
         }
      }
      return {
         filtered: filtered,
         filteredOut: filteredOut
      };
   }

   function loadPosts() {
      hideSpinner()
      if (conurancyCounter == 0 && $scope.sortedPosts.length != 0 && $scope.sortedPosts.length != loadedCounter) {
         var index;
         var postIdAccumulator = [];
         var max = $scope.sortedPosts.length;
         for (index = 0; index < max; index++) {
            var postObj = $scope.sortedPosts[index];
            if (postObj.loadStatus != 'Loaded') {
               postIdAccumulator.push(postObj.id)
               if (postIdAccumulator.length == 5) {
                  getPosts(postIdAccumulator);
                  return true;
               }
            }
         }
         if (postIdAccumulator.length != 0) getPosts(postIdAccumulator);
      }
   }

   function getPosts(idArray, callBack) {
      conurancyCounter++;
      console.log(idArray)
      promiseQueue.addPromise('script', APIService.runGAScript('getPosts', idArray), function (postsData) {
         console.log(postsData)
         var postsArray = JSON.parse(postsData.result.response.result);
         if (postsArray.error == undefined) {
            conurancyCounter--;
            console.log(conurancyCounter)
            console.log(postsArray);
            var max = postsArray.length;
            for (var count = 0; count < max; count++) {
               loadedCounter++;
               postsArray[count].loadStatus = 'Loaded';
               var indexes = getIdIndexInPostArrays(postsArray[count].id);
               postsArray[count] = mergeFirebasePost(postsArray[count], $scope.allPosts[indexes.allPosts])
               $scope.allPosts[indexes.allPosts] = postsArray[count];
               $scope.sortedPosts[indexes.sortedPosts] = postsArray[count];
            }
            $timeout(function () {
               $scope.sortedPosts = $scope.sortedPosts;
               if (callBack) callBack()
               setTimeout(hideSpinner, 750)
            })
         } else {
            var indexes = getIdIndexInPostArrays(postsArray.id);
            $scope.allPosts.splice(indexes.allPosts, 1)
            $scope.sortedPosts.splice(indexes.sortedPosts, 1)
            conurancyCounter--;
         }
      }, null, 150, 'Error retrieving posts, try reloading the page');
   }

   function hideSpinner(hide) {
      console.log("LoadCount:" + loadedCounter)
      if ($scope.sortedPosts.length == 0) {
         layout_grid.style.height = '0px';
         loading_spinner.style.display = 'none';
         no_posts_footer.style.display = 'block';
         clearInterval(getFileTimer);
      } else if ($scope.sortedPosts.length == loadedCounter) {
         loading_spinner.style.display = 'none';
         no_more_footer.style.display = 'block';
         clearInterval(getFileTimer);
      } else {
         loading_spinner.style.display = 'block';
         no_posts_footer.style.display = 'none';
         no_more_footer.style.display = 'none';
         footer_problem.style.display = 'none';
      }
   }

   // $scope.$watch('sortedPosts', function () {
   //    var visible = [];
   //    var max = $scope.sortedPosts.length
   //    for (var index = 0; index < max; index++) {
   //       var postObj = $scope.sortedPosts[index]
   //       if (postObj.loadStatus == 'Loaded') visible.push(postObj);
   //    }
   //    $timeout(function () {
   //       $scope.visiblePosts = visible;
   //       angularGridInstance.postsGrid.refresh();
   //       if ($scope.visiblePosts.length == 0) layout_grid.style.height = '0px';
   //    })
   // }, true);

   $scope.loadPosts = loadPosts;

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
               operation: operation,
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

   $scope.newPost = newPost;
   $scope.showDrivePicker = showDrivePicker;

   //----------------------------------------------------
   //------------------ Searching -----------------------
   var previousSearch = undefined;

   function generateQueryString() {
      var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false"
      if ($scope.queryParams.flagged !== null && $scope.queryParams.flagged !== undefined) {
         query += " and properties has { key='Flagged' and value='" + $scope.queryParams.flagged + "' }";
      }
      if ($scope.queryParams.creatorEmail !== null && $scope.queryParams.creatorEmail !== undefined) {
         query += " and '" + $scope.queryParams.creatorEmail + "' in owners"
      }
      if ($scope.queryParams.type !== null && $scope.queryParams.type !== undefined) {
         query += " and properties has { key='Type' and value='" + $scope.queryParams.type + "' }"
      }
      if ($scope.queryParams.classPath !== null && $scope.queryParams.classPath !== undefined && $scope.queryParams.classPath !== 'Your Posts' && $scope.queryParams.classPath !== 'All Posts' && $scope.queryParams.classPath !== 'Flagged Posts') {
         query += " and properties has { key='ClassName' and value='" + $scope.queryParams.classPath + "' }"
      }
      if ($scope.queryParams.q !== null && $scope.queryParams.q !== undefined) {
         query += " and fullText contains '" + $scope.queryParams.q + "'";
      }
      console.log(query)
      return query
   }

   $scope.$watch('searchInputTxt', function (newValue) {
      var input = newValue || null
      if (input != ($scope.queryParams.q || null)) $scope.gotoRoute({
         q: input
      })
   }, false);

   //----------------------------------------------------
   //-------------- Filtering & Sorting -----------------
   $scope.findClassObject = function (className) {
      if (className == 'All Posts') {
         return ({
            name: 'All Posts',
            color: 'hsla(200, 70%, 75%,',
            catagory: null,
            rules: null,
            stared: null,
         })
      } else if (className == 'Your Posts') {
         return ({
            name: 'Your Posts',
            color: 'hsla(114, 89%, 42%,',
            catagory: null,
            rules: null,
            stared: null,
         })
      } else if (className == 'Flagged Posts') {
         return ({
            name: 'Flagged Posts',
            color: 'hsla(15, 95%, 65%,',
            catagory: null,
            rules: null,
            stared: null,
         })
      } else if (className == 'York Quizlet') {
         return ({
            name: 'York Quizlet',
            color: 'hsla(229, 46%, 49%,',
            catagory: null,
            rules: null,
            stared: null,
         })
      } else if (className == 'Memes') {
         return ({
            name: 'Memes',
            color: 'hsla(200, 70%, 75%,',
            catagory: null,
            rules: 'What da heck are you doing here??',
            stared: false,
         })
      } else if (className == 'Other') {
         return ({
            name: 'Other',
            color: 'hsla(200, 70%, 75%,',
            catagory: null,
            rules: null,
            stared: null,
         })
      } else {
         for (var Catagories = 0; Catagories < $scope.classList.length; Catagories++) {
            for (var ClassNum = 0; ClassNum < $scope.classList[Catagories].classes.length; ClassNum++) {
               var Class = $scope.classList[Catagories].classes[ClassNum]
               if (Class.name == className) {
                  Class.color = $scope.classList[Catagories].color
                  Class.catagory = $scope.classList[Catagories].catagory
                  Class.stared = Class.stared || false;
                  return (Class)
               }
            }
         }
      }
      return false
      console.warn('could not find class: ' + className);
   };
   $scope.sortLabels = function (input) {
      if ($scope.sortedLabels && $scope.post && $scope.post.class && $scope.post.class.name != '') var classChosen = true;
      for (var labelCount = 0, max = $scope.sortedLabels.length; labelCount < max; labelCount++) {
         var label = $scope.sortedLabels[labelCount];
         var classMax, classCount = 0;
         if (classChosen) {
            for (classCount = 0, classMax = label.classes.length; classCount < classMax; classCount++) {
               var labelClass = label.classes[classCount]
               if (labelClass.name == $scope.post.class.name) {
                  if (label.type == 'Teacher') $scope.sortedLabels[labelCount].sortOrder = (labelClass.usage * 2) + 10000;
                  if (label.type == 'Label') $scope.sortedLabels[labelCount].sortOrder = (labelClass.usage * 2) + 1000;
                  classCount = classMax + 1;
               }
            }
         }
         if (classCount != classMax + 2) {
            if (label.type == 'Teacher') {
               $scope.sortedLabels[labelCount].sortOrder = 0;
            } else {
               $scope.sortedLabels[labelCount].sortOrder = label.totalUsage || 1
            }
         }
      }
      $scope.sortedLabels = $scope.sortedLabels.sort(function (a, b) {
         return (b.sortOrder || 0) - (a.sortOrder || 0);
      })
      console.log($scope.sortedLabels)
      return ($scope.sortedLabels)
   };

   //----------------------------------------------------
   //------------------UI Actions------------------------
   var starClickTimer = {}
   $scope.signOut = function () {
      authorizationService.handleSignoutClick();
   };
   $scope.FABClick = function () { //called by the top left toolbar menu button
      if ($scope.globals.FABisOpen == true) {
         $scope.newPost({}, 'new')
      }

   };
   $scope.toggleSidebar = function (close) { //called by the top left toolbar menu button
      if (close === true) {
         $mdSidenav('sidenav_overlay').close();
      } else {
         if ($mdMedia('gt-sm')) {
            $scope.globals.sidenavIsOpen = !$scope.globals.sidenavIsOpen;
         } else {
            $mdSidenav('sidenav_overlay').toggle();
         }
      }
   };
   $scope.toggleMobileSearch = function (toOpen) {
      $timeout(function () {
         $scope.globals.mobileSearchIsOpen = toOpen;
         $scope.searchInputTxt = '';
      })
      if (toOpen == true) {
         document.getElementById("mobile_search_input").focus();
      } else {
         document.getElementById("mobile_search_input").blur();
      }
   }
   $scope.toggleSidenavClassSearch = function (toOpen) {
      $timeout(function () {
         $scope.globals.sideNavClassSearchOpen = toOpen;
         $scope.sideNavClassSearch = '';
      })
      if (toOpen == true) {
         document.getElementById("sidenav_class_search_input").focus();
      } else {
         document.getElementById("sidenav_class_search_input").blur();
      }
   }
   $scope.userStarClass = function (classObj) {
      classObj.stared = !classObj.stared;
      if (typeof (starClickTimer[classObj.name]) == 'number') clearTimeout(starClickTimer[classObj.name]);
      starClickTimer[classObj.name] = setTimeout(function () {
         var trueClassObj = $scope.findClassObject(classObj.name)
         trueClassObj.stared = classObj.stared;
         for (var count = 0, max = $scope.myInfo.staredClasses.length; count < max; count++) {
            if ($scope.myInfo.staredClasses[count].name == classObj.name) {
               classObj.stared = false;
               trueClassObj.stared = false;
               $scope.myInfo.staredClasses.splice(count, 1);
               count = max + 1;
            }
         }
         if (count != max + 2) {
            classObj.stared = true;
            trueClassObj.stared = true;
            $scope.myInfo.staredClasses.push(classObj)
         }
         scopeUpdate(classObj.stared)
         promiseQueue.addPromise('drive', APIService.runGAScript('saveUserPrefs', {
            operation: 'saveUserPrefs',
            content: {
               starClass: classObj.name
            },
         }), function (data) {
            classObj.stared = data.result.response.result == 'true';
            trueClassObj.stared = classObj.stared;
            scopeUpdate(classObj.stared)
         }, function (err) {
            classObj.stared = !classObj.stared;
            trueClassObj.stared = classObj.stared;
            scopeUpdate(classObj.stared)
         }, 150, 'Problem adding favorite, try again.');
      }, 1000);

      function scopeUpdate(vari) {
         $timeout(function () {
            vari = vari;
         })
      }
   }
   $scope.goToQuzletPage = function () {
      if ($scope.myInfo.quizletUsername == undefined || $scope.myInfo.quizletUsername == '') {
         $scope.gotoRoute({
            classPath: 'York Quizlet'
         });
      } else {
         window.open('https://quizlet.com/join/nVZb4UAU9')
      }
   }
   $scope.addQuizetUsername = function (username) {
      if (username && username != '') {
         $mdToast.showSimple('Connecting...')
         promiseQueue.addPromise('drive', APIService.runGAScript('saveUserPrefs', {
            operation: 'saveUserPrefs',
            content: {
               quizletUsername: username,
            },
         }), function () {
            $mdToast.hide();
            $scope.myInfo.quizletUsername = username;
            $scope.gotoRoute({
               classPath: 'All Posts'
            });
            $timeout(function () {
               $mdToast.show({
                  template: '<md-toast><span>Connection successful <md-button ng-click="launchQuizet()" class="md-accent">launch York Quizlet</md-button></span></md-toast>',
                  hideDelay: 10000,
                  controller: function (scope) {
                     scope.launchQuizet = function () {
                        window.open('https://quizlet.com/join/nVZb4UAU9')
                     }
                  }
               });
            }, 500)
         }, null, 150, 'Problem connecting Quizlet, try again.');
      }
   }

   // $scope.checkQuizletName = function(quizletName) {
   //    $http.get('https://api.quizlet.com/2.0/users/' + quizletName + '/sets?client_id=ZvJPu87NPA').then(console.log,console.warn)
   // }
   $scope.openQuizletAssistWindow = function () {
      var quizWindow = window.open("", "_blank", "status=no,menubar=no,toolbar=no");
      quizWindow.resizeTo(9000, 140)
      quizWindow.moveTo(0, 0);
      quizWindow.document.write("<div style='display:flex;align-items: center;height: 100%;'><span>Your Quizlet username should be here.</span><div style='flex:1;height: 2px;margin-left: 5px;background:black;'></div><div style=' width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 10px solid; '></div><div style=' width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 10px solid; margin-right: 160px; '></div></div>");
      setTimeout(function () {
         quizWindow.location = "https://quizlet.com"
      }, 3000);
   };

   //----------------------------------------------------
   // --------------- Post Card Functions ---------------
   var likeClickTimer = {}
   $scope.deletePost = function (post) {
      var confirm = $mdDialog.confirm().title('Permanently delete this?').ariaLabel('Delete?').ok('Delete').cancel('Cancel');
      $mdDialog.show(confirm).then(function () {
         $mdToast.show({
            template: '<md-toast>Deleting...<md-toast>',
            hideDelay: 10000
         });
         promiseQueue.addPromise('script', APIService.runGAScript('deletePost', post.id, false), function (returnedValue) {
            console.log(returnedValue.result.response.result)
            console.log(post.id)
            if (returnedValue.result.response.result == true || returnedValue.result.response.result == 'true') authorizationService.FireDatabase.ref('posts/' + post.id).remove().then($mdToast.hide, console.warn);
         }, null, 150, 'Problem deleting the post, try again.');
      });
   };
   $scope.likePost = function (post) {
      post.likeCount = post.likeCount || 0;
      if (post.userLiked == false) {
         post.userLiked = true;
         post.likeCount++;
      } else {
         post.userLiked = false;
         post.likeCount--;
      }
      if (typeof (likeClickTimer[post.id]) == 'number') clearTimeout(likeClickTimer[post.id]);
      likeClickTimer[post.id] = setTimeout(function () {
         promiseQueue.addPromise('drive', APIService.runGAScript('likePost', {
            operation: 'likePost',
            postId: post.id,
            content: post.userLiked,
         }), function (data) {
            console.log(data)
            var arrayIndecies = getIdIndexInPostArrays(post.id)
            var res = data.result.response.result.split(" ");
            res[0] = res[0] == 'true'
            res[1] = parseInt(res[1])
            console.log(res)
            $timeout(function () {
               ($scope.allPosts[arrayIndecies.allPosts] || {}).userLiked = res[0];
               ($scope.allPosts[arrayIndecies.allPosts] || {}).likeCount = res[1];
               ($scope.sortedPosts[arrayIndecies.sortedPosts] || {}).userLiked = res[0];
               ($scope.sortedPosts[arrayIndecies.sortedPosts] || {}).likeCount = res[1];
               authorizationService.FireDatabase.ref('posts/' + post.id + '/LC').set(res[1])
            })
         }, null, 150, 'Problem liking the post, try again.');
      }, 2000);
   };

   //----------------------------------------------------
   //-------------------- dialogs -----------------------
   function DialogController(scope, $mdDialog) {
      scope.hideDialog = function () {
         $mdDialog.hide();
      };
      scope.cancelDialog = function () {
         $mdDialog.cancel();
      };
      scope.myEmail = $scope.myInfo.Email
   }
   $scope.openHelpDialog = function () { //called by the top right toolbar help button
      $mdDialog.show({
         templateUrl: 'templates/help.html',
         controller: DialogController,
         parent: angular.element(document.body),
         clickOutsideToClose: true,
         fullscreen: ($mdMedia('xs')),
      });
   };
   $scope.openFeedbackDialog = function () { //called by the top right toolbar help button
      $mdDialog.show({
         templateUrl: 'templates/feedback.html',
         controller: DialogController,
         parent: angular.element(document.body),
         clickOutsideToClose: true,
         fullscreen: ($mdMedia('xs')),
      });
   };
   $scope.openOnboardingDialog = function () { //called by the top right toolbar help button
      $mdDialog.show({
         templateUrl: 'templates/onboard.html',
         controller: DialogController,
         parent: angular.element(document.body),
         // scope: {
         // 	fullscreen:	$mdMedia('xs'),
         // },
         clickOutsideToClose: false,
         fullscreen: ($mdMedia('xs')),
      });
      authorizationService.hideSigninDialog();
   };
   $scope.closeDialog = function () {
      $mdDialog.hide();
   };

   //----------------------------------------------------
   //---------------- Event Watchers --------------------
   window.addEventListener("resize", function () {
      if ($mdMedia('gt-sm')) $mdSidenav('sidenav_overlay').close()
   });
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
   //----------------- Error Handling -------------------

   window.APIErrorHandeler = function (error, item, tries) {
      console.warn(error);
      console.log(item);
      if (tries == 2) sendErrorEmail(error)
      if (error.hasOwnProperty('expectedDomain')) authorizationService.showNonYorkDialog()
      if (error.result && error.result.error) {
         if (error.result.error.details) {
            if (error.result.error.details[0]) {
               if (error.result.error.details[0].errorMessage == 'Authorization is required to perform that action.') {
                  $scope.showInfoPopup('Signin error, retrying...', 'Below is the returned error object:', error, true)
                  return reAuth()
               } else {
                  return $scope.showInfoPopup(item.errMsg || error.result.error.details[0].errorMessage || 'Error', 'Below is the returned error:', error, true)
               }
            } else {
               return $scope.showInfoPopup(item.errMsg || error.result.error.details[0].errorMessage || 'Error', 'Below is the returned error:', error, true)
            }
         } else if (error.result.error.errors) {
            if (error.result.error.errors[0].message == 'Invalid Credentials' || error.result.error.errors[0].reason == 'dailyLimitExceededUnreg') {
               authorizationService.showSigninButton();
               return $scope.showInfoPopup('Please signin again.', 'Below is the returned error object:', error, true)
            } else {
               return $scope.showInfoPopup(item.errMsg || error.result.error.errors[0].message || 'Error', 'Below is the returned error:', error, true)
            }
         }
      }
   }


   function sendErrorEmail(error) {
      promiseQueue.addPromise('drive', APIService.runGAScript('sendEmailError'), null, null, 150, 'Problem connecting, make sure you have an internet connection.');
   }

   window.clearUserInfo = function () {
      $timeout(function () {
         $scope.myInfo = {};
         $scope.sortedPosts = [];
      })
   }

   //----------------------------------------------------
   //---------------- Utility Functions --------------------
   var theQueue = {};
   var timer = {};
   var delay = 1;

   // Take a promise.  Queue 'action'.  On 'action' faulure, run 'error' and continue.
   window.promiseQueue = {
      addPromise: function (typeName, promiseFunc, action, error, interval, errMsg) {
         typeName = typeName || 'general';
         if (!theQueue[typeName]) theQueue[typeName] = []
         theQueue[typeName].push({
            promiseFunc: promiseFunc,
            action: action,
            err: error,
            errMsg: errMsg,
         });
         if (!timer[typeName]) {
            processTheQueue(typeName); // start immediately on the first invocation
            timer[typeName] = setInterval(function () {
               processTheQueue(typeName)
            }, interval || 150);
         }
      },
      runPromise: function (item) {
         var promise = item.promiseFunc();
         promise.then(function (output) {
            console.log('output', output)
            if (output.result && (output.result.hasOwnProperty('kind') == false) && (output.result.hasOwnProperty('files') == false) && (output.result.error || output.result.response.result == 'Error' || output.result.response.result == 'Err')) {
               errorBackoff(output, item)
            } else {
               item.action(output)
            }
         }, function (error) {
            console.log('err', error)
            errorBackoff(error, item)
         });

         function errorBackoff(error, item) {
            var errorHandled = APIErrorHandeler(error, item, delay || 1);
            if (errorHandled) errorHandled.then(function () {
               if (item.Err) item.Err(error);
               if (delay < 4) {
                  setTimeout(function () {
                     promiseQueue.runPromise(item);
                  }, (delay = Math.max(delay *= 2, 1)) * 1000);
               } else {
                  delay = 1;
               }
            });
         }
      }
   }

   function processTheQueue(typeName) {
      var item = theQueue[typeName].shift();
      if (item) {
         var delay = 0;
         if (new Date(authorizationService.GUser.getAuthResponse(true).expires_at) > new Date()) {
            promiseQueue.runPromise(item);
         } else {
            reAuth(function () {
               promiseQueue.runPromise(item)
            })
         }
      }
      if (theQueue[typeName].length == 0) {
         clearInterval(timer[typeName]), timer[typeName] = null;
      }
   }

   function reAuth(callback) {
      if (callback) {
         authorizationService.GUser.reloadAuthResponse().then(callback, function (err) {
            console.warn(err)
            gapi.auth2.getAuthInstance().signOut().then(function () {
               authorizationService.showSigninButton();
            })
         })
      } else {
         return authorizationService.GUser.reloadAuthResponse()
      }
   }

   $scope.removeHttp = function (input) {
      if (input) {
         return (input.replace(/(?:http|https):\/\//, '').replace('www.', ''))
      } else {
         return input
      }
   }

   $scope.openLink = function (link, dontOpen) {
      console.log(link)
      if (link != "" && link != undefined && dontOpen != true) window.open(link)
   };

   function getIdIndexInPostArrays(id) {
      function findPostIndexById(id, array) {
         var index = 0;
         for (index in array) {
            if (array[index].id == id) return (index)
         }
      }
      return {
         allPosts: findPostIndexById(id, $scope.allPosts),
         sortedPosts: findPostIndexById(id, $scope.sortedPosts),
      }
   }

   function updateSortedPosts(array, callback) {
      console.log(array)
      $timeout(function () {
         if (array) {
            $scope.sortedPosts = array;
         }
         if (callback) {
            callback();
         }
      })
   }

   function mergeFirebasePost(fullPost, slimedPost) {
      var fullPostCopy = fullPost
      fullPost.class = slimedPost.class
      fullPost.labels = slimedPost.labels
      fullPost.teachers = slimedPost.teachers
      fullPost.likeCount = slimedPost.likeCount
      fullPost.updateDate = slimedPost.updateDate
      fullPost.creationDate = slimedPost.creationDate
      fullPost.creator.classOf = slimedPost.creator.classOf
      var fullPostNew = fullPost
      fullPost = fullPostCopy;
      return fullPostNew;
   }


   //----------------------------------------------------
   //---------------------- dev -------------------------
   $scope.consoleLogInput = function (input, asAlert) {
      console.log(input)
      if (asAlert) $scope.showInfoPopup('Logged', null, input, false)
   }

   $scope.consoleLogVariable = function (input, asAlert) {
      console.log(self[input])
      if (asAlert) window.alert(JSON.stringify(self[input], null, 4))
   }

   $scope.logPostToConsole = function (post, arrayIndex) {
      //  'FirebaseLink: https://york-studyhub.firebaseio.com/posts/' + post.id + '\nGDriveLink: https://drive.google.com/drive/u/0/#my-drive?action=locate&id=' + post.id)
      console.log({
         'postContent': post,
         'sortedArrayIndex': arrayIndex,
      });
      var html = '<a href="https://york-studyhub.firebaseio.com/posts/' + post.id + '">FirebaseLink</a></br>' +
         '<a href="https://drive.google.com/drive/u/0/#my-drive?action=locate&id=' + post.id + '">GDriveLink</a></br>' +
         '<a href="https://drive.google.com/file/d/' + post.id + '/view">AltGDriveLink</a></br></br>' +
         'sortedArrayIndex: ' + arrayIndex + '</br></br>Below is a JSON representation of the Post.';
      $scope.showInfoPopup('Post Data', html, post, false);
   }

   $scope.refreshLayout = function () {
      angularGridInstance.postsGrid.refresh();
   }

   $scope.showInfoPopup = function (title, helpHtml, content, preToast) {
      if (preToast) {
         var toastPromise = $mdToast.show($mdToast.simple().textContent(title).action('Details').highlightAction(true).highlightClass('md-accent').hideDelay(7000)).then(function (response) {
            if (response == 'ok') showPanel();
         });
      } else {
         showPanel();
      }
      return toastPromise

      function showPanel() {
         if (typeof (content) == 'object' || typeof (content) == 'array') {
            var formatedContent = JSON.stringify(content, undefined, 2)
            console.log(formatedContent)
         } else {
            var formatedContent = content;
         }
         $mdPanel.open({
            attachTo: angular.element(document.body),
            controller: function (mdPanelRef, $scope) {
               $scope.title = title;
               $scope.helpHtml = $sce.trustAsHtml(helpHtml);
               $scope.formatedContent = formatedContent;
               $scope.closePopup = function () {
                  mdPanelRef.close()
               }
            },
            disableParentScroll: false,
            templateUrl: 'templates/popupTemplate.html',
            panelClass: 'demo-dialog-example',
            position: $mdPanel.newPanelPosition().absolute().bottom('16px').left('16px'),
            animation: $mdPanel.newPanelAnimation().openFrom({
               bottom: 0,
               left: 0,
            }).withAnimation($mdPanel.animation.SCALE),
            trapFocus: false,
            zIndex: 15000,
            hasBackdrop: false,
            clickOutsideToClose: false,
            escapeToClose: true,
            focusOnOpen: false,
         });
      }
   }
}
