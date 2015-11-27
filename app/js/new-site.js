/**
 * Create a New Sitelab
 */
'use strict';

var sitelabs = [];
var introductionContent;
var siteLabName;
var labName;
var pageName;
var labs = [];

(function () {

    // Bind Sidebar
    App.registerGlobal('bindSidebar', function () {

        // Offcanvas
        $('[data-toggle="offcanvas"]').on('click', function () {
            //$('.main-content').css('height', $('.sidenav').height()+100 + 'px');
            $('body').toggleClass('open-sidebar');
            if ($('body').hasClass('open-sidebar')) {
                $('html').css('overflow', 'hidden');
                $('.main-content').css('height', $('.sidenav').height()+100 + 'px');
                $('.site-header .jumbotron').slideUp(50);
            }
            else {
                $('html').css('overflow', 'visible');
                $('.main-content').css('height', 'auto');
                $('.site-header .jumbotron').slideDown(900);
            }
        });

        // Dropdown
        $('.sidenav.dropable > li > a').on('click', function(e){

            if ( 0 < $(this).next("ul").size() ) {
                e.preventDefault();
            }

            if ( 0 == $(this).next("ul").size() || 0 == $(this).next("ul:hidden").size() ) {
                return;
            }

            $(this).parents(".sidenav").find("> li > a").removeClass('open');
            $(this).parents(".sidenav").find("ul").not(":hidden").slideUp(300);
            $(this).addClass('open').next("ul").slideDown(300);
        });

        $('.sidenav.dropable > li > a.active').addClass('open');
        $('.sidenav.dropable > li > ul').prev('a').addClass('has-child');

        if ($(window).width() < 768) {
            $('.sidebar-boxed').removeClass('sidebar-dark');
        }

        // Sticky behaviour
        if ($('.sidenav').hasClass('sticky')) {
            $(window).scroll(function() {
                var $sidenav = $('.sidenav'),
                    offset   = $('.sidebar').offset();

                if ($(window).scrollTop() > offset.top) {
                    $sidenav.css({ position: 'fixed', top: '120px' });
                } else {
                    $sidenav.css('position', 'static');
                }
            });
        }
    });

    // Maintain a list of sitelabs
    var siteLabsRef = firebaseRef.child('sitelabs');

    siteLabsRef.on("child_added", function(snapshot, prevChildKey) {
        var value = snapshot.val();
        sitelabs.push(value);
    });

    siteLabsRef.once("value", function(snapshot) {
        if (snapshot.exists()) {
            var sitelabs = snapshot.val();

            //console.log(sitelabs);

            var tmp = "";

            for (var sitelabKey in sitelabs) {
                if (sitelabs.hasOwnProperty(sitelabKey)) {
                    var sitelab = sitelabs[sitelabKey];
                    var sitelabName = sitelab.name;
                    var dasherizedSitelabName = _.kebabCase(sitelabName);
                    var sitelabURL = '/' + dasherizedSitelabName;
                    var sitelabLinkTemplate = '<li><a href="{{url}}">{{name}}</a>';
                    tmp += sitelabLinkTemplate.replace('{{url}}', sitelabURL).replace('{{name}}', sitelabName);
                }
            }

            tmp += '<li class="divider"></li><li><a href="#" class="create-site">+ New Sitelab</a></li>';

            $('#switch-labs').html(tmp);
        }
    });

    // Get this page
    var pathSegments = window.location.pathname.split('/');

    siteLabName = pathSegments[1];
    labName = pathSegments[2];
    pageName = pathSegments[3];

    firebaseRef.child('sitelabs/' + siteLabName + '/labs/' + labName + '/pages/' + pageName).once("value", function(snapshot) {
        if (snapshot.exists()) {
            introductionContent = snapshot.val().contents;
            $('#article-container').html(introductionContent);
        }
    });

    // Build the left sidebar
    var labsRef = firebaseRef.child('sitelabs/' + siteLabName + '/labs/');

    labsRef.on("child_added", function(snapshot, prevChildKey) {
        var value = snapshot.val();
        labs.push(value);

        // Rebuild menu
        var temp = "<li><a href=\"/" + siteLabName + "\">Home</a></li>\n";
        var classNames = "";

        labs.forEach(function (item) {
            var name = item.name;
            var dasherizedName = _.kebabCase(name);
            var thisLabName = dasherizedName;
            var url = '#';
            var template = '<li><a href="{{url}}" class="{{class}}">{{name}}</a>';

            // Set the active class for the current lab (category)
            classNames = labName === dasherizedName ? "active" : "";
            temp += template.replace('{{url}}', url).replace('{{name}}', name).replace('{{class}}', classNames);

            // Create UL
            temp += '<ul>';

            // Add List Items
            if (item.pages) {
                for (var pageKey in item.pages) {
                    if (item.pages.hasOwnProperty(pageKey)) {
                        var page = item.pages[pageKey];
                        var pageName = page.name;
                        var dasherizedPageName = _.kebabCase(pageName);
                        var pageUrl = '/' + siteLabName + '/' + thisLabName + '/' + dasherizedPageName;
                        var pageTemplate = '<li><a href="{{url}}">{{name}}</a>';
                        temp += pageTemplate.replace('{{url}}', pageUrl).replace('{{name}}', pageName);
                    }
                }
            }

            temp += '<li><a href="#" class="create-page" data-labname="'+thisLabName+'" style="color: #2196f3">+ New Page</a></li>';
            temp += '</ul>';
            temp += '</li>';
        });

        temp += '<br><li><a href="#" class="create-lab" style="color: #2196f3">+ New Category</a></li>';

        $('#sidenav').html(temp);
        App.bindSidebar();
    });

    // Display Table of Contents
    if (!labName || labName === "") {
        setTimeout(function () {
            var sidenav = $('#sidenav').html();
            $('#article-container').html("<h1>Contents</h1><ol>" + sidenav + "</ol>");
            $('#article-container ol .create-lab, #article-container ol .create-page').each(function () {
                $(this).parent().remove();
            });
        }, 1000);
    }

    $(document).ready(function () {
        $('#switch-labs').on('click', '.create-site', function () {
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

        $('#sidenav').on('click', '.create-lab', function () {
            var labName = "";

            swal({
                title: "Create a New Category",
                text: "What would you like to name this category?",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: "Swashbuckling"
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
                            // window.location.href = "/" + dasherizedSiteName + "/sitelab/introduction"; // Turns out we don't need to :)
                        });
                    } else {

                        // Annoy the user by telling them the lab name has already been taken
                        swal("Sorry!", "This name is already being used.", "error");
                    }
                });


            });
        });

        $('#sidenav').on('click', '.create-page', function () {
            var pageName = "";

            var thisLabName = window.thisLabName = $(this).attr('data-labname');

            swal({
                title: "Create a New Page",
                text: "What would you like to name your new page?",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: "The Hitchhiker's Guide to Swashbuckling"
            }, function (inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError("You need to give your page a name!");
                    return false
                }

                pageName = inputValue;
                var dasherizedPageName = _.kebabCase(pageName);

                // Check to see if the sitelab exists
                var ref = new Firebase("https://sitelab.firebaseio.com/sitelabs/" + siteLabName + '/labs/' + thisLabName + "/pages/" + dasherizedPageName);
                ref.once("value", function(snapshot) {
                    if (!snapshot.exists()) {

                        // Create new lab
                        ref.set({
                            name: pageName,
                            contents: "<h1>\n    " + pageName + "\n</h1>\n<p>\n    This is a new page. Click the pencil in the upper-left corner to edit.\n</p>"
                        });

                        swal({
                            title: "Nice!",
                            text: "Page: `" + inputValue + "` has been created.",
                            type: "success"
                        }, function () {

                            // Redirect to the newly-created page
                             window.location.href = "/" + siteLabName + "/" + thisLabName + "/" + dasherizedPageName; // Turns out we don't need to :)
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