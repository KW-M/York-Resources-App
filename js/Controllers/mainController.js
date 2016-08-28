/*global app*/ /*global angular*/ /*global gapi*/ /*global google*/ /*global queue*/
var dependancies = ['$scope', '$mdDialog', '$window', '$timeout', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', '$location', '$routeParams', 'angularGridInstance']
app.controller('ApplicationController', dependancies.concat([function($scope, $mdDialog, $window, $timeout, $sce, $mdSidenav, $mdMedia, authorizationService, GoogleDriveService, $q, $location, $routeParams, angularGridInstance) {
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

   $scope.searchTxt = undefined; //undefined to make popunder show with no text in  field
   $scope.previousSearch = undefined;
   $scope.searchPlaceholder = 'Search';
   $scope.searchExtra = [undefined];
   $scope.searchChips = ["Class: "]

   $scope.classList = classes;
   $scope.userList = [];
   $scope.Tags = [];
   $scope.globals = {
      FABisOpen: false,
      FABisHidden: true,
      sidenavIsOpen: true,
      mobileSearchOpen: false,
   };

   $scope.firstFiles = false;
   $scope.queryPropertyString = '';
   $scope.queryProperties = {
      Flagged: false,
      Type: "any",
      Class: "any",
      CreatorEmail: "any",
   };


   $scope.$mdMedia = $mdMedia;
   $scope.$mdDialog = $mdDialog;

   var moderators = { //temporary
      'worcester-moorek2018@york.org': true,
   }

   //-routing-------------

   $scope.pathSelected = function(path) {
      if ($location.path() === path) {
         return true;
      }
      else {
         return false;
      }
   }

   $scope.gotoRoute = function(path, query, id) {
      if (path) {
         $location.path(path);
         $scope.toggleSidebar(true);
      }
      if (id) {
         $location.hash(id);
      }
      if (query) {
         $location.search('q=' + query);
         var deferred = $q.defer();
         console.log(deferred);
         $timeout(function() {
            deferred.resolve(['o']);
         }, Math.random() * 1000, false);
         return deferred.promise;
      }
      else {
         $location.search('');
      }
   };

   $scope.$on('$routeChangeSuccess', function() {
      $scope.classParam = $location.path();
      $scope.queryParam = $location.search();
      $scope.idParam = $location.hash();
      $scope.selectedClass = $scope.classParam.replace(/\//g, "")
      if ($scope.firstFiles == true) { // check  if firstFiles have been loaded
         //sortPostsByType();
         $window.setTimeout(function() {
            $scope.getFiles();
         }, 100);
      }
   });

   //-creating posts---------

   $scope.newPost = function(postObj, operation) {
      //called by the bottom right plus/add resource button
      console.log(postObj)
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
      console.log("loaded my picker")
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
      $scope.firstFiles = true;
      if ($scope.searchTxt) {
         var nextPageToken = classPageTokenSelectionIndex[$scope.selectedClass + $scope.searchTxt] || "";
      }
      else {
         var nextPageToken = classPageTokenSelectionIndex[$scope.selectedClass] || "";
      }
      if (nextPageToken !== "end") {
         $scope.getQueryProperties();
         loading_spinner.style.display = 'inherit'; //////
         var queryParamString = $scope.generateQueryString();
         console.log("query params:" + queryParamString);
         queue(GoogleDriveService.getListOfFlies(queryParamString, nextPageToken, 2), function(fileList) {
            console.log(fileList);
            if (fileList.result.files.length > 0) {
               //format every file:
               console.log('files length ' + fileList.result.files.length);
               var fileCount = 0;
               var formattedFileList = [];
               if (!$scope.searchTxt) {
                  for (o = 0; o < fileList.result.files.length; o++) {
                     if (deDuplicationIndex[fileList.result.files[o].id] === undefined) { //if the deDuplication obj doesn't have the file's id as a key, it hasn't already been downloaded.
                        formattedFileList[fileCount] = $scope.formatPost(fileList.result.files[o]);
                        deDuplicationIndex[fileList.result.files[o].id] = 1; //mark this id as used with a one.
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
                  if (fileList.result.nextPageToken !== undefined) { //if we haven't reached the end of our search:
                     console.log("more posts coming...")
                     if ($scope.searchTxt) {
                        classPageTokenSelectionIndex[$scope.selectedClass + $scope.searchTxt] = fileList.result.nextPageToken;
                     }
                     else {
                        classPageTokenSelectionIndex[$scope.selectedClass] = fileList.result.nextPageToken;
                     }
                  }
                  else { //if we havene reached the end of our search:
                     console.log("end of the line");
                     if ($scope.searchTxt) {
                        classPageTokenSelectionIndex[$scope.selectedClass + $scope.searchTxt] = "end";
                     }
                     else {
                        classPageTokenSelectionIndex[$scope.selectedClass] = "end";
                     }
                  }
                  sortPostsByType(formattedFileList);
                  console.log({
                     allPosts: $scope.allPosts,
                     visiblePosts: $scope.visiblePosts,
                  });
                  console.log("-----------------------");
               }
               else {
                  sortPostsByType();
                  if (fileList.result.nextPageToken !== undefined) { //if we haven't reached the end of our search:
                     console.log("duplicate posts - more posts coming...")
                     if ($scope.searchTxt) {
                        classPageTokenSelectionIndex[$scope.selectedClass + $scope.searchTxt] = fileList.result.nextPageToken;
                     }
                     else {
                        classPageTokenSelectionIndex[$scope.selectedClass] = fileList.result.nextPageToken;
                     }
                  }
                  else { //if we havene reached the end of our search:
                     console.log("duplicate posts - end of the line");
                     if ($scope.searchTxt) {
                        classPageTokenSelectionIndex[$scope.selectedClass + $scope.searchTxt] = "end";
                     }
                     else {
                        classPageTokenSelectionIndex[$scope.selectedClass] = "end";
                     }
                  }
                  $scope.getFiles();
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
      $timeout(function() {
         console.log("sorting");
         if ($scope.searchTxt) {
            if (formattedFileList !== undefined) {
               if ($scope.searchTxt === $scope.previousSearch) {
                  console.log('continueing search')
                  $scope.searchPosts = $scope.searchPosts.concat(formattedFileList);
               }
               else {
                  $scope.searchPosts = formattedFileList;
               }
               $scope.previousSearch = $scope.searchTxt
            }
            $scope.visiblePosts = $scope.searchPosts;
         }
         else {
            if ($scope.selectedClass === 'all-posts') {
               $scope.searchPlaceholder = 'Search'
               if (formattedFileList !== undefined) {
                  $scope.allPosts = $scope.allPosts.concat(formattedFileList);
               }
               $scope.visiblePosts = $scope.allPosts;
            }
            else if ($scope.selectedClass === 'flagged') {
               $scope.searchPlaceholder = 'Search Flagged Posts'
               if (formattedFileList !== undefined) {
                  $scope.flaggedPosts = $scope.flaggedPosts.concat(formattedFileList);
               }
               $scope.visiblePosts = $scope.flaggedPosts;
            }
            else if ($scope.selectedClass === 'my-posts') {
               $scope.searchPlaceholder = 'Search My Posts'
               if (formattedFileList !== undefined) {
                  $scope.allPosts = $scope.allPosts.concat(formattedFileList);
               }
               $scope.visiblePosts = $scope.filterPosts($scope.allPosts.concat($scope.flaggedPosts));
            }
            else {
               $scope.searchPlaceholder = 'Search ' + $scope.selectedClass;
               if (formattedFileList !== undefined) {
                  $scope.allPosts = $scope.allPosts.concat(formattedFileList);
               }
               $scope.visiblePosts = $scope.filterPosts($scope.allPosts.concat($scope.flaggedPosts));
            }
         }
      })
   }

   $scope.generateQueryString = function() {
      var query = "'0B5NVuDykezpkbUxvOUMyNnRsUGc' in parents and trashed = false";
      if ($scope.searchTxt) {
         query = query + " and fullText contains '" + $scope.searchTxt + "'";
      }
      query = query + " and properties has { key='Flagged' and value='" + $scope.queryProperties.Flagged + "' }"
      if ($scope.queryProperties.Class !== "any" && $scope.queryProperties.Class !== undefined) {
         query = query + " and properties has { key='ClassName' and value='" + $scope.queryProperties.Class + "' }"
      }
      if ($scope.queryProperties.CreatorEmail !== "any" && $scope.queryProperties.CreatorEmail !== undefined) {
         query = query + " and '" + $scope.queryProperties.CreatorEmail + "' in owners "
      }
      if ($scope.queryProperties.Type !== "any" && $scope.queryProperties.Type !== undefined) {
         query = query + " and properties has { key='Type' and value='" + $scope.queryProperties.Type + "' }"
      }
      return query;
   }

   $scope.filterPosts = function(inputSet) {

      return inputSet.filter(function(post) {
         var Flagged = post.Flagged === $scope.queryProperties.Flagged || post.Flagged;
         if ($scope.queryProperties.Class !== "any" && $scope.queryProperties.Class !== undefined) {
            var Class = post.Class.Name === $scope.queryProperties.Class;
         }
         else {
            var Class = true;
         }
         if ($scope.queryProperties.Type !== "any" && $scope.queryProperties.Type !== undefined) {
            var Type = post.Type === $scope.queryProperties.Type;
         }
         else {
            var Type = true;
         }
         if ($scope.queryProperties.CreatorEmail !== "any" && $scope.queryProperties.CreatorEmail !== undefined) {
            var Creator = post.Creator.Email === $scope.queryProperties.CreatorEmail;
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

   $scope.sortByLikes = function(thingToSort) {
      thingToSort.sort(function(a, b) {
         return b.LikeUsers.length - a.LikeUsers.length;
      });
   }

   $scope.sortByDate = function(thingToSort) {
      thingToSort.sort(function(a, b) {
         return b.UpdateDate - a.UpdateDate;
      });
   }

   $scope.formatPost = function(unformatedFile) {
      var formatedFile = {}
      var tagsRaw = "[\"" + unformatedFile.properties.Tag1 + unformatedFile.properties.Tag2 + "\"]";
      var titleAndURL = unformatedFile.name.split("{]|[}");

      formatedFile.Type = unformatedFile.properties.Type;
      formatedFile.Flagged = unformatedFile.properties.Flagged;
      formatedFile.Id = unformatedFile.id;

      formatedFile.Title = titleAndURL[0];
      formatedFile.Description = unformatedFile.description;
      formatedFile.CreationDate = unformatedFile.createdTime //Date.prototype.parseRFC3339(unformatedFile.createdTime);
      formatedFile.UpdateDate = unformatedFile.modifiedTime //Date.prototype.parseRFC3339(unformatedFile.modifiedTime);
      if (unformatedFile.properties.Tag1 || unformatedFile.properties.Tag2) {
      formatedFile.Tags = JSON.parse(tagsRaw.replace(/,/g, "\",\""));
      } else {
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
      formatedFile.PreviewImg = unformatedFile.thumbnailLink.replace("=s220", "=s400") //"https://drive.google.com/thumbnail?authuser=0&sz=w400&id=" + formatedFile.Id;

      console.log({
         unformated: unformatedFile,
         formated: formatedFile
      })

      return formatedFile;
   }

   //-UI actions---------

   $scope.toggleSidebar = function(urlPathChanged) { //called by the top left toolbar menu button
      if (urlPathChanged === true) {
         if ($mdMedia('gt-sm') !== true) {
            $mdSidenav('sidenav_overlay').toggle();
         }
      }
      else {
         if ($mdMedia('gt-sm')) {
            $scope.globals.sidenavIsOpen = !$scope.globals.sidenavIsOpen;
            $window.setTimeout(angularGridInstance.posts.refresh, 500);
         }
         else {
            $mdSidenav('sidenav_overlay').toggle();
         }
      }
   };

   $scope.toggleMobileSearch = function() {
      $scope.globals.mobileSearchOpen = !$scope.globals.mobileSearchOpen;
      console.log($scope.globals.mobileSearchOpen);
   }

   $scope.openHelpDialog = function() { //called by the top right toolbar help button
      $mdDialog.show({
         templateUrl: 'templates/html/help.html',
         controller: DialogController,
         parent: angular.element(document.body),
         clickOutsideToClose: true,
         fullscreen: ($mdMedia('xs')),
      });
   };

   $scope.openOnboardingDialog = function() { //called by the top right toolbar help button
      $mdDialog.show({
         templateUrl: 'templates/html/onboarding.html',
         controller: DialogController,
         parent: angular.element(document.body),
         clickOutsideToClose: false,
         fullscreen: ($mdMedia('xs')),
      });
      authorizationService.hideSigninDialog();
   };

   $scope.logPostToConsole = function(content, arrayIndex) {
      console.log({
         'loggedPostContent': content,
         'arrayIndex': arrayIndex
      });
   };

   $scope.confirmDelete = function(ev, content, arrayIndex) {
      // Appending dialog to document.body to cover sidenav in docs app
      var confirm = $mdDialog.confirm()
         .title('Permanently delete this?')
         .ariaLabel('Delete?')
         .targetEvent(ev)
         .ok('Delete')
         .cancel('Cancel');
      $mdDialog.show(confirm).then(function() {
         //ok
         $timeout(function() { //makes angular update values
            $scope.visiblePosts.splice(arrayIndex, 1);
         });
         queue(GoogleDriveService.deleteDriveFile(content.Id), function() {
            console.log("deleted" + content.Id);
         });
      }, function() {
         //cancel
      });
   };

   $scope.flagPost = function(ev, content, arrayIndex) {
      content.Flagged = true;
      $timeout(function() { //makes angular update values
         $scope.visiblePosts.splice(arrayIndex, 1);
         $scope.flaggedPosts.push(content);
      });
      queue(GoogleDriveService.updateFileProperty(content.Id, 'Flagged', true), function() {
         console.log("flagged: " + content.Id);
      });
      //set the user's has flagged date back
   };

   $scope.unFlagPost = function(ev, content, arrayIndex) {
      if ($scope.myInfo.moderator === false) {
         content.Flagged = false;
         $timeout(function() { //makes angular update values
            $scope.flaggedPosts.splice(arrayIndex, 1);
            $scope.visiblePosts.push(content);
         });

         queue(GoogleDriveService.updateFileProperty(content.Id, 'Flagged', false), function() {
            console.log("unflagged: " + content.Id);
         });
      }
      else {
         $mdDialog.show($mdDialog.alert({
            title: 'Uh Oh.',
            htmlContent: '<p style="margin: 0px; margin-bottom: 2px">One of your posts has been flagged within the past two weeks.</p><p style="margin: 0px">To unlock the ability to unflag posts, make sure none of your posts get flagged this week.</p>',
            ok: 'Ok'
         }));
      }
   };

   $scope.likePost = function(ev, content, arrayIndex) {
      GoogleDriveService.flagDriveFile(content.Id, 'Flagged', false).then(function() {
         console.log("flagged: " + content.Id);
      })
   };

   $scope.unLikePost = function(ev, content, arrayIndex) {
      if ($scope.myInfo.Moderator === true) {
         var permissionID = "needs to be created"
         GoogleDriveService.unLikeFile(content.Id, permissionID).then(function() {
            console.log("unflagged: " + content.Id);
         });
      }
      else {

      }
   };

   $scope.openLink = function(link) {
      if (link !== "" && link !== undefined) {
         $window.open(link);
      }
   };

   function DialogController($scope, $mdDialog) {
      $scope.hideDialog = function() {
         $mdDialog.hide();
      };
      $scope.cancelDialog = function() {
         $mdDialog.cancel();
      };
   }

   $scope.closeDialog = function() {
      console.log('closing dialog')
      $mdDialog.hide();
   };

   //-signin & initiation------------

   $scope.signOut = function() {
      authorizationService.handleSignoutClick();
   };

   gapi.load('client:auth2', function() {
      authorizationService.initilize(loginSucessful);
   });

   function loginSucessful() {
      GoogleDriveService.loadAPIs($scope.initiateDrive);
   }

   $scope.initiateDrive = function(loaded) {
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
   }

   function handleUserPrefsSheet() {
      //var deFormatedEmail = $scope.myInfo.Email.replace(/\W/g, '');
      queue(GoogleDriveService.getUserSettings("Sheet1!A2:B", false), function(usersList) {
         $scope.userList = usersList.result.values;
         for (var UserContact = 0; UserContact < $scope.userList.length; UserContact++) {
            if ($scope.userList[UserContact][0] === $scope.myInfo.Email) {
               var adjustedUserSettingsCount = UserContact + 2;
               $scope.UserSettingsRange = 'A' + adjustedUserSettingsCount + ':' + adjustedUserSettingsCount
               getUserSettings('A' + adjustedUserSettingsCount + ':' + adjustedUserSettingsCount);
               UserContact = 100000;
            }
         }
         if (UserContact > 999995) {
            createUserSettings();
         }
      });

      function getUserSettings(range) {
         queue(GoogleDriveService.getUserSettings(range), function(spreadsheetResult) {
            var UserSettingsArray = spreadsheetResult.result.values[0];
            pushUserSettingsToScope(UserSettingsArray);
            var gg  = new window.Event('sheetPrefsLoaded')
            document.dispatchEvent(gg);
         });
      }

      function createUserSettings() {
         var newData = [$scope.myInfo.Email, $scope.myInfo.Name, false, "3/25/2016", "", "", "", 1]
         queue(GoogleDriveService.updateUserSettings("Sheet1!A1:A", newData, true), function(newRow) {
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
         console.log($scope.myInfo);
      }
      $scope.getFiles("");
   }

   $scope.angularGridOptions = {
      gridWidth: 250,
      infiniteScroll: $scope.getFiles,
      scrollContainer: '#content_container',
      pageSize: 1.5,
      performantScroll: false,
      gutterSize: 12,
   };
   //-event watchers---------

   content_container.onscroll = function(event) {
      //called whenever the content_container scrolls
      if (performantScrollEnabled === false && $scope.angularGridOptions.performantScroll === false) {
         $scope.angularGridOptions.performantScroll = true;
         performantScrollEnabled = true;
      }
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
      if (performantScrollEnabled === true && $scope.angularGridOptions.performantScroll === true) {
         $scope.angularGridOptions.performantScroll = false;
         performantScrollEnabled = false;
      }
   });
}]));


var classes = [{
   'Name': 'English',
   'Color': '#e9ecfb',
   'Classes': [
      'English I',
      'English II',
      'English III',
      'English IV',
      'English IV Honors',
      'English V',
      'AP Liturature'
   ]
}, {
   'Name': 'History',
   'Color': '#fbf2e0',
   'Classes': [
      'Ancient History',
      'World History I',
      'World History II',
      'Asian History',
      'US History',
      'AP US History'
   ]
}, {
   'Name': 'Mathematics',
   'Color': '#fae1fa',
   'Classes': [
      'Algebra I',
      'Geometry',
      'Algebra II',
      'Precalculus',
      'Precalculus Honors',
      'Statistics',
      'Calculus',
      'AP Calculus AB',
      'AP Calculus BC'
   ]
}, {
   'Name': 'Physical Sciences',
   'Color': 'pTerquois',
   'Classes': [
      'Physical Science (8th)',
      'Chemistry',
      'AP Chemistry',
      'Physics',
      'AP Physics'
   ]
}, {
   'Name': 'Biological Sciences',
   'Color': '#e1f9e1',
   'Classes': [
      'Biology I',
      'Marine Biology',
      'Anatomy & Physiology',
      'Enviromental Science',
      'AP Biology'
   ]
}, {
   'Name': 'Modern Languages',
   'Color': 'pYellow',
   'Classes': []
}, {
   'Name': 'Clasical Languages',
   'Color': '#fae4e1',
   'Classes': []
}, {
   'Name': 'Humanities',
   'Color': 'pYellowGreen',
   'Classes': [
      'Economics',
      'AP US Government',
      'YAS Psycology Honors'
   ]
}, {
   'Name': 'Arts',
   'Color': 'pPink',
   'Classes': []
}, ]
