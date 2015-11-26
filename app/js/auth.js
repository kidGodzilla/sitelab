/**
 * Registration / Auth / Passwd reset for the App
 */
(function () {

    // Firebase-safe-key version of the host
    var host = window.location.host.replace('www.', '').replace(/\./g, '');
    App.set('host', host);

    // Firebase-safe-key version of the pathname
    var pathname = window.location.pathname.replace(/\//g, '').replace(/\./g, '');
    App.set('pathname', pathname);
    App.set('pathName', pathname);

    function redirectWithPOST (timestamp) {
        var host = App.get('host');
        var pathname = App.get('pathname');
        var user = App.get('userID');

        var form = $('<form action="" method="post">' +
            '<input type="hidden" name="host" value="' + host + '" />' +
            '<input type="hidden" name="pathname" value="' + pathname + '" />' +
            '<input type="hidden" name="user" value="' + user + '" />' +
            '<input type="hidden" name="timestamp" value="' + timestamp + '" />' +
            '</form>');
        $('body').append(form);
        form.submit();
    }

    App.registerGlobal('auth', function (callback, force) {

        // IF we have a callback
        if (callback && typeof(callback) === "function") {
            // Do not require authentication for SVGPEN (demo site)
            if (window.location.host === "svgpen.com" || window.location.host === "www.svgpen.com") return callback();

            // Do not require authentication for demos (unless forced)
            if (App.get('isTemplate') && !force) return callback();
        }

        var authData = firebaseRef.getAuth();

        if (authData) {
            // console.log("Authenticated user with uid:", authData.uid);
            var userID = authData.uid;
            App.set('userID', authData.uid);
            App.set('userEmail', authData.password.email);
            if (callback && typeof(callback) === "function")
                callback();
        } else {
            // Modal
            vex.dialog.open({
                message: 'Enter your username and password:',
                input: "<input name=\"email\" type=\"text\" placeholder=\"Email\" required />\n<input name=\"password\" type=\"password\" placeholder=\"Password\" required /><br>Don't have an account? <a href='#' onclick='$(\".vex-dialog-button-secondary\").click();App.createAccount()'>Create an account now</a>",
                buttons: [
                    $.extend({}, vex.dialog.buttons.YES, {
                        text: 'Login'
                    }), $.extend({}, vex.dialog.buttons.NO, {
                        text: 'Back'
                    })
                ],
                callback: function (data) {
                    if (data === false) {
                        // App.lockBuilder();
                        return false; // Cancelled
                    }
                    firebaseRef.authWithPassword({ "email": data.email, "password": data.password
                    }, function (error, authData) {
                        if (error) {
                            // Todo: Try login again
                            Messenger().post({
                                message: "Login Failed! " + error + ' <a href="#" onclick="App.resetPassword()">Reset Password</a>?',
                                type: 'error',
                                showCloseButton: true
                            });
                        } else {
                            var userID = authData.uid;
                            App.set('userID', authData.uid);
                            App.set('userEmail', authData.password.email);
                            if (callback && typeof(callback) === "function") callback();
                        }
                    });
                }
            });
        }
    });

    App.registerGlobal('createAccount', function () {
        vex.dialog.open({
            message: 'Please enter your email address and choose a password:',
            input: "<input name=\"email\" type=\"text\" placeholder=\"Email\" required />\n<input name=\"password\" type=\"password\" placeholder=\"Password\" required />",
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, {
                    text: 'Create Account'
                }), $.extend({}, vex.dialog.buttons.NO, {
                    text: 'Back'
                })
            ],
            callback: function (data) {
                if (data === false) {
                    return false; // Cancelled
                }
                console.log(data.email, data.password);

                firebaseRef.createUser({
                    email: data.email,
                    password: data.password
                }, function(error, userData) {
                    if (error) {
                        switch (error.code) {
                            case "EMAIL_TAKEN":
                                console.log("The new user account cannot be created because the email is already in use.");
                                Messenger().post({
                                    message: "The new user account cannot be created because the email is already in use.",
                                    type: 'error',
                                    showCloseButton: true
                                });
                                break;
                            case "INVALID_EMAIL":
                                console.log("The specified email is not a valid email.");
                                Messenger().post({
                                    message: "The specified email is not a valid email.",
                                    type: 'error',
                                    showCloseButton: true
                                });
                                break;
                            default:
                                console.log("Error creating user:", error);
                                Messenger().post("Error creating user:", error);
                        }
                    } else {
                        console.log("Successfully created user account with uid:", userData.uid);
                        Messenger().post("Your account was created successfully.");
                        setTimeout(function () {
                            window.location.reload();
                        }, 2500);
                    }
                });

            }
        });
    })


    App.registerGlobal('resetPassword', function () {

        vex.dialog.open({
            message: 'To reset your password, please enter your email address:',
            input: "<input name=\"email\" type=\"text\" placeholder=\"Email\" required />",
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, {
                    text: 'Reset Password'
                }), $.extend({}, vex.dialog.buttons.NO, {
                    text: 'Back'
                })
            ],
            callback: function (data) {
                if (data === false) {
                    return true; // Cancelled
                }

                firebaseRef.resetPassword({
                    email: data.email
                }, function (error) {
                    if (error) {
                        switch (error.code) {
                            case "INVALID_USER":
                                Messenger().post({
                                    message: "The specified user account does not exist.",
                                    type: 'error',
                                    showCloseButton: true
                                });
                                break;
                            default:
                                Messenger().post({
                                    message: "Error resetting password: " + error,
                                    type: 'error',
                                    showCloseButton: true
                                });
                        }
                    } else {
                        Messenger().post("Your password has been reset. You should receive an email at the address provided.");
                    }
                });
            }
        });
    });
})();

// Require the login for all visitors
var firebaseRef = new Firebase("https://sitelab.firebaseio.com");
App.auth();