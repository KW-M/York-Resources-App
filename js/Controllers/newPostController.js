/* we don't define the "new post controller" here because it was alredy
   defined by the $md-dialog in the newPost function on mainController.   */
function newPostController($scope, $mdDialog, GoogleDriveService) {
    $scope.close = function() {
        $mdDialog.hide();
    };
    $scope.Tags = [];
    $scope.Title = '';
    $scope.Description = '';
    $scope.Link = '';
    $scope.readOnly = false;
    $scope.classSearch = "";
    $scope.courses = ["English III", "Spanish I", "Chemistry", "AP Biology", "Geometry", "Algebra II", "Physics", "calc AB", "Chinese I"];
var link = $scope.Link.toString();
    $scope.type = function() {

        console.log("reached")
        if (link === '') {
            return ('NoLink');
        }
        else {
            console.log("reached2")
            if (link.match(/(?:http|https):\/\/.{2,}/)) {
                if (link.match(/\/(?:d|file|folder)\/([-\w]{25,})\//)) {
                    return ('gDrive');
                }
                else {
                    return ('Link');
                }
            }
            else {
                if(link.length > 9) {
                    $scope.Link = "http://" + link
                }
                return ('Link');
            }
        }
    };
    $scope.submit = function() {
        GoogleDriveService.getUserInfo().then(function(userInfo) {
            console.log(userInfo.result);
            var description = document.querySelector('#DescriptionTxt').textContent;
            var response = ({
                "Type": type,
                "Title": $scope.Title,
                "Creator": {
                    "Name": userInfo.result.user.displayName,
                    "Email": userInfo.result.user.emailAddress,
                    "ClassOf": '2018',
                },
                "CreationDate": new Date(),
                "UpdateDate": new Date(),
                "Tags": $scope.Tags,
                "Description": description,
                "Class": {
                    "Name": "Name Of Class",
                    "Teacher": "name of teacher"
                },
                "Link": $scope.Link,
                "FileId": "If present, the link to the resource of the post (haven't setup ui drive integration yet)",
                "ImageURL": "https://api.pagelr.com/capture?uri=" + $scope.Link + "&width=400&height=260&key=Ca7GOVe9BkGefE_rvwN2Bw",
                "LikeUsers": [],
            });
            console.log(response);
            console.log('sending...');
            GoogleDriveService.sendDriveFile(response, $scope.Title).then(function(reply) {
                console.log(reply.result);
                $scope.close();
            });
        });
    };
}