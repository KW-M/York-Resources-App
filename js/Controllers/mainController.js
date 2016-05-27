/*global app*/ /*global angular*/ /*global gapi*/
app.controller('ApplicationController', ['$scope', '$mdDialog', '$window', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', function($scope, $mdDialog, $window, $sce, $mdSidenav, $mdMedia, authorizationService, GoogleDriveService, $q) {
   var self = this
   $scope.unfilteredPosts = [];
   $scope.Posts = [];
   $scope.searchTxt = '';
   $scope.searchedPosts = [];
   $scope.globals = {
      FABisOpen: false,
      SidebarIsOpen: false //not used
   };
   $scope.GoogleDriveService = GoogleDriveService;

   $scope.signIn = function() { //called by the signIn button click
      loginProcedure(authorizationService.authorizePopup());
   };

   $scope.toggleSidebar = function() { //called by the top left toolbar menu button
      $mdSidenav('left').toggle();
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
      console.log(val);
      val = val.toLowerCase();
      $scope.Posts = $scope.unfilteredPosts.filter(function(obj) {
         return obj.Title.toLowerCase().indexOf(val) != -1;
      });
      console.log($scope.Posts + "post from filter");
   }


   $scope.newPost = function(idInput, linkInput) {
      $scope.Link = linkInput;
      $scope.Id = idInput;
      //called by the bottom right plus/add resource button
      $mdDialog.show({
         templateUrl: 'templates/html/newPost.html',
         controller: ['$scope', '$mdDialog', 'GoogleDriveService', '$mdToast', newPostController],
         scope: $scope,
         preserveScope: true, // use parent scope in template
         parent: angular.element(document.body),
         clickOutsideToClose: false,
         fullscreen: ($mdMedia('xs')),
         openFrom: ('#new_post_button'),
         closeTo: {
            left: 1000,
         }
      });
   };

   // $scope.newPostBeta = function() { //called by the bottom right plus/add resource button
   //    $mdDialog.show({
   //       templateUrl: 'templates/html/newPost-new.html',
   //       controller: ['$scope', '$mdDialog', 'GoogleDriveService', newPostController],
   //       scope: $scope,
   //       preserveScope: true, // use parent scope in template
   //       parent: angular.element(document.body),
   //       clickOutsideToClose: false,
   //       fullscreen: ($mdMedia('xs')),
   //       openFrom: ('#new_post_button'),
   //       closeTo: {
   //          left: 1000,
   //       }
   //    });
   // };

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
            GoogleDriveService.initiateAuthLoadDrive($scope.initiateDrive)
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

   $scope.initiateDrive = function() {
      queue(GoogleDriveService.getUserInfo(), function(userInfo) {
         $scope.myInfo = {
            "Name": userInfo.result.user.displayName,
            "Email": userInfo.result.user.emailAddress,
            "ClassOf": userInfo.result.user.emailAddress.match(/\d+/)[0],
         };
         console.log({
            myInfo: $scope.myInfo
         });
      });
      queue(GoogleDriveService.getListOfFlies(),function(fileList) {
         for (var item = 0; item < fileList.result.files.length; item++) {
            var metadata = fileList.result.files[item];
            console.log(metadata.id);
            queue(GoogleDriveService.getFileContent(metadata.id), $scope.handleFile(file));
         }
      });

      //       function getFiles(pageToken) {
      //    queue(GoogleDriveService.multiRequest(pageToken),function(combinedResponse) {
      //       console.log(combinedResponse);
      //       if (combinedResponse.pageToken) {
      //          getFiles(combinedResponse.pageToken);
      //       }
      //       handleFiles(combinedResponse);
      //    });
      // }

      // function handleFiles(combinedResponse) {
      //    combinedResponse.files.then(function(fileResponse) {
      //       unfilteredPosts = unfilteredPosts.concat(formatArrayResponse(fileResponse, combinedResponse.ids));
      //       console.log(unfilteredPosts)
      //       filterPosts($scope.searchTxt);
      //       $scope.$apply();
      //    });
      // }
   }
   
   $scope.handleFile = function(file) {
      console.log file
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
         $scope.unfilteredPosts.splice(arrayIndex, 1);
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

   $window.onscroll = function(event) { //called whenever the window scrolls
      var yScroll = $window.pageYOffset;
      if (yScroll >= 100) {
         $('#speed-dial-container').slideDown(300)
      }
      else {
         $('#speed-dial-container').slideUp(300);
      }
   };

   $window.loginSilent = function(response) {
      loginProcedure(authorizationService.authorizeSilent());
   };
}]);

//called by the google client api when it loads (must be outside the controller)
function gClientLoaded() {
   gapi.auth.init(loginSilent());
}