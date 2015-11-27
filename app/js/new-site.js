/**
 * Create a New Sitelab
 */
'use strict';

var sitelabs = [];
var introductionContent;
var siteLabName;
var labName;
var pageName;

(function () {

    // Maintain a list of sitelabs
    var siteLabsRef = firebaseRef.child('sitelabs');

    siteLabsRef.on("child_added", function(snapshot, prevChildKey) {
        var value = snapshot.val();
        sitelabs.push(value);
    });

    // Get this page
    var pathSegments = window.location.pathname.split('/');

    siteLabName = pathSegments[1];
    labName = pathSegments[2];
    pageName = pathSegments[3];

    firebaseRef.child('sitelabs/'+siteLabName+'/labs/'+labName+'/pages/'+pageName).once("value", function(snapshot) {
        if (snapshot.exists()) {
            introductionContent = snapshot.val().contents;
            $('#article-container').html(introductionContent);
        }
    });

    //    .on("child_added", function(snapshot, prevChildKey) {
    //    introductionContent = snapshot.val();
    //    $('#article-container').html(introductionContent);
    //});

    $(document).ready(function () {
        $('.create-site').click(function () {
            var siteName = "";
            swal({
                title: "Create a New Sitelab",
                text: "What would you like to name your Sitelab?",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: "Team Pirates and Yachts"
            }, function (inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError("You need to name your Sitelab something!");
                    return false
                }

                siteName = inputValue;
                var dasherizedSiteName = _.kebabCase(siteName);

                // Check to see if the sitelab exists
                var ref = new Firebase("https://sitelab.firebaseio.com/sitelabs/" + dasherizedSiteName);
                ref.once("value", function(snapshot) {
                    if (!snapshot.exists()) {

                        // Create new sitelab
                        ref.set({
                            name: siteName,
                            labs: {
                                sitelab: {
                                    name: 'Sitelab',
                                    pages: {
                                        introduction: {
                                            name: 'Introduction',
                                            contents: introductionContent
                                        }
                                    }
                                }
                            }
                        });

                        swal({
                            title: "Nice!",
                            text: "Your Sitelab: `" + inputValue + "` has been created.",
                            type: "success"
                        }, function () {
                            // Redirect to the newly-created Sitelab
                            window.location.href = "/" + dasherizedSiteName + "/sitelab/introduction";
                        });
                    } else {
                        // Annoy the user by telling them the site name has already been taken
                        swal("Sorry!", "This name is already being used by another user.", "error");
                    }
                });


            });
        });

        $('.create-lab').click(function () {
            var labName = "";
            swal({
                title: "Create a New Category",
                text: "What would you like to name this category?",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: "Swashbuckling Ninjas"
            }, function (inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError("You need to name your category something!");
                    return false
                }

                labName = inputValue;
                var dasherizedlabName = _.kebabCase(labName);

                // Check to see if the sitelab exists
                var ref = new Firebase("https://sitelab.firebaseio.com/sitelabs/" + siteLabName + '/labs/' + dasherizedlabName);
                ref.once("value", function(snapshot) {
                    if (!snapshot.exists()) {

                        // Create new lab
                        ref.set({
                            name: labName
                        });

                        swal({
                            title: "Nice!",
                            text: "Category: `" + inputValue + "` has been created.",
                            type: "success"
                        }, function () {
                            // Redirect to the newly-created lab
                            // window.location.href = "/" + dasherizedSiteName + "/sitelab/introduction";
                        });
                    } else {
                        // Annoy the user by telling them the lab name has already been taken
                        swal("Sorry!", "This name is already being used.", "error");
                    }
                });


            });
        });
    });

})();