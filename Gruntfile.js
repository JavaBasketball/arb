var env = process.env.CI ? 'continuous' : 'unit';
var path = require('path');
var config = {
  src_path: 'src',
  build_path: 'build/app',
  components_path: 'build/bower_components',
  coverage_path:  'coverage',
  require: 'config/require.js',
  require_map: 'config/src.map.js'
};


module.exports = function (grunt) {
  // grunt plugins
  var mountFolder = function (connect, dir) {
    return connect.static(path.resolve(dir));
  };

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    config: config,

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      unit: {
      },
      continuous: {
        autoWatch: false,
        singleRun: true
      },
      coverage: {
        autoWatch: false,
        singleRun: true,
        reporters: ['progress', 'coverage'],
        preprocessors: {
          'src/scripts/**/*.js': ['coverage']
        },
        coverageReporter: {
          type: 'html',
          dir: 'coverage/'
        }
      },
    },

    watch: {
      build: {
        options: { livereload: true },
        files: ['<%= config.src_path %>/**/*'],
        tasks: ['build']
      },
      source: {
        options: { livereload: true },
        files: ['<%= config.src_path %>/**/*'],
        tasks: ['env-src']
      },
    },

    connect: {
      build: {
        options: {
          port: 9000,
          hostname: '0.0.0.0',
          livereload: true,
          middleware: function (connect) {
            return [mountFolder(connect, config.build_path)];
          }
        }
      },
      source: {
        options: {
          port: 9000,
          hostname: '0.0.0.0',
          livereload: true,
          middleware: function (connect) {
            return [mountFolder(connect, '.')];
          }
        }
      },
      coverage: {
        options: {
          port: 5555,
          // hostname: '0.0.0.0',
          keepalive: true,
          open: true,
          middleware: function (connect) {
            var dir = grunt.file.glob.sync(require('path').resolve(config.coverage_path + '/PhantomJS*'))[0];
            return [mountFolder(connect, dir)];
          }
        }
      },
    },

    clean: {
      build: ['<%= config.build_path %>/**/*', '!<%= config.build_path %>/<%= config.require %>'],
      deps: ['<%= config.components_path %>'],
      coverage: ['<%= config.coverage_path %>'],
      require: ['<%= config.src_path %>/<%= config.require %>'],
      require_map: ['<%= config.src_path %>/<%= config.require_map %>'],
      base: ['base']
    },

    copy: {
      build: {
        files: [{ src: ['**'], dest: '<%= config.build_path %>', cwd: '<%= config.src_path %>', expand: true }]
      },
      require: {
        files: [{ src: '<%= config.require %>', dest: '<%= config.src_path %>', cwd: './', expand: true }]
      },
      base: {
        files: [{ src: '<%= config.src_path %>/**', dest: 'base', cwd: './', expand: true }]        
      },
      cov: {},
      deps: {
        files: [
          { expand: true,
            cwd: 'bower_components',
            src: [
              'jquery/jquery*.{js,map}',
              'angular*/*.js',
              '!angular-ui-router/**',
              'requirejs/require.js',
              'respond/*.js',
            ],
            dest: '<%= config.components_path %>' },
          { expand: true, cwd: 'bower_components/angular-ui-router', src: ['release/*.js'], dest: '<%= config.components_path %>/angular-ui-router' },
          { expand: true, cwd: 'bower_components/html5shiv', src: ['dist/**'], dest: '<%= config.components_path %>/html5shiv' },
          { expand: true, cwd: 'bower_components/bootstrap', src: ['dist/**'], dest: '<%= config.components_path %>/bootstrap' },
        ]
      }
    },

    bower: {
      source: {
        rjsConfig: '<%= config.src_path %>/<%= config.require %>'
      }
    },

    require_map: {
      source: {
        options: {
          fileName: '<%= config.src_path %>/<%= config.require_map %>'
        },
        files: [{
          src: ['scripts/**/*.js', '!scripts/app.js'],
          cwd: '<%= config.src_path %>'
        }]
      }, 
      base: {
        options: {
          fileName: '<%= config.src_path %>/<%= config.require_map %>'
        },
        files: [{
          src: ['base/src/scripts/**/*.js', '!base/src/scripts/app.js', '!base/src/scripts/src.map.js'],
          cwd: '.'
        }]
      }    
    }
  });

  grunt.registerTask('deps',           'install bower components and copy to build',            ['bower_install', 'clean:deps', 'copy:deps']);
  grunt.registerTask('source',         'copy source to build',                                  ['clean:build', 'copy:build']);
  grunt.registerTask('require',        'copy require to build and resolve deps',                ['clean:require', 'copy:require', 'bower', 'clean:require_map', 'require_map:source']);

  grunt.registerTask('build',          'make build using: [deps|source|require]',               ['require', 'source', 'deps']);
  grunt.registerTask('server_build',   'start server on build',                                 ['build', 'connect:build', 'watch:build']);

  grunt.registerTask('server',         'start server',                                          ['bower_install', 'require', 'connect:source', 'watch:source']);

  grunt.registerTask('release',        '',                                                      []);
  grunt.registerTask('server_release', '',                                                      []);

  grunt.registerTask('test',           'make test',                                             ['build', 'copy:base', 'require_map:base', 'clean:base', 'karma:' + env]);

  grunt.registerTask('test_build',     'not implemented',                                       []);
  grunt.registerTask('test_release',   'not implemented',                                       []);

  grunt.registerTask('coverage',       'make coverage',                                         ['install', 'karma:coverage', 'connect:coverage']);
  grunt.registerTask('default',        '',                                                      ['test']);
};
