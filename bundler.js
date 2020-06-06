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
// Single entrypoint file location:
// OR: Multiple files with globbing (can also be .js)
// const entryFiles = './src/*.js';
// OR: Multiple files in an array
// const entryFiles = ['./src/index.html', './some/other/directory/scripts.js'];

// Bundler options
const base_options = {
  outDir: './dist', // The out directory to put the build files in, defaults to dist
  outFile: 'index.html', // The name of the outputFile
  watch: false, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  cache: true, // Enabled or disables caching, defaults to true
  contentHash: false, // Disable content hash from being included on the filename
  minify: false, // Minify files, enabled if process.env.NODE_ENV === 'production'
  target: 'browser', // Browser/node/electron, defaults to browser//
  logLevel: 4, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors, 0 = log nothing
  sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  detailedReport: true, // Prints a detailed report of the bundles, assets, filesizes and times, defaults to false, reports are only printed if watch is disabled
  autoInstall: true, // Enable or disable auto install of missing dependencies found during bundling
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
  const files = ['assets/styles/chor-js.css', 'node_modules/bpmn-js/dist/assets/diagram-js.css'];
  const cssOptions = { ...base_options, outFile: 'chor-js.css' };
  const bundler = new Bundler(files, cssOptions);

  // Run the bundler, this returns the main bundle
  // Use the events if you're using watch mode as this promise will only trigger once and not for every rebuild
  await bundler.bundle();
}

async function bundleAll() {
  for (const entrypoint of entryFiles) {
    const entryFile = Path.join(__dirname, entrypoint.path);
    console.log(entryFile);
    const devOptions = {
      ...base_options,
      outFile: entrypoint.name + '.development.js'
    };
    await bundleChorJs(entryFile, devOptions);
    console.log('Bundled: ' + devOptions.outFile);

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

bundleAll().then(value => console.log('Done: ' + value));
