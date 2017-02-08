// function subControllerFunctions($scope, $location, $mdDialog, $mdToast, $mdMedia, $timeout, $filter, $mdSidenav, authorizationService, GoogleDriveService, angularGridInstance) {

// 	var likeClickTimer = {};
// 	window.reloadQuizletFrame = null;

// 	function findPostById(id, array) {
// 		var item = 0;
// 		for (item in array) {
// 			if (array[item].id == id) return (item)
// 		}
// 	}

// 	function findItemInArray(value, array) {
// 		var item = 0;
// 		for (item in array) {
// 			if (array[item] === value) return (item)
// 		}
// 		return (-1);
// 	}

// 	//----------------------------------------------------
// 	//------------------ Converting ----------------------
// 	$scope.convertDriveToPost = function (DriveMetadata) {
// 		var formatedPost = {};
// 		try {
// 			if (DriveMetadata.description) {
// 				var descriptionAndPreviewimage = DriveMetadata.description.split("{]|[}");
// 				formatedPost.Description = descriptionAndPreviewimage[0] || '';
// 				formatedPost.Link = descriptionAndPreviewimage[1] || '';
// 				formatedPost.PreviewImage = descriptionAndPreviewimage[2] || '';
// 			}
// 			if (DriveMetadata.name) {
// 				var nameArray = DriveMetadata.name.split("{]|[}"); //not flagged any more
// 				formatedPost.Likes = (nameArray[2] || "").split(",");
// 				formatedPost.userLiked = ((nameArray[2] || "").indexOf($scope.myInfo.Email) !== -1);
// 			}
// 			if (DriveMetadata.properties) {
// 				formatedPost.Labels = ((DriveMetadata.properties.Tag1 || "") + (DriveMetadata.properties.Tag2 || "")).split(",") || [];
// 				formatedPost.Labels.forEach(function (Label, Index) {
// 					formatedPost.Labels[Index] = $scope.findLabel(Label);
// 				})
// 				var updatedClass = $scope.findClassObject(DriveMetadata.properties.ClassName);
// 				formatedPost.Title = DriveMetadata.properties.Title || nameArray[1] || ''
// 				formatedPost.Flagged = DriveMetadata.properties.Flagged == 'TRUE' || DriveMetadata.properties.Flagged == 'true';
// 				formatedPost.Class = {
// 					Name: DriveMetadata.properties.ClassName || '',
// 					Catagory: updatedClass.Catagory || DriveMetadata.properties.ClassCatagory || '',
// 					Color: updatedClass.Color || DriveMetadata.properties.ClassColor || '#ffffff',
// 				}
// 				var ClassOf = (DriveMetadata.properties.CreatorEmail || DriveMetadata.owners[0].emailAddress).match(/\d+/) || ['∞'];
// 				formatedPost.Creator = {
// 					Name: (DriveMetadata.properties.CreatorName || DriveMetadata.owners[0].displayName) || '',
// 					Email: (DriveMetadata.properties.CreatorEmail || DriveMetadata.owners[0].emailAddress) || '',
// 					ClassOf: ClassOf[0],
// 					Me: (DriveMetadata.properties.CreatorEmail || DriveMetadata.owners[0].emailAddress) === $scope.myInfo.Email,
// 				}
// 				formatedPost.Type = DriveMetadata.properties.Type || 'noLink'
// 				formatedPost.AttachmentId = DriveMetadata.properties.AttachmentId || ''
// 				formatedPost.AttachmentIcon = DriveMetadata.properties.AttachmentIcon || ''
// 				formatedPost.AttachmentName = DriveMetadata.properties.AttachmentName || ''
// 			}
// 			formatedPost.CreationDate = new Date(DriveMetadata.createdTime) || new Date();
// 			formatedPost.UpdateDate = new Date(DriveMetadata.modifiedTime) || new Date();
// 			formatedPost.Id = DriveMetadata.id || '';
// 			if (formatedPost.Type === 'gDrive') {
// 				queue('drive', GoogleDriveService.getFileThumbnail(formatedPost.AttachmentId), function (response) {
// 					$timeout(function () {
// 						if (response.result.thumbnailLink) {
// 							formatedPost.PreviewImage = response.result.thumbnailLink.replace("=s220", "=s400") + "&access_token=" + authorizationService.getAuthToken();
// 						} else {
// 							formatedPost.PreviewImage = "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
// 						}
// 						formatedPost.AttachmentName = response.result.name;
// 						formatedPost.AttachmentIcon = response.result.iconLink;
// 					});
// 				}, function (error) {
// 					console.warn(error);
// 					formatedPost.PreviewImage = "https://ssl.gstatic.com/atari/images/simple-header-blended-small.png"
// 				}, 150);
// 			}
// 			return (formatedPost)
// 		} catch (e) {
// 			console.log(DriveMetadata)
// 			console.log(formatedPost)
// 			console.warn(e)
// 			return (formatedPost);
// 		}
// 	};
// 	$scope.convertPostToDriveMetadata = function (Post) {
// 		var formatedDriveMetadata
// 		try {
// 			var tagString, tagStringArray
// 			Post.Labels.forEach(function (label, index) {
// 				var isComma = (index + 1 != Post.Labels.length) ? ',' : '';
// 				tagString = tagString + label.text + isComma;
// 			})
// 			tagStringArray = tagString.match(/[\s\S]{1,116}/g) || [];
// 			console.log(tagStringArray);
// 			formatedDriveMetadata = {
// 				name: (Post.Likes.length || 0) + '{]|[}' + Post.Title + '{]|[}' + (Post.Likes.join(",") || ""),
// 				description: Post.Description + '{]|[}' + Post.Link + '{]|[}' + Post.PreviewImage,
// 				properties: {
// 					Title: Post.Title || null,
// 					Flagged: Post.Flagged || false,
// 					Type: Post.Type || 'noLink',
// 					AttachmentId: Post.AttachmentId || null,
// 					AttachmentIcon: Post.AttachmentIcon || null,
// 					AttachmentName: Post.AttachmentName || null,
// 					CreatorEmail: Post.Creator.Email || $scope.myInfo.Email || null,
// 					CreatorName: Post.Creator.Name || $scope.myInfo.Name || null,
// 					Tag1: tagStringArray[0] || null,
// 					Tag2: tagStringArray[1] || null,
// 					ClassCatagory: Post.Class.Catagory || null,
// 					ClassColor: Post.Class.Color || null,
// 					ClassName: Post.Class.Name || null,
// 				},
// 				contentHints: {
// 					indexableText: "Title: " + Post.Title + ", Attachment: " + Post.AttachmentName + ", Class: " + Post.Class.Name + ", Class Catagory: " + Post.Class.Catagory + ", Labels: (" + (tagString[2] || '') + (tagString[2] || '') + ")"
// 				}
// 			};
// 			return (formatedDriveMetadata);
// 		} catch (e) {
// 			return (formatedDriveMetadata);
// 			console.warn(e)
// 		}
// 	};
// 	$scope.convertRowToUserPreferences = function (spreadsheetRow) {
// 		$scope.myInfo.Moderator = (spreadsheetRow[0] == 'TRUE') ? true : false;
// 		$scope.myInfo.NumberOfVisits = parseInt(spreadsheetRow[4]);
// 		$scope.myInfo.NumberOfContributions = parseInt(spreadsheetRow[5])
// 		if (spreadsheetRow[6]) $scope.myInfo.LastContributionDate = new Date(spreadsheetRow[6]);
// 		if (spreadsheetRow[7]) $scope.myInfo.LastBeenFlaggedDate = new Date(spreadsheetRow[7]);
// 		if (spreadsheetRow[8]) {
// 			var staredArray = spreadsheetRow[8].split(",") || [];
// 			$scope.myInfo.StaredClasses = [];
// 			$timeout(function () {
// 				$scope.myInfo.StaredClasses.push({
// 					Name: 'Other',
// 					Color: 'hsla(200, 70%, 75%,',
// 				})
// 				staredArray.forEach(function (Class) {
// 					$scope.myInfo.StaredClasses.push($scope.findClassObject(Class))
// 				})
// 			})
// 		}
// 		if (spreadsheetRow[9]) $scope.myInfo.QuizletUsername = spreadsheetRow[9];
// 		if (spreadsheetRow[10]) $scope.myInfo.QuizletUpdateDate = new Date(spreadsheetRow[10]);
// 	}
// 	$scope.convertUserPreferencesToRow = function () {
// 		// var spreadsheetRow = [];
// 		// spreadsheetRow[0] = $scope.myInfo.Email;
// 		// spreadsheetRow[1] = $scope.myInfo.Name;
// 		// spreadsheetRow[2] = $scope.myInfo.NumberOfVisits || 0;
// 		// spreadsheetRow[3] = $scope.myInfo.NumberOfContributions || 0;
// 		// spreadsheetRow[4] = $scope.myInfo.LastContributionDate || '';
// 		// spreadsheetRow[5] = $scope.myInfo.LastBeenFlaggedDate || '';
// 		// return (spreadsheetRow);
// 	};



