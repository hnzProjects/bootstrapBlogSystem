/* jshint node: true, strict: true */
'use strict';

/*=====================================
=        Default Configuration        =
=====================================*/

// Please use config.js to override these selectively:

var config = {
  appName : 'ZJSY_WeChat',
  dest: 'www',
  cordova: true,
  host : "",
  sass: {
    src: [
      './src/sass/app.scss', './src/sass/responsive.scss',
    ],
    paths: [
      './src/sass' //'./bower_components'
    ],
    libcss:{
        src :[]//'./bower_components/mobile-angular-ui/dist/css/*.min.css'
    }
  },
    less: {
        src: [
            './bower_components/mobile-angular-ui/src/less/mobile-angular-ui-base.less',
            './bower_components/Swiper/src/less/swiper.less'
        ],
        paths: [
            './bower_components'
        ],

    },
  vendor: {
    js: [
      './bower_components/jquery/dist/jquery.min.js',
      './bower_components/Swiper/dist/js/swiper.min.js',
      './bower_components/lodash/lodash.min.js',
      './bower_components/angular/angular.js',
      //'./bower_components/angular-route/angular-route.js',
      './bower_components/angular-ui-router/release/angular-ui-router.js',
      './bower_components/mobile-angular-ui/dist/js/mobile-angular-ui.js',
        './bower_components/ng-file-upload/ng-file-upload.min.js',
        './bower_components/ng-file-upload/ng-file-upload-shim.min.js',
        './bower_components/ui-bootstrap-datepicker-build/ui-bootstrap-custom-1.0.0.js',
        './bower_components/ui-bootstrap-datepicker-build/ui-bootstrap-custom-tpls-1.0.0.js',
        './bower_components/ui-bootstrap-datepicker-build/angular-locale_zh-cn.js',
      //'./bower_components/angular-bootstrap/ui-bootstrap.js',
      //'./bower_components/angular-bootstrap/ui-bootstrap-tpls.js'
    ],

    css: {
      prepend: [],
      append: [],
    },

    fonts: [
      './bower_components/font-awesome/fonts/fontawesome-webfont.*'
    ]
  },

  server: {
    host: '0.0.0.0',
    port: '8000'
  },

  weinre: {
    httpPort:     8001,
    boundHost:    'localhost',
    verbose:      false,
    debug:        false,
    readTimeout:  5,
    deathTimeout: 15
  },

  round : Math.floor(Math.random()*10000)
};

if (require('fs').existsSync('./config.js')) {
  var configFn = require('./config');
  configFn(config);
}

console.log('process.argv[3]',process.argv)
switch (process.argv[4]){
    case '49' : config.host = "http://192.168.6.49";break;
    case 'pro' : config.host = "http://demo1.yzlpie.com";break;
    case undefined :config.host = "http://192.168.6.49";break;
    default : config.host = process.argv[4];break;
}

/*-----  End of Configuration  ------*/


/*========================================
=            Requiring stuffs            =
========================================*/

var gulp           = require('gulp'),
    seq            = require('run-sequence'),
    connect        = require('gulp-connect'),
    less           = require('gulp-less'),
    uglify         = require('gulp-uglify'),
    sourcemaps     = require('gulp-sourcemaps'),
    cssmin         = require('gulp-cssmin'),
    order          = require('gulp-order'),
    concat         = require('gulp-concat'),
    ignore         = require('gulp-ignore'),
    rimraf         = require('gulp-rimraf'),
    templateCache  = require('gulp-angular-templatecache'),
    mobilizer      = require('gulp-mobilizer'),
    ngAnnotate     = require('gulp-ng-annotate'),
    replace        = require('gulp-replace'),
    ngFilesort     = require('gulp-angular-filesort'),
    streamqueue    = require('streamqueue'),
    rename         = require('gulp-rename');
import path from 'path';
import babel from 'gulp-babel';
import sass from 'gulp-sass';



/*================================================
=            Report Errors to Console            =
================================================*/

gulp.on('error', (e) => {
    console.log(e.stack);
  //throw(e);
});


/*=========================================
=            Clean dest folder            =
=========================================*/

gulp.task('clean', function (cb) {
  return gulp.src([
        path.join(config.dest, 'index.html'),
        path.join(config.dest, 'images'),
        path.join(config.dest, 'css'),
        path.join(config.dest, 'js'),
        path.join(config.dest, 'fonts')
      ], { read: false })
     .pipe(rimraf());
});


/*==========================================
=            Start a web server            =
==========================================*/

gulp.task('connect', function() {
  if (typeof config.server === 'object') {
    connect.server({
      root: config.dest,
      host: config.server.host,
      port: config.server.port,
      livereload: true
    });
  } else {
    //throw new Error('Connect is not configured');
  }
});


/*==============================================================
=            Setup live reloading on source changes            =
==============================================================*/

gulp.task('livereload', function () {
  gulp.src(path.join(config.dest, '*.html'))
    .pipe(connect.reload());
});


/*=====================================
=            Minify images            =
=====================================*/

