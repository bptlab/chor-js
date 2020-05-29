// Karma configuration

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(karma) {
  console.log('hihihih')
  console.log(karma);
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
      detailedReport: true, // default: false,
      logLevel: 2,// default: 1
      minify: false,
      sourceMaps: true,
    },

    logLevel: karma.LOG_DEBUG,

    browsers: ['ChromeHeadless'],

    browserNoActivityTimeout: 300000,

    singleRun: false,
    autoWatch: false,
    middleware: ['custom'],
    plugins: [
      { 'middleware:custom': ['factory', CustomMiddlewareFactory] },
      'karma-*'
    ]

  });
};

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