// 	//----------------------------------------------------
// 	//------------------Handleing Labels------------------------
// 	$scope.addLabel = function (labelName) {
// 		var newLabel = {
// 			text: labelName,
// 			linkedClasses: [{
// 				Name: $scope.queryParams.classPath,
// 				Usage: 1,
// 			}],
// 			totalUsage: 1
// 		}
// 		var labelIndex = $scope.Post.Labels.length;
// 		queue('sheets', GoogleDriveService.appendSpreadsheetRange('Labels!A2:A', [labelName, null, $scope.queryParams.classPath + ",1"], 'class'), null, function (err) {
// 			$mdToast.showSimple('Error adding label, try again.');
// 			$scope.Post.Labels.splice(labelIndex, 1);
// 		}, 2);
// 		$timeout(function () {
// 			$scope.labelSearch = "";
// 			$scope.Post.Labels.push(newLabel);
// 		})
// 	}
// 	$scope.transferAllLabels = function () {
// 		$scope.queryParams.labels.forEach(function () {
// 			var label = $scope.Post.Labels.pop()
// 			$scope.allLabels.push(label);
// 		})
// 		$timeout(function () {
// 			$scope.labelSearch = "";
// 			$scope.visibleLabels = $scope.sortLabels($scope.allLabels)
// 		})
// 	}
// 	$scope.moveLabeltoActive = function (labelName) {
// 		$scope.allLabels.every(function (Label, Index) {
// 			if (Label.text == labelName) {
// 				$scope.allLabels.splice(Index, 1);
// 				$scope.Post.Labels.push(Label);
// 				return false
// 			} else {
// 				return true
// 			}
// 		})
// 		$timeout(function () {
// 			$scope.labelSearch = "";
// 			$scope.visibleLabels = $scope.sortLabels($scope.allLabels)
// 		})
// 	}
// 	$scope.moveLabeltoAllLabels = function (activeLabelIndex) {
// 		var label = $scope.Post.Labels.splice(activeLabelIndex, 1)
// 		$scope.allLabels.push(label[0]);
// 		$timeout(function () {
// 			$scope.visibleLabels = $scope.sortLabels($scope.allLabels)
// 		})
// 	}
// 	$scope.findLabel = function (labelName) {
// 		for (var labelCount = 0; labelCount < $scope.allLabels.length; labelCount++) {
// 			var Label = $scope.allLabels[labelCount];
// 			if (Label.text == labelName) return labelName
// 		}
// 		var newLabel = {
// 				text: labelName,
// 				linkedClasses: [{
// 					Name: $scope.queryParams.classPath,
// 					Usage: 1,
// 				}],
// 				totalUsage: 1
// 			}
// 			// $timeout(function() {
// 			// 	$scope.allLabels.push(newLabel);
// 			// })
// 		return newLabel;
// 	}

	
// 	$scope.clearText = function (text) {
// 		text = null;
// 	};

