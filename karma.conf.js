// Karma configuration

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(karma) {
  karma.set({
    basePath: '',

    frameworks: ['mocha', 'chai', 'parcel'],

    files: [
      'test/spec/**/*Spec.js'
    ],
    preprocessors: {
      '**/*.bpmn': ['parcel'],
      '**/*Spec.js': ['parcel']
    },
    parcelConfig: {
      cacheDir: "/path/to/cache", // default: "./.cache"
      detailedReport: true, // default: false,
      logLevel: 2 // default: 1
    },

    logLevel: karma.LOG_DEBUG,

    browsers: ['ChromeHeadless'],

    browserNoActivityTimeout: 300000,

    singleRun: true,
    autoWatch: false,

  });
};
