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

                firebaseRef.child('sitelabs/' + siteLabName + '/labs/' + labName + '/pages/' + pageName).set({
                    contents: data
                });
            }

            this.busy(false);
        });
    });

})();