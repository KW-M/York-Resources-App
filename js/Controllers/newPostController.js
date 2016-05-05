/* we don't define the "new post controller" here because it was alredy
   defined by the $md-dialog in the newPost function on mainController.   */
function newPostController($scope, $mdDialog, GoogleDriveService) {
    console.log($scope.globals);
    $scope.close = function() {
        $mdDialog.hide();
    };
    $scope.Tags = [];
    $scope.Title = '';
    $scope.Type = '';
    $scope.Description = '';
    $scope.Link = '';
    $scope.readOnly = false;
    $scope.driveThumbnail = "";
    $scope.classSearch = "";
    $scope.class = "";
    $scope.courses = ["English III", "Spanish I", "Chemistry", "AP Biology", "Geometry", "Algebra II", "Physics", "calc AB", "Chinese I", "World-history I", "world-history II"];

    $scope.classSelected = function(inputClass) {
        $scope.class = inputClass.class;
        console.log(inputClass.class);
    }

    $scope.Preview = function() {
        if ($scope.Type === "Link") {
            return 'https://api.pagelr.com/capture?uri=' + $scope.Link + '&width=400&height=260&key=Ca7GOVe9BkGefE_rvwN2Bw'
        }
        else if ($scope.type === "gDrive") {
            return $scope.driveThumbnail;
        }
    }

    $scope.findType = function() {
        if ($scope.Link === '') {
            $scope.Type = 'NoLink';
                 alert("hey, that isn't a link");
        }
        else {
            console.log("reached2")

            if ($scope.Link.match(/(?:http|https):\/\/.{2,}/)) {
                var isgdrive = $scope.Link.match(/\/(?:d|file|folder|folders)\/([-\w]{25,})/)
                if (isgdrive) {
                    $scope.Type = 'gDrive';
                    alert("hey, thats a google drive link with and id of :" + isgdrive);
                }
                else {
                    $scope.Type = 'Link';
                    alert("hey, that is a link");
                }
            }
            else {
                if ($scope.Link.length > 9) {
                    $scope.Link = "http://" + $scope.Link
                }
                $scope.Type = 'Link';
            }
        }
    };
    $scope.submit = function() {
        GoogleDriveService.getUserInfo().then(function(userInfo) {
            console.log(userInfo.result);
            var description = document.querySelector('#DescriptionTxt').textContent;
            var response = ({
                "Type": "noLink",
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
                    "Name": $scope.class,
                    "Teacher": "Brook"
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