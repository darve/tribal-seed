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

        $('[data-component]').each(function (i, v) {

            var name = v.getAttribute('data-component');

            if (name in Modules) {

                Instances.push(new Modules[v.getAttribute('data-component')]);

            }

        });

    }

    $(initialise);

}());
