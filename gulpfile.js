const gulp = require("gulp");
const zipLib = require("gulp-zip");
const zip =
  typeof zipLib === "function"
    ? zipLib
    : zipLib && zipLib.default
      ? zipLib.default
      : null;
const fs = require("fs");
const path = require("path");

function bundle() {
  return gulp
    .src(
      [
        "**/*",
        "!node_modules/**",
        "!.git/**",
        "!dist/**",
        "!*.zip",
        "!**/.DS_Store",
        "!**/Thumbs.db",
        "!gulpfile.js",
        "!package.json",
        "!package-lock.json",
      ],
      {
        dot: true,
      },
    )
    .pipe(zip("kreebi-forms.zip"))
    .pipe(gulp.dest("dist"));
}

function clean(cb) {
  const dist = path.join(__dirname, "dist");
  try {
    if (fs.existsSync(dist)) {
      fs.rmSync(dist, { recursive: true, force: true });
    }
  } catch (e) {
    // ignore errors during clean
  }
  cb();
}

exports.clean = clean;
exports.bundle = bundle;
exports.default = gulp.series(clean, bundle);
