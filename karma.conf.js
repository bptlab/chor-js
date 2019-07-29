// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox', 'IE', 'PhantomJS' ]
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(karma) {
  karma.set({

    frameworks: [ 'browserify', 'mocha', 'chai' ],

    files: [
      'test/spec/**/*Spec.js'
    ],


    preprocessors: {
      'test/spec/**/*Spec.js': [ 'browserify' ],

    },

    browsers: ['ChromeHeadless'],

    browserNoActivityTimeout: 30000,

    singleRun: true,
    autoWatch: false,

    // browserify configuration
    browserify: {
      debug: true,
      transform: [
        [ 'stringify', {
          global: true,
          extensions: [
            '.bpmn',
            '.css'
          ]
        } ],
        [ 'babelify', {
          global: true
        } ]
      ]
    }
  });
};
