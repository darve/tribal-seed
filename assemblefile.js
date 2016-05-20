
'use strict';

var
    // Used for generating static site content with handlebars
    assemble        = require('assemble'),

    // An instance of assemble
    app             = assemble(),

    // Le file system
    path            = require('path'),
    fs              = require('fs'),
    mkdirp          = require('mkdirp');


app.create('modules', {
    viewType: 'partial',
    renameKey: function(key, view) {
        var v = view ? view.basename : path.basename(key);
        v = v.split('/').pop().replace('.hbs', '');
        console.log(v);
        return v;
    }
});

app.task('load', function(cb){
    app.layouts('./src/views/layouts/**/*.hbs');
    app.modules('./compiled/views/**/*.hbs');
    cb();
});


app.task('default', ['load'], function() {
    return app.toStream('layouts')
        .pipe(app.renderFile())
        .pipe(app.dest('./lads'));

    console.log('lads');
});

module.exports = app;
