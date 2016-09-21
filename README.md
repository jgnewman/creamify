# creamify

Cream & Sugar Transformer for use with browserify

> Adapted from babelify (https://github.com/babel/babelify)

## Usage

Here is a gulp example. You'll get the picture :)

```javascript
var gulp       = require('gulp');
var browserify = require('browserify');
var creamify   = require('creamify');
var source     = require('vinyl-source-stream'); // <- standard re-gulpification

gulp.task('cns', function () {
  return browserify({entries: ['/path/to/entry.cns'], extensions: ['.cns']})
         .transform(creamify)
         .bundle()
         .pipe(source('app.js'))
         .pipe(gulp.dest('path/to/output_directory'));
});
```
