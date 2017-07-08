const Controller = (function () {
	"use strict";

	let routerInstance;

	//noinspection ES6ModulesDependencies
	let router = Backbone.Router.extend({
		routes: {
			"": "home",
			"login": "login",
			"logout": "logout",
			"add": "add",
			"search": "search",
			//"search/:page": "search",
		},

		home: function() {
			root.changeState('home');
		},

		login: function() {
			root.changeState('login');
		},

		logout: function() {
			root.changeState('logout');
		},

		search: function(page) {
			alert("ricerca" + ", " + page);
		},

		add: function() {
			root.changeState('addnew');
		}
	});

	routerInstance = new router();
	let root = new rootView(routerInstance);
	Backbone.history.start();
})();