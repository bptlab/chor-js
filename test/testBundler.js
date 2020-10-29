const Bundler = require('parcel-bundler');
const Path = require('path');


// Bundler options, some of theme are set do default values just to be sure and more verbose
const base_options = {
  hmr: true, // reload browser on change
  outDir: Path.join(__dirname, '.test-bin'), // The out directory to put the build files in, defaults to dist
  cacheDir:  Path.join(__dirname, '.test-cache'),
  watch: true, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  cache: true, // Enabled or disables caching.
  contentHash: false, // Disable content hash from being included on the filename
  minify: false, // Minify files, enabled if process.env.NODE_ENV === 'production'
  target: 'browser', // Browser/node/electron, defaults to browser//
  logLevel: 2, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors, 0 = log nothing
  sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  detailedReport: true, // Prints a detailed report of the bundles, assets, filesizes and times, defaults to false, reports are only printed if watch is disabled
  autoInstall: false, // Enable or disable auto install of missing dependencies found during bundling
};

async function bundleChorJSTests() {
  // Initializes a bundler using the entrypoint location and options provided
  const entryFile = Path.join(__dirname, './test.html');
  const bundler = new Bundler(entryFile, base_options);

  // Run the bundler, this returns the main bundle
  const port = 2222;
  await bundler.serve(port);
  console.log('Serving tests on http://localhost:' + port);
}

bundleChorJSTests().then();
