/* globals require */
/* eslint one-var: 0 */

'use strict';

var $ = require('jquery');

(function () {

    var Modules = {},
        Instances = [];

    // modules:js
    // endinject

    /**
     * This is called when the DOM has finished loading.
     * @return {undefined}
     */
    function initialise () {

        $('[data-component]').each(function (i, el) {

            var name = el.getAttribute('data-component');

            if (name in Modules) {

                Instances.push(new Modules[el.getAttribute('data-component')](el));

            }

        });

    }

    /**
     * Delete a component instance.
     * @return {undefined}
     */
    function delete_component () {

    }

    $(initialise);

}());
