
'use strict';

var $ = require('jquery');

(function(win, doc) {

    var Modules = {},
        Instances = [];

    // modules:js
    Modules.lookbook = require("../../src/modules/lookbook/scripts/lookbook.module.js");
    // endinject

    function initialise() {
        $('[data-component]').each(function(i, v){
            Instances.push(new Modules[this.getAttribute('data-component')]);
        });
    }

    $(initialise);

})(window, document);
