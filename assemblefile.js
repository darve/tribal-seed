
'use strict';

var
    assemble        = require('assemble'),
    app             = assemble(),
    rename          = require('gulp-rename'),
    path            = require('path'),
    fs              = require('fs'),
    mkdirp          = require('mkdirp');


/**
 * Register all of our compiled component templates as partials
 * so we can render them all on the page.
 */
app.create('modules', {
    viewType: 'partial',
    renameKey: function(key, view) {
        var v = view ? view.basename : path.basename(key);
        v = v.split('/').pop().replace('.hbs', '');
        return v;
    }
});

app.create('wrappers', {
   viewType: 'partial',
    renameKey: function(key, view) {
        var v = view ? view.basename : path.basename(key);
        v = v.split('/').pop().replace('.hbs', '');
        return v;
    }
});

/**
 * Load the actual template files
 */
app.task('load', function(cb){
    app.layouts('./src/views/layouts/compiled.hbs');
    app.wrappers('./src/views/partials/component.hbs');
    app.modules('./compiled/views/**/*.hbs');
    cb();
});

/**
 * Render and save the preview page
 */
app.task('default', ['load'], function() {
    return app.toStream('layouts')
        .pipe(app.renderFile())
        .pipe(rename('index.html'))
        .pipe(app.dest('./app'));
});

module.exports = app;
