module.exports = function(grunt) {
	"use strict";

	let concatThese = [
			"js/framework.js",
			"js/XHR.js",
			"js/log.js",
			"js/search.js",
			"js/item.js",
			"js/itemupdate.js",
			"js/session.js",
			"js/stateholder.js",
			"js/translations.js",
			"js/transaction.js",
			"js/views/browserView.js",
			"js/views/computerView.js",
			"js/views/rootView.js",
			"js/views/loginView.js",
			"js/views/logoutView.js",
			"js/views/logsView.js",
			"js/views/navigationView.js",
			"js/views/textView.js",
			"js/views/transactionView.js",
			"js/views/featureView.js",
			"js/views/itemView.js",
			"js/views/itemLocationView.js",
			"js/views/searchView.js"
			];

	let watchThese = concatThese.slice();
	watchThese.push('Gruntfile.js');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				separator: ';',
				sourceMap: true,
				sourceMapStyle: 'inline',
			},
			all: {
				src: concatThese,
				dest: 'dist/all.js',
			},
		},

		watch: {
			js: {
				files: watchThese,
				tasks: ['concat'],
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat']);
};
