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
					"js/frameworkobject.js",
					"js/frameworkview.js",
					"js/XHR.js",
					"js/log.js",
					"js/item.js",
					"js/session.js",
					"js/stateholder.js",
					"js/translations.js",
					"js/transaction.js",
					"js/views.js",
					"js/itemview.js"
				],
				dest: 'dist/all.js',
			},
		},

		watch: {
			js: {
				files: ['js/*.js'],
				tasks: ['concat'],
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat']);
};
