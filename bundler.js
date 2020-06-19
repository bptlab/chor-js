const Bundler = require('parcel-bundler');
const Path = require('path');

const entryFiles = [
  {
    name: 'chor-js-modeler',
    path: './lib/Modeler.js'
  }, {
    name: 'chor-js-navigated-viewer',
    path: './lib/NavigatedViewer.js'
  }, {
    name: 'chor-js-viewer',
    path: './lib/Viewer.js'
  }];

// Bundler options, some of theme are set do default values just to be sure and more verbose
const base_options = {
  hmr: false, // Disable hot module reload. it is not needed here.
  outDir: './dist', // The out directory to put the build files in, defaults to dist
  watch: false, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  cache: true, // Enabled or disables caching.
  contentHash: false, // Disable content hash from being included on the filename
  minify: false, // Minify files, enabled if process.env.NODE_ENV === 'production'
  target: 'browser', // Browser/node/electron, defaults to browser//
  logLevel: 2, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors, 0 = log nothing
  sourceMaps: false, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  detailedReport: true, // Prints a detailed report of the bundles, assets, filesizes and times, defaults to false, reports are only printed if watch is disabled
  autoInstall: true, // Enable or disable auto install of missing dependencies found during bundling
  global: 'ChorJS', // exposes the modules under this name
  publicUrl: './' // for relative paths in css and potentially source-maps if activated
};

async function bundleChorJs(entryFile, options) {
  // Initializes a bundler using the entrypoint location and options provided
  const bundler = new Bundler(entryFile, options);

  // Run the bundler, this returns the main bundle
  // Use the events if you're using watch mode as this promise will only trigger once and not for every rebuild
  await bundler.bundle();
}

async function bundleCSS() {
  // Initializes a bundler using the entrypoint location and options provided
  const file = 'assets/styles/chor-js.css';
  const cssOptions = {
    ...base_options,
    outFile: 'chor-js.css',
    outDir: './dist/assets',
  };
  const bundler = new Bundler(file, cssOptions);

  await bundler.bundle();
}

async function bundleAll() {
  for (const entrypoint of entryFiles) {

    const entryFile = Path.join(__dirname, entrypoint.path);
    console.log('Bundling development version of: ' + entryFile);
    const devOptions = {
      ...base_options,
      outFile: entrypoint.name + '.development.js'
    };
    await bundleChorJs(entryFile, devOptions);
    console.log('Bundled: ' + devOptions.outFile);

    console.log('Bundling minified version of: ' + entryFile);
    const minOptions = {
      ...base_options,
      outFile: entrypoint.name + '.min.js',
      minify: true
    };
    await bundleChorJs(entryFile, minOptions);
    console.log('Bundled: ' + minOptions.outFile);
  }
  await bundleCSS();
}

bundleAll().then(_ => console.log('Done bundling!'));
