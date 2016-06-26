/*global app*/ /*global angular*/ /*global gapi*/ /*global google*/
var dependancies = ['$scope', '$mdDialog', '$window', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', '$location', '$routeParams', 'angularGridInstance']
app.controller('ApplicationController', dependancies.concat([function($scope, $mdDialog, $window, $sce, $mdSidenav, $mdMedia, authorizationService, GoogleDriveService, $q, $location, $routeParams, angularGridInstance) {
   var self = this;
   var content_container = document.getElementById("content_container");
   var performantScrollEnabled = false;
   $scope.classList = classes;
   $scope.allPosts = [];
   $scope.Tags = [];
   $scope.filteredPosts = [];
   $scope.searchTxt = '';
   $scope.nextPageToken = '';
   $scope.globals = {
      FABisOpen: false,
      FABisHidden: true,
      sidenavIsOpen: true,
   };
   $scope.GoogleDriveService = GoogleDriveService;

   $scope.signIn = function() { //called by the signIn button click
      loginProcedure(authorizationService.authorizePopup());
   };

   $scope.toggleSidebar = function() { //called by the top left toolbar menu button

      $scope.globals.sidenavIsOpen = !$scope.globals.sidenavIsOpen
         //$mdSidenav('left').toggle();
      $window.setTimeout(angularGridInstance.posts.refresh, 500);
   };

   $scope.gotoRoute = function(path, query, id) {
      console.log(path + query + id);
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

   $scope.helpDialog = function() { //called by the top right toolbar help button
      $mdDialog.show({
         templateUrl: 'templates/html/help.html',
         parent: angular.element(document.body),
         clickOutsideToClose: true,
         fullscreen: ($mdMedia('xs')),
      });
   };

   $scope.$watch('searchTxt', $scope.filterPosts);

   $scope.filterPosts = function(val) {
      val = val.toLowerCase();
      $scope.allPosts = $scope.allPosts.filter(function(obj) {
         return obj.Title.toLowerCase().indexOf(val) != -1;
      });
   }

   $scope.pathSelected = function(path) {
      if ($location.path() === path) {
         return true;
      } else {
         return false;
      }
   }

   $scope.$on('$routeUpdate', function() {
      $scope.sort = $location.search().sort;
      $scope.order = $location.search().order;
      $scope.offset = $location.search().offset;
   });

   $scope.newPost = function(postObj, operation) {
      //called by the bottom right plus/add resource button
      $mdDialog.show({
         contentElement: document.querySelector('#new_post_preload'),
         controller: ['$scope', '$mdDialog', 'GoogleDriveService', '$mdToast', newPostController],
         scope: $scope,
         preserveScope: true,
         locals: {
           postObj: $scope.items,
           operation: operation
         },
         onComplete: function () {
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
         var fileId = data.docs[0].id;

         alert('File: ' + data.docs[0].name + " id:" + fileId + " URL:" + data.docs[0].url);
         $scope.newPost(data.docs[0].id, data.docs[0].url);
      }
   }

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
         $('#login_spinner').fadeOut(200,
            function() {
               $('#auth_button').fadeIn(200);
            });
      };
   };

   $scope.pickerLoaded = function() {

   }

   $scope.initiateDrive = function() {
      queue(GoogleDriveService.getUserInfo(), function(userInfo) {
         $scope.myInfo = {
            "Name": userInfo.result.user.displayName,
            "Email": userInfo.result.user.emailAddress,
            "ClassOf": userInfo.result.user.emailAddress.match(/\d+/)[0],
         };
         console.log($scope.myInfo)
      });
      $scope.getFilesInitial("");
   }

   $scope.getFilesInitial = function() {
      console.log('getting files');
      queue(GoogleDriveService.getListOfFlies('', $scope.nextPageToken, 12), function(fileList) {
         var tempFileArray = [];
         for (var item = 0; item < fileList.result.files.length; item++) {
            var metadata = fileList.result.files[item];
            queue(GoogleDriveService.getFileContent(metadata.id), function(file) {
               tempFileArray = $scope.handleFile(file, metadata, tempFileArray);
               if (tempFileArray.length === 12) {
                  console.log(tempFileArray);
                  $scope.$apply(function(){$scope.allPosts = $scope.allPosts.concat(tempFileArray);});
               }
            });
         }
         $scope.nextPageToken = '';
      });
   }

   $scope.getFiles = function(query) {
      if ($scope.allPosts.length >= 12){
      console.log('getting files');
      queue(GoogleDriveService.getListOfFlies(query, $scope.nextPageToken, 10), function(fileList) {
         var tempFileArray = [];
         for (var item = 0; item < fileList.result.files.length; item++) {
            var metadata = fileList.result.files[item];
            queue(GoogleDriveService.getFileContent(metadata.id), function(file) {
               tempFileArray = $scope.handleFile(file, metadata, tempFileArray);
               if (tempFileArray.length === 10) {
                  console.log(tempFileArray);
                  $scope.$apply(function(){$scope.allPosts = $scope.allPosts.concat(tempFileArray);});
               }
            });
         }
         $scope.nextPageToken = '';
      });
      }
   }

   $scope.handleFile = function(file, metadata, destination) {
      console.log({
          file: file,
          metadata: metadata,
          fileArray: destination
       });
      destination = destination.concat(file.result);
      return destination;
   }

   $scope.combineset = function(newSet) {


   }

   $scope.sortByLikes = function (thingToSort) {
      thingToSort.sort(function (a, b) {
         return b.LikeUsers.length - a.LikeUsers.length;
      });
   }

   $scope.sortByDate = function (thingToSort) {
      thingToSort.sort(function (a, b) {
         return b.UpdateDate - a.UpdateDate;
      });
   }

   $scope.confirmDelete = function(ev, content, arrayIndex) {
      // Appending dialog to document.body to cover sidenav in docs app
      var confirm = $mdDialog.confirm()
         .title('Are you sure you want to remove this:')
         .textContent(content.Title)
         .ariaLabel('Delete?')
         .targetEvent(ev)
         .ok('Delete')
         .cancel('Keep it');
      $mdDialog.show(confirm).then(function() {
         //ok
         $scope.allPosts.splice(arrayIndex, 1);
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

   $scope.angularGridOptions = {
     gridWidth: 250,
     infiniteScroll: $scope.getFiles(),
     scrollContainer: '#content_container',
     pageSize: 1.5,
     performantScroll:false,
     gutterSize: 12,
   }

   content_container.onscroll = function(event) {
            //called whenever the content_container scrolls
      if (performantScrollEnabled === false) {
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

window.addEventListener("resize", function () {
      if (performantScrollEnabled === true) {
         $scope.angularGridOptions.performantScroll = false;
         performantScrollEnabled = false;
      }
});

   $window.loginSilent = function(response) {
      loginProcedure(authorizationService.authorizeSilent());
   };
}]));

//called by the google client api when it loads (must be outside the controller)
function gClientLoaded() {
   gapi.auth.init(loginSilent());
}


var classes = [
{
 'Name':'English',
 'Color':'pLightBlue',
 'Classes':[
    'English I',
    'English II',
    'English III',
    'English IV',
    'English IV Honors',
    'English V',
    'AP Liturature'
   ]
},
{
 'Name':'History',
 'Color':'pOrange',
 'Classes':[
   'Ancient History',
   'World History I',
   'World History II',
   'Asian History',
   'US History',
   'AP US History'
  ]
},
{
 'Name':'Mathematics',
 'Color':'pPurple',
 'Classes':[
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
},
{
 'Name':'Physical Sciences',
 'Color':'pTerquois',
 'Classes':[
    'Physical Science (8th)',
    'Chemistry',
    'AP Chemistry',
    'Physics',
    'AP Physics'
  ]
},
{
 'Name':'Biological Sciences',
 'Color':'pGreen',
 'Classes':[
    'Biology I',
    'Marine Biology',
    'Anatomy & Physiology',
    'Enviromental Science',
    'AP Biology'
  ]
},
{
 'Name':'Modern Languages',
 'Color':'pYellow',
 'Classes':[]
},
{
 'Name':'Clasical Languages',
 'Color':'pRed',
 'Classes':[]
},
{
 'Name':'Humanities',
 'Color':'pYellowGreen',
 'Classes':[
    'Economics',
    'AP US Government',
    'YAS Psycology Honors'
  ]
},
{
 'Name':'Arts',
 'Color':'pPink',
 'Classes':[]
},
]
