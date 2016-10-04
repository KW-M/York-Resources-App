function subControllerFunctions($scope, $location, $mdDialog, $mdMedia, $timeout, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance) {


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
			console.log(likesAndFlagged);
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
				Likes: [], // likesAndFlagged[2] like email array,
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
				name: 2 + '{]|[}' + JSON.stringify(["worcester-moorek2018@york.org", "lie2018@york.org"]),
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
	//-------------- Sorting & Filtering -----------------
	$scope.sortByLikes = function(thingToSort) {
		thingToSort.sort(function(a, b) {
			return b.LikeUsers.length - a.LikeUsers.length;
		});
	};
	$scope.sortByDate = function(thingToSort) {
		thingToSort.sort(function(a, b) {
			return b.UpdateDate - a.UpdateDate;
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

	$scope.flagPost = function(ev, content, arrayIndex) {
		$timeout(function() { //makes angular update values
			$scope.visiblePosts.splice(arrayIndex, 1);
		});
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
		console.log(content)
		content.userLiked != content.userLiked;
		if (content.userLiked === true) {
			content.Likes.push($scope.myInfo.Email);
		} else {
			content.Likes.pop($scope.myInfo.Email);
		}
		debounce(function() {
			var allArrayPost = $scope.allPosts[findPostById(content.Id, $scope.allPosts)];
			allArrayPost.userLiked = content.userLiked;
			if (content.userLiked === true) {
				allArrayPost.Likes.push($scope.myInfo.Email);
			} else {
				allArrayPost.Likes.pop($scope.myInfo.Email);
			}
			console.log(allArrayPost)
			// GoogleDriveService.updateTitle(content.Id, false).then(function(result) {
			// 	console.log(result);
			// })
		}, 1000)

		content.Likes.push();
		content.Likes.pop();
	};
	$scope.bookmark = function(content) {
		content.Bookmarked != content.Bookmarked;
		debounce(function() {
			queue(GoogleDriveService.updateFileMetadata(content.Id, {starred: content.Bookmarked}), function(result) {
				console.log("bookmarked: " + content.Id);
			});
		}, 1000);
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