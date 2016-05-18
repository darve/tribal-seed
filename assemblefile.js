

'use strict';


var assemble = require('assemble'),
    app = assemble(),

    gulp = require('gulp'),
    tap = require('gulp-tap'),
    rename = require('gulp-rename'),
    Q = require('q');

function getManifests() {

    var deferred = new Q.defer();

    gulp.src('./src/modules/**/manifest.js')
        .pipe(tap(function(file, t) {
            var manifest = require(file.path),
                template = './src/modules/' + manifest.name + '/views/' + 'lookbook.hbs';

            for ( var state in manifest.states ) {
                app.page(template, manifest.states[state]);
            }
        }))
        .pipe(tap(function() {
            deferred.resolve();
        }));

    return deferred.promise;

}

app.task('lad', function() {

    getManifests().then(function(){
        return app.toStream('pages')
            .pipe(app.renderFile())
            .pipe(tap(function(file, t){
                console.log(file);
            }))
            .pipe(app.dest('site'));
    });
});

module.exports = app;
