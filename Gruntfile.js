
module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				separator: ';',
				sourceMap: true,
			},
			all: {
				src: [
					"frameworkobject.js",
					"frameworkview.js",
					"XHR.js",
					"log.js",
					"item.js",
					"session.js",
					"stateholder.js",
					"translations.js",
					"transaction.js",
					"views.js",
					"itemview.js"
				],
				dest: 'dist/all.js',
			},
		},

		watch: {
			js: {
				files: ['*.js', '!all.js'],
				tasks: ['concat'],
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat']);
};

