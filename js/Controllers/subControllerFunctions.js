function subControllerFunctions($scope, $location, $mdDialog, $mdMedia, $timeout, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance) {

	var likeClickTimer = {};
	var bookmarkClickTimer = {};
	
	function findPostById(id, array) {
		console.log({
			id: id,
			array: array
		})
		for (var item = 0; item < array.length; item++) {
			if (array[item].Id === id) {
				return (item);
			}
		}
	}
	
	function findItemInArray(value, array) {
		for (var item = 0; item < array.length; item++) {
			if (array[item] === value) {
				return (item);
			}
		}
		return (-1);
	}
	// $scope.DriveMetadataTemplate = {
	// 	id: '0B5NVuDykezpkYkNpaGxXWk1rM1U',
	// 	name: 'Like#{]|[}Flagged(True/False){]|[}["LikerEmail","LikerEmail"]',
	// 	description: '<html>Description Text</html>{]|[}LinkUrl{]|[}PreviewImageUrl',
	// 	iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_10_generic_list.png',
	// 	thumbnailLink: 'https://lh3.googleusercontent.com/i4HfW5uFAyfxizWdBBSnQc4X222eyutIFFZmWemOjyk1CjcZe0-itOo7jkk97OYZWQnASQ=s220',
	// 	createdTime: '2016-09-11T16:50:51.767Z',
	// 	modifiedTime: '2016-09-11T16:50:51.767Z',
	// 	starred: false,
	// 	viewedByMe: true,
	// 	owners: [{
	// 		displayName: 'Kyle Worcester-Moore',
	// 		emailAddress: 'worcester-moorek2018@york.org',
	// 	}],
	// 	properties: {
	// 		Title: 'hi',
	// 		Type: 'noLink',
	// 		AttachmentId: '',
	// 		Tag1: '',
	// 		Tag2: '',
	// 		ClassCatagory: 'Physical Sciences',
	// 		ClassColor: '#e6f9f4',
	// 		ClassName: 'Physical Science (8th)',
	// 	}
	// }

	// $scope.PostTemplate = {
	// 	Title: '',
	// 	Description: '',
	// 	Link: '',
	// 	Tags: [],
	// 	Type: 'noLink',
	// 	Flagged: false,
	// 	CreationDate: new Date(),
	// 	UpdateDate: new Date(),
	// 	Class: {
	// 		Name: '',
	// 		Catagory: '',
	// 		Color: '#ffffff',
	// 	},
	// 	Creator: {
	// 		ClassOf: '',
	// 		Email: '',
	// 		Me: null,
	// 		Name: '',
	// 	},
	// 	Link: '',
	// 	Id: '',
	// 	AttachmentId: '',
	// 	Likes: [],
	// 	PreviewImage: '',
	// 	Bookmarked: false,
	// }

	//----------------------------------------------------
	//------------------ Converting ----------------------
	$scope.convertDriveToPost = function(DriveMetadata) {
		var formatedPost
		try {
			var likesAndFlagged = DriveMetadata.name.split("{]|[}"); //not flagged any more
			var descriptionAndPreviewimage = DriveMetadata.description.split("{]|[}");
			if (DriveMetadata.properties.Tag1 || DriveMetadata.properties.Tag2) {
				var tags = JSON.parse(("[\"" + (DriveMetadata.properties.Tag1 || '') + (DriveMetadata.properties.Tag2 || '') + "\"]").replace(/,/g, "\",\""));
			} else {
				var tags = [];
			}
			if (likesAndFlagged[1].indexOf($scope.myInfo.Email) === -1) {
				var hasLiked = false;
			} else {
				var hasLiked = true;
			}
			formatedPost = {
				Title: DriveMetadata.properties.Title || '',
				Description: descriptionAndPreviewimage[0] || '',
				Link: descriptionAndPreviewimage[1] || '',
				Tags: tags,
				Type: DriveMetadata.properties.Type || 'noLink',
				Flagged: JSON.parse(DriveMetadata.properties.Flagged) || false,
				CreationDate: Date.parse(DriveMetadata.createdTime) || new Date(),
				UpdateDate: Date.parse(DriveMetadata.modifiedTime) || new Date(),
				Class: {
					Name: DriveMetadata.properties.ClassName || '',
					Catagory: DriveMetadata.properties.ClassCatagory || '',
					Color: DriveMetadata.properties.ClassColor || '#ffffff',
				},
				Creator: {
					Name: DriveMetadata.owners[0].displayName || '',
					Email: DriveMetadata.owners[0].emailAddress || '',
					ClassOf: DriveMetadata.owners[0].emailAddress.match(/\d+/)[0] || '',
					Me: DriveMetadata.owners[0].emailAddress === $scope.myInfo.Email,
				},
				Link: descriptionAndPreviewimage[1],
				Id: DriveMetadata.id || '',
				AttachmentId: DriveMetadata.properties.AttachmentId || '',
				Likes: JSON.parse(likesAndFlagged[1]),
				userLiked: hasLiked,
				PreviewImage: descriptionAndPreviewimage[2],
				Bookmarked: DriveMetadata.starred || false,
			}
			return (formatedPost)
		} catch (e) {
			return (formatedPost);
			console.log(e)
		}
	};
	$scope.convertPostToDriveMetadata = function(Post) {
		console.log(Post);
		var formatedDriveMetadata
		try {
			var tagString = JSON.stringify(Post.Tags).replace(/[\[\]"]+/g, '').match(/[\s\S]{1,116}/g) || [];
			formatedDriveMetadata = {
				name: 0 + '{]|[}' + JSON.stringify([]),
				description: Post.Description + '{]|[}' + Post.Link + '{]|[}' + Post.PreviewImage,
				createdTime: Post.CreationDate.toRFC3339UTCString(),
				modifiedTime: Post.UpdateDate.toRFC3339UTCString(),
				starred: Post.Bookmarked,
				properties: {
					Title: Post.Title,
					Flagged: Post.Flagged,
					Type: Post.Type,
					AttachmentId: Post.AttachmentId,
					Tag1: tagString[0],
					Tag2: tagString[1],
					ClassCatagory: Post.Class.Catagory,
					ClassColor: Post.Class.Color,
					ClassName: Post.Class.Name,
				}
			};
			return (formatedDriveMetadata);
		} catch (e) {
			return (formatedDriveMetadata);
			console.log(e)
		}
	};
	//----------------------------------------------------
	//-------------- Filtering & Sorting -----------------
	$scope.filterPosts = function(inputSet) {
      var output = inputSet.filter(function(post) {
         if ($scope.queryParams.flagged !== null && $scope.queryParams.flagged !== undefined) {
            var Flagged = post.Flagged === $scope.queryParams.flagged || post.Flagged;
         } else {
            var Flagged = true;
         }
         if ($scope.queryParams.classpath !== null && $scope.queryParams.classpath !== undefined && $scope.queryParams.classpath !== 'my-posts' && $scope.queryParams.classpath !== 'my-bookmarks' && $scope.queryParams.classpath !== 'all-posts' && $scope.queryParams.classpath !== 'flagged') {
            var Class = post.Class.Name === $scope.queryParams.classpath;
         } else {
            var Class = true;
         }
         if ($scope.queryParams.type !== null && $scope.queryParams.type !== undefined) {
            var Type = post.Type === $scope.queryParams.type;
         } else {
            var Type = true;
         }
         if ($scope.queryParams.bookmarked !== null && $scope.queryParams.bookmarked !== undefined) {
            var Bookmarked = post.Bookmarked === $scope.queryParams.bookmarked;
         } else {
            var Bookmarked = true;
         }
         if ($scope.queryParams.creatorEmail !== null && $scope.queryParams.creatorEmail !== undefined) {
            var Creator = post.Creator.Email === $scope.queryParams.creatorEmail;
         } else {
            var Creator = true;
         }
         // console.log({
         //    filteredPost: post,
         //    Flagged: Flagged,
         //    Class: Class,
         //    Type: Type,
         //    Bookmarked: Bookmarked,
         //    Creator: Creator,
         // });
         return Flagged && Class && Type && Creator && Bookmarked;
      });
      return (output)
   }
	$scope.sortByDateAndLikes = function(arrayToSort) {
		arrayToSort.sort(function(a, b) {
			console.log(b.UpdateDate.addDays(b.Likes.length))
			return b.UpdateDate.addDays(b.Likes.length) - a.UpdateDate.addDays(a.Likes.length);
		});
	};
	//----------------------------------------------------
	//--------------- Grid & Layout ------------------
	$scope.sortByLikes = function(thingToSort) {

	};
	//----------------------------------------------------
	//------------------UI Actions------------------------
	$scope.toggleSidebar = function(close) { //called by the top left toolbar menu button
		if (close === true) {
			$mdSidenav('sidenav_overlay').close();
		} else {
			if ($mdMedia('gt-sm')) {
				$scope.globals.sidenavIsOpen = !$scope.globals.sidenavIsOpen;
				//angularGridInstance.posts.refresh
			} else {
				$mdSidenav('sidenav_overlay').toggle();
			}
		}
	};
	$scope.signOut = function() {
		authorizationService.handleSignoutClick();
	};
	//----------------------------------------------------
	// --------------- Post Card Functions ---------------
	$scope.confirmDelete = function(ev, content, arrayIndex) {
		var confirm = $mdDialog.confirm().title('Permanently delete this?').ariaLabel('Delete?').targetEvent(ev).ok('Delete').cancel('Cancel');
		$mdDialog.show(confirm).then(function() {
			
			$timeout($scope.visiblePosts.splice(arrayIndex, 1));
			queue(GoogleDriveService.deleteDriveFile(content.Id), function() {
				console.log("deleted");
			});
		});
	};
	$scope.flagPost = function(ev, content, arrayIndex) {
		// $timeout(function() { //makes angular update values
		// 	$scope.visiblePosts.splice(arrayIndex, 1);
		// });
		$scope
		$scope.sortByDateAndLikes
		var allArrayPost = $scope.allPosts[findPostById(content.Id, $scope.allPosts)];
		queue(GoogleDriveService.updateFlagged(content.Id, true), function() {
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

			queue(GoogleDriveService.updateFlagged(content.Id, false), function() {
				console.log("unflagged: " + content.Id);
			});
		} else {
			$mdDialog.show($mdDialog.alert({
				title: 'Uh Oh.',
				htmlContent: '<p style="margin: 0px; margin-bottom: 2px">One of your posts has been flagged within the past two weeks.</p><p style="margin: 0px">To unlock the ability to unflag posts, make sure none of your posts get flagged this week.</p>',
				ok: 'Ok'
			}));
		}
	};
	$scope.likePost = function(content) {
		var userLikeIndex = findItemInArray($scope.myInfo.Email, content.Likes)
		if (userLikeIndex === -1) {
			content.userLiked = true;
			content.Likes.push($scope.myInfo.Email);
		} else {
			content.userLiked = false;
			content.Likes.splice(userLikeIndex, 1);
		}
		if(typeof(likeClickTimer[content.Id]) == 'number') {
            clearTimeout(likeClickTimer[content.Id]);
        }
		likeClickTimer[content.Id] = setTimeout(function() {
			var allArrayPost = $scope.allPosts[findPostById(content.Id, $scope.allPosts)];
			allArrayPost.userLiked = content.userLiked;
			allArrayPost.Likes = content.Likes;
			var name = allArrayPost.Likes.length + "{]|[}" + JSON.stringify(allArrayPost.Likes)
			console.log(name);
			queue(GoogleDriveService.updateFileMetadata(content.Id, {name:name}),function(result) {
				console.log(result);
			});
		}, 2000);
	};
	$scope.bookmark = function(content) {
		content.Bookmarked = !content.Bookmarked;
		if(typeof(bookmarkClickTimer[content.Id]) == 'number') {
            clearTimeout(bookmarkClickTimer[content.Id]);
        }
		bookmarkClickTimer[content.Id] = setTimeout(function() {
			var allArrayPost = $scope.allPosts[findPostById(content.Id, $scope.allPosts)];
			allArrayPost.Bookmarked = content.Bookmarked;
			queue(GoogleDriveService.updateFileMetadata(content.Id, {starred: content.Bookmarked}), function(result) {
				console.log("bookmarked: " + content.Id);
			});
		}, 2000);
	};
	$scope.openLink = function(link) {
		if (link !== "" && link !== undefined) {
			window.open(link);
		}
	};
	$scope.clearText = function(text) {
		text = null;
	};
	//----------------------------------------------------
	//-------------------- dialogs -----------------------
	function DialogController($scope, $mdDialog) {
		$scope.hideDialog = function() {
			$mdDialog.hide();
		};
		$scope.cancelDialog = function() {
			$mdDialog.cancel();
		};
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
	$scope.closeDialog = function() {
		console.log('closing dialog')
		$mdDialog.hide();
	};
	//----------------------------------------------------
	//---------------------- dev -------------------------
	$scope.consoleLog = function(input, asAlert) {
		console.log(input)
		if (asAlert) {
			window.alert(JSON.stringify(input, null, 4))
		}
	}
	$scope.logDuplicationIndexes = function() {
		console.log()
	}
	$scope.logPostToConsole = function(content, arrayIndex) {
		window.alert(JSON.stringify({
			'loggedPostContent': content,
			'arrayIndex': arrayIndex
		}, null, 4));
		console.log({
			'loggedPostContent': content,
			'arrayIndex': arrayIndex,
			'converted': $scope.convertPostToDriveMetadata(content)
		});
	}
}