function subControllerFunctions($scope, $location, $mdDialog, $mdToast, $mdMedia, $timeout, $filter, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance) {

	var likeClickTimer = {};
	window.reloadQuizletFrame = null;

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
	$scope.convertDriveToPost = function(DriveMetadata) {
		console.log($scope.classList)
		var formatedPost = {};
	//	try {
			var likesAndFlagged = DriveMetadata.name.split("{]|[}"); //not flagged any more
			if (DriveMetadata.description) {
				var descriptionAndPreviewimage = DriveMetadata.description.split("{]|[}");
			}
			if (DriveMetadata.properties.Tag1 || DriveMetadata.properties.Tag2) {
				var tags = JSON.parse(("[\"" + (DriveMetadata.properties.Tag1 || '') + (DriveMetadata.properties.Tag2 || '') + "\"]").replace(/,/g, "\",\""));
			}
			else {
				var tags = [];
			}
			if (likesAndFlagged[1].indexOf($scope.myInfo.Email) === -1) {
				var hasLiked = false;
			}
			else {
				var hasLiked = true;
			}
			var updatedClass = $scope.findClassObject(DriveMetadata.properties.ClassName);
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
				Catagory: updatedClass.Catagory || DriveMetadata.properties.ClassCatagory || '',
				Color: updatedClass.Color || DriveMetadata.properties.ClassColor || '#ffffff',
			}
			var ClassOf = (DriveMetadata.properties.CreatorEmail || DriveMetadata.owners[0].emailAddress).match(/\d+/) || ['∞'];
			formatedPost.Creator = {
				Name: (DriveMetadata.properties.CreatorName || DriveMetadata.owners[0].displayName) || '',
				Email: (DriveMetadata.properties.CreatorEmail || DriveMetadata.owners[0].emailAddress) || '',
				ClassOf: ClassOf[0],
				Me: (DriveMetadata.properties.CreatorEmail || DriveMetadata.owners[0].emailAddress) === $scope.myInfo.Email,
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
				queue('drive', GoogleDriveService.getFileThumbnail(formatedPost.AttachmentId), function(response) {
					$timeout(function() {
						if (response.result.thumbnailLink) {
							formatedPost.PreviewImage = response.result.thumbnailLink.replace("=s220", "=s400") + "&access_token=" + authorizationService.getAuthToken();
						}
						else {
							formatedPost.PreviewImage = "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
						}
						formatedPost.AttachmentName = response.result.name;
						formatedPost.AttachmentIcon = response.result.iconLink;
					});
				}, function(error) {
					console.warn(error);
					formatedPost.PreviewImage = "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
				}, 150);
			}
			return (formatedPost)
		// }
		// // catch (e) {
		// // 	console.warn(e)
		// // 	return (formatedPost);
		// // }
	};
	$scope.convertPostToDriveMetadata = function(Post) {
		var formatedDriveMetadata
		try {
			var tagString = JSON.stringify(Post.Tags).replace(/[\[\]"]+/g, '').match(/[\s\S]{1,116}/g) || [];
			formatedDriveMetadata = {
				name: (Post.Likes.length || 0) + '{]|[}' + JSON.stringify(Post.Likes || []),
				description: Post.Description + '{]|[}' + Post.Link + '{]|[}' + Post.PreviewImage,
				//createdTime: Post.CreationDate.toRFC3339UTCString(),
				//modifiedTime: Post.UpdateDate.toRFC3339UTCString(),
				properties: {
					Title: Post.Title || null,
					Flagged: Post.Flagged || false,
					Type: Post.Type || 'noLink',
					AttachmentId: Post.AttachmentId || null,
					AttachmentIcon: Post.AttachmentIcon || null,
					AttachmentName: Post.AttachmentName || null,
					CreatorEmail: Post.Creator.Email || $scope.myInfo.Email || null,
					CreatorName: Post.Creator.Name || $scope.myInfo.Name || null,
					Tag1: tagString[0] || null,
					Tag2: tagString[1] || null,
					ClassCatagory: Post.Class.Catagory || null,
					ClassColor: Post.Class.Color || null,
					ClassName: Post.Class.Name || null,
				},
				contentHints: {
					indexableText: "Title: " + Post.Title + ", Attachment: " + Post.AttachmentName + ", Class: " + Post.Class.Name + ", Class Catagory: " + Post.Class.Catagory + ", tags: (" + (tagString[2] || '') + (tagString[2] || '') + ")"
				}
			};
			return (formatedDriveMetadata);
		}
		catch (e) {
			return (formatedDriveMetadata);
			console.warn(e)
		}
	};
	$scope.convertRowToUserPreferences = function(spreadsheetRow) {
		$scope.myInfo.Moderator = (spreadsheetRow[3] = 'TRUE') ? true : false;
		$scope.myInfo.NumberOfVisits = spreadsheetRow[5]
		$scope.myInfo.NumberOfContributions = spreadsheetRow[6]
		if (spreadsheetRow[7]) {
			$scope.myInfo.LastContributionDate = new Date(spreadsheetRow[7])
		}
		if (spreadsheetRow[8]) {
			$scope.myInfo.LastBeenFlaggedDate = new Date(spreadsheetRow[8])
		}
	}
	$scope.convertUserPreferencesToRow = function() {
		var spreadsheetRow = [];
		spreadsheetRow[0] = $scope.myInfo.Email;
		spreadsheetRow[1] = $scope.myInfo.Name;
		spreadsheetRow[2] = $scope.myInfo.NumberOfVisits || 0;
		spreadsheetRow[3] = $scope.myInfo.NumberOfContributions || 0;
		spreadsheetRow[4] = $scope.myInfo.LastContributionDate || '';
		spreadsheetRow[5] = $scope.myInfo.LastBeenFlaggedDate || '';
		return (spreadsheetRow);
	};
	//----------------------------------------------------
	//-------------- Filtering & Sorting -----------------
	$scope.filterPosts = function(inputSet) {
		var output = inputSet.filter(function(post) {
			if ($scope.queryParams.flagged !== null && $scope.queryParams.flagged !== undefined) {
				var Flagged = post.Flagged == $scope.queryParams.flagged;
			}
			else {
				var Flagged = true;
			}
			if ($scope.queryParams.classPath !== null && $scope.queryParams.classPath !== undefined && $scope.queryParams.classPath !== 'my-posts' && $scope.queryParams.classPath !== 'all-posts' && $scope.queryParams.classPath !== 'flagged') {
				var Class = post.Class.Name === $scope.queryParams.classPath;
			}
			else {
				var Class = post.Class.Name != 'memes';
			}
			if ($scope.queryParams.type !== null && $scope.queryParams.type !== undefined) {
				var Type = post.Type === $scope.queryParams.type;
			}
			else {
				var Type = true;
			}
			if ($scope.queryParams.creatorEmail !== null && $scope.queryParams.creatorEmail !== undefined) {
				var Creator = post.Creator.Email === $scope.queryParams.creatorEmail;
			}
			else {
				var Creator = true;
			}
			return Flagged && Class && Type && Creator;
		});
		return ($scope.sortByDateAndLikes(output))
	}
	$scope.sortByDateAndLikes = function(arrayToSort) {
		return (arrayToSort.sort(function(a, b) {
			return b.CreationDate.addDays(b.Likes.length || 0) - a.CreationDate.addDays(a.Likes.length || 0);
		}));
	};
	$scope.findClassObject = function(className) {
		for (var Catagories = 0; Catagories < $scope.classList.length; Catagories++) {
			console.log($scope.classList[Catagories])
			for (var ClassNum = 0; ClassNum < $scope.classList[Catagories].Classes.length; ClassNum++) {
				var Class = $scope.classList[Catagories].Classes[ClassNum]
				if(Class.Name == className) {
					Class.Color = $scope.classList[Catagories].Color
					Class.Catagory = $scope.classList[Catagories].Catagory
					return(Class)
				}
		    }
		}
		console.warn ('could not find class: ' + className);
	}
	//----------------------------------------------------
	//------------------UI Actions------------------------
	$scope.toggleSidebar = function(close) { //called by the top left toolbar menu button
		if (close === true) {
			$mdSidenav('sidenav_overlay').close();
		}
		else {
			if ($mdMedia('gt-sm')) {
				$scope.globals.sidenavIsOpen = !$scope.globals.sidenavIsOpen;
			}
			else {
				$mdSidenav('sidenav_overlay').toggle();
			}
		}
	};
	$scope.FABClick = function() { //called by the top left toolbar menu button
		if ($scope.globals.FABisOpen == true) {
			$scope.newPost({}, 'new')
		}

	};
	$scope.signOut = function() {
		authorizationService.handleSignoutClick();
	};
	$scope.toggleMobileSearch = function(toOpen) {
		$timeout(function() {
			$scope.globals.mobileSearchIsOpen = toOpen;
			$scope.searchInputTxt = '';
		})
		if (toOpen == true) {
			document.getElementById("mobile_search_input").focus();
		}
		else {
			document.getElementById("mobile_search_input").blur();
		}
	}
	$scope.toggleSidenavClassSearch = function(toOpen) {
		$timeout(function() {
			$scope.globals.sideNavClassSearchOpen = toOpen;
			$scope.sideNavClassSearch = '';
		})
		if (toOpen == true) {
			document.getElementById("sidenav_class_search_input").focus();
		}
		else {
			document.getElementById("sidenav_class_search_input").blur();
		}
	}
	$scope.openQuizletWindow = function(argument) {
		var quizWindow = window.open("", "_blank", "status=no,menubar=no,toolbar=no");
		quizWindow.resizeTo(9000, 140)
		quizWindow.moveTo(0, 0);
		quizWindow.document.write("<div style='display:flex;align-items: center;height: 100%;'><span>Your Quizlet username should show up here.</span><div style='flex:1;height: 2px;margin-left: 5px;background:black;'></div><div style=' width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 10px solid; '></div><div style=' width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 10px solid; margin-right: 160px; '></div></div>");
		setTimeout(function() {
			quizWindow.location = "https://quizlet.com"
		}, 3000);
	}
	//----------------------------------------------------
	// --------------- Post Card Functions ---------------
	$scope.confirmDelete = function(content, arrayIndex) {
		var confirm = $mdDialog.confirm().title('Permanently delete this?').ariaLabel('Delete?').ok('Delete').cancel('Cancel');
		$mdDialog.show(confirm).then(function() {
			$scope.allPosts.splice(findPostById(content.Id, $scope.allPosts), 1);
			$timeout($scope.visiblePosts.splice(arrayIndex, 1));
			queue('drive', GoogleDriveService.deleteDriveFile(content.Id), null, function(err) {
				$mdToast.showSimple('Error deleting post, try again.');
				console.warn(err)
			}, 150);
		});
	};
	$scope.flagPost = function(content, arrayIndex) {
		content.Flagged = true;
		if ($scope.queryParams.classPath != 'flagged') {
			$timeout(function() { //makes angular update values
				$scope.visiblePosts.splice(arrayIndex, 1);
			});
		}
		$scope.allPosts[findPostById(content.Id, $scope.allPosts)].Flagged = true;
		queue('drive', GoogleDriveService.updateFlagged(content.Id, true), null, function(err) {
			$timeout(function() { //makes angular update values
				content.Flagged = false;
				$scope.visiblePosts.splice(arrayIndex, 0, content);
			});
			$mdToast.showSimple('Error flagging post, try again.');
			console.warn(err)
		}, 150);
		//set the poster's has flagged date back
		for (var item = 0; item < $scope.userList.length; item++) {
			if ($scope.userList[item][0] && $scope.userList[item][0] == content.Creator.Email) {
				var range = 'Sheet1!I' + (item + 2)
				var today = $filter('date')(new Date(), 'M/d/yy');
				queue('sheets', GoogleDriveService.updateSpreadsheetRange(range, [today]), null, function(err) {
					$timeout(function() { //makes angular update values
						content.Flagged = false;
						$scope.visiblePosts.splice(arrayIndex, 0, content);
					});
					console.warn(err)
					$mdToast.showSimple('Error flagging post, try again.');
				}, 2);
			}
		}
	};
	$scope.unFlagPost = function(content, arrayIndex) {
		var timeoutDate = new Date($scope.myInfo.LastBeenFlaggedDate.getTime() + 7 * 86400000);
		if (timeoutDate < new Date()) {
			content.Flagged = false;
			if ($scope.queryParams.classPath == 'flagged') {
				$timeout(function() { //makes angular update values
					$scope.visiblePosts.splice(arrayIndex, 1);
				});
			}
			$scope.allPosts[findPostById(content.Id, $scope.allPosts)].Flagged = false;
			$scope.updateVisiblePosts($scope.filterPosts($scope.allPosts));
			queue('drive', GoogleDriveService.updateFlagged(content.Id, false), null, function(err) {
				$mdToast.showSimple('Error unflagging post, try again.');
				console.warn(err)
			}, 150);
		}
		else {
			$mdDialog.show($mdDialog.alert({
				title: 'Uh Oh.',
				htmlContent: '<p style="margin: 0 0 2px 0">One of your posts has been flagged within the past week.<br>To unlock the ability to unflag posts, don\'t let your posts get flagged this week.</p>',
				ok: 'Ok'
			}));
		}
	};
	$scope.updateLastPosted = function() {
		$scope.myInfo.LastContributionDate = new Date()
		var today = $filter('date')(new Date(), 'M/d/yy');
		$scope.NumberOfContributions++
			var range = 'Sheet1!G' + $scope.UserSettingsRowNum + ':H' + $scope.UserSettingsRowNum
		queue('sheets', GoogleDriveService.updateSpreadsheetRange(range, [$scope.NumberOfContributions, today]), null, function(err) {
			console.warn(err)
			$mdToast.showSimple('Error Saving Post');
		}, 2);
	}
	$scope.likePost = function(content) {
		var userLikeIndex = findItemInArray($scope.myInfo.Email, content.Likes)
		if (userLikeIndex == -1) {
			content.userLiked = true;
			content.Likes.push($scope.myInfo.Email);
		}
		else {
			content.userLiked = false;
			content.Likes.splice(userLikeIndex, 1);
		}
		if (typeof(likeClickTimer[content.Id]) == 'number') clearTimeout(likeClickTimer[content.Id]);
		likeClickTimer[content.Id] = setTimeout(function() {
			var allArrayPost = $scope.allPosts[findPostById(content.Id, $scope.allPosts)];
			allArrayPost.userLiked = content.userLiked;
			allArrayPost.Likes = content.Likes;
			var name = allArrayPost.Likes.length + "{]|[}" + JSON.stringify(allArrayPost.Likes)
			queue('drive', GoogleDriveService.updateDriveFile(content.Id, {
				name: name
			}), null, function(err) {
				$mdToast.showSimple('Error liking post, try again.');
				console.warn(err)
			}, 150);
		}, 2000);
	};
	$scope.openLink = function(link, dontOpen) {
		if (link !== "" && link !== undefined && dontOpen != true) {
			window.open(link);
		}
	};
	$scope.removeHttp = function(input) {
		if (input) {
			var url = input.replace(/(?:http|https):\/\//, '')
			return (url.replace('www.', ''))
		}
		else {
			return input
		}
	}
	$scope.clearText = function(text) {
		text = null;
	};

	//----------------------------------------------------
	//-------------------- dialogs -----------------------

	function DialogController(scope, $mdDialog) {
		scope.hideDialog = function() {
			$mdDialog.hide();
		};
		scope.cancelDialog = function() {
			$mdDialog.cancel();
		};
		scope.myEmail = $scope.myInfo.Email
	}
	$scope.openHelpDialog = function() { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/help.html',
			controller: DialogController,
			parent: angular.element(document.body),
			clickOutsideToClose: true,
			fullscreen: ($mdMedia('xs')),
		});
	};
	$scope.openFeedbackDialog = function() { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/feedback.html',
			controller: DialogController,
			parent: angular.element(document.body),
			clickOutsideToClose: true,
			fullscreen: ($mdMedia('xs')),
		});
	};
	$scope.openQuizletDialog = function() { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/quizlet.html',
			controller: function($scope, $mdDialog, $timeout) {
				$scope.quizletStepNumber = 0;
				$scope.reSize
				$scope.hideDialog = function() {
					$mdDialog.hide();
				};
				setInterval(function() {
					document.getElementById('quizlet_setup_frame').src += '';
				}, 4000)
				window.addEventListener("message", function receiveMessage(event) {
					console.log(event);
					window.reloadQuizletFrame = null
					if (event.data == "QuizletAuthorized") {
						console.log('auth q done');
						$scope.quizletStepNumber = 3;
					}
				}, false);
			},
			parent: angular.element(document.body),
			clickOutsideToClose: true,
			fullscreen: ($mdMedia('xs')),
			onComplete: function() {
				window.reloadQuizletFrame = document.getElementById('quizlet_setup_frame')
					// setInterval(function() {
					// 	console.log(window.reloadQuizletFrame)
					// 	if (window.reloadQuizletFrame != null) {
					// 					window.reloadQuizletFrame.src += '';
					// 	}
					// },4000)
			}
		});
	};
	$scope.openOnboardingDialog = function() { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/onboard.html',
			controller: DialogController,
			parent: angular.element(document.body),
			// scope: {
			// 	fullscreen:	$mdMedia('xs'),
			// },
			clickOutsideToClose: false,
			fullscreen: ($mdMedia('xs')),
		});
		authorizationService.hideSigninDialog();
	};
	$scope.closeDialog = function() {
		$mdDialog.hide();
	};
	//----------------------------------------------------
	//----------------- Error Handling -------------------
	window.DriveErrorHandeler = function(error, item) {
		console.warn(error);
		console.log(item);
		if (error.hasOwnProperty('expectedDomain')) {
			gapi.auth2.getAuthInstance().signOut();
			$mdDialog.show($mdDialog.alert({
				title: 'Sorry.',
				htmlContent: "<p>York Study Resources only works with York Google accounts right now.</p><p>If you have an email account ending with @york.org, please login with it, or ask Mr.Brookhouser if you don't have one.<p>",
				ok: 'Ok'
			})).then(function() {
				angular.element(document.querySelector('#login_spinner')).addClass('fadeOut');
				setTimeout(function() {
					angular.element(document.querySelector('#auth_button')).addClass('fadeIn');
				}, 500);
			});
		}
		if (error.result) {
			if (error.result.error.errors[0].message == 'Invalid Credentials') {
				console.log('Invalid Credentials - token: ' + authorizationService.getAuthToken())
				runPromise(item);
			}
			else if (error.result.error.errors[0].reason == 'dailyLimitExceededUnreg') {
				console.log('daily limit')
			}
		}
		if (item.Err) {
			item.Err(error)
		}
	}
	window.checkAuthToken = function() {

	}
	window.clearUserInfo = function() {
			$timeout(function(argument) {
				$scope.myInfo = {};
				$scope.visiblePosts = [];
				$scope.userList = [];
			})
		}
		//----------------------------------------------------
		//---------------------- dev -------------------------
	$scope.consoleLog = function(input, asAlert) {
		console.log(input)
		if (asAlert) {
			window.alert(JSON.stringify(input, null, 4))
		}
	}
	$scope.refreshLayout = function() {
		angularGridInstance.postsGrid.refresh();
	}
	$scope.logDuplicationIndexes = function() {
		//	console.log()
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
