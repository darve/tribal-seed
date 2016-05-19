'use strict';

var gulp            = require('gulp'),

    // SASS compiler
    sass            = require('gulp-sass'),

    // Used for reading tags in HTML and replacing them with gulp output
    processhtml     = require('gulp-processhtml'),

    // Used to automatically add in css browser prefixes so we can just write lovely CSS3 without worrying
    autoprefixer    = require('gulp-autoprefixer'),

    // Used to minify our compiled CSS
    mincss          = require('gulp-minify-css'),

    // Used to combine multiple files into one
    concat          = require('gulp-concat'),

    // Used for minifying javascript
    uglify          = require('gulp-uglify'),

    // Outputs the filesize of the gulp output
    size            = require('gulp-filesize'),

    // Used for linting javascript and checking for issues
    jshint          = require('gulp-jshint'),

    // Used for modular javascript development
    browserify      = require('browserify'),

    // Used by babelify
    source          = require('vinyl-source-stream'),
    buffer          = require('vinyl-buffer'),

    // Used for generating sourcemaps of minified javascript files.
    sourcemaps      = require('gulp-sourcemaps'),

    // Gulp utility
    gutil           = require('gulp-util'),

    // Test-runner
    tape            = require('gulp-tape'),

    // Reporter used by the test runner
    tapcolor        = require('tap-colorize'),

    // Collates all of the filenames that have been iterated through
    tap             = require('gulp-tap'),

    // Used for resolve file and folder paths
    path            = require('path'),

    // Used for injecting content into files
    inject          = require('gulp-inject'),

    // These are used to perform tasks differently depending on the args
    argv            = require('yargs').argv,
    gulpif          = require('gulp-if'),

    // Used to rename the outputted file(s)
    rename          = require('gulp-rename'),

    // Used for generating static site content with handlebars
    assemble        = require('assemble'),

    // An instance of assemble
    app             = assemble(),

    // Le file system
    fs              = require('fs');


/**
 * Polyfill required so the autoprefixer doesn't break.
 */
require('es6-promise').polyfill();

function saveTemplate(template, name, data, state) {
    app.render(template, data, function(err, view){
        fs.writeFile('./app/assets/views/' + name + '.' + state + '.html', view.content);
    });
}

gulp.task('views', function() {
    gulp.src('./src/modules/**/manifest.js')
        .pipe(tap(function(file, t){
            var manifest = require(file.path),
                template = './src/modules/' + manifest.name + '/views/' + manifest.name + '.hbs';

            for ( var state in manifest.states ) {
                saveTemplate(template, manifest.name, manifest.states[state], state);
            }
        }));
});

/**
 * Bundle and minify all of the source script files
 */
gulp.task('scripts', function () {

    return browserify({ entries: './src/scripts/app.js', debug: true })
        .bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(gulpif(argv.production, uglify()))
            .pipe(gulpif(argv.production, rename({suffix: '.min'})))
            .pipe(gulpif(argv.production, sourcemaps.write('./')))
            .on('error', gutil.log)
            .pipe(gulp.dest('./app/assets/scripts'));
});


/**
 * This task is used to verify that I am not taking crazy pills
 * and that my javascript is in fact perfectly formed.
 */
gulp.task('jshint', function() {

    return gulp.src('./src/scripts/**/*.js')
        .pipe(jshint(require('./config/jshint.js')))
        .pipe(jshint.reporter('default'))
});

function sasstransform(fp) {
    var m = fp.match(/(\/)_{1,2}.*.scss/g)[0],
        r = m.replace('_', '').replace('.scss', '');
    return '@import "../..' + fp.replace(m, r) + '";';
}

gulp.task('injectsass', function() {

    gulp.src('./src/scss/app.scss')
        .pipe(inject(gulp.src([ './src/modules/**/scss/*.scss', '!./src/modules/**/scss/*.narrow.scss', '!./src/modules/**/scss/*.wide.scss']), {
            starttag: '// mobile:{{ext}}',
            endtag: '// endinject',
            transform: sasstransform
        }))
        .pipe(inject(gulp.src('./src/modules/**/scss/*.narrow.scss'), {
            starttag: '// narrow:{{ext}}',
            endtag: '// endinject',
            transform: sasstransform
        }))
        .pipe(inject(gulp.src('./src/modules/**/scss/*.wide.scss'), {
            starttag: '// wide:{{ext}}',
            endtag: '// endinject',
            transform: sasstransform
        }))
        .pipe(rename('compiled.scss'))
        .pipe(gulp.dest('./src/scss'));
});

/**
 * This task compiles, nay transforms my sass into a hard
 * shiny peg of truth (CSS). Compiles scss files for dev.
 * Minifies if this task is run with the productiona argument.
 */
gulp.task('sass', function() {

    return gulp.src('./src/scss/compiled.scss')
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulpif(argv.production, mincss()))
        .pipe(gulpif(argv.production, rename({suffix: '.min'})))
        .pipe(rename('app.css'))
        .pipe(gulp.dest('./app/assets/css'));
});


/**
 * Run the TAPE tests
 */
gulp.task('test', function() {

    return gulp.src('./tests/*.js')
        .pipe(tape({
            reporter: tapcolor()
        }));
});


/**
 * This task is used to lint and minify everything and stick
 * it in a folder called 'prod'.
 */
gulp.task('build', ['jshint', 'test', 'sass', 'scripts']);


/**
 *  Watch our source files and trigger a build when they change
 */
gulp.task('watch', function() {

    gulp.watch([
        './src/scripts/**/*.js',
        './src/scss/**'
    ], ['build']);
});
