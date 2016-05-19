'use strict';

var gulp            = require('gulp'),

    // SASS compiler
    sass            = require('gulp-sass'),

    // Used for reading tags in HTML and replacing them with gulp output
    processhtml     = require('gulp-processhtml'),

    // Used to automatically add in css browser prefixes so we can just write lovely CSS3 without worrying
    autoprefixer    = require('gulp-autoprefixer'),

    // Used to minify our compiled CSS
    mincss          = require('gulp-clean-css'),

    // Used to combine multiple files into one
    concat          = require('gulp-concat'),

    // Used for minifying javascript
    uglify          = require('gulp-uglify'),

    // Outputs the filesize of the gulp output
    size            = require('gulp-filesize'),

    // Used for linting javascript and checking for issues
    eslint          = require('gulp-eslint'),

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

    // Rim-raf based deletion tool for directory clearing
    del = require('del'),

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
    fs              = require('fs'),
    mkdirp          = require('mkdirp');


/**
 * Polyfill required so the autoprefixer doesn't break.
 */
require('es6-promise').polyfill();

function saveTemplate(template, name, data, state) {
    app.render(template, data, function(err, view) {

        mkdirp('./app/assets/views/', function (err) {
            if (err) return err;

            fs.writeFile('./app/assets/views/' + name + '.' + state + '.html', view.content);
        });
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
gulp.task('eslint', function() {

    return gulp.src('./src/scripts/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format());
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


// Remove pre-existing content from output and test folders
gulp.task('clean:dist', function() {
    del.sync([
        './app/'
    ]);
});

/**
 * This task is used to clean out the build directory so that
 * we can handle cache busting files.
 */
gulp.task('sass', function() {

    return gulp.src('./src/scss/compiled.scss')
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulpif(argv.production, mincss({compatibility: 'ie8'})))
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
gulp.task('build', ['eslint', 'test', 'clean:dist', 'sass', 'scripts']);


/**
 *  Watch our source files and trigger a build when they change
 */
gulp.task('watch', function() {
    gulp.watch([
        './src/scripts/**/*.js',
        './src/scss/**'
    ], ['build']);
});

// Default
gulp.task('default', [
    'build'
]);