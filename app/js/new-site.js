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

    //    .on("child_added", function(snapshot, prevChildKey) {
    //    introductionContent = snapshot.val();
    //    $('#article-container').html(introductionContent);
    //});

    // Build the left sidebar
    var labsRef = firebaseRef.child('sitelabs/' + siteLabName + '/labs/');

    labsRef.on("child_added", function(snapshot, prevChildKey) {
        var value = snapshot.val();
        labs.push(value);

        // Rebuild menu
        var temp = "<li><a href=\"#\">Home</a></li>\n";
        var classNames = "active";

        labs.forEach(function (item) {
            var name = item.name;
            //var dasherizedName = _.kebabCase(name);
            var url = '#';
            var template = '<li><a href="{{url}}" class="{{class}}">{{name}}</a>';
            temp += template.replace('{{url}}', url).replace('{{name}}', name).replace('{{class}}', classNames);
            classNames = "";

            // Create UL
            temp += '<ul>';

            // Add List Items
            if (item.pages) {
                for (var page in item.pages) {
                    if (item.pages.hasOwnProperty(page)) {
                        var pageName = page;
                        var dasherizedName = _.kebabCase(pageName);
                        var url = '/' + siteLabName + '/' + labName + '/' + dasherizedName;
                        var template = '<li><a href="{{url}}">{{name}}</a>';
                        temp += template.replace('{{url}}', url).replace('{{name}}', pageName);
                    }
                }
            }

            temp += '<li><a href="#" class="create-page" style="color: #2196f3">+ New Page</a></li>';
            temp += '</ul>';
            temp += '</li>';
        });

        temp += '<br><li><a href="#" class="create-lab" style="color: #2196f3">+ New Category</a></li>';

        $('#sidenav').html(temp);
        App.bindSidebar();
    });

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