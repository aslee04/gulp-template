let project_folder = require('path').basename(__dirname),
  source_folder = '#src',
  fs = require('fs')

let path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css',
    js: project_folder + '/js',
    fonts: project_folder + '/fonts/',
    images: project_folder + '/img/'
  },
  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/scss/main.scss',
    js: source_folder + '/js/main.js',
    fonts: source_folder + '/fonts/*.ttf',
    images: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}'
  },
  watch: {
    html: source_folder + '/**/*.html',
    css: source_folder + '/scss/**/*.scss',
    js: source_folder + '/js/**/*.js',
    images: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}'
  },
  clean: './' + project_folder + '/'
}

let {src, dest} = require('gulp'),
  gulp = require('gulp'),
  browsersync = require('browser-sync').create(),
  fileinclude = require('gulp-file-include'),
  scss = require('gulp-sass')(require('sass')),
  autoprefixer = require('gulp-autoprefixer'),
  group_media = require('gulp-group-css-media-queries'),
  cleancss = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify-es').default,
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  webphtml = require('gulp-webp-html'),
  webpcss = require('gulp-webp-css'),
  svgsprite = require('gulp-svg-sprite'),
  ttf2woff = require('gulp-ttf2woff'),
  ttf2woff2 = require('gulp-ttf2woff2'),
  fonter = require('gulp-fonter');

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: './' + project_folder + '/',
    },
    port: 3000,
    notify: false
  })
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    // .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

function watchFiles(params) {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.images], images)
}

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: 'expanded'
      })
    )
    .pipe(
      autoprefixer({
        overrideBrowserList: ['last 5 versions'],
        cascade: true
      })
    )
    /*.pipe(group_media())*/
    // .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(cleancss())
    .pipe(
      rename({
        extname: '.min.css'
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

gulp.task('svgSprite', function () {
  return gulp.src([source_folder + '/iconsprite/*.svg'])
    .pipe(svgsprite({
      mode: {
        stack: {
          sprite: '../icons/icons.svg',
          example: true
        }
      }
    }))
    .pipe(dest(path.build.images))

})

gulp.task('otf2ttf', function () {
  return src([source_folder + '/fonts/*.otf'])
    .pipe(fonter({
      formats: ['ttf']
    }))
    .pipe(dest(source_folder + '/fonts/'))
})

function fonts(params) {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(
      uglify()
    )
    .pipe(
      rename({
        extname: '.min.js'
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

function images() {
  return src(path.src.images)
    /*.pipe(
        webp({
            quality: 70
        })
    )*/
    .pipe(dest(path.build.images))
    .pipe(src(path.src.images))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        interlaced: true,
        optimizationLevel: 3
      })
    )
    .pipe(dest(path.build.images))
    .pipe(browsersync.stream())
}

function fontsStyle(params) {

  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss')
  if (file_content === '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (let i = 0; i < items.length; i++) {
          let fontname = items[i].split('.')
          fontname = fontname[0];
          if (c_fontname !== fontname) {
            fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb)
          }
          c_fontname = fontname
        }
      }
    })
  }
}

function cb() {}

let build = gulp.series(gulp.parallel(js, images, fontsStyle, fonts, css, html))
let watch = gulp.parallel(build, watchFiles, browserSync)

exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.images = images
exports.js = js
exports.css = css
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch
