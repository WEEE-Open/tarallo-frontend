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
					"js/views/browserView.js",
					"js/views/rootView.js",
					"js/views/loginView.js",
					"js/views/logoutView.js",
					"js/views/logsView.js",
					"js/views/navigationView.js",
					"js/views/textView.js",
					"js/views/transactionView.js",
					"js/views/itemView.js",
					"js/views/itemLocationView.js"
				],
				dest: 'dist/all.js',
			},
		},

		watch: {
			js: {
				files: ['js/**/*.js'],
				tasks: ['concat'],
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat']);
};
