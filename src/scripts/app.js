/* globals require */

'use strict';

var $ = require('jquery');

(function () {

    var Modules = {},
        Instances = [];

    // modules:js
    // endinject

    var initialise = function initialise () {

        $('[data-component]').each(function (i, v) {

            var name = v.getAttribute('data-component');

            if (name in Modules) {

                Instances.push(new Modules[v.getAttribute('data-component')]);

            }

        });

    }

    $(initialise);

}());
