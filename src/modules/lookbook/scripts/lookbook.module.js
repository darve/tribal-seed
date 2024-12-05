/* globals module */
/**
 * Javascript component definition for Lookbook
 */


'use strict';


/**
 * Module dependencies go here
 */
var request = require('request'),
    $ = require('jquery');


/**
 * Exposing our function to Browserify
 * @param  {HTMLElement} element A reference to the actual HTML element this module is attached to
 * @return {Function}         function definition for the module
 */
module.exports = function(element) {

    'use strict';

    // Cache the HTML element this component instance is attached to
    var $el = $(element);


    /**
     * Add event listeners
     * ---
     */
    $el.on('click', clicked);


    /**
     * Any other functionality that needs to happen upon initialisation
     * ---
     */
    dance();


    /**
     * Methods
     * ---
     */


    function dance() {
        console.log('this is a public function.');
    }

    function clicked(ev) {
        $el.addClass('red');
    };


    /**
     * Expose public methods to the application
     */
    return {
        dance: dance
    }

};
