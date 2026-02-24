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
const semver = require("semver");

function bundle() {
  return gulp
    .src(
      [
        "**/*",
        "!node_modules/**",
        "!.git/**",
        "!.gitignore",
        "!dist/**",
        "!src/**",
        "!*.zip",
        "!**/.DS_Store",
        "!**/Thumbs.db",
        "!gulpfile.js",
        "!package.json",
        "!package-lock.json",
        "!.prettierrc*",
        "!.eslintrc*",
        "!webpack.config.*",
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

function bumpVersion(cb) {
  const pkgPath = path.join(__dirname, "package.json");
  const readmePath = path.join(__dirname, "readme.txt");
  const pluginPath = path.join(__dirname, "kreebi-forms.php");

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const oldVersion = pkg.version;
  const newVersion = semver.inc(oldVersion, "patch");
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  let readme = fs.readFileSync(readmePath, "utf8");
  readme = readme.replace(/Stable tag: .*/, `Stable tag: ${newVersion}`);
  fs.writeFileSync(readmePath, readme);

  let plugin = fs.readFileSync(pluginPath, "utf8");
  plugin = plugin.replace(/(Version:\s*)([\d\.]+)/, `$1${newVersion}`);
  fs.writeFileSync(pluginPath, plugin);

  console.log(`Bumped version from ${oldVersion} to ${newVersion}`);
  cb();
}

exports.bump = bumpVersion;

exports.clean = clean;
exports.bundle = bundle;
exports.default = gulp.series(clean, bundle);
