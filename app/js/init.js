/**
 * Sitelab Application
 */
'use strict';

(function () {

    var App = window.App = new Core();

    /**********************************************************************************
     * Simple data-binding demo (because all of the other frameworks are doing it)
     **********************************************************************************/

    //App.bind('input', function (newValue) {
    //    $('#outlet #outputBox').html(newValue);
    //});


    /**********************************************************************************
     * Advanced (data-backed) template example
     **********************************************************************************/

    //App.set('templatePageTitle', 'Advanced Template Demo');
    //App.set('items', {
    //    a: "foo",
    //    b: "bar",
    //    c: "baz"
    //});
    //
    //App.registerGlobal('addItem', function () {
    //    var newKey = (Math.random()*0xFFFFFF<<0).toString(16);
    //    App.data.items[newKey] = $('input[name=newItem]').val();
    //});


    /**********************************************************************************
     * Gravatar example
     **********************************************************************************/

    //App.bind('gravatarEmail', function (email) {
    //    var gravatar = 'http://www.gravatar.com/avatar/' + Utils.md5(email) + '?s=200';
    //    $('#gravatar').attr('src', gravatar);
    //});


    /**********************************************************************************
     * Data-backing example
     **********************************************************************************/

    //$.get('https://api.github.com/repos/kidGodzilla/framework/events', function (data) {
    //    App.set('githubData', data);
    //});


    /**********************************************************************************
     * Loads external resources via AJAX
     **********************************************************************************/
    Utils.HTMLIncludes();




    /**********************************************************************************
     * Bind Content Tools to Load Function
     **********************************************************************************/
    window.addEventListener('load', function() {
        var editor;

        editor = ContentTools.EditorApp.get();
        editor.init('*[data-editable]', 'data-name');

        editor.bind('save', function (regions) {
            var name, payload, xhr;

            // Set the editor as busy while we save our changes
            this.busy(true);

            // Collect the contents of each region into a FormData instance
            payload = new FormData();
            for (name in regions) {
                if (regions.hasOwnProperty(name)) {
                    payload.append(name, regions[name]);
                }
            }

            if (regions.article) {
                var data = regions.article;
                // console.log(data);
                new ContentTools.FlashUI('ok');

                firebaseRef.child('sitelabs/' + siteLabName + '/labs/' + labName + '/pages/' + pageName + '/contents').set(data);
            }

            this.busy(false);
        });

        // Define settings for the uploader
        var CLOUDINARY_PRESET_NAME = 's2ajgjsu';
        var CLOUDINARY_RETRIEVE_URL = 'http://res.cloudinary.com/kidgodzilla/image/upload';
        var CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/kidgodzilla/image/upload';

        // Define the image uploader
        function cloudinaryImageUploader(dialog) {
            var image, xhr, xhrComplete, xhrProgress;

            // Set up the event handlers
            dialog.bind('imageUploader.cancelUpload', function () {
                // Cancel the current upload

                // Stop the upload
                if (xhr) {
                    xhr.upload.removeEventListener('progress', xhrProgress);
                    xhr.removeEventListener('readystatechange', xhrComplete);
                    xhr.abort();
                }

                // Set the dialog to empty
                dialog.state('empty');
            });

            dialog.bind('imageUploader.clear', function () {
                // Clear the current image
                dialog.clear();
                image = null;
            });

            dialog.bind('imageUploader.fileReady', function (file) {
                // Upload a file to Cloudinary
                var formData;

                // Define functions to handle upload progress and completion
                function xhrProgress(ev) {
                    // Set the progress for the upload
                    dialog.progress((ev.loaded / ev.total) * 100);
                }

                function xhrComplete(ev) {
                    var response;

                    // Check the request is complete
                    if (ev.target.readyState != 4) {
                        return;
                    }

                    // Clear the request
                    xhr = null
                    xhrProgress = null
                    xhrComplete = null

                    // Handle the result of the upload
                    if (parseInt(ev.target.status) == 200) {
                        // Unpack the response (from JSON)
                        response = JSON.parse(ev.target.responseText);

                        // Store the image details
                        image = {
                            angle: 0,
                            height: parseInt(response.height),
                            maxWidth: parseInt(response.width),
                            width: parseInt(response.width)
                        };

                        // Apply a draft size to the image for editing
                        image.filename = parseCloudinaryURL(response.url)[0];
                        image.url = buildCloudinaryURL(
                            image.filename,
                            [{c: 'fit', h: 600, w: 600}]
                        );

                        // Populate the dialog
                        dialog.populate(image.url, [image.width, image.height]);

                    } else {
                        // The request failed, notify the user
                        new ContentTools.FlashUI('no');
                    }
                }

                // Set the dialog state to uploading and reset the progress bar to 0
                dialog.state('uploading');
                dialog.progress(0);

                // Build the form data to post to the server
                formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_PRESET_NAME);

                // Make the request
                xhr = new XMLHttpRequest();
                xhr.upload.addEventListener('progress', xhrProgress);
                xhr.addEventListener('readystatechange', xhrComplete);
                xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
                xhr.send(formData);
            });

            function rotate(angle) {
                // Handle a request by the user to rotate the image
                var height, transforms, width;

                // Update the angle of the image
                image.angle += angle;

                // Stay within 0-360 degree range
                if (image.angle < 0) {
                    image.angle += 360;
                } else if (image.angle > 270) {
                    image.angle -= 360;
                }

                // Rotate the image's dimensions
                width = image.width;
                height = image.height;
                image.width = height;
                image.height = width;
                image.maxWidth = width;

                // Build the transform to rotate the image
                transforms = [{c: 'fit', h: 600, w: 600}];
                if (image.angle > 0) {
                    transforms.unshift({a: image.angle});
                }

                // Build a URL for the transformed image
                image.url = buildCloudinaryURL(image.filename, transforms);

                // Update the image in the dialog
                dialog.populate(image.url, [image.width, image.height]);
            }

            dialog.bind('imageUploader.rotateCCW', function () { rotate(-90); });
            dialog.bind('imageUploader.rotateCW', function () { rotate(90); });

            dialog.bind('imageUploader.save', function () {
                // Handle a user saving an image
                var cropRegion, cropTransform, imageAttrs, ratio, transforms;

                // Build a list of transforms
                transforms = [];

                // Angle
                if (image.angle != 0) {
                    transforms.push({a: image.angle});
                }

                // Crop
                cropRegion = dialog.cropRegion();
                if (cropRegion.toString() != [0, 0, 1, 1].toString()) {
                    cropTransform = {
                        c: 'crop',
                        x: parseInt(image.width * cropRegion[1]),
                        y: parseInt(image.height * cropRegion[0]),
                        w: parseInt(image.width * (cropRegion[3] - cropRegion[1])),
                        h: parseInt(image.height * (cropRegion[2] - cropRegion[0]))
                    };
                    transforms.push(cropTransform);

                    // Update the image size based on the crop
                    image.width = cropTransform.w;
                    image.height = cropTransform.h;
                    image.maxWidth = cropTransform.w;
                }

                // Resize (the image is inserted in the page at a default size)
                if (image.width > 400 || image.height > 400) {
                    transforms.push({c: 'fit', w: 400, h: 400});

                    // Update the size of the image in-line with the resize
                    ratio = Math.min(400 / image.width, 400 / image.height);
                    image.width *= ratio;
                    image.height *= ratio;
                }

                // Build a URL for the image we'll insert
                image.url = buildCloudinaryURL(image.filename, transforms);

                // Build attributes for the image
                imageAttrs = {'alt': '', 'data-ce-max-width': image.maxWidth};

                // Save/insert the image
                dialog.save(image.url, [image.width, image.height]);
            });
        }

        function buildCloudinaryURL(filename, transforms) {
            // Build a Cloudinary URL from a filename and the list of transforms
            // supplied. Transforms should be specified as objects (e.g {a: 90} becomes
            // 'a_90').
            var i, name, transform, transformArgs, transformPaths, urlParts;

            // Convert the transforms to paths
            transformPaths = [];
            for  (i = 0; i < transforms.length; i++) {
                transform = transforms[i];

                // Convert each of the object properties to a transform argument
                transformArgs = [];
                for (name in transform) {
                    if (transform.hasOwnProperty(name)) {
                        transformArgs.push(name + '_' + transform[name]);
                    }
                }

                transformPaths.push(transformArgs.join(','));
            }

            // Build the URL
            urlParts = [CLOUDINARY_RETRIEVE_URL];
            if (transformPaths.length > 0) {
                urlParts.push(transformPaths.join('/'));
            }
            urlParts.push(filename);

            return urlParts.join('/');
        }

        function parseCloudinaryURL(url) {
            // Parse a Cloudinary URL and return the filename and list of transforms
            var filename, i, j, transform, transformArgs, transforms, urlParts;

            // Strip the URL down to just the transforms, version (optional) and
            // filename.
            url = url.replace(CLOUDINARY_RETRIEVE_URL, '');

            // Split the remaining path into parts
            urlParts = url.split('/');

            // The path starts with a '/' so the first part will be empty and can be
            // discarded.
            urlParts.shift();

            // Extract the filename
            filename = urlParts.pop();

            // Strip any version number from the URL
            if (urlParts.length > 0 && urlParts[urlParts.length - 1].match(/v\d+/)) {
                urlParts.pop();
            }

            // Convert the remaining parts into transforms (e.g `w_90,h_90,c_fit >
            // {w: 90, h: 90, c: 'fit'}`).
            transforms = [];
            for (i = 0; i < urlParts.length; i++) {
                transformArgs = urlParts[i].split(',');
                transform = {};
                for (j = 0; j < transformArgs.length; j++) {
                    transform[transformArgs[j].split('_')[0]] =
                        transformArgs[j].split('_')[1];
                }
                transforms.push(transform);
            }

            return [filename, transforms];
        }

        // Capture image resize events and update the Cloudinary URL
        ContentEdit.Root.get().bind('taint', function (element) {
            var args, filename, newSize, transforms, url;

            // Check the element tainted is an image
            if (element.constructor.name != 'Image') {
                return;
            }

            // Parse the existing URL
            args = parseCloudinaryURL(element.attr('src'));
            filename = args[0];
            transforms = args[1];

            // If no filename is found then exit (not a Cloudinary image)
            if (!filename) {
                return;
            }

            // Remove any existing resize transform
            if (transforms.length > 0 &&
                transforms[transforms.length -1]['c'] == 'fill') {
                transforms.pop();
            }

            // Change the resize transform for the element
            transforms.push({c: 'fill', w: element.size()[0], h: element.size()[1]});
            url = buildCloudinaryURL(filename, transforms);
            if (url != element.attr('src')) {
                element.attr('src', url);
            }
        });

        ContentTools.IMAGE_UPLOADER = cloudinaryImageUploader;

        // TimeTool Test
        //var TimeTool,
        //    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        //    hasProp = {}.hasOwnProperty;
        //
        //TimeTool = (function(superClass) {
        //    extend(TimeTool, superClass);
        //
        //    function TimeTool() {
        //        return TimeTool.__super__.constructor.apply(this, arguments);
        //    }
        //
        //    ContentTools.ToolShelf.stow(TimeTool, 'time');
        //
        //    TimeTool.label = 'Time';
        //
        //    TimeTool.icon = 'fa fa fa-file-o';
        //
        //    TimeTool.tagName = 'time';
        //
        //    TimeTool.apply = function(element, selection, callback) {};
        //
        //    TimeTool.getDatetime = function(element, selection) {};
        //
        //    return TimeTool;
        //
        //})(ContentTools.Tools.Bold);
        //
        //ContentTools.DEFAULT_TOOLS[2].push('time')

    });

})();