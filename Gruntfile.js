module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var path = require('path');

  /**
   * Resolve external project resource as file path
   */
  function resolvePath(project, file) {
    return path.join(path.dirname(require.resolve(project)), file);
  }

  grunt.initConfig({
    browserify: {
      options: {
        browserifyOptions: {
          debug: true
        },
        transform: [
          [ 'stringify', {
            extensions: [ '.bpmn' ]
          } ],
          [ 'babelify', {
            global: true
          } ]
        ]
      },
      watch: {
        options: {
          watch: true
        },
        files: {
          'dist/app.js': [ 'app/app.js' ]
        }
      },
      app: {
        files: {
          'dist/app.js': [ 'app/app.js' ]
        }
      }
    },
    copy: {
      diagram_js: {
        files: [
          {
            src: resolvePath('diagram-js', 'assets/diagram-js.css'),
            dest: 'dist/css/diagram-js.css'
          }
        ]
      },
      bpmn_js: {
        files: [
          {
            expand: true,
            cwd: resolvePath('bpmn-js', 'dist'),
            src: ['**/*.*', '!**/*.js'],
            dest: 'dist/vendor/bpmn-js'
          }
        ]
      },
      font: {
        files: [
          {
            expand: true,
            cwd: 'font/include',
            src: ['**/*.*', '!**/*.json'],
            dest: 'dist/font'
          }
        ]
      },
      app: {
        files: [
          {
            expand: true,
            cwd: 'app/',
            src: ['**/*.*', '!**/*.js'],
            dest: 'dist'
          }
        ]
      }
    },
    less: {
      options: {
        dumpLineNumbers: 'comments',
        paths: [
          'node_modules'
        ]
      },
      styles: {
        files: {
          'dist/css/app.css': 'styles/app.less'
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },

      samples: {
        files: [ 'app/**/*.*' ],
        tasks: [ 'copy:app' ]
      },

      less: {
        files: [
          'styles/**/*.less'
        ],
        tasks: [
          'less'
        ]
      },
    },

    connect: {
      livereload: {
        options: {
          port: 9013,
          livereload: true,
          hostname: 'localhost',
          open: true,
          base: [
            'dist'
          ]
        }
      }
    }
  });

  // tasks

  grunt.registerTask('build', [ 'copy', 'less', 'browserify:app' ]);

  grunt.registerTask('auto-build', [
    'copy',
    'less',
    'browserify:watch',
    'connect:livereload',
    'watch'
  ]);

  grunt.registerTask('default', [ 'build' ]);
};
