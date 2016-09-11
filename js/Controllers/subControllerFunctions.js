function subControllerFunctions($scope, $location) {
	$scope.pathSelected = function(path) {
      if ($location.path() === path) {
         return true;
      }
      else {
         return false;
      }
   }
}