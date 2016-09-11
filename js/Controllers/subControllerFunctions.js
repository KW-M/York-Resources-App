function subControllerFunctions($scope, $location, $mdDialog, $timeout, $mdSidenav, angularGridInstance) {
	
	//----------------------------------------------------
	//------------------UI actions------------------------
	$scope.toggleSidebar = function(urlPathChanged) { //called by the top left toolbar menu button
      if (urlPathChanged === true) {
         if ($mdMedia('gt-sm') !== true) {
            $mdSidenav('sidenav_overlay').close();
         }
      }
      else {
         if ($mdMedia('gt-sm')) {
            $scope.globals.sidenavIsOpen = !$scope.globals.sidenavIsOpen;
            //$window.setTimeout(angularGridInstance.posts.refresh, 500);
         }
         else {
            $mdSidenav('sidenav_overlay').toggle();
         }
      }
   };
   	$scope.pathSelected = function(path) {
		if ($location.path() === path) {
			return true;
		}
		else {
			return false;
		}
	}
	//----------------------------------------------------
	// --------------- Post Card Functions ---------------
	$scope.confirmDelete = function(ev, content, arrayIndex) {
		var confirm = $mdDialog.confirm().title('Permanently delete this?').ariaLabel('Delete?').targetEvent(ev).ok('Delete').cancel('Cancel');
		$mdDialog.show(confirm).then(function() {
			$timeout(function() { //makes angular update values
				$scope.visiblePosts.splice(arrayIndex, 1);
			});
			queue(GoogleDriveService.deleteDriveFile(content.Id), function() {
				console.log("deleted" + content.Id);
			});
		}, function() {
			//cancel
		});
	};
	$scope.flagPost = function(ev, content, arrayIndex) {
		content.Flagged = true;
		$timeout(function() { //makes angular update values
			$scope.visiblePosts.splice(arrayIndex, 1);
			$scope.flaggedPosts.push(content);
		});
		queue(GoogleDriveService.updateFileProperty(content.Id, 'Flagged', true), function() {
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

			queue(GoogleDriveService.updateFileProperty(content.Id, 'Flagged', false), function() {
				console.log("unflagged: " + content.Id);
			});
		}
		else {
			$mdDialog.show($mdDialog.alert({
				title: 'Uh Oh.',
				htmlContent: '<p style="margin: 0px; margin-bottom: 2px">One of your posts has been flagged within the past two weeks.</p><p style="margin: 0px">To unlock the ability to unflag posts, make sure none of your posts get flagged this week.</p>',
				ok: 'Ok'
			}));
		}
	};
	$scope.likePost = function(ev, content, arrayIndex) {
		GoogleDriveService.flagDriveFile(content.Id, 'Flagged', false).then(function() {
			console.log("flagged: " + content.Id);
		})
	};
	$scope.unLikePost = function(ev, content, arrayIndex) {
		if ($scope.myInfo.Moderator === true) {
			var permissionID = "needs to be created"
			GoogleDriveService.unLikeFile(content.Id, permissionID).then(function() {
				console.log("unflagged: " + content.Id);
			});
		}
		else {

		}
	};
	$scope.openLink = function(link) {
		if (link !== "" && link !== undefined) {
			$window.open(link);
		}
	};
	$scope.clearText = function(text) {
		text = '';
	};
	//----------------------------------------------------
	//-------------------- dialogs -----------------------
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
	function DialogController($scope, $mdDialog) {
		$scope.hideDialog = function() {
			$mdDialog.hide();
		};
		$scope.cancelDialog = function() {
			$mdDialog.cancel();
		};
	}
	//----------------------------------------------------
	//---------------------- dev -------------------------
	$scope.consoleLog = function(input, asAlert) {
		if (asAlert) {
			window.alert(JSON.stringify(input, null, 4))
		}
		else {
			console.log(input)
		}
	}
	$scope.logPostToConsole = function(content, arrayIndex) {
		window.alert(JSON.stringify({
			'loggedPostContent': content,
			'arrayIndex': arrayIndex
		}, null, 4));
		console.log({
			'loggedPostContent': content,
			'arrayIndex': arrayIndex
		});
	};
}