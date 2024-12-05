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

    // Collates all of the filenames that have been iterated through
    tap             = require('gulp-tap'),

    // Rim-raf based deletion tool for directory clearing
    del             = require('del'),

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
    mkdirp          = require('mkdirp'),

    shell           = require('gulp-shell'),

    modules         = [];


/**
 * Polyfill required so the autoprefixer doesn't break.
 */
require('es6-promise').polyfill();


/**
 * Synchronous helper function for saving out static HTML templates
 * @param  {String} template Path to the handlebars template file
 * @param  {String} name     Name of the component
 * @param  {Object} data     JSON object to be merged into the handlebars template
 * @param  {String} state    Name of the template state we are generating
 */
function saveTemplate(template, name, data, state) {
    app.render(template, data, function(err, view) {
        if (err) return err;
        fs.writeFile('./compiled/views/' + name + '.' + state + '.hbs', view.content);
    });
}


/**
 * Iterate through all of our components and generate static HTML templates for
 * each of the states described in the components manifest.js
 */
gulp.task('views', function() {

    mkdirp('./compiled/views/');

    return gulp.src('./src/modules/**/manifest.js')
        .pipe(tap(function(file, t){
            var manifest = require(file.path),
                template = './src/modules/' + manifest.name + '/views/' + manifest.name + '.hbs';

            for ( var state in manifest.states ) {
                saveTemplate(template, manifest.name, manifest.states[state], state);
            }
        }));
});


/**
 * Add links to all of the components as partials in our generated preview page
 */
gulp.task('partials', ['views'], function() {
    return gulp.src('./src/views/layouts/preview.hbs')
        .pipe(inject(gulp.src('./compiled/views/**/*.hbs'), {
            starttag: '<!-- modules -->',
            endtag: '<!-- endinject -->',
            transform: function(fp) {
                var m = fp.split('/').pop().replace('.hbs', '');
                return '{{> component mod="' + m + '" }}';
            }
        }))
        .pipe(rename('compiled.hbs'))
        .pipe(gulp.dest('./src/views/layouts'));
});

gulp.task('assemble', ['partials'], shell.task(['assemble']));

/**
 * Used to inject all of the javascript modules into the browserify entrypoint
 */
gulp.task('injectjs', function() {
    return gulp.src('./src/scripts/app.js')
        .pipe(inject(gulp.src('./src/modules/**/scripts/*.module.js'), {
            starttag: '// modules:{{ext}}',
            endtag: '// endinject',
            transform: function(fp) {
                var m = fp.split('/').pop().replace('.module.js', '');
                return 'Modules.' + m + ' = require("../..' + fp + '");';
            }
        }))
        .pipe(rename('compiled.js'))
        .pipe(gulp.dest('./src/scripts'));
});


/**
 * Bundle and minify all of the source script files
 */
gulp.task('scripts', ['injectjs'], function () {

    return browserify({ entries: './src/scripts/compiled.js', debug: true })
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
 * Checks the javascript for errors and conformity to our guidelines
 */
gulp.task('eslint', function() {

    return gulp.src([
            './src/scripts/**/*.js',
            '!./src/scripts/**/compiled.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format());
});


/**
 * Returns a transformed @import statement to be injected into an scss file
 * @param  {String} fp Path to the scss file
 * @return {String}    A transformed path string e.g. '@import "../../src/modules/lookbook/scss/lookbook";'
 */
function sasstransform(fp) {
    var m = fp.match(/(\/)_{1,2}.*.scss/g)[0],
        r = m.replace('_', '').replace('.scss', '');
    return '@import "../..' + fp.replace(m, r) + '";';
}

/**
 * Iterates through all of our component SCSS files and injects them into
 * the relevant place in our main app.scss file
 */
gulp.task('injectsass', function() {
    return gulp.src('./src/scss/app.scss')
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
 * Compiles all of our SCSS files into a single CSS file
 */
gulp.task('sass', ['injectsass'], function() {

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
 * This task is used to clean out the build directory so that
 * we can handle cache busting files.
 */
gulp.task('clean:app', function() {
    del.sync([
        './app/', './compiled'
    ]);
});


/**
 * This task is used to lint and minify everything
 */
gulp.task('build', ['clean:app', 'sass', 'scripts', 'partials', 'eslint', 'assemble']);

/**
 *  Watch our source files and trigger a build when they change
 */
gulp.task('watch', function() {
    gulp.watch([
        './src/modules/**/scripts/*.js',
        './src/scripts/**/*.js',
        '!./src/scripts/**/compiled.js',
        './src/scss/**',
        '!./src/scss/compiled.scss'
    ], ['build']);
});


// Default
gulp.task('default', [
    'build'
]);
