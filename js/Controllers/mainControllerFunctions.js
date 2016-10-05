/*global app*/ /*global angular*/ /*global gapi*/ /*global google*/ /*global queue*/ /*global subControllerFunctions*/
app.controller('ApplicationController', controllerFunction)
   //controllerFunction.$inject(['$scope', '$mdDialog', '$window', '$timeout', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', '$location', 'angularGridInstance'])
function controllerFunction($scope, $rootScope, $mdDialog, $window, $timeout, $sce, $mdSidenav, $mdMedia, authorizationService, GoogleDriveService, $q, $location, angularGridInstance) {
   var self = this;
   var content_container = document.getElementById("content_container");
   var loading_spinner = document.getElementById("loading_spinner");
   var no_more_footer = document.getElementById("no_more_footer");
   var no_posts_footer = document.getElementById("no_posts_footer");
   var footer_problem = document.getElementById("footer_problem");
   var conurancy_counter = 0
   var performantScrollEnabled = false;

   $scope.allPosts = [];
   $scope.searchPosts = [];
   $scope.visiblePosts = [];

   var deDuplicationIndex = {};
   var classPageTokenSelectionIndex = {};
   var LoadingFiles = null;

   $scope.previousSearch = undefined;
   $scope.searchPlaceholder = 'Search';

   $scope.userList = [];
   $scope.globals = {
      sidenavIsOpen: true,
      FABisOpen: false,
      FABisHidden: true,
      addBarTopIsHidden: false,
      mobileSearchIsOpen: false,
   };
   $scope.angularGridOptions = {
      gridWidth: 250,
      infiniteScroll: function() {
         console.log('loading from overscroll...');
         getFiles();
      },
      scrollContainer: '#content_container',
      pageSize: 1.5,
      performantScroll: true,
      gutterSize: 12,
   };

   $scope.queryPropertyString = '';
   $scope.queryParams = {
      q: undefined, //undefined to make search popunder show with no text in  field
      flagged: false,
      type: null,
      bookmarked: null,
      classpath: 'all-posts',
      creatorEmail: null,
      id: null,
   };

   $scope.$mdMedia = $mdMedia;
   $scope.$mdDialog = $mdDialog;
   $scope.$location = $location;
   // $scope.$timeout = $timeout;

   //----------------------------------------------------
   //------------------- Routing ------------------------
   $scope.gotoRoute = function(query) {
      if (query.classPath) {
         $scope.toggleSidebar(true);
         $location.search({
            q: null
         });
         $location.path(query.classPath);
      } else {
         $location.search({
            q: query.q || $scope.queryParams.q
         });
      }
      $location.hash(query.id || null);
   };

   function listenForURLChange() {
      console.log('ilocation change');
      onLocationChange();
      $rootScope.$on('$locationChangeSuccess', function(event) {
         onLocationChange()
      });
   }

   function onLocationChange() {
      $scope.queryParams.q = $location.search().q || null;
      $scope.queryParams.classpath = $location.path().replace(/\//g, "") || 'all-posts';
      $scope.queryParams.id = $location.hash();

      no_more_footer.style.display = 'none';
      no_posts_footer.style.display = 'none';
      footer_problem.style.display = 'none';

      if ($scope.queryParams.q !== null) {
         if ($scope.queryParams.q !== $scope.previousSearch) {
            $scope.visiblePosts = [];
            $scope.previousSearch = $scope.queryParams.q
         }
      } else {
         $scope.queryParams.flagged = null
         $scope.queryParams.type = null
         $scope.queryParams.bookmarked = null
         $scope.queryParams.creatorEmail = null
      }
      if ($scope.queryParams.classpath === 'all-posts') {
         $scope.searchPlaceholder = 'Search'
         $scope.queryParams.flagged = false;
      } else if ($scope.queryParams.classpath === 'my-posts') {
         $scope.searchPlaceholder = 'Search My Posts'
         $scope.queryParams.creatorEmail = $scope.myInfo.Email;
      } else if ($scope.queryParams.classpath === 'my-bookmarks') {
         $scope.searchPlaceholder = 'Search My Bookmarks'
         $scope.queryParams.bookmarked = true
      } else if ($scope.queryParams.classpath === 'flagged') {
         $scope.searchPlaceholder = 'Search Flagged Posts'
         $scope.queryParams.flagged = true
      } else {
         $scope.searchPlaceholder = 'Search Within ' + $scope.queryParams.classpath;
         $scope.queryParams.flagged = false
      }
      generateQueryString();
      if ($scope.queryParams.q === null) {
         var filteredPosts = $scope.filterPosts($scope.allPosts);
         $timeout(function() {
            console.log({
               filter: filteredPosts,
               All: $scope.allPosts
            })
            $scope.visiblePosts = filteredPosts;
            hideSpinner()
         });
      }
      getFiles();
   }

   //----------------------------------------------------
   //------------- Signin & Initiation ------------------
   gapi.load('client:auth2', function() {
      authorizationService.initilize(function() {
         GoogleDriveService.loadAPIs(initiateDrive);
      });
   });

   function initiateDrive(loaded) {
      console.log("API loaded: " + loaded)
      if (loaded === "drive") {
         var preUserinfo = GoogleDriveService.getUserInfo()
         console.log(preUserinfo);
         queue(preUserinfo, function(userInfo) {
            console.log(preUserinfo);
            $scope.myInfo = {
               "Name": userInfo.result.user.displayName,
               "Email": userInfo.result.user.emailAddress,
               "ClassOf": userInfo.result.user.emailAddress.match(/\d+/)[0],
            };
            document.dispatchEvent(new window.Event('userInfoLoaded'));
         });
      } else if (loaded === "sheets") {
         if ($scope.myInfo !== undefined) {
            handleUserPrefsSheet()
         } else {
            document.addEventListener('userInfoLoaded', function() {
               handleUserPrefsSheet();
            });
         }
      } else if (loaded === "picker") {
         if ($scope.myInfo !== undefined) {
            authorizationService.hideSigninDialog();
         } else {
            document.addEventListener('sheetPrefsLoaded', function() {
               authorizationService.hideSigninDialog();
            });
         }
         //          console.log('run')
         // queue(GoogleDriveService.runGAppsScript(), function(result) {
         //    console.log('run2')
         //    console.log(result)
         // });
      }
   }

   function handleUserPrefsSheet() {
      queue(GoogleDriveService.getSpreadsheetRange('1_ncCoG3lzplXNnSevTivR5bdJaunU2DOQOA0-KWXTU0', "Sheet1!A2:B", false), function(usersList) {
         $scope.userList = usersList.result.values;
         for (var UserContact = 0; UserContact < $scope.userList.length; UserContact++) {
            if ($scope.userList[UserContact][0] === $scope.myInfo.Email) {
               var adjustedUserSettingsCount = UserContact + 2;
               $scope.UserSettingsRange = 'A' + adjustedUserSettingsCount + ':' + adjustedUserSettingsCount
               getSpreadsheetRange('A' + adjustedUserSettingsCount + ':' + adjustedUserSettingsCount);
               UserContact = 100000;
            }
         }
         if (UserContact > 999995) {
            createUserSettings();
         }
      });

      function getSpreadsheetRange(range) {
         queue(GoogleDriveService.getSpreadsheetRange('1_ncCoG3lzplXNnSevTivR5bdJaunU2DOQOA0-KWXTU0', range), function(spreadsheetResult) {
            var UserSettingsArray = spreadsheetResult.result.values[0];
            pushUserSettingsToScope(UserSettingsArray);
            var gg = new window.Event('sheetPrefsLoaded')
            document.dispatchEvent(gg);
         });
      }

      function createUserSettings() {
         var newData = [$scope.myInfo.Email, $scope.myInfo.Name, false, "3/25/2016", "", "", "", 1]
         queue(GoogleDriveService.updateSpreadsheetRange('1_ncCoG3lzplXNnSevTivR5bdJaunU2DOQOA0-KWXTU0', "Sheet1!A1:A", newData, true), function(newRow) {
            console.log(newRow)
            console.log(newRow.result.updates.updatedRange.match(/(?:Sheet1!A)(\d+)/g));
         });
         pushUserSettingsToScope(newData);
      }

      function pushUserSettingsToScope(settingsArray) {
         $scope.myInfo.Moderator = settingsArray[2]
         $scope.myInfo.LastContributionDate = Date.parse(settingsArray[3])
         $scope.myInfo.LastBeenFlaggedDate = Date.parse(settingsArray[4])
         $scope.myInfo.quizletUsername = settingsArray[5]
         $scope.myInfo.LastQuizletCheckDate = Date.parse(settingsArray[6])
         $scope.myInfo.NumberOfVisits = settingsArray[7]
      }
      listenForURLChange(); // this also Starts getting files
      queue(GoogleDriveService.getSpreadsheetRange("1DfFUn8sgnFeLLijtKvWsd90GNcnEG6Xl5JTSeApX3bY", "Sheet1!A2:Z"), handleClassesSheet)
   }

   function handleClassesSheet(rawClasses) {
      var classList = [];
      var classesResult = rawClasses.result.values
         //format the class list:
      for (var Catagory = 0; Catagory < classesResult.length; Catagory++) {
         classList[Catagory] = {
            'Catagory': classesResult[Catagory][0],
            'Color': classesResult[Catagory][1],
            'Classes': []
         }
         for (var Class = 2; Class < classesResult[Catagory].length; Class++) {
            classList[Catagory].Classes[Class - 2] = classesResult[Catagory][Class]
         }
      }
      $timeout(function() { //makes angular update values
         $scope.classList = classList;
      })
   }

   //----------------------------------------------------
   //--------------- Creating Posts ---------------------
   $scope.newPost = function(postObj, operation, event) {
      //called by the bottom right plus/add resource button
      //angular.element(event.path[2]).addClass('fade-out');;
      // console.log(event)
      // console.log(event.path[2])
      // console.log(event.path[2].getBoundingClientRect())
      // var rect = event.path[2].getBoundingClientRect()
      log(postObj);
      $mdDialog.show({
         templateUrl: '/directives/html/newPostContent.html',
         controller: ['$scope', '$mdDialog', 'GoogleDriveService', '$mdToast', "postObj", "operation", newPostController],
         scope: $scope,
         parent: angular.element(document.body),
         preserveScope: true,
         locals: {
            postObj: postObj,
            operation: operation
         },
         onComplete: function() {
            $scope.newPostHeaderImg = document.getElementById("header_image");
            $scope.newPostDescription = document.querySelector('#DescriptionTxt');
            $scope.dialogElement = document.querySelector('#new_post_dialog');
         },
         clickOutsideToClose: false,
         fullscreen: ($mdMedia('xs')),
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
      }).then(function() {
         //angular.element(event.path[2]).removeClass('fade-out');
      });
   };

   $scope.showPicker = function(typ) {
      var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setParent("root");
      var sharedView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setOwnedByMe(false);
      var uploadView = new google.picker.DocsUploadView().setParent("0B5NVuDykezpkUGd0LTRGc2hzM2s");
      console.log("picker");
      if (typ === "Upload") {
         console.log("pickerup");
         var UploadPicker = new google.picker.PickerBuilder().
         addView(uploadView).
         addView(docsView).
         addView(sharedView).
         setOAuthToken(gapi.auth.getToken().access_token).
         setDeveloperKey("AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo").
         setCallback(self.pickerCallback).
         build();
         UploadPicker.setVisible(true);
      } else if (typ === "Drive") {
         var drivePicker = new google.picker.PickerBuilder().
         addView(docsView).
         addView(sharedView).
         addView(uploadView).
         setOAuthToken(gapi.auth.getToken().access_token).
         setDeveloperKey("AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo").
         setCallback(self.pickerCallback).
         build();
         console.log(drivePicker);
         drivePicker.setVisible(true);
      }

   };

   self.pickerCallback = function(data) {
      //drivePicker.dispose();
      console.log(data);
      if (data.action == google.picker.Action.PICKED) {
         var AttachmentId = data.docs[0].id;

         alert('File: ' + data.docs[0].name + " id:" + AttachmentId + " URL:" + data.docs[0].url);
         $scope.newPost(data.docs[0].id, data.docs[0].url);
      }
   }

   //----------------------------------------------------
   //--------- loading and filtering posts --------------
   function getFiles() {
      LoadingFiles = true;
      console.log("concurancy: " + conurancy_counter);
      conurancy_counter++;
      no_more_footer.style.display = 'none';
      no_posts_footer.style.display = 'none';
      footer_problem.style.display = 'none';
      console.log({
         pageIndex: classPageTokenSelectionIndex,
         string: $scope.queryPropertyString,
         nextPageToken: nextPageToken
      })
      var formattedFileList = [];
      var nextPageToken = classPageTokenSelectionIndex[$scope.queryPropertyString] || "";
      if (nextPageToken !== "end") {
         loading_spinner.style.display = 'block';
         queue(GoogleDriveService.getListOfFlies($scope.queryPropertyString, nextPageToken, 3), function(fileList) {
            for (var fileCount = 0; fileCount < fileList.result.files.length; fileCount++) {
               if (!$scope.queryParams.q && deDuplicationIndex[fileList.result.files[fileCount].id] === undefined) {
                  //if the deDuplication obj doesn't have the file's id as a key, it hasn't already been downloaded.
                  formattedFileList[fileCount] = $scope.convertDriveToPost(fileList.result.files[fileCount]) //format and save the new post to the formatted files list array
                  deDuplicationIndex[fileList.result.files[fileCount].id] = 1; //mark this id as used with a "1".
               }
               if ($scope.queryParams.q) {
                  formattedFileList[fileCount] = $scope.convertDriveToPost(fileList.result.files[fileCount]) //format and save the new post to the formatted files list array
               }
            }
            console.log({
               fileList: fileList,
               formattedFileList: formattedFileList
            });
            sortPostsByType(formattedFileList);
            if (fileList.result.nextPageToken !== undefined) {
               classPageTokenSelectionIndex[$scope.queryPropertyString] = fileList.result.nextPageToken; //if we haven't reached the end of our search:
            } else {
               classPageTokenSelectionIndex[$scope.queryPropertyString] = "end" //if we have reached the end of our search:
            }
            hideSpinner();
         }, function() {
            no_more_footer.style.display = 'none';
            no_posts_footer.style.display = 'none';
            footer_problem.style.display = 'flex';
         });
      }
   }

   function hideSpinner() {
      if (classPageTokenSelectionIndex[$scope.queryPropertyString] === "end") {
         loading_spinner.style.display = 'none';
         $timeout(function() {
            if ($scope.visiblePosts.length > 0) {
               no_more_footer.style.display = 'block';
            } else {
               no_posts_footer.style.display = 'block';
            }
         }, 100)
      }
   }

   function generateQueryString() {
      var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false"
      if ($scope.queryParams.flagged !== null && $scope.queryParams.flagged !== undefined) {
         query = query + " and properties has { key='Flagged' and value='" + $scope.queryParams.flagged + "' }";
      }
      if ($scope.queryParams.bookmarked !== null && $scope.queryParams.bookmarked !== undefined) {
         query = query + " and starred = " + $scope.queryParams.bookmarked;
      }
      if ($scope.queryParams.creatorEmail !== null && $scope.queryParams.creatorEmail !== undefined) {
         query = query + " and '" + $scope.queryParams.creatorEmail + "' in owners"
      }
      if ($scope.queryParams.type !== null && $scope.queryParams.type !== undefined) {
         query = query + " and properties has { key='Type' and value='" + $scope.queryParams.type + "' }"
      }
      if ($scope.queryParams.classpath !== null && $scope.queryParams.classpath !== undefined && $scope.queryParams.classpath !== 'my-posts' && $scope.queryParams.classpath !== 'my-bookmarks' && $scope.queryParams.classpath !== 'all-posts' && $scope.queryParams.classpath !== 'flagged') {
         query = query + " and properties has { key='ClassName' and value='" + $scope.queryParams.classpath + "' }"
      }
      if ($scope.queryParams.q !== null && $scope.queryParams.q !== undefined) {
         query = query + " and fullText contains '" + $scope.queryParams.q + "'";
      }
      $scope.queryPropertyString = query;
   }

   function sortPostsByType(formattedFileList) {
      $timeout(function() {
         if ($scope.queryParams.q) {
            if ($scope.queryParams.q === $scope.previousSearch) {
               $scope.searchPosts = $scope.searchPosts.concat(formattedFileList);
            } else {
               $scope.searchPosts = formattedFileList;
            }
            $scope.previousSearch = $scope.queryParams.q
            $scope.visiblePosts = $scope.searchPosts;
         } else {
            $scope.allPosts = $scope.allPosts.concat(formattedFileList);
            $scope.visiblePosts = $scope.visiblePosts.concat($scope.filterPosts(formattedFileList));
         }
         conurancy_counter = conurancy_counter - 1 
         LoadingFiles = false;
         document.dispatchEvent(new window.Event('filesLoaded'));
         console.log('endingLoadingFiles')
      })
   }
   $scope.getFiles = function() {
      console.log('fake get files')
      getFiles();
         // if (LoadingFiles === true) {
         //    console.log('waiting')
         //    document.addEventListener('filesLoaded', getFiles());
         // }
         // else {
         //    removeEventListener('filesLoaded', getFiles())
         //    console.log('startingLoadingFiles')
         //    getFiles()
         // }
   };

   //----------------------------------------------------
   //---------------- Event Watchers --------------------
   // The md-select directive eats keydown events for some quick select
   // logic. Since we have a search input here, we don't need that logic.
   // var selectSearchInput = angular.element(document.getElementById('class_select_input'))
   // selectSearchInput.on('keydown', function(ev) {
   //        ev.stopPropagation();
   //        console.log(ev)
   // });
   addResizeListener(content_container, function() {
      console.log('resize')
   });
   content_container.onscroll = function(event) {
      //called whenever the content_container scrolls
      // if (performantScrollEnabled === false && $scope.angularGridOptions.performantScroll === false) {
      //    $scope.angularGridOptions.performantScroll = true;
      //    performantScrollEnabled = true;
      // }
      var yScroll = content_container.scrollTop;
      if (yScroll >= 120) {
         $scope.globals.FABisHidden = false;
         $scope.globals.FABisOpen = false;
      } else {
         $scope.globals.FABisOpen = false;
         $scope.globals.FABisHidden = true;
      }
   };
   window.addEventListener("resize", function() {
      // if (performantScrollEnabled === true && $scope.angularGridOptions.performantScroll === true) {
      //    $scope.angularGridOptions.performantScroll = false;
      //    performantScrollEnabled = false;
      // }
      if ($mdMedia('gt-sm')) {
         $mdSidenav('sidenav_overlay').close();
      }
   });
   document.onkeydown = function(e) {
      if (e.altKey && e.ctrlKey && e.keyCode == 68) {
         devMode = !devMode
         $timeout(function() {
            $scope.devMode = devMode;
         })
      }
   }
   $scope.$watch("visiblePosts", function() {
      console.log("VisiblePosts Updated")
      console.log($scope.visiblePosts)
		angularGridInstance.postsGrid.refresh();
	});

   //----------------------------------------------------
   //---------------------- dev -------------------------
   $scope.logDuplicationIndexes = function() {
      console.log({
         deDuplicationIndex: deDuplicationIndex,
         classPageTokenSelectionIndex: classPageTokenSelectionIndex
      })
   }

   //More (less important functions are delegated to another file);
   subControllerFunctions($scope, $location, $mdDialog, $mdMedia, $timeout, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance);
}
