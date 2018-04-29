const gulp = require('gulp')
const fs = require('fs')
const os = require('os')
const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const gulpWebpack = require('webpack-stream')
const gulpUtil = require('gulp-util')
const gls = require('gulp-live-server')
const seq = require('run-sequence')
const Events = require('events')
const cp = require('child_process')
const UglifyJS = require('uglifyjs-webpack-plugin')
const replace = require('gulp-replace')

const events = new Events()

const uglyOpts = () => ({
  sourceMap: true,
  uglifyOptions: {
    mangle: true,
    compress: {
      sequences: true,
      dead_code: true,
      conditionals: true,
      booleans: true,
      unused: true,
      if_return: true,
      join_vars: true,
      drop_console: false,
    },
    output: {
      comments: false
    }
  }
})

gulp.task('build', [ 'build-webapp', 'build-server' ])

gulp.task('build-webapp', cb => seq('build-webapp-bundle', 'build-webapp-package', cb))

gulp.task('build-webapp-package', () => {
  const script = fs.readFileSync('dist/webapp/index.js')
  return gulp.src('src/webapp/*.html')
    .pipe(replace('%', script))
    .pipe(gulp.dest('dist/webapp/'))
})

gulp.task('build-webapp-bundle', cb =>
  webpack({
      mode: "development",
    entry: [ './src/webapp/index.js' ],
    output: {
      path: path.join(__dirname, '/dist/webapp/'),
      filename: 'index.js'
    },
    module: {
      rules: [{
        test: /\.css/, use: [ 'style-loader', 'css-loader']
      }]
    },
    plugins: [
      new UglifyJS(uglyOpts()),
    ]
  }, (err, stats) => {
    if (err) throw new gulpUtil.PluginError('webpack', err)
    gulpUtil.log(stats.toString('minimal'))
    cb()
  }))

gulp.task('build-server', cb =>
  webpack({
      mode: "development",
    entry: [ './src/server/index.js' ],
    output: {
      path: path.join(__dirname, '/dist/server/'),
      filename: 'index.js'
    },
    target: 'node',
    externals: [ nodeExternals() ],
    plugins: [
      new webpack.IgnorePlugin(/vertx/),
      new UglifyJS(uglyOpts()),
    ]
  }, (err, stats) => {
    if (err) throw new gulpUtil.PluginError('webpack', err)
    gulpUtil.log(stats.toString('minimal'))
    events.emit('built-server')
    cb()
  }))

gulp.task('watch', ['watch-project', 'watch-webapp', 'watch-server' ])

gulp.task('watch-project', () =>
  gulp.watch(['package.json'], ['build']))

gulp.task('watch-webapp', () =>
  gulp.watch(['src/*.js','src/webapp/**/*'], ['build-webapp']))

gulp.task('watch-server', () =>
  gulp.watch(['src/*.js','src/server/**/*'], ['build-server']))

gulp.task('serve', () => {
  try {
    const server = gls('dist/server/index.js', { port: 3009 }, 4009)
    server.start()
    gulp.watch('dist/webapp/**/*', file =>
      server.notify.apply(server, [file]))
    gulp.watch('dist/server/**/*.js', () =>
      server.start.bind(server)())
  } catch (e) {
    server.stop()
    console.error(e)
  }
})

gulp.task('live-server', cb => seq('watch', 'serve', cb))

gulp.task('dev', cb => seq('env-dev', 'build', cb))
gulp.task('dev-server', cb => seq('dev', 'live-server', cb))
gulp.task('dev-shell', cb => seq('dev', 'live-shell', cb))
gulp.task('env-dev', cb => {
  process.env.NODE_ENV = 'development'
  cb()
})

gulp.task('prod', cb => seq('env-prod', 'build', cb))
gulp.task('prod-shell', cb => seq('prod', 'live-shell', cb))
gulp.task('env-prod', cb => {
  process.env.NODE_ENV = 'production'
  cb()
})

gulp.task('test', cb => seq('env-test', 'build', cb))
gulp.task('test-shell', cb => seq('test', 'live-shell', cb))
gulp.task('env-test', cb => {
  process.env.NODE_ENV = 'testing'
  cb()
})
