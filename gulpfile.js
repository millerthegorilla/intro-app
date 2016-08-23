var gulp            = require("gulp");
var browserSync     = require('browser-sync').create();
var postcss         = require('gulp-postcss');
var sorting         = require('postcss-sorting');
var sourcemaps      = require('gulp-sourcemaps');
var autoprefixer    = require('autoprefixer');
var sass            = require('gulp-sass');
var cleanCSS        = require('gulp-clean-css');
var rename          = require('gulp-rename');
var notify          = require('gulp-notify');
var htmllint        = require('gulp-htmllint');
var gutil           = require('gulp-util');
var htmltidy        = require('gulp-htmltidy');

gulp.task('html-tidy', function() {
    return gulp.src(['./src/*.html','./src/**/*.html'])
        .pipe(htmltidy({doctype: 'html5',
                         hideComments: true,
                         indent: true}))
        .pipe(htmllint({}, htmllintReporter))
        .pipe(gulp.dest('./build'));
});

gulp.task('browser-sync', function() {
    browserSync.init({
        open: 'external',
        host: 'intro-app.dev',
        proxy: 'intro-app.dev',
        port: 8080
    });
    gulp.watch(["./build/*.html","./build/**/*.html"]).on('change', browserSync.reload);
    //gulp.watch("./build/css/*.css").on('change', browserSync.reload);
});
 
gulp.task('sass', function () {
  return gulp.src('./src/sass/sass.scss')
    .pipe(sass().on('error', errorHandler))
    .pipe(rename ("stylesheet.css"))
    .pipe(gulp.dest('./src/tmp/'));
});
 
gulp.task('sortcss', function (cb) {
    return gulp.src(['./src/tmp/*.css','./src/tmp/**/*.css'])
        .pipe( postcss([sorting({})]))
        .pipe(gulp.dest('./src/tmp'));
        cb(err);
});

gulp.task('autoprefixer', ['sortcss'], function (cb) {
    return gulp.src(['./src/tmp/*.css','./src/tmp/**/*.css'])
        .pipe(sourcemaps.init())
        .pipe(postcss([ autoprefixer({ browsers: ['last 2 versions'] }) ]))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/css'));
        cb(err);
});

gulp.task('css-minify', ['autoprefixer'], function(cb) {
    return gulp.src(['./build/css/*.css','!./build/css/normalize*','!./build/css/*.min.css'])
        .pipe(cleanCSS({debug: true}, function(details) {
            console.log('original : ' + details.name + ': ' + details.stats.originalSize);
            console.log('minified : ' + details.name + ': ' + details.stats.minifiedSize);
        }))
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest('./build/css'))
        .pipe(browserSync.stream({once: true}));
        cb(err);
});

gulp.task('css-rename', ['css-minify'], function() {
    return gulp.src(['./build/css/*.css','!./build/css/*.min.css'])
        
        .pipe(gulp.dest('./build/css'))
        .pipe(browserSync.stream({once: true}));
});

/* // swap with browser-sync for apache proxy
gulp.task('browser-sync', function() {
    browserSync.init({
        proxy: "yourlocal.dev"
    });
});*/

gulp.task("default", function() {
    console.log("Default task");
});

gulp.task("scripts", function() {
    console.log("Scripts task");
});

gulp.task("build", ["scripts", "browser-sync"], function() {
    gulp.watch(["./src/*.html", "./src/**/*.html"], ['html-tidy']);
    gulp.watch('./src/sass/*.scss', ['sass']);
    var watcher = gulp.watch(['./src/tmp/*.css','./src/tmp/**/*.css'], ['css-minify']);
    watcher.on('change', function(event) {  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});

// Handle errors
function errorHandler (error) {
    report(error);
    this.emit('end');
}

function report(error)
{
  notify().write(error);
  console.log(error.toString());
}

function htmllintReporter(filepath, issues) {
    if (issues.length > 0) {
        issues.forEach(function (issue) {
            switch(issue.code)
            {
                case 'E036':
                case 'E011':
                case 'E001':
                case 'E002':
                    break;
                default:
                    report("error in html, check console!")
                    console.log( filepath + " : \n" + 
                          issue.line + " : " +
                          issue.column + " : " +
                          issue.code + " : \n" + 
                          issue.msg );
            }
        })
    }
    //this.emit("end");
}
