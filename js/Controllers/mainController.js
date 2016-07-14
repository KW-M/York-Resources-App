/*global app*/ /*global angular*/ /*global gapi*/ /*global google*/
var dependancies = ['$scope', '$mdDialog', '$window', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', '$location', '$routeParams', 'angularGridInstance']
app.controller('ApplicationController', dependancies.concat([function($scope, $mdDialog, $window, $sce, $mdSidenav, $mdMedia, authorizationService, GoogleDriveService, $q, $location, $routeParams, angularGridInstance) {
   var self = this;
   $scope.GoogleDriveService = GoogleDriveService;
   var content_container = document.getElementById("content_container");
   var performantScrollEnabled = false;

   $scope.allPosts = [];
   $scope.tempPosts = [];
   $scope.searchPosts = [];
   $scope.visiblePosts = [];

   $scope.searchTxt = '';
   $scope.searchExtra = [''];
   $scope.searchChips = ["Class: "]

   $scope.classList = classes;
   $scope.Tags = [];
   $scope.globals = {
      FABisOpen: false,
      FABisHidden: true,
      sidenavIsOpen: true,
   };

   $scope.firstFiles = false;
   $scope.nextPageToken = '';
   $scope.queryPropertyString = '';
   $scope.queryProperties = {
      Flagged: false,
      Type: "any",
      Class: "any",
      CreatorEmail: "any",
   };

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
      }
      if (query) {
         $location.search(query);
      }
      if (id) {
         $location.hash(id);
      }
   };

   $scope.$on('$routeChangeSuccess', function() {
      $scope.classParam = $location.path();
      $scope.queryParam = $location.search();
      $scope.idParam = $location.hash();
      $scope.selectedClass = $scope.classParam.replace(/\//g, "")
      if ($scope.firstFiles == true) {// check  if firstFiles have been loaded
         $window.setTimeout(function(){
            $scope.getFiles();
         }, 100);
      }
   });

   //-creating posts---------

   $scope.newPost = function(postObj, operation) {
      //called by the bottom right plus/add resource button
      $mdDialog.show({
         templateUrl: '/directives/html/newPostContent.html',
         controller: ['$scope', '$mdDialog', 'GoogleDriveService', '$mdToast', newPostController],
         scope: $scope,
         parent: angular.element(document.body),
         preserveScope: true,
         locals: {
            postObj: $scope.items,
            operation: operation
         },
         onComplete: function() {
            $scope.newPostHeaderImg = document.getElementById("header_image");
            $scope.newPostDescription = document.querySelector('#DescriptionTxt');
            $scope.dialogElement = document.querySelector('#new_post_dialog');
            // var newPostScroll = document.getElementById('dialog_scroll');
            // alert(document.getElementById('dialog_scroll'));
            // newPostScroll.onscroll = function() {
            //    var scroll = newPostScroll.scrollTop;
            //    var header = document.getElementById('dialog_header');
            //    var headerImage = document.getElementById('newPostImg');
            //    var linkButtons = document.getElementById('newPostLinkButtons');
            //    var newPostContent = document.getElementById('newPostContent');
            //    if (scroll < 116) {
            //       linkButtons.style.opacity = '1';
            //       header.style.width = '100%';
            //       header.style.borderTopRightRadius = '0px';
            //       header.style.boxShadow = "";
            //       header.style.height = 156 - scroll + 'px';
            //       header.style.margin = scroll + 'px 0 0 0';
            //       header.style.position = 'relative';
            //       headerImage.style.top = -20 - (scroll / 5) + 'px';
            //       newPostContent.style.margin = '0 0 0 0';
            //    }
            //    else {
            //       header.style.topRightBorderRadius = '4px';
            //       header.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
            //       header.style.width = '450px';
            //       header.style.margin = '0 0 0 0';
            //       header.style.height = '42px';
            //       header.style.position = 'fixed';
            //       newPostContent.style.margin = '156px 0 0 0';
            //       linkButtons.style.opacity = 0;
            //    }
            //    if (scroll > 87 & scroll < 117) {
            //       linkButtons.style.opacity = (100 - scroll) / 30;
            //    }
            // };
         },
         clickOutsideToClose: false,
         fullscreen: ($mdMedia('xs')),
         openFrom: ('#new_post_button'),
         closeTo: {
            left: 1000,
         }
      });
   };

   $scope.pickerLoaded = function() {

   }

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
      $scope.getQueryProperties();
      console.log("clearing tempPosts...")
      $scope.tempPosts = []; //clear the temporary posts (for de-duplication with next page token).
      var queryParamString = $scope.generateQueryString()
      console.log("query params: " + queryParamString);
      queue(GoogleDriveService.getListOfFlies(queryParamString, $scope.nextPageToken, 2), function(fileList) {
         console.log(fileList);
         if (fileList.result.files.length > 0) {
            //format every file:
            for (o = 0; o < fileList.result.files.length; o++) {
               fileList.result.files[o] = $scope.formatPost(fileList.result.files[o]);
            }
            //if we haven't reached the end of our search:
            if (fileList.result.nextPageToken !== undefined) {
               console.log("more posts coming...")
               $scope.nextPageToken = fileList.result.nextPageToken;
               $scope.allPosts = $scope.allPosts.concat(fileList.result.files);
            }
            else {
             console.log("end of the line - saving to tempPosts...")
               $scope.tempPosts = fileList.result.files;
            }
            $scope.$apply(function() {
               $scope.visiblePosts = $scope.allPosts.concat($scope.tempPosts)
               //$scope.filterPosts($scope.allPosts.concat($scope.tempPosts), $scope.visiblePosts);
               console.log({
                  allPosts: $scope.allPosts,
                  tempPosts: $scope.tempPosts,
                  visiblePosts: $scope.visiblePosts,
               });
            });
            $scope.$apply();
            console.log("-----------------------");
         }
      });
   }

   $scope.generateQueryString = function() {
      var query = '';
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

   $scope.filterPosts = function(inputSet, outputSet) {
      outputSet = inputSet.filter(function(post) {
         var Flagged = post.Flagged === $scope.queryProperties.Flagged || post.Flagged;
         if ($scope.queryProperties.Class !== "any" && $scope.queryProperties.Class !== undefined) {
            var Class = post.Class.Name === $scope.queryProperties.Class;
         } else {
            var Class = true;
         }
         if ($scope.queryProperties.CreatorEmail !== "any" && $scope.queryProperties.CreatorEmail !== undefined) {
            var Type = post.Type === $scope.queryProperties.Type;
         } else {
            var Type = true;
         }
         if ($scope.queryProperties.CreatorEmail !== "any" && $scope.queryProperties.CreatorEmail !== undefined) {
            var Creator = post.Creator.Email === $scope.queryProperties.CreatorEmail;
         } else {
            var Creator = true;
         }
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
      formatedFile.Tags = JSON.parse(tagsRaw.replace(/,/g, "\",\""));
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
      formatedFile.PreviewImg = unformatedFile.thumbnailLink //"https://drive.google.com/thumbnail?authuser=0&sz=w400&id=" + formatedFile.Id;

      console.log({
         unformated: unformatedFile,
         formated: formatedFile
      })

      return formatedFile;
   }

   //-UI actions---------

   $scope.toggleSidebar = function() { //called by the top left toolbar menu button
      if ($mdMedia('gt-sm')) {
         $scope.globals.sidenavIsOpen = !$scope.globals.sidenavIsOpen
         $window.setTimeout(angularGridInstance.posts.refresh, 500);
      }
      else {
         $mdSidenav('sidenav_overlay').toggle();
      }
   };

   $scope.openHelpDialog = function() { //called by the top right toolbar help button
      $mdDialog.show({
         templateUrl: 'templates/html/help.html',
         parent: angular.element(document.body),
         clickOutsideToClose: true,
         fullscreen: ($mdMedia('xs')),
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
         $scope.visiblePosts.splice(arrayIndex, 1);
         $scope.filterPosts($scope.searchTxt);
         //$scope.$apply();
         console.log("deleting" + content.ID);

         GoogleDriveService.deleteDriveFile(content.ID).then(function() {
            console.log("deleted" + content.ID);
         })
      }, function() {
         //cancel
      });
   };

   $scope.openLink = function(link) {
      if (link != "") {
         $window.open(link);
      }
   };

   //-signin & initiation------------

   $scope.signIn = function() { //called by the signIn button click
      loginProcedure(authorizationService.authorizePopup());
   };

   $window.loginSilent = function(response) {
      loginProcedure(authorizationService.authorizeSilent());
   };

   function loginProcedure(response) {
      //handles the 'response' promise
         response.then(function(response) {
            $scope.loginStatus = response;
            GoogleDriveService.initiateAuthLoadDrive($scope.initiateDrive, $scope.pickerLoaded)
         }).catch(function(error) {
            if (error.error_subtype !== undefined && error.error_subtype === "access_denied") {
               showLoginButton();
            }
            else if (error.error !== undefined && error.error === "access_denied") {
               showLoginButton();
            }
            else {
               console.log(error);
            }
         })
         //called to show the login button (& hide the loading spinner)
      function showLoginButton() {
         angular.element(document.querySelector('#login_spinner')).addClass('fadeOut');
         setTimeout(function() {
            angular.element(document.querySelector('#auth_button')).addClass('fadeIn');
         }, 500);
      };
   };

   $scope.initiateDrive = function() {
      queue(GoogleDriveService.getUserInfo(), function(userInfo) {
         $scope.myInfo = {
            "Name": userInfo.result.user.displayName,
            "Email": userInfo.result.user.emailAddress,
            "ClassOf": userInfo.result.user.emailAddress.match(/\d+/)[0],
         };
         console.log($scope.myInfo);
         $scope.getFiles("");
      });
   }

   // $scope.angularGridOptions = {
   //    gridWidth: 250,
   //    infiniteScroll: $scope.getFiles,
   //    scrollContainer: '#content_container',
   //    pageSize: 1.5,
   //    performantScroll: false,
   //    gutterSize: 12,
   // };


   //-event watchers---------

   $scope.$watch('searchTxt', $scope.filterPosts);

   content_container.onscroll = function(event) {
      //called whenever the content_container scrolls
      if (performantScrollEnabled === false && $scope.angularGridOptions.performantScroll = false) {
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
      if (performantScrollEnabled === true && $scope.angularGridOptions.performantScroll = true) {
         $scope.angularGridOptions.performantScroll = false;
         performantScrollEnabled = false;
      }
   });

}]));

//called by the google client api when it loads (must be outside the controller)
function gClientLoaded() {
   gapi.auth.init(loginSilent());
}


var classes = [{
   'Name': 'English',
   'Color': 'pLightBlue',
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
   'Color': 'pOrange',
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
   'Color': 'pPurple',
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
   'Color': 'pGreen',
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
   'Color': 'pRed',
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
