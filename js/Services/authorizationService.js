// /*Define the authorizationService service for Angular */ /*global angular*/ /*global gapi*/ /*global app*/
// app.service('authorizationService', authService);

// function authService($mdDialog) {
//     var self = this;
//     var signinButton = angular.element(document.getElementById('signin_button'));
//     var signinSpinner = angular.element(document.getElementById('signin_spinner'));
//     var signinDialog = angular.element(document.getElementById('overlay_background'));
//     var datButton = document.getElementById('dat_button');
//     var signoutButton = angular.element(document.getElementById('signout_button'));

//     this.initilize = function(callback) {
//         gapi.auth2.init({
//             client_id: '632148950209-60a3db9qm6q31sids128mvstddg2qme7.apps.googleusercontent.com',
//             scope: 'email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install',
//             fetch_basic_profile: false,
//             hosted_domain: 'york.org'
//         })
//         .then(function() {
//             var authinstance = gapi.auth2.getAuthInstance()
//             // Listen for sign-in state changes.
//             authinstance.isSignedIn.listen(updateSigninStatus);
//             // Handle the initial sign-in state.
//             updateSigninStatus(authinstance.isSignedIn.get());
//             // show sign in prompt if sign in button is clicked
//             authinstance.attachClickHandler('signin_button', null, console.log, console.log)
//             datButton.style.display = 'inline-block';
//         },console.log);

//         function updateSigninStatus(isSignedIn) {
//             if (isSignedIn) {
//                 var authInstance = gapi.auth2.getAuthInstance()
//                 var currentUser = authInstance.currentUser.get()
//                 var accountDomain = currentUser.getHostedDomain()
//                 if (accountDomain === 'york.org') {
//                     if (callback){
//                         callback();
//                     };
//                     self.hideSigninButton();
//                 }
//             } else {
//                 window.clearUserInfo();
//                 self.showSigninDialog();
//             }
//         }
//     }

//     this.showSigninButton = function() {
//         signinSpinner.addClass('fadeOut');
//         setTimeout(function() {
//             signinButton.addClass('fadeIn');
//             datButton.style.display = 'none';
//         }, 500);
//         console.log(signinDialog)
//         signinDialog[0].style.zIndex = "2000"
//     };

//     this.hideSigninButton = function() {
//         signinSpinner.removeClass('fadeOut');
//         setTimeout(function() {
//             signinButton.removeClass('fadeIn');
//             datButton.style.display = 'inline-block';
//         }, 500);
//     };

//     this.hideSigninDialog = function() {
//         signinDialog.addClass('fadeOut');
//     };

//     this.showSigninDialog = function() {
//         signinDialog.removeClass('fadeOut');
//     };

//     this.handleSigninClick = function(callback) {
//         gapi.auth2.getAuthInstance().signIn(function (res) {
//             console.log(res)
//             if (callback) {
//                 callback()
//             }
//         })
//     }

//     this.handleSignoutClick = function() {
//         gapi.auth2.getAuthInstance().signOut();
//         var logout = document.createElement("img");
//         logout.setAttribute("src", "https://mail.google.com/mail/u/0/?logout&hl=en");
//         logout.style.display = "none";
//         var logoutImg = document.body.appendChild(logout);
//     }

//     this.getAuthToken = function() {
//         return (gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse(true).access_token)
//     }
// }
