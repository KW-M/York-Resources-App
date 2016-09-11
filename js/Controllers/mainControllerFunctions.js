/*global app*/ /*global angular*/ /*global gapi*/ /*global google*/ /*global queue*//*global subControllerFunctions*/
app.controller('ApplicationController', controllerFunction)
//controllerFunction.$inject(['$scope', '$mdDialog', '$window', '$timeout', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', '$location', 'angularGridInstance'])
function controllerFunction($scope, $mdDialog, $window, $timeout, $sce, $mdSidenav, $mdMedia, authorizationService, GoogleDriveService, $q, $location, angularGridInstance) {
   var self = this;
   var content_container = document.getElementById("content_container");
   var loading_spinner = document.getElementById("loading_spinner");
   var performantScrollEnabled = false;

   $scope.allPosts = [];
   $scope.searchPosts = [];
   $scope.flaggedPosts = [];
   $scope.visiblePosts = [];

   var deDuplicationIndex = {};
   var classPageTokenSelectionIndex = {};
   var firstFiles = false;

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

   $scope.queryPropertyString = '';
   $scope.queryParams = {
      q: undefined, //undefined to make search popunder show with no text in  field
      type: "any",
      classpath: 'all-posts',
      creatorEmail: "any",
      id: null,
   };

   $scope.$mdMedia = $mdMedia;
   $scope.$mdDialog = $mdDialog;
   $scope.$location = $location;

   //-routing-------------

   $scope.gotoRoute = function(query) {
      var tempQuery = {}
      if (query.q !== null && query.q !== undefined && query.q !== '') {
         tempQuery.q = query.q || $scope.queryParams.q;
         tempQuery.type = query.type || $scope.queryParams.type;
         tempQuery.creatorEmail = query.creatorEmail || $scope.queryParams.creatorEmail;
      } else {
         tempQuery.q = null;
         tempQuery.flagged = null;
         tempQuery.type = null;
         tempQuery.creatorEmail = null;
      }
      if (query.classPath) {
         $scope.toggleSidebar(true);
      }
      $location.path(query.classpath || 'all-posts');
      $location.hash(query.id || null);
      $location.search(tempQuery || null);
   };
   
   function listenForURLChange() {
      onLocationChange();
      $scope.$on('$locationChangeSuccess', onLocationChange());
      function onLocationChange() {
         $scope.queryParams = $location.search();
         $scope.queryParams.classpath = $location.path().replace(/\//g, "");
         $scope.queryParams.id = $location.hash();
         if ($scope.queryParams.q !== $scope.previousSearch) {
            $scope.visiblePosts = []
            $scope.previousSearch = $scope.queryParams.q
         }
         
         $scope.generateQueryString();
         $scope.getFiles();
      }
   }

   //-creating posts---------

   $scope.newPost = function(postObj, operation) {
      //called by the bottom right plus/add resource button
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
         openFrom: ('#new_post_button'),
         closeTo: {
            left: 1000,
         }
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
      }
      else if (typ === "Drive") {
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


   //-loading and filtering posts---------

   $scope.getFiles = function() {
      firstFiles = true;
      var fileCount = 0;
      var formattedFileList = [];
      var nextPageToken = classPageTokenSelectionIndex[$scope.queryPropertyString] || "";

      if (nextPageToken !== "end") {
         loading_spinner.style.display = 'inherit'; //show the user that were loading results
         queue(GoogleDriveService.getListOfFlies($scope.queryPropertyString, nextPageToken, 3), function(fileList) {
            console.log(fileList)
            if (fileList.result.files.length > 0) {
               //format every file:
               if (!$scope.queryParams.q) {
                  for (o = 0; o < fileList.result.files.length; o++) {
                     if (deDuplicationIndex[fileList.result.files[o].id] === undefined) {
                        //if the deDuplication obj doesn't have the file's id as a key, it hasn't already been downloaded.
                        deDuplicationIndex[fileList.result.files[o].id] = 1; //mark this id as used with a "1".
                        formattedFileList[fileCount] = $scope.formatPost(fileList.result.files[o]); //format and save the new post to the formatted files list array
                        fileCount++;
                     }
                  }
               }
               else {
                  for (o = 0; o < fileList.result.files.length; o++) {
                     formattedFileList[fileCount] = $scope.formatPost(fileList.result.files[o]);
                     fileCount++;
                  }
               }
               if (formattedFileList.length !== 0) {
                  if (fileList.result.nextPageToken !== undefined) {
                     //if we haven't reached the end of our search:
                     classPageTokenSelectionIndex[$scope.queryPropertyString] = fileList.result.nextPageToken;
                  }
                  else {
                     //if we have reached the end of our search:
                     classPageTokenSelectionIndex[$scope.queryPropertyString] = "end"
                  }
                  sortPostsByType(formattedFileList);
                  log({
                     allPosts: $scope.allPosts,
                     visiblePosts: $scope.visiblePosts,
                  }, true);
                  log("-----------------------", true);
               }
               else {
                  sortPostsByType();
                  if (fileList.result.nextPageToken !== undefined) { //if we haven't reached the end of our search:
                     log("duplicate posts - more posts coming...")
                     classPageTokenSelectionIndex[$scope.queryPropertyString] = fileList.result.nextPageToken;
                  }
                  else { //if we havene reached the end of our search:
                     log("duplicate posts - end of the line");
                     classPageTokenSelectionIndex[$scope.queryPropertyString] = "end";
                  }
                  //$scope.getFiles();
               }
            }
            else {
               loading_spinner.style.display = 'none';
               sortPostsByType();
            }
         });
      }
      else {
         loading_spinner.style.display = 'none';
         sortPostsByType();
      }
   }

   function sortPostsByType(formattedFileList) {
      if ($scope.queryParams.q) {
         if (formattedFileList !== undefined) {
            if ($scope.queryParams.q === $scope.previousSearch) {
               log('continueing search')
               $scope.searchPosts = $scope.searchPosts.concat(formattedFileList);
            }
            else {
               $scope.searchPosts = formattedFileList;
            }
            $scope.previousSearch = $scope.queryParams.q
         }
         $timeout(function() {
            $scope.visiblePosts = $scope.searchPosts;
         })
      }
      else {
         if ($scope.queryParams.classpath === 'all-posts') {
            $scope.searchPlaceholder = 'Search'
            if (formattedFileList !== undefined) {
               $scope.allPosts = $scope.allPosts.concat(formattedFileList);
            }
            $timeout(function() {
               $scope.visiblePosts = $scope.allPosts;
               log({
                  visiblePosts: $scope.visiblePosts
               }, true);
            })
         }
         else if ($scope.queryParams.classpath === 'flagged') {
            $scope.searchPlaceholder = 'Search Flagged Posts'
            if (formattedFileList !== undefined) {
               $scope.flaggedPosts = $scope.flaggedPosts.concat(formattedFileList);
            }
            $timeout(function() {
               $scope.visiblePosts = $scope.flaggedPosts;
               log({
                  visiblePosts: $scope.visiblePosts
               }, true);
            })
         }
         else if ($scope.queryParams.classpath === 'my-posts') {
            $scope.searchPlaceholder = 'Search My Posts'
            if (formattedFileList !== undefined) {
               $scope.allPosts = $scope.allPosts.concat(formattedFileList);
            }
            var filteredPosts = $scope.filterPosts($scope.allPosts.concat($scope.flaggedPosts));
            $timeout(function() {
               $scope.visiblePosts = filteredPosts;
               log({
                  visiblePosts: $scope.visiblePosts
               }, true);
            });
         }
         else {
            $scope.searchPlaceholder = 'Search ' + $scope.queryParams.classpath;
            if (formattedFileList !== undefined) {
               $scope.allPosts = $scope.allPosts.concat(formattedFileList);
            }
            var filteredPosts = $scope.filterPosts($scope.allPosts.concat($scope.flaggedPosts));
            $timeout(function() {
               $scope.visiblePosts = filteredPosts;
               log({
                  visiblePosts: $scope.visiblePosts
               }, true);
            });
         }
      }
   }

   $scope.generateQueryString = function() {
      if ($scope.queryParams.classpath === 'all-posts') {
         var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false and properties has { key='Flagged' and value='false' }"
      }
      else if ($scope.queryParams.classpath === 'my-posts') {
         var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false"
      }
      else if ($scope.queryParams.classpath === 'my-bookmarks') {
         var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false"
      }
      else if ($scope.queryParams.classpath === 'flagged') {
         var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false and properties has { key='Flagged' and value='true' }"
      } else {
         var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false and properties has { key='Flagged' and value='false' } and properties has { key='ClassName' and value='" + $scope.queryParams.classpath + "' }"
      }
      if ($scope.queryParams.q) {
         query = query + " and fullText contains '" + $scope.queryParams.q + "'";
      }
      if ($scope.queryParams.creatorEmail !== "any" && $scope.queryParams.creatorEmail !== undefined) {
         query = query + " and '" + $scope.queryParams.creatorEmail + "' in owners "
      }
      if ($scope.queryParams.type !== "any" && $scope.queryParams.type !== undefined) {
         query = query + " and properties has { key='Type' and value='" + $scope.queryParams.type + "' }"
      }
      $scope.queryPropertyString = query;
   }

   $scope.filterPosts = function(inputSet) {
      return inputSet.filter(function(post) {
         var Flagged = post.Flagged === $scope.queryParams.flagged || post.Flagged;
         if ($scope.queryParams.class !== "any" && $scope.queryParams.class !== undefined) {
            var Class = post.Class.Name === $scope.queryParams.class;
         }
         else {
            var Class = true;
         }
         if ($scope.queryParams.type !== "any" && $scope.queryParams.type !== undefined) {
            var Type = post.Type === $scope.queryParams.type;
         }
         else {
            var Type = true;
         }
         if ($scope.queryParams.creatorEmail !== "any" && $scope.queryParams.creatorEmail !== undefined) {
            var Creator = post.Creator.Email === $scope.queryParams.creatorEmail;
         }
         else {
            var Creator = true;
         }
         console.log({
            filteredPost: post,
            Flagged: Flagged,
            Class: Class,
            Type,
            Type,
            Creator: Creator,
         });
         return Flagged && Class && Type && Creator;
      });
   }

   $scope.formatPost = function(unformatedFile) {
      var formatedFile = {}
      var tagsRaw = "[\"" + unformatedFile.properties.Tag1 + unformatedFile.properties.Tag2 + "\"]";
      var titleAndURL = unformatedFile.name.split("{]|[}");

      formatedFile.Type = unformatedFile.properties.Type;
      formatedFile.Flagged = unformatedFile.properties.Flagged;
      formatedFile.getghjmb = false;
      formatedFile.Id = unformatedFile.id;

      formatedFile.Title = titleAndURL[0];
      formatedFile.Description = unformatedFile.description;
      formatedFile.CreationDate = unformatedFile.createdTime //Date.prototype.parseRFC3339(unformatedFile.createdTime);
      formatedFile.UpdateDate = unformatedFile.modifiedTime //Date.prototype.parseRFC3339(unformatedFile.modifiedTime);
      if (unformatedFile.properties.Tag1 || unformatedFile.properties.Tag2) {
         formatedFile.Tags = JSON.parse(tagsRaw.replace(/,/g, "\",\""));
      }
      else {
         formatedFile.Tags = [];
      }
      formatedFile.TagString = unformatedFile.properties.Tag1 + unformatedFile.properties.Tag2;
      formatedFile.Creator = {
         Name: unformatedFile.owners[0].displayName,
         Me: unformatedFile.owners[0].me,
         Email: unformatedFile.owners[0].emailAddress,
         ClassOf: unformatedFile.owners[0].emailAddress.match(/\d+/)[0],
      }
      formatedFile.Class = {
         Name: unformatedFile.properties.ClassName,
         Catagory: unformatedFile.properties.ClassCatagory,
         Color: unformatedFile.properties.ClassColor,
      }

      formatedFile.Link = titleAndURL[1];
      formatedFile.attachmentId = unformatedFile.properties.attachmentId;
      if (formatedFile.Type === "Link") {
         formatedFile.PreviewImg = unformatedFile.thumbnailLink.replace("=s220", "=s400")
      }
      else if (formatedFile.Type === "Gdrive") {
         formatedFile.PreviewImg = "https://drive.google.com/thumbnail?authuser=0&sz=w400&id=" + formatedFile.attachmentId;
      }

      if (devMode) {
         console.log({
            unformated: unformatedFile,
            formated: formatedFile
         })
      }

      return formatedFile;
   }

   //-signin & initiation------------

   gapi.load('client:auth2', function() {
      authorizationService.initilize(GoogleDriveService.loadAPIs(initiateDrive));
   });

   function initiateDrive(loaded) {
      console.log("API loaded: " + loaded)
      if (loaded === "drive") {
         queue(GoogleDriveService.getUserInfo(), function(userInfo) {
            $scope.myInfo = {
               "Name": userInfo.result.user.displayName,
               "Email": userInfo.result.user.emailAddress,
               "ClassOf": userInfo.result.user.emailAddress.match(/\d+/)[0],
            };
            document.dispatchEvent(new window.Event('userInfoLoaded'));
         });
      }
      else if (loaded === "sheets") {
         if ($scope.myInfo !== undefined) {
            handleUserPrefsSheet()
         }
         else {
            document.addEventListener('userInfoLoaded', function() {
               handleUserPrefsSheet();
            });
         }
      }
      else if (loaded === "picker") {
         if ($scope.myInfo !== undefined) {
            authorizationService.hideSigninDialog();
         }
         else {
            document.addEventListener('sheetPrefsLoaded', function() {
               authorizationService.hideSigninDialog();
            });
         }
      }

      // queue(GoogleDriveService.runGAppsScript(), function(result) {
      //    console.log(result)
      // });
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
      listenForURLChange();// this also Starts getting files
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

   //-event watchers---------

   $scope.angularGridOptions = {
      gridWidth: 250,
      infiniteScroll: function() {
         console.log('loading from overscroll...');
         if ($scope.visiblePosts >= 1) {
            $scope.getFiles();
         }
      },
      scrollContainer: '#content_container',
      pageSize: 1.5,
      performantScroll: true,
      gutterSize: 12,
   };


   // The md-select directive eats keydown events for some quick select
   // logic. Since we have a search input here, we don't need that logic.
   // var selectSearchInput = angular.element(document.getElementById('class_select_input'))
   // selectSearchInput.on('keydown', function(ev) {
   //        ev.stopPropagation();
   //        console.log(ev)
   // });
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
      }
      else {
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

   subControllerFunctions($scope, $location, $mdDialog, $mdMedia, $timeout, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance);
}
