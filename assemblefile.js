

'use strict';


var assemble = require('assemble'),
    app = assemble(),

    gulp = require('gulp'),
    tap = require('gulp-tap'),
    rename = require('gulp-rename');

app.task('load', function(cb) {

    gulp.src('./src/modules/**/manifest.js')
        .pipe(tap(function(file, t) {
            var manifest = require(file.path),
                template = './src/modules/' + manifest.name + '/views/' + 'lookbook.hbs';

            for ( var state in manifest.states ) {
                app.page(template, manifest.states[state]);
            }
        }));
});

app.task('default', function() {
    return app.toStream('pages')
        .pipe(app.renderFile())
        .pipe(app.dest('site'));
});

module.exports = app;
