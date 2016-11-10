function subControllerFunctions($scope, $location, $mdDialog, $mdToast, $mdMedia, $timeout, $filter, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance) {

	var likeClickTimer = {};

	function findPostById(id, array) {
		var item = 0;
		for (item in array) {
			if (array[item].Id == id) return (item)
		}
	}

	function findItemInArray(value, array) {
		var item = 0;
		for (item in array) {
			if (array[item] === value) return (item)
		}
		return (-1);
	}

	//----------------------------------------------------
	//------------------ Converting ----------------------
	$scope.convertDriveToPost = function (DriveMetadata) {
		var formatedPost = {};
		try {
			var likesAndFlagged = DriveMetadata.name.split("{]|[}"); //not flagged any more
			if (DriveMetadata.description) {
				var descriptionAndPreviewimage = DriveMetadata.description.split("{]|[}");
			}
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
			formatedPost.Title = DriveMetadata.properties.Title || ''
			formatedPost.Description = descriptionAndPreviewimage[0] || ''
			formatedPost.Link = descriptionAndPreviewimage[1] || ''
			formatedPost.Tags = tags
			formatedPost.Type = DriveMetadata.properties.Type || 'noLink'
			formatedPost.Flagged = JSON.parse(DriveMetadata.properties.Flagged) || false
			formatedPost.CreationDate = new Date(DriveMetadata.createdTime) || new Date()
			formatedPost.UpdateDate = new Date(DriveMetadata.modifiedTime) || new Date()
			formatedPost.Class = {
				Name: DriveMetadata.properties.ClassName || '',
				Catagory: DriveMetadata.properties.ClassCatagory || '',
				Color: DriveMetadata.properties.ClassColor || '#ffffff',
			}
			formatedPost.Creator = {
				Name: DriveMetadata.owners[0].displayName || '',
				Email: DriveMetadata.owners[0].emailAddress || '',
				ClassOf: DriveMetadata.owners[0].emailAddress.match(/\d+/)[0] || '',
				Me: DriveMetadata.owners[0].emailAddress === $scope.myInfo.Email,
			}
			formatedPost.Link = descriptionAndPreviewimage[1]
			formatedPost.Id = DriveMetadata.id || ''
			formatedPost.AttachmentId = DriveMetadata.properties.AttachmentId || ''
			formatedPost.AttachmentIcon = DriveMetadata.properties.AttachmentIcon || ''
			formatedPost.AttachmentName = DriveMetadata.properties.AttachmentName || ''
			formatedPost.Likes = JSON.parse(likesAndFlagged[1])
			formatedPost.userLiked = hasLiked
			formatedPost.PreviewImage = descriptionAndPreviewimage[2]
			if (formatedPost.Type === 'gDrive') {
				queue('drive', GoogleDriveService.getFileThumbnail(formatedPost.AttachmentId), function (response) {
					$timeout(function () {
						if (response.result.thumbnailLink) {
							formatedPost.PreviewImage = response.result.thumbnailLink.replace("=s220", "=s400") + "&access_token=" + authorizationService.getAuthToken();
						} else {
							formatedPost.PreviewImage = "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
						}
						formatedPost.AttachmentName = response.result.name;
						formatedPost.AttachmentIcon = response.result.iconLink;
					});
				}, function (error) {
					console.log(error);
					formatedPost.PreviewImage = "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
				}, 150);
			}
			return (formatedPost)
		} catch (e) {
			console.warn(e)
			return (formatedPost);
		}
	};
	$scope.convertPostToDriveMetadata = function (Post) {
		var formatedDriveMetadata
		try {
			var tagString = JSON.stringify(Post.Tags).replace(/[\[\]"]+/g, '').match(/[\s\S]{1,116}/g) || [];
			formatedDriveMetadata = {
				name: 0 + '{]|[}' + JSON.stringify([]),
				description: Post.Description + '{]|[}' + Post.Link + '{]|[}' + Post.PreviewImage,
				//createdTime: Post.CreationDate.toRFC3339UTCString(),
				//modifiedTime: Post.UpdateDate.toRFC3339UTCString(),
				properties: {
					Title: Post.Title,
					Flagged: Post.Flagged,
					Type: Post.Type,
					AttachmentId: Post.AttachmentId,
					AttachmentIcon: Post.AttachmentIcon,
					AttachmentName: Post.AttachmentName,
					Tag1: tagString[0],
					Tag2: tagString[1],
					ClassCatagory: Post.Class.Catagory,
					ClassColor: Post.Class.Color,
					ClassName: Post.Class.Name,
				},
				contentHints: {
					indexableText: "Title: " + Post.Title + ", Attachment: " + Post.AttachmentName + ", Class: " + Post.Class.Name + ", Class Catagory: " + Post.Class.Catagory + ", tags: (" + (tagString[2] || '') + (tagString[2] || '') + ")"
				}
			};
			return (formatedDriveMetadata);
		} catch (e) {
			return (formatedDriveMetadata);
			console.warn(e)
		}
	};
	$scope.convertRowToUserPreferences = function (spreadsheetRow) {
		$scope.myInfo.Moderator = spreadsheetRow[2]
		$scope.myInfo.NumberOfVisits = spreadsheetRow[3]
		$scope.myInfo.NumberOfContributions = spreadsheetRow[4]
		$scope.myInfo.LastContributionDate = new Date(spreadsheetRow[5])
		$scope.myInfo.LastBeenFlaggedDate = new Date(spreadsheetRow[6])
	}
	$scope.convertUserPreferencesToRow = function () {
		var spreadsheetRow = [];
		spreadsheetRow[0] = $scope.myInfo.Email;
		spreadsheetRow[1] = $scope.myInfo.Name;
		spreadsheetRow[2] = $scope.myInfo.Moderator || false;
		spreadsheetRow[3] = $scope.myInfo.NumberOfVisits || 0;
		spreadsheetRow[4] = $scope.myInfo.NumberOfContributions || 0;
		spreadsheetRow[5] = $scope.myInfo.LastContributionDate || '';
		spreadsheetRow[6] = $scope.myInfo.LastBeenFlaggedDate || '';
		return (spreadsheetRow);
	}

	//----------------------------------------------------
	//-------------- Filtering & Sorting -----------------
	$scope.filterPosts = function (inputSet) {
		var output = inputSet.filter(function (post) {
			if ($scope.queryParams.flagged !== null && $scope.queryParams.flagged !== undefined) {
				var Flagged = post.Flagged === $scope.queryParams.flagged || post.Flagged;
			} else {
				var Flagged = true;
			}
			if ($scope.queryParams.classpath !== null && $scope.queryParams.classpath !== undefined && $scope.queryParams.classpath !== 'my-posts' && $scope.queryParams.classpath !== 'all-posts' && $scope.queryParams.classpath !== 'flagged') {
				var Class = post.Class.Name === $scope.queryParams.classpath;
			} else {
				var Class = post.Class.Name != 'memes';
			}
			if ($scope.queryParams.type !== null && $scope.queryParams.type !== undefined) {
				var Type = post.Type === $scope.queryParams.type;
			} else {
				var Type = true;
			}
			if ($scope.queryParams.creatorEmail !== null && $scope.queryParams.creatorEmail !== undefined) {
				var Creator = post.Creator.Email === $scope.queryParams.creatorEmail;
			} else {
				var Creator = true;
			}
			return Flagged && Class && Type && Creator;
		});
		return ($scope.sortByDateAndLikes(output))
	}
	$scope.sortByDateAndLikes = function (arrayToSort) {
		return (arrayToSort.sort(function (a, b) {
			return b.UpdateDate.addDays(b.Likes.length) - a.UpdateDate.addDays(a.Likes.length);
		}));
	};
	//----------------------------------------------------
	//------------------UI Actions------------------------
	$scope.toggleSidebar = function (close) { //called by the top left toolbar menu button
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
	$scope.signOut = function () {
		authorizationService.handleSignoutClick();
	};
	//----------------------------------------------------
	// --------------- Post Card Functions ---------------
	$scope.confirmDelete = function (content, arrayIndex) {
		var confirm = $mdDialog.confirm().title('Permanently delete this?').ariaLabel('Delete?').targetEvent(ev).ok('Delete').cancel('Cancel');
		$mdDialog.show(confirm).then(function () {
			$scope.allPosts.splice(findPostById(content.Id, $scope.allPosts), 1);
			$timeout($scope.visiblePosts.splice(arrayIndex, 1));
			queue('drive', GoogleDriveService.deleteDriveFile(content.Id), null, function (err) {
				$mdToast.showSimple('Error deleting post, try again.');
				console.warn(err)
			}, 150);
		});
	};
	$scope.flagPost = function (content, arrayIndex) {
		content.Flagged = true;
		if ($scope.queryParams.classpath != 'flagged') {
			$timeout(function () { //makes angular update values
				$scope.visiblePosts.splice(arrayIndex, 1);
			});
		}
		$scope.allPosts[findPostById(content.Id, $scope.allPosts)].Flagged = true;
		queue('drive', GoogleDriveService.updateFlagged(content.Id, true), null, function (err) {
			$timeout(function () { //makes angular update values
				content.Flagged = false;
				$scope.visiblePosts.splice(arrayIndex, 0, content);
			});
			$mdToast.showSimple('Error flagging post, try again.');
			console.warn(err)
		}, 150);
		//set the poster's has flagged date back
		for (var item = 0; item < $scope.userList.length; item++) {
			if ($scope.userList[item][0] && $scope.userList[item][0] == content.Creator.Email) {
				var range = 'Sheet1!G' + (item + 2)
				var today = $filter('date')(new Date(), 'M/d/yy');
				console.log(today);
				queue('sheets', GoogleDriveService.updateSpreadsheetRange(range, [today]), null, function (err) {
					$timeout(function () { //makes angular update values
						content.Flagged = false;
						$scope.visiblePosts.splice(arrayIndex, 0, content);
					});
					console.warn(err)
					$mdToast.showSimple('Error flagging post, try again.');
				}, 2);
			}
		}
	};
	$scope.unFlagPost = function (content, arrayIndex) {
		var timeoutDate = new Date($scope.myInfo.LastBeenFlaggedDate.getTime() + 7 * 86400000);
		if (timeoutDate < new Date()) {
			content.Flagged = false;
			if ($scope.queryParams.classpath == 'flagged') {
				$timeout(function () { //makes angular update values
					$scope.visiblePosts.splice(arrayIndex, 1);
				});
			}
			$scope.allPosts[findPostById(content.Id, $scope.allPosts)].Flagged = false;
			$scope.updateVisiblePosts($scope.filterPosts($scope.allPosts));
			queue('drive', GoogleDriveService.updateFlagged(content.Id, false), null, function (err) {
				$mdToast.showSimple('Error unflagging post, try again.');
				console.warn(err)
			}, 150);
		} else {
			$mdDialog.show($mdDialog.alert({
				title: 'Uh Oh.',
				htmlContent: '<p style="margin: 0 0 2px 0">One of your posts has been flagged within the past week.<br>To unlock the ability to unflag posts, don\'t let your posts get flagged this week.</p>',
				ok: 'Ok'
			}));
		}
	};
	$scope.updateLastPosted = function () {
		var today = $filter('date')(new Date(), 'M/d/yy');
		$scope.NumberOfContributions++
		var range = 'Sheet1!E' + $scope.UserSettingsRowNum + ':F' + $scope.UserSettingsRowNum
		queue('sheets', GoogleDriveService.updateSpreadsheetRange(range, [,today]), null, function (err) {
			console.warn(err)
			$mdToast.showSimple('Error Saving Post');
		}, 2);
	}
	$scope.likePost = function (content) {
		var userLikeIndex = findItemInArray($scope.myInfo.Email, content.Likes)
		if (userLikeIndex == -1) {
			content.userLiked = true;
			content.Likes.push($scope.myInfo.Email);
		} else {
			content.userLiked = false;
			content.Likes.splice(userLikeIndex, 1);
		}
		if (typeof (likeClickTimer[content.Id]) == 'number') clearTimeout(likeClickTimer[content.Id]);
		likeClickTimer[content.Id] = setTimeout(function () {
			var allArrayPost = $scope.allPosts[findPostById(content.Id, $scope.allPosts)];
			allArrayPost.userLiked = content.userLiked;
			allArrayPost.Likes = content.Likes;
			var name = allArrayPost.Likes.length + "{]|[}" + JSON.stringify(allArrayPost.Likes)
			queue('drive', GoogleDriveService.updateDriveFile(content.Id, {
				name: name
			}), null, function (err) {
				$mdToast.showSimple('Error liking post, try again.');
				console.warn(err)
			}, 150);
		}, 2000);
	};
	$scope.openLink = function (link) {
		if (link !== "" && link !== undefined) {
			window.open(link);
		}
	};
	$scope.removeHttp = function (input) {
		if (input) {
			var url = input.replace(/(?:http|https):\/\//, '')
			return (url.replace('www.', ''))
		} else {
			return input
		}
	}
	$scope.clearText = function (text) {
		text = null;
	};
	//----------------------------------------------------
	//-------------------- dialogs -----------------------
	function DialogController($scope, $mdDialog) {
		$scope.hideDialog = function () {
			$mdDialog.hide();
		};
		$scope.cancelDialog = function () {
			$mdDialog.cancel();
		};
	}
	$scope.openHelpDialog = function () { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/html/help.html',
			controller: DialogController,
			parent: angular.element(document.body),
			clickOutsideToClose: true,
			fullscreen: ($mdMedia('xs')),
		});
	};
	$scope.openOnboardingDialog = function () { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/html/onboarding.html',
			controller: DialogController,
			parent: angular.element(document.body),
			clickOutsideToClose: false,
			fullscreen: ($mdMedia('xs')),
		});
		authorizationService.hideSigninDialog();
	};
	$scope.closeDialog = function () {
		$mdDialog.hide();
	};
	//----------------------------------------------------
	//----------------- Error Handling -------------------
	window.DriveErrorHandeler = function (error, callback) {
		console.warn(error);
		if (error.hasOwnProperty('expectedDomain')) {
			gapi.auth2.getAuthInstance().signOut();
			$mdDialog.show($mdDialog.alert({
				title: 'Sorry.',
				htmlContent: "<p>York Study Resources only works with York Google accounts right now.</p><p>If you have an email account ending with @york.org, please login with it, or ask Mr.Brookhouser if you don't have one.<p>",
				ok: 'Ok'
			})).then(function () {
				angular.element(document.querySelector('#login_spinner')).addClass('fadeOut');
				setTimeout(function () {
					angular.element(document.querySelector('#auth_button')).addClass('fadeIn');
				}, 500);
			});
		}
		if (error.hasOwnProperty('result')) {
			if (error.result.error.message == 'Invalid Credentials') {
				//console.log(authorizationService.getAuthToken())
			}
		}
		if (callback) {
			callback(error)
		}
	}
	window.checkAuthToken = function () {

		}
		//----------------------------------------------------
		//---------------------- dev -------------------------
	$scope.consoleLog = function (input, asAlert) {
		console.log(input)
		if (asAlert) {
			window.alert(JSON.stringify(input, null, 4))
		}
	}
	$scope.refreshLayout = function () {
		angularGridInstance.postsGrid.refresh();
	}
	$scope.logDuplicationIndexes = function () {
		//	console.log()
	}
	$scope.logPostToConsole = function (content, arrayIndex) {
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
