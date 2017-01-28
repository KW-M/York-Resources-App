/*global app*/ /*global angular*/ /*global gapi*/ /*global google*/ /*global queue*/ /*global subControllerFunctions*/
app.controller('AppController', controllerFunction)
   //controllerFunction.$inject(['$scope', '$mdDialog', '$window', '$timeout', '$sce', '$mdSidenav', '$mdMedia', 'authorizationService', 'GoogleDriveService', '$q', '$location', 'angularGridInstance'])
function controllerFunction($scope, $rootScope, $filter, $mdDialog, $mdToast, $window, $http, $timeout, $sce, $mdSidenav, $mdMedia, $mdTheming, authorizationService, GoogleDriveService, $q, $location, angularGridInstance) {
   var self = this;
   var content_container = document.getElementById("content_container");
   var layout_grid = document.getElementById("layout_grid");
   var loading_spinner = document.getElementById("loading_spinner");
   var no_more_footer = document.getElementById("no_more_footer");
   var no_posts_footer = document.getElementById("no_posts_footer");
   var footer_problem = document.getElementById("footer_problem");

   var drivePicker, uploadPicker;
   var getFileTimer = null;
   var conurancy_counter = 0;

   $scope.allPosts = [];
   $scope.searchPosts = [];
   $scope.visiblePosts = [];

   var deDuplicationIndex = {};
   var classPageTokenSelectionIndex = {};

   $scope.previousSearch = undefined;
   $scope.searchPlaceholder = 'Search';
   $scope.allLabels = [];
   $scope.visibleLabels = [];
   $scope.labelSearch = null;

   $scope.userList = [];
   $scope.restorePost = false;
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
      flagged: false,
      type: null,
      classPath: 'Loading...',
      creatorEmail: null,
      id: null,
   };

   $scope.$mdMedia = $mdMedia;
   $scope.$mdDialog = $mdDialog;
   $scope.$location = $location;
   $scope.$timeout = $timeout;

   //----------------------------------------------------
   //------------------- Routing ------------------------
   $scope.gotoRoute = function(query) {
      if (query.classPath !== undefined) {
         $scope.toggleSidebar(true);
         $location.search({
            q: null
         });
         $location.path(query.classPath.replace(" ", "-") || query.classPath);
      }
      if (query.q !== undefined) {
         if (query.q === null || query.q == '') {
            $location.search({
               q: null
            });
         }
         else {
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
   }

   function onLocationChange() {
      $scope.queryParams.q = $location.search().q || null;
      $scope.queryParams.classPath = $location.path().replace("/", "").replace("-", " ") || 'All Posts';
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
      }
      else {
         $scope.queryParams.flagged = null
         $scope.queryParams.type = null
         $scope.queryParams.creatorEmail = null
      }
      if ($scope.queryParams.classPath === 'All Posts') {
         $scope.queryParams.flagged = false;
      }
      else if ($scope.queryParams.classPath === 'Your Posts') {
         $scope.queryParams.creatorEmail = $scope.myInfo.Email;
      }
      else if ($scope.queryParams.classPath === 'Flagged Posts') {
         $scope.queryParams.flagged = true
      }
      else {
         $scope.searchPrefix = 'Search Within'
            //$scope.classTitle = $scope.queryParams.classPath;
         $scope.queryParams.flagged = false
      }
      generateQueryString();
      if ($scope.queryParams.q === null) {
         $scope.updateVisiblePosts($scope.filterPosts($scope.allPosts), function() {
            hideSpinner();
         });
      }
      $scope.getFiles();
      $timeout(function() {
         $scope.selectedClass = $scope.findClassObject($scope.queryParams.classPath);
         $scope.visibleLabels = $scope.sortLabels($scope.allLabels);
      })
      getFileTimer = setInterval(function() {
         if (conurancy_counter == 0 && content_container.scrollHeight == content_container.clientHeight) {
            $scope.getFiles()
         }
      }, 1000)
   }

   //----------------------------------------------------
   //------------- Signin & Initiation ------------------
   authorizationService.onLoad(function() {
      var pickerPromise = $q.defer();
      gapi.load('picker', {
         'callback': function() {
            initiateDrivePicker();
            pickerPromise.resolve();
         }
      })
      $q.all([loadData(), pickerPromise]).then(function() {
         console.log("Everything Loaded")
         authorizationService.hideSigninDialog();
         //More stuff...
      })
   })

   function initiateDrivePicker() {
      var uploadView = new google.picker.DocsUploadView().setParent("0B5NVuDykezpkUGd0LTRGc2hzM2s");
      var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setParent("root");
      var sharedView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setOwnedByMe(false);
      var recentsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(false).setSelectFolderEnabled(true).setLabel('Recents');

      drivePicker = new google.picker.PickerBuilder().setDeveloperKey("AIzaSyAhXIGkYgfAG9LXhAuwbePD3z_qSVWUSNA").setOrigin(window.location.protocol + '//' + window.location.host).setOAuthToken(authorizationService.getGAuthToken()).setCallback(self.pickerCallback)
         .addView(docsView).addView(recentsView).addView(sharedView).build();
      uploadPicker = new google.picker.PickerBuilder().setDeveloperKey("AIzaSyAhXIGkYgfAG9LXhAuwbePD3z_qSVWUSNA").setOrigin(window.location.protocol + '//' + window.location.host).setOAuthToken(authorizationService.getGAuthToken()).setCallback(self.pickerCallback)
         .addView(uploadView).enableFeature(google.picker.Feature.NAV_HIDDEN).hideTitleBar().build();
   }

   function loadData() {
      var getStartupData = runAppsScript('getStartupData').then(function(data) {
         console.log(JSON.parse(data.result.response.result))
      })
      var getProfilePic = gapi.client.request({
         'root': 'https://people.googleapis.com',
         'path': '/v1/people/me?fields=photos%2Furl',
         'method': 'GET',
      })
      $http({
         method: 'POST',
         url: 'https://script.google.com/a/macros/york.org/s/AKfycbwIkvLKyDqGe4gzf_hC80akuuxiOW-yzBiNJl0xVrXwDHLHLPg/exec',
         headers: {
            'Authorization': 'Bearer ' + authorizationService.getGAuthToken(),
         },
      })

      // getUserPrefs.then(function(response) {
      //    $timeout(function() {
      //       $scope.myInfo = JSON.parse(response.result.response.result).content;
      //       console.log(authorizationService)
      //       $scope.myInfo.Email = authorizationService.FireUser.email;
      //       // $scope.myInfo.staredClasses.forEach(function(className, index) {
      //       //    $scope.myInfo.staredClasses[index] = $scope.findClassObject(className);
      //       // })
      //       // $scope.myInfo.staredClasses.push({
      //       //    Name: 'Other',
      //       //    Color: 'hsla(200, 70%, 75%,',
      //       // })
      //    })
      // }, console.warn)

      // getLabels.then(function(resp) {
      //    $timeout(function() {
      //       $scope.labels = JSON.parse(resp.result.response.result).content;
      //    })
      //    console.log('getLabels', JSON.parse(resp.result.response.result))
      // }, console.warn)

      // getClasses.then(function(resp) {
      //    var result = JSON.parse(resp.result.response.result).content;
      //    $timeout(function() {
      //       $scope.classList = result.classList
      //       console.log(JSON.stringify(result.classList))
      //       $scope.teacherList = result.teacherList
      //    })
      //    console.log('getClassList', resp)
      //    console.log('getClassList', result)
      // }, console.warn)

      getProfilePic.then(function(response) {
         // $timeout(function() {
         //    $scope.myInfo.profilePicture = response.result
         //    $scope.teacherList = result.teacherList
         // })
         console.log(response)
      })

      //return $q.all([getUserPrefs, getClasses, getLabels])
   }

   function runAppsScript(scriptFunction, payload) {
      return (gapi.client.script.scripts.run({
         'scriptId': 'MZMSm56uR7QYFSkt-WuDJEPA9VMeL9Grb',
         'function': scriptFunction,
         'parameters': [JSON.stringify(payload)],
         'devMode': true,
      }));
   }

   //----------------------------------------------------
   //--------------- Creating Posts ---------------------
   $scope.newPost = function(postObj, operation, event) {
      $scope.newPostScroll = 0;
      $mdDialog.show({
         templateUrl: 'templates/createPost.html',
         controller: ['$scope', '$timeout', '$http', '$mdDialog', 'GoogleDriveService', 'authorizationService', '$mdToast', "Post", "operation", newPostController],
         scope: $scope,
         parent: angular.element(document.body),
         preserveScope: true,
         locals: {
            Post: postObj,
            operation: operation
         },
         onComplete: function() {
            var newPostDialog = document.getElementById("new_post_dialog");
            var newPostHeaderLink = document.getElementById("header_link");
            var newPostHeaderMetadata = document.getElementById("Metadata");
            var newPostHeaderImage = document.getElementById("header_image");
            var newPostHeaderTitle = document.getElementById("header_title");
            $scope.dialog_container = document.getElementsByClassName('md-dialog-container')[0]
            var newPostScroll = document.getElementsByClassName('new_post_dialog_scroll')[0];
            newPostScroll.style.opacity = 1
            var newPostHeader = document.getElementById('dialog_header');
            newPostScroll.onscroll = function() {
                  if (newPostScroll.scrollTop < 141) {
                     $timeout(function() {
                        $scope.newPostScroll = newPostScroll.scrollTop;
                     })
                     newPostHeaderImage.style.top = -20 - (newPostScroll.scrollTop / 5) + 'px';
                  }
                  else {
                     $timeout(function() {
                        $scope.newPostScroll = 140;
                     })
                  }
               }
               // The md-select directive eats keydown events for some quick select
               // logic. Since we have a search input here, we don't need that logic.
            var selectSearchInput = angular.element(document.getElementById('class_select_input'))
            selectSearchInput.on('keydown', function(ev) {
               ev.stopPropagation();
            });
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
         //done
      });
   };

   $scope.showPicker = function(type, restorePost) {
      $scope.restorePost = restorePost || false;
      if (type == "Drive") {
         drivePicker.setVisible(true);
      }
      else if (type == "Upload") {
         uploadPicker.setVisible(true);
      }
   };

   self.pickerCallback = function(data) {
      //drivePicker.dispose();
      if (data.action == google.picker.Action.PICKED) {
         if ($scope.restorePost == true) {
            $timeout(function() {
               $scope.Post.AttachmentId = data.docs[0].id;
               $scope.Post.Link = data.docs[0].url;
               $scope.Post.Title = $scope.Post.Title || data.docs[0].name;
            })
         }
         else {
            $scope.newPost({
               AttachmentId: data.docs[0].id,
               Link: data.docs[0].url,
               Title: data.docs[0].name,
            }, 'new');
         }
      }
   }

   //----------------------------------------------------
   //--------- loading and filtering posts --------------
   $scope.getFiles = function() {
      conurancy_counter++;
      var formattedFileList = [];
      var nextPageToken = classPageTokenSelectionIndex[$scope.queryPropertyString] || "";
      var queryString = $scope.queryPropertyString;
      if (nextPageToken !== "end") {
         loading_spinner.style.display = 'block';
         no_more_footer.style.display = 'none';
         no_posts_footer.style.display = 'none';
         footer_problem.style.display = 'none';
         queue('drive', GoogleDriveService.getListOfFlies($scope.queryPropertyString, nextPageToken, 3), function(fileList) {
            for (var fileCount = 0; fileCount < fileList.result.files.length; fileCount++) {
               if (!$scope.queryParams.q && deDuplicationIndex[fileList.result.files[fileCount].id] === undefined) {
                  //if the deDuplication obj doesn't have the file's id as a key, it hasn't already been downloaded.
                  formattedFileList[fileCount] = $scope.convertDriveToPost(fileList.result.files[fileCount]) //format and save the new post to the formatted files list array
                  deDuplicationIndex[fileList.result.files[fileCount].id] = 1; //mark this id as used with a "1".
               }
               else if ($scope.queryParams.q) {
                  formattedFileList[fileCount] = $scope.convertDriveToPost(fileList.result.files[fileCount]) //format and save the new post to the formatted files list array
               }
            }
            sortPostsByType(formattedFileList, queryString, $scope.queryParams);
            if (fileList.result.nextPageToken !== undefined) {
               classPageTokenSelectionIndex[$scope.queryPropertyString] = fileList.result.nextPageToken; //if we haven't reached the end of our search:
            }
            else {
               classPageTokenSelectionIndex[$scope.queryPropertyString] = "end" //if we have reached the end of our search:
            }
            hideSpinner();
         }, function() {
            no_more_footer.style.display = 'none';
            no_posts_footer.style.display = 'none';
            no_more_footer.style.display = 'none';
            footer_problem.style.display = 'flex';
            content_container.scrollTop = content_container.scrollHeight;
         }, 150);
      }
   }

   function hideSpinner() {
      if (classPageTokenSelectionIndex[$scope.queryPropertyString] === "end") {
         loading_spinner.style.display = 'none';
         clearInterval(getFileTimer);
         $timeout(function() {
            if ($scope.visiblePosts.length > 0) {
               no_more_footer.style.display = 'block';
            }
            else {
               layout_grid.style.height = '0px';
               no_posts_footer.style.display = 'block';
            }
         }, 200)
      }
      $timeout(function() {
         angularGridInstance.postsGrid.refresh();
      }, 1000)
   }

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

   function sortPostsByType(formattedFileList, queryString, queryParams) {
      if (queryParams.q) {
         console.log('hasQueryParams')
         if (queryParams.q === $scope.previousSearch) {
            console.log('sameSearch')
            $scope.searchPosts = $scope.searchPosts.concat(formattedFileList);
         }
         else {
            console.log('newSearch')
            $scope.searchPosts = formattedFileList;
         }
         $scope.previousSearch = $scope.queryParams.q || null;
         $scope.updateVisiblePosts($scope.searchPosts);
      }
      else {
         $scope.allPosts = $scope.allPosts.concat(formattedFileList);
         if ($scope.queryPropertyString == queryString) {
            $scope.updateVisiblePosts($scope.visiblePosts.concat($scope.filterPosts(formattedFileList)));
         }
      }
      conurancy_counter = conurancy_counter - 1
   }

   //----------------------------------------------------
   //---------------- Event Watchers --------------------
   $scope.$watch('searchInputTxt', function(newValue) {
      var input = newValue || null
      var query = $scope.queryParams.q || null;
      if (input != query) {
         $scope.gotoRoute({
            q: input
         })
      }
   }, false);

   $scope.$watch('allPosts', function(newValue) {
      console.log('allPosts Changed')
   }, true);


   content_container.onscroll = function(event) {
      //called whenever the content_container scrolls
      // if (performantScrollEnabled === false && $scope.angularGridOptions.performantScroll === false) {
      //    $scope.angularGridOptions.performantScroll = true;
      //    performantScrollEnabled = true;
      // }
      var yScroll = content_container.scrollTop;
      $timeout(function() {
         if (yScroll >= 120 && $scope.globals.FABisHidden == true) {
            $scope.globals.FABisHidden = false;
         }
         if (yScroll <= 120 && $scope.globals.FABisHidden == false) {
            $scope.globals.FABisOpen = false;
            $scope.globals.FABisHidden = true;
         }
      })
   };

   window.addEventListener("resize", function() {
      $timeout(function() {
         if ($mdMedia('gt-sm')) {
            $mdSidenav('sidenav_overlay').close();
         }
      })
   });

   document.onkeydown = function(e) {
      if (e.altKey && e.ctrlKey) {
         if (e.keyCode == 68) {
            devMode = !devMode
            $timeout(function() {
               $scope.devMode = devMode;
            })
         }
         if (e.keyCode == 75) {
            alert('handeling signin click')
            authorizationService.handleSigninClick(function() {
               alert('done')
            });
         }
         if (e.keyCode == 76) {
            alert('running siginin initialization')
            authorizationService.initilize(function() {
               alert('done')
            })
         }
         if (e.keyCode == 77) {
            alert('signing out')
            gapi.auth2.getAuthInstance().signOut();
         }
      }
   }

   $scope.updateVisiblePosts = function(array, callback) {
      $timeout(function() {
         if (array) {
            $scope.visiblePosts = array;
         }
         if (callback) {
            callback();
         }
      })
   }

   if (window.location.search) {
      var unformated = window.location.search.match(/state=([^&]+)(?:$|&)/)
      var shareInput = JSON.parse(decodeURIComponent(unformated[1]));
      if (shareInput.exportIds) {
         var id = shareInput.exportIds[0]
      }
      else if (shareInput.ids) {
         var id = shareInput.ids[0]
      }
      $scope.newPost({
         Link: 'https://drive.google.com/?open=' + id
      }, 'new')
   }

   //----------------------------------------------------
   //---------------------- dev -------------------------

   $scope.logDuplicationIndexes = function() {
      console.log({
         deDuplicationIndex: deDuplicationIndex,
         classPageTokenSelectionIndex: classPageTokenSelectionIndex
      })
   }

   //less important functions are delegated to another file;
   subControllerFunctions($scope, $location, $mdDialog, $mdToast, $mdMedia, $timeout, $filter, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance);
}