gulp.task('images', function () {
  return gulp.src(['src/images/**/*','src/images/*'])
        .pipe(gulp.dest(path.join(config.dest, 'images')));
});


/*==================================
=            Copy fonts            =
==================================*/

gulp.task('fonts', function() {
  return gulp.src(config.vendor.fonts)
  .pipe(gulp.dest(path.join(config.dest, 'fonts')));
});


/*=================================================
=            Copy html files to dest              =
=================================================*/

gulp.task('html', function() {
  var inject = [];
  if (typeof config.weinre === 'object') {
    inject.push('<script src="http://'+config.weinre.boundHost+':'+config.weinre.httpPort+'/target/target-script-min.js"></script>');
  }
  if (config.cordova) {
    inject.push('<script src="cordova.js"></script>');
  }
  gulp.src(['src/html/**/*.html'])
  .pipe(replace('<!-- inject:js -->', inject.join('\n    ')))
  .pipe(replace('<!-- app.js -->', '<script src="js/app.'+ config.round + '.min.js"></script>'))
  .pipe(gulp.dest(config.dest));
});
//
//gulp.task('injectJs', function() {
//    gulp.src(['src/html/**/*.html'])
//        .pipe(replace('<!-- app.js -->', '<script src="js/app.'+ config.round + '.min.js"></script>'))
//        .pipe(gulp.dest(config.dest));
//});


/*======================================================================
=            Compile, minify, mobilize sass                            =
======================================================================*/

gulp.task('sass', function () {
    return gulp.src(config.sass.src).pipe(
    sass.sync({
        outputStyle: 'expanded',
        precision: 10,
        includePaths: ['.']
    }))
    .pipe(mobilizer('app.css', {
      'app.css': {
        hover: 'exclude',
        screens: ['0px']
      },
      'hover.css': {
        hover: 'only',
        screens: ['0px']
      }
    }))
    .pipe(cssmin())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(path.join(config.dest, 'css')));
});

gulp.task('less', function () {
    return gulp.src(config.less.src).pipe(less({
        paths: config.less.paths.map(function(p){
            return path.resolve(__dirname, p);
        })
    })).pipe(concat('lib.css'))
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(path.join(config.dest, 'css')));
});


gulp.task('libcss', function () {
    return gulp.src(config.sass.libcss.src)
        .pipe(concat('lib.css'))
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(path.join(config.dest, 'css')));
});


/*====================================================================
=            Compile and minify js generating source maps            =
====================================================================*/
// - Orders ng deps automatically
// - Precompile templates to ng templateCache

gulp.task('js', function() {
    !streamqueue({objectMode: true},
        gulp.src('./src/js/app.js').pipe(babel())
            .pipe(replace('<replaceSec>', config.host)).pipe(ngFilesort()),
        gulp.src('./src/js/*/*.js').pipe(babel()).pipe(ngFilesort()),
        gulp.src(['src/templates/**/*.html']).pipe(templateCache({module: config.appName}))
    )

    .pipe(sourcemaps.init())
    .pipe(concat('app' + '.' + config.round + '.js'))
    .pipe(ngAnnotate())
    //.pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join(config.dest, 'js')));
});

gulp.task('libjs', function() {
    streamqueue({ objectMode: true },
        gulp.src(config.vendor.js)
    )
        .pipe(sourcemaps.init())
        .pipe(concat('lib.js'))
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.join(config.dest, 'js')));
});


/*===================================================================
=            Watch for source changes and rebuild/reload            =
===================================================================*/

gulp.task('watch', function () {
  if (typeof config.server === 'object') {
    gulp.watch([config.dest + '/**/*'],['livereload']);
  }
  gulp.watch(['./src/html/**/*'], ['html']);
  gulp.watch(['./src/sass/**/*'], ['sass']);
  gulp.watch(['./bower_components/**/*.less'], ['less']);
  gulp.watch(['./src/js/**/*', './src/templates/**/*', config.vendor.js], ['js']);
  gulp.watch([config.vendor.js], ['libjs']);
  gulp.watch(['./src/images/**/*'], ['images']);
});


/*===================================================
=            Starts a Weinre Server                 =
===================================================*/

gulp.task('weinre', function() {
  if (typeof config.weinre === 'object') {
    var weinre = require('./node_modules/weinre/lib/weinre');
    weinre.run(config.weinre);
  } else {
    //throw new Error('Weinre is not configured');
  }
});


/*======================================
=            Build Sequence            =
======================================*/

gulp.task('build', function(done) {
  var tasks = ['html', 'fonts', 'images', 'sass', 'libcss','less','libjs','js'];
  seq('clean', tasks, done);
});


/*====================================
=            Default Task            =
====================================*/

gulp.task('default', function(done){
  var tasks = [];

  if (typeof config.weinre === 'object') {
    tasks.push('weinre');
  }

  if (typeof config.server === 'object') {
    tasks.push('connect');
  }

  tasks.push('watch');

  seq('build', tasks, done);
});
