app.service('clientSideDataService', ['GoogleDriveService', function() {
  self = this;
  this.formatPostForUpload = function(allInputsJsObject){
    var formattedPost = {
        'function': 'createFile',
        "parameters": [
                Title,
                Tags,
                Description,
                Likes,
                ImageURL
            ]
    };
    return(formattedPost);
  };
}]);