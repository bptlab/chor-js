// Karma configuration

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(karma) {
  karma.set({
    basePath: '',

    frameworks: ['mocha', 'chai', 'parcel'],

    files: [
      { pattern: 'test/spec/**/*Spec.js', included: false, served: false, watched: false, nocache: false },
    ],
    preprocessors: {
      '**/*.bpmn': ['parcel'],
      '**/*Spec.js': ['parcel'],

    },
    parcelConfig: {
      detailedReport: false, // default: false,
      logLevel: 2,// default: 1
      minify: false,
      sourceMaps: true,
      cacheDir: '.karma-parcel-cache',
      hmr: false,
      watch: false
    },

    logLevel: karma.LOG_INFO,

    browsers: ['ChromeHeadless'],

    client: {
      mocha: {
        ui: 'bdd',
      }
    },

    browserNoActivityTimeout: 30000,

    singleRun: true,
    autoWatch: false,

  });
};

