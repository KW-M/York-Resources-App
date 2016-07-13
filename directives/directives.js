// Put any directives you make here and the html template in a file in the directives/html/ folder

// ----Outer UI----
app.directive('toolbarTop', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/toolbarTop.html'
    };
});
app.directive('toolbarTopMobile', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/toolbarTopMobile.html'
    };
});
app.directive('searchBar', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/searchBar.html'
    };
});
app.directive('sideNavInsides', function () {
    return {
        restrict: 'A',
        templateUrl: 'directives/html/sideNavInsides.html'
    };
});
app.directive('addLowerButton', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/addLowerButton.html'
    };
});

// ----Posts layout pieces----
app.directive('postCard', function () {
    return {
        restrict: 'EA',
        templateUrl: 'directives/html/postCard.html'
    };
});

app.directive('addBarTop', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/addBarTop.html'
    };
});

app.directive('newPostContent', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/newPostContent.html'
    };
});


app.directive('getPosts', function() {
  return {
    restrict: 'AE',
    link: function(scope, elem, attrs) {
        var query = "";
        if (attrs.flagged === true) {
            query = query + " and properties has { key='Flagged' and value='true' }"
        } else {
           query = query + " and properties has { key='Flagged' and value='false' }" 
        }
        if (attrs.class !== undefined) {
            query = query + " and properties has { key='ClassName' and value='" + attrs.class + "' }"
        }
        if (attrs.creatorEmail !== undefined) {
            query = query + " and '" + attrs.creatorEmail + "' in owners"
        }
        if (attrs.type !== undefined) {
            query = query + " and properties has { key='Type' and value='" + attrs.type + "' }"
        }
        scope.$parent.queryProperties = query;
        //if (attrs.refresh === true) {
            scope.$parent.getFiles();
        //}
    }
  };
});

app.directive('filterPosts', function() {
  return {
    restrict: 'AE',
    link: function(scope, elem, attrs) {
        if (attrs.showflaged !== true) {
            query = query + ' and not fullText contains \'"Flagged":true\''
        }
        console.log(query);
    }
  };
});

// ----New post pieces----
app.directive('classSelectMenu', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/html/classSelectMenu.html'
    };
});