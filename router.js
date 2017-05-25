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
			//"list/:location": "list",
			//"view/:code": "view"
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

		list: function(location) {
			// TODO: tearing down the entire page and re-rendering an exact copy every time looks like a waste...
			root = new NavigationView(container, logs, session, transaction, translations);
			root.addLocation(/* TODO: path or what? */);
		},

		view: function(code) {
			root = new NavigationView(container, logs, session, transaction, translations);
		},

		search: function(page) {
			alert("ricerca" + ", " + page);
		},

		add: function() {
			root = new LocationView(document.createElement("div"), ['Polito', 'Chernobyl', 'ArmadioL'], translations);
			container.appendChild(root.el);
		}
	});

	routerInstance = new router();
	let root = new rootView(routerInstance);
	Backbone.history.start();
})();