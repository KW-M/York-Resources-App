function subControllerFunctions($scope, $location, $mdDialog, $mdToast, $mdMedia, $timeout, $filter, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance) {

	var likeClickTimer = {};
	window.reloadQuizletFrame = null;

	function findPostById(id, array) {
		var item = 0;
		for (item in array) {
			if (array[item].id == id) return (item)
		}
	}
	$scope.getIdPostArrayIndex = function (id) {
		var
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
			if (DriveMetadata.description) {
				var descriptionAndPreviewimage = DriveMetadata.description.split("{]|[}");
				formatedPost.Description = descriptionAndPreviewimage[0] || '';
				formatedPost.Link = descriptionAndPreviewimage[1] || '';
				formatedPost.PreviewImage = descriptionAndPreviewimage[2] || '';
			}
			if (DriveMetadata.name) {
				var nameArray = DriveMetadata.name.split("{]|[}"); //not flagged any more
				formatedPost.Likes = (nameArray[2] || "").split(",");
				formatedPost.userLiked = ((nameArray[2] || "").indexOf($scope.myInfo.Email) !== -1);
			}
			if (DriveMetadata.properties) {
				formatedPost.Labels = ((DriveMetadata.properties.Tag1 || "") + (DriveMetadata.properties.Tag2 || "")).split(",") || [];
				formatedPost.Labels.forEach(function (Label, Index) {
					formatedPost.Labels[Index] = $scope.findLabel(Label);
				})
				var updatedClass = $scope.findClassObject(DriveMetadata.properties.ClassName);
				formatedPost.Title = DriveMetadata.properties.Title || nameArray[1] || ''
				formatedPost.Flagged = DriveMetadata.properties.Flagged == 'TRUE' || DriveMetadata.properties.Flagged == 'true';
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
				formatedPost.Type = DriveMetadata.properties.Type || 'noLink'
				formatedPost.AttachmentId = DriveMetadata.properties.AttachmentId || ''
				formatedPost.AttachmentIcon = DriveMetadata.properties.AttachmentIcon || ''
				formatedPost.AttachmentName = DriveMetadata.properties.AttachmentName || ''
			}
			formatedPost.CreationDate = new Date(DriveMetadata.createdTime) || new Date();
			formatedPost.UpdateDate = new Date(DriveMetadata.modifiedTime) || new Date();
			formatedPost.Id = DriveMetadata.id || '';
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
					console.warn(error);
					formatedPost.PreviewImage = "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
				}, 150);
			}
			return (formatedPost)
		} catch (e) {
			console.log(DriveMetadata)
			console.log(formatedPost)
			console.warn(e)
			return (formatedPost);
		}
	};
	$scope.convertPostToDriveMetadata = function (Post) {
		var formatedDriveMetadata
		try {
			var tagString, tagStringArray
			Post.Labels.forEach(function (label, index) {
				var isComma = (index + 1 != Post.Labels.length) ? ',' : '';
				tagString = tagString + label.text + isComma;
			})
			tagStringArray = tagString.match(/[\s\S]{1,116}/g) || [];
			console.log(tagStringArray);
			formatedDriveMetadata = {
				name: (Post.Likes.length || 0) + '{]|[}' + Post.Title + '{]|[}' + (Post.Likes.join(",") || ""),
				description: Post.Description + '{]|[}' + Post.Link + '{]|[}' + Post.PreviewImage,
				properties: {
					Title: Post.Title || null,
					Flagged: Post.Flagged || false,
					Type: Post.Type || 'noLink',
					AttachmentId: Post.AttachmentId || null,
					AttachmentIcon: Post.AttachmentIcon || null,
					AttachmentName: Post.AttachmentName || null,
					CreatorEmail: Post.Creator.Email || $scope.myInfo.Email || null,
					CreatorName: Post.Creator.Name || $scope.myInfo.Name || null,
					Tag1: tagStringArray[0] || null,
					Tag2: tagStringArray[1] || null,
					ClassCatagory: Post.Class.Catagory || null,
					ClassColor: Post.Class.Color || null,
					ClassName: Post.Class.Name || null,
				},
				contentHints: {
					indexableText: "Title: " + Post.Title + ", Attachment: " + Post.AttachmentName + ", Class: " + Post.Class.Name + ", Class Catagory: " + Post.Class.Catagory + ", Labels: (" + (tagString[2] || '') + (tagString[2] || '') + ")"
				}
			};
			return (formatedDriveMetadata);
		} catch (e) {
			return (formatedDriveMetadata);
			console.warn(e)
		}
	};
	$scope.convertRowToUserPreferences = function (spreadsheetRow) {
		$scope.myInfo.Moderator = (spreadsheetRow[0] == 'TRUE') ? true : false;
		$scope.myInfo.NumberOfVisits = parseInt(spreadsheetRow[4]);
		$scope.myInfo.NumberOfContributions = parseInt(spreadsheetRow[5])
		if (spreadsheetRow[6]) $scope.myInfo.LastContributionDate = new Date(spreadsheetRow[6]);
		if (spreadsheetRow[7]) $scope.myInfo.LastBeenFlaggedDate = new Date(spreadsheetRow[7]);
		if (spreadsheetRow[8]) {
			var staredArray = spreadsheetRow[8].split(",") || [];
			$scope.myInfo.StaredClasses = [];
			$timeout(function () {
				$scope.myInfo.StaredClasses.push({
					Name: 'Other',
					Color: 'hsla(200, 70%, 75%,',
				})
				staredArray.forEach(function (Class) {
					$scope.myInfo.StaredClasses.push($scope.findClassObject(Class))
				})
			})
		}
		if (spreadsheetRow[9]) $scope.myInfo.QuizletUsername = spreadsheetRow[9];
		if (spreadsheetRow[10]) $scope.myInfo.QuizletUpdateDate = new Date(spreadsheetRow[10]);
	}
	$scope.convertUserPreferencesToRow = function () {
		// var spreadsheetRow = [];
		// spreadsheetRow[0] = $scope.myInfo.Email;
		// spreadsheetRow[1] = $scope.myInfo.Name;
		// spreadsheetRow[2] = $scope.myInfo.NumberOfVisits || 0;
		// spreadsheetRow[3] = $scope.myInfo.NumberOfContributions || 0;
		// spreadsheetRow[4] = $scope.myInfo.LastContributionDate || '';
		// spreadsheetRow[5] = $scope.myInfo.LastBeenFlaggedDate || '';
		// return (spreadsheetRow);
	};
	//----------------------------------------------------
	//-------------- Filtering & Sorting -----------------
	$scope.filterPosts = function (inputSet) {
		var filtered = []
		var filteredOut = []
		var max = inputSet.length
		var count;
		for (count = 0; count < max; count++) {
			if ($scope.queryParams.flagged !== null && $scope.queryParams.flagged !== undefined) {
				var Flagged = inputSet[count].flagged === $scope.queryParams.flagged;
			} else {
				var Flagged = true;
			}
			if ($scope.queryParams.classPath !== null && $scope.queryParams.classPath !== undefined && $scope.selectedClass !== false && $scope.selectedClass.stared !== null) {
				var Class = inputSet[count].class.name === $scope.queryParams.classPath;
			} else {
				var Class = inputSet[count].class.name !== 'Memes';
			}
			if ($scope.queryParams.type !== null && $scope.queryParams.type !== undefined) {
				var Type = inputSet[count].type === $scope.queryParams.type;
			} else {
				var Type = true;
			}
			if ($scope.queryParams.creatorEmail !== null && $scope.queryParams.creatorEmail !== undefined) {
				var Creator = inputSet[count].creator.email === $scope.queryParams.creatorEmail;
			} else {
				var Creator = true;
			}
			if (Flagged && Class && Type && Creator) {
				filtered.push(inputSet[count])
			} else {
				filteredOut.push(inputSet[count])
			}
		};
		return {
			filtered: filtered,
			filteredOut: filteredOut
		};
		//return ($scope.sortByDateAndLikes(output))
	}

	$scope.sortByDateAndLikes = function (arrayToSort) {
		return (arrayToSort.sort(function (a, b) {
			return b.creationDate.addDays((b.likes.length || b.likeCount || 0) * 2) - a.creationDate.addDays((a.likes.length || a.likeCount || 0) * 2);
		}));
	};
	$scope.findClassObject = function (className) {
		console.log(className == 'All Posts');
		if (className == 'All Posts') {
			return ({
				name: 'All Posts',
				color: 'hsla(200, 70%, 75%,',
				catagory: null,
				rules: null,
				stared: null,
			})
		} else if (className == 'Your Posts') {
			return ({
				name: 'Your Posts',
				color: 'hsla(114, 89%, 42%,',
				catagory: null,
				rules: null,
				stared: null,
			})
		} else if (className == 'Flagged Posts') {
			return ({
				name: 'Flagged Posts',
				color: 'hsla(15, 95%, 65%,',
				catagory: null,
				rules: null,
				stared: null,
			})
		} else if (className == 'Quizlet') {
			return ({
				name: 'Quizlet',
				color: 'hsla(229, 46%, 49%,',
				catagory: null,
				rules: null,
				stared: null,
			})
		} else if (className == 'Memes') {
			return ({
				name: 'Memes',
				color: 'hsla(200, 70%, 75%,',
				catagory: null,
				rules: 'What da heck are you doing here??',
				stared: false,
			})
		} else if (className == 'Other') {
			return ({
				name: 'Other',
				color: 'hsla(200, 70%, 75%,',
				catagory: null,
				rules: null,
				stared: null,
			})
		} else {
			for (var Catagories = 0; Catagories < $scope.classList.length; Catagories++) {
				for (var ClassNum = 0; ClassNum < $scope.classList[Catagories].classes.length; ClassNum++) {
					var Class = $scope.classList[Catagories].classes[ClassNum]
					if (Class.name == className) {
						Class.color = $scope.classList[Catagories].color
						Class.catagory = $scope.classList[Catagories].catagory
						for (var StaredNum = 0; StaredNum < $scope.myInfo.staredClasses.length; StaredNum++) {
							if ($scope.myInfo.staredClasses[StaredNum].name == className) {
								Class.stared = true;
								return (Class)
							}
						}
						Class.stared = false;
						return (Class)
					}
				}
			}
		}
		return false
		console.warn('could not find class: ' + className);
	};
	$scope.sortLabels = function (input) {
		var output = [];
		input.forEach(function (item) {
			if (item.type == 'Teacher') {
				item.classesTaught.forEach(function (classTaught) {
					if (classTaught == $scope.queryParams.classPath) output.push(item);
				});
			} else {
				output.push(item);
			}
		})
		output = output.sort(function (a, b) {
			var aUsage, bUsage
			if (a.type == 'Teacher') {
				aUsage = 100000;
			} else {
				aUsage = a.totalUsage
				a.linkedClasses.forEach(function (linkedClass) {
					if (linkedClass.Name == $scope.queryParams.classPath) aUsage = linkedClass.Usage + 1000;
				});
			}
			if (b.type == 'Teacher') {
				bUsage = 100000;
			} else {
				bUsage = b.totalUsage
				b.linkedClasses.forEach(function (linkedClass) {
					if (linkedClass.Name == $scope.queryParams.classPath) bUsage = linkedClass.Usage + 1000;
				});
			}
			return bUsage - aUsage;
		})
		return output
	};

	//----------------------------------------------------
	//------------------UI Actions------------------------
	$scope.toggleSidebar = function (close) { //called by the top left toolbar menu button
		if (close === true) {
			$mdSidenav('sidenav_overlay').close();
		} else {
			if ($mdMedia('gt-sm')) {
				$scope.globals.sidenavIsOpen = !$scope.globals.sidenavIsOpen;
			} else {
				$mdSidenav('sidenav_overlay').toggle();
			}
		}
	};
	$scope.FABClick = function () { //called by the top left toolbar menu button
		if ($scope.globals.FABisOpen == true) {
			$scope.newPost({}, 'new')
		}

	};
	$scope.signOut = function () {
		authorizationService.handleSignoutClick();
	};
	$scope.toggleMobileSearch = function (toOpen) {
		$timeout(function () {
			$scope.globals.mobileSearchIsOpen = toOpen;
			$scope.searchInputTxt = '';
		})
		if (toOpen == true) {
			document.getElementById("mobile_search_input").focus();
		} else {
			document.getElementById("mobile_search_input").blur();
		}
	}
	$scope.toggleSidenavClassSearch = function (toOpen) {
		$timeout(function () {
			$scope.globals.sideNavClassSearchOpen = toOpen;
			$scope.sideNavClassSearch = '';
		})
		if (toOpen == true) {
			document.getElementById("sidenav_class_search_input").focus();
		} else {
			document.getElementById("sidenav_class_search_input").blur();
		}
	}
	$scope.openQuizletWindow = function (argument) {
		var quizWindow = window.open("", "_blank", "status=no,menubar=no,toolbar=no");
		quizWindow.resizeTo(9000, 140)
		quizWindow.moveTo(0, 0);
		quizWindow.document.write("<div style='display:flex;align-items: center;height: 100%;'><span>Your Quizlet username should show up here.</span><div style='flex:1;height: 2px;margin-left: 5px;background:black;'></div><div style=' width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 10px solid; '></div><div style=' width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 10px solid; margin-right: 160px; '></div></div>");
		setTimeout(function () {
			quizWindow.location = "https://quizlet.com"
		}, 3000);
	}

	//----------------------------------------------------
	//------------------Handleing Labels------------------------
	$scope.addLabel = function (labelName) {
		var newLabel = {
			text: labelName,
			linkedClasses: [{
				Name: $scope.queryParams.classPath,
				Usage: 1,
			}],
			totalUsage: 1
		}
		var labelIndex = $scope.Post.Labels.length;
		queue('sheets', GoogleDriveService.appendSpreadsheetRange('Labels!A2:A', [labelName, null, $scope.queryParams.classPath + ",1"], 'class'), null, function (err) {
			$mdToast.showSimple('Error adding label, try again.');
			$scope.Post.Labels.splice(labelIndex, 1);
		}, 2);
		$timeout(function () {
			$scope.labelSearch = "";
			$scope.Post.Labels.push(newLabel);
		})
	}
	$scope.transferAllLabels = function () {
		$scope.queryParams.labels.forEach(function () {
			var label = $scope.Post.Labels.pop()
			$scope.allLabels.push(label);
		})
		$timeout(function () {
			$scope.labelSearch = "";
			$scope.visibleLabels = $scope.sortLabels($scope.allLabels)
		})
	}
	$scope.moveLabeltoActive = function (labelName) {
		$scope.allLabels.every(function (Label, Index) {
			if (Label.text == labelName) {
				$scope.allLabels.splice(Index, 1);
				$scope.Post.Labels.push(Label);
				return false
			} else {
				return true
			}
		})
		$timeout(function () {
			$scope.labelSearch = "";
			$scope.visibleLabels = $scope.sortLabels($scope.allLabels)
		})
	}
	$scope.moveLabeltoAllLabels = function (activeLabelIndex) {
		var label = $scope.Post.Labels.splice(activeLabelIndex, 1)
		$scope.allLabels.push(label[0]);
		$timeout(function () {
			$scope.visibleLabels = $scope.sortLabels($scope.allLabels)
		})
	}
	$scope.findLabel = function (labelName) {
		for (var labelCount = 0; labelCount < $scope.allLabels.length; labelCount++) {
			var Label = $scope.allLabels[labelCount];
			if (Label.text == labelName) return labelName
		}
		var newLabel = {
				text: labelName,
				linkedClasses: [{
					Name: $scope.queryParams.classPath,
					Usage: 1,
				}],
				totalUsage: 1
			}
			// $timeout(function() {
			// 	$scope.allLabels.push(newLabel);
			// })
		return newLabel;
	}

	//----------------------------------------------------
	// --------------- Post Card Functions ---------------
	$scope.confirmDelete = function (content, arrayIndex) {
		var confirm = $mdDialog.confirm().title('Permanently delete this?').ariaLabel('Delete?').ok('Delete').cancel('Cancel');
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
		if ($scope.queryParams.classPath != 'flagged') {
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
				var range = 'Sheet1!H' + (item + 2);
				var today = $filter('date')(new Date(), 'M/d/yy');
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
			if ($scope.queryParams.classPath == 'flagged') {
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
		$scope.myInfo.LastContributionDate = new Date()
		var today = $filter('date')(new Date(), 'M/d/yy');
		var range = 'Sheet1!F' + $scope.UserSettingsRowNum + ':F' + $scope.UserSettingsRowNum
		$scope.myInfo.NumberOfContributions++;
		queue('sheets', GoogleDriveService.updateSpreadsheetRange(range, [$scope.myInfo.NumberOfContributions, today]), null, function (err) {
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
	$scope.openLink = function (link, dontOpen) {
		if (link !== "" && link !== undefined && dontOpen != true) window.open(link)
	};
	$scope.removeHttp = function (input) {
		if (input) {
			return (input.replace(/(?:http|https):\/\//, '').replace('www.', ''))
		} else {
			return input
		}
	}
	$scope.clearText = function (text) {
		text = null;
	};

	//----------------------------------------------------
	//-------------------- dialogs -----------------------
	function DialogController(scope, $mdDialog) {
		scope.hideDialog = function () {
			$mdDialog.hide();
		};
		scope.cancelDialog = function () {
			$mdDialog.cancel();
		};
		scope.myEmail = $scope.myInfo.Email
	}
	$scope.openHelpDialog = function () { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/help.html',
			controller: DialogController,
			parent: angular.element(document.body),
			clickOutsideToClose: true,
			fullscreen: ($mdMedia('xs')),
		});
	};
	$scope.openFeedbackDialog = function () { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/feedback.html',
			controller: DialogController,
			parent: angular.element(document.body),
			clickOutsideToClose: true,
			fullscreen: ($mdMedia('xs')),
		});
	};
	$scope.openQuizletDialog = function () { //called by the top right toolbar help button
		$mdDialog.show({
			templateUrl: 'templates/quizlet.html',
			controller: function ($scope, $mdDialog, $timeout) {
				$scope.quizletStepNumber = 0;
				$scope.reSize
				$scope.hideDialog = function () {
					$mdDialog.hide();
				};
				setInterval(function () {
					document.getElementById('quizlet_setup_frame').src += '';
				}, 4000)
				window.addEventListener("message", function receiveMessage(event) {
					window.reloadQuizletFrame = null
					if (event.data == "QuizletAuthorized") {
						$scope.quizletStepNumber = 3;
					}
				}, false);
			},
			parent: angular.element(document.body),
			clickOutsideToClose: true,
			fullscreen: ($mdMedia('xs')),
			onComplete: function () {
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
	$scope.openOnboardingDialog = function () { //called by the top right toolbar help button
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
	$scope.closeDialog = function () {
		$mdDialog.hide();
	};
	//----------------------------------------------------
	//----------------- Error Handling -------------------
	window.DriveErrorHandeler = function (error, item) {
		console.warn(error);
		console.log(item);
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
		if (error.result) {
			// var newItem = JSON.parse(JSON.stringify(item).replace(/(?:"Authorization":"Bearer )[^"]+/,'"Authorization":"Bearer woop woop ' + authorizationService.getAuthToken() + '"'));
			// 		console.log(newItem)
			if (error.result.error.errors[0].message == 'Invalid Credentials') {
				console.warn("invalid credentials")
				$mdToast.show($mdToast.simple().textContent('Please signin again.')).hideDelay(8000);
				authorizationService.showSigninButton();
				authorizationService.showSigninDialog();
			} else if (error.result.error.errors[0].reason == 'dailyLimitExceededUnreg') {
				console.warn('daily limit reached')
				$mdToast.show($mdToast.simple().textContent('Please signin again.')).hideDelay(8000);
			}
		}
		if (item.Err) {
			item.Err(error)
		}
	}
	window.clearUserInfo = function () {
			$timeout(function (argument) {
				$scope.myInfo = {};
				$scope.visiblePosts = [];
				$scope.userList = [];
			})
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
