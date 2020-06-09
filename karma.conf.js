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
      logLevel: 0,// default: 1
      minify: false,
      sourceMaps: true,
      cacheDir: '.test-cache',
    },

    logLevel: karma.LOG_INFO,

    browsers: ['ChromeHeadless'],

    browserNoActivityTimeout: 30000,

    singleRun: true,
    autoWatch: false,
    middleware: ['custom'],
    plugins: [
      { 'middleware:custom': ['factory', CustomMiddlewareFactory] },
      'karma-*'
    ]

  });
};

/*
 There is an issue in karma-parcel that prevents sourcemaps from being served. This
 is the workaround to serve source-maps
 */
function CustomMiddlewareFactory(config) {
  return function(request, response, next) {
    const originalUrl = request.url;
    if (originalUrl.includes('index.js.map')) {
      request.url = '/.'+originalUrl.substring(1);
      console.log('augmented url:' +request.url);
    }
    next();
  };
}