// 	//----------------------------------------------------
// 	//-------------------- dialogs -----------------------
// 	function DialogController(scope, $mdDialog) {
// 		scope.hideDialog = function () {
// 			$mdDialog.hide();
// 		};
// 		scope.cancelDialog = function () {
// 			$mdDialog.cancel();
// 		};
// 		scope.myEmail = $scope.myInfo.Email
// 	}
// 	$scope.openHelpDialog = function () { //called by the top right toolbar help button
// 		$mdDialog.show({
// 			templateUrl: 'templates/help.html',
// 			controller: DialogController,
// 			parent: angular.element(document.body),
// 			clickOutsideToClose: true,
// 			fullscreen: ($mdMedia('xs')),
// 		});
// 	};
// 	$scope.openFeedbackDialog = function () { //called by the top right toolbar help button
// 		$mdDialog.show({
// 			templateUrl: 'templates/feedback.html',
// 			controller: DialogController,
// 			parent: angular.element(document.body),
// 			clickOutsideToClose: true,
// 			fullscreen: ($mdMedia('xs')),
// 		});
// 	};
// 	$scope.openQuizletDialog = function () { //called by the top right toolbar help button
// 		$mdDialog.show({
// 			templateUrl: 'templates/quizlet.html',
// 			controller: function ($scope, $mdDialog, $timeout) {
// 				$scope.quizletStepNumber = 0;
// 				$scope.reSize
// 				$scope.hideDialog = function () {
// 					$mdDialog.hide();
// 				};
// 				setInterval(function () {
// 					document.getElementById('quizlet_setup_frame').src += '';
// 				}, 4000)
// 				window.addEventListener("message", function receiveMessage(event) {
// 					window.reloadQuizletFrame = null
// 					if (event.data == "QuizletAuthorized") {
// 						$scope.quizletStepNumber = 3;
// 					}
// 				}, false);
// 			},
// 			parent: angular.element(document.body),
// 			clickOutsideToClose: true,
// 			fullscreen: ($mdMedia('xs')),
// 			onComplete: function () {
// 				window.reloadQuizletFrame = document.getElementById('quizlet_setup_frame')
// 					// setInterval(function() {
// 					// 	console.log(window.reloadQuizletFrame)
// 					// 	if (window.reloadQuizletFrame != null) {
// 					// 					window.reloadQuizletFrame.src += '';
// 					// 	}
// 					// },4000)
// 			}
// 		});
// 	};
// 	$scope.openOnboardingDialog = function () { //called by the top right toolbar help button
// 		$mdDialog.show({
// 			templateUrl: 'templates/onboard.html',
// 			controller: DialogController,
// 			parent: angular.element(document.body),
// 			// scope: {
// 			// 	fullscreen:	$mdMedia('xs'),
// 			// },
// 			clickOutsideToClose: false,
// 			fullscreen: ($mdMedia('xs')),
// 		});
// 		authorizationService.hideSigninDialog();
// 	};
// 	$scope.closeDialog = function () {
// 		$mdDialog.hide();
// 	};

		
//   $scope.getFiles = function () {
//       var formattedFileList = [];
//       var nextPageToken = classPageTokenSelectionIndex[$scope.queryPropertyString] || "";
//       var queryString = $scope.queryPropertyString;
//       if (nextPageToken !== "end") {
//          queue('drive', GoogleDriveService.getListOfFlies($scope.queryPropertyString, nextPageToken, 3), function (fileList) {
//             for (var fileCount = 0; fileCount < fileList.result.files.length; fileCount++) {
//               if (!$scope.queryParams.q && deDuplicationIndex[fileList.result.files[fileCount].id] === undefined) {
//                   //if the deDuplication obj doesn't have the file's id as a key, it hasn't already been downloaded.
//                   formattedFileList[fileCount] = $scope.convertDriveToPost(fileList.result.files[fileCount]) //format and save the new post to the formatted files list array
//                   deDuplicationIndex[fileList.result.files[fileCount].id] = 1; //mark this id as used with a "1".
//               } else if ($scope.queryParams.q) {
//                   formattedFileList[fileCount] = $scope.convertDriveToPost(fileList.result.files[fileCount]) //format and save the new post to the formatted files list array
//               }
//             }
//             sortPostsByType(formattedFileList, queryString, $scope.queryParams);
//             if (fileList.result.nextPageToken !== undefined) {
//               classPageTokenSelectionIndex[$scope.queryPropertyString] = fileList.result.nextPageToken; //if we haven't reached the end of our search:
//             } else {
//               classPageTokenSelectionIndex[$scope.queryPropertyString] = "end" //if we have reached the end of our search:
//             }
//             hideSpinner();
//          }, function () {
//             no_more_footer.style.display = 'none';
//             no_posts_footer.style.display = 'none';
//             no_more_footer.style.display = 'none';
//             footer_problem.style.display = 'flex';
//             content_container.scrollTop = content_container.scrollHeight;
//          }, 150);
//       }
//   }

//   // function sortPostsByType(formattedFileList, queryString, queryParams) {
//   //    if (queryParams.q) {
//   //       console.log('hasQueryParams')
//   //       if (queryParams.q === $scope.previousSearch) {
//   //          console.log('sameSearch')
//   //          $scope.searchPosts = $scope.searchPosts.concat(formattedFileList);
//   //       } else {
//   //          console.log('newSearch')
//   //          $scope.searchPosts = formattedFileList;
//   //       }
//   //       $scope.previousSearch = $scope.queryParams.q || null;
//   //       $scope.updateVisiblePosts($scope.searchPosts);
//   //    } else {
//   //       $scope.allPosts = $scope.allPosts.concat(formattedFileList);
//   //       $scope.updateVisiblePosts($scope.visiblePosts.concat($scope.filterPosts(formattedFileList)));

//   //       //if ($scope.queryPropertyString == queryString) {
//   //       // }
//   //    }
//   //    conurancy_counter = conurancy_counter - 1
//   // }
//       // $scope.$watch('allPosts', function (newValue) {
//   //    console.log('allPosts Changed')
//   // }, true);
		
// }
