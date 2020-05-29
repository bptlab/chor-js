// Karma configuration

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(karma) {
  karma.set({
    basePath: '',

    frameworks: ['mocha', 'chai', 'parcel'],

    files: [
      {pattern: '.karma-parcel/index.js.map', included: true, served: true, watched: false, nocache: false},

      {pattern: 'test/spec/**/*Spec.js', included: false, served: false, watched: false, nocache: false},

      //'test/spec/**/*Spec.js',
//      {pattern: '/karma-parcel/*', included: false, served: true, watched: false, nocache: true}
      //{pattern: '/karma-parcel/index.js.map', included: false, served: true, watched: false, nocache: true},

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

    browsers: ['Chrome'],

    browserNoActivityTimeout: 300000,

    singleRun: true,
    autoWatch: false,
    middleware: ['custom'],
    plugins: [
      {'middleware:custom': ['factory', CustomMiddlewareFactory]},
      'karma-*'
    ]

  });
};

function CustomMiddlewareFactory (config) {
  return function (request, response, next) {
    console.log('hihihi' + request.url);
    const originalUrl = request.url;
    if(originalUrl.includes('index.js.map')){
      request.url = '/.'+originalUrl.substring(1);
      console.log('includese');
      console.log( request.url)
    }
    next();
  }
}
