var gulp = require('gulp'), nodemon = require('gulp-nodemon'), plumber = require('gulp-plumber'), livereload = require('gulp-livereload');
var Server = require('karma').Server;

gulp.task('develop', function() {
	livereload.listen();
	nodemon({
		script : 'bin/www',
		ext : 'js jade coffee',
		stdout : false
	}).on('readable', function() {
		this.stdout.on('data', function(chunk) {
			if (/^Express server listening on port/.test(chunk)) {
				livereload.changed(__dirname);
			}
		});
		this.stdout.pipe(process.stdout);
		this.stderr.pipe(process.stderr);
	});
});

gulp.task('default', ['develop']);

gulp.task('test', function(done) {
	new Server({
		configFile : __dirname + '/karma.conf.js',
		singleRun : true
	}, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd2', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});