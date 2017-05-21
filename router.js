const Controller = (function () {
	"use strict";

	let routerInstance;

	//noinspection ES6ModulesDependencies
	let router = Backbone.Router.extend({
		routes: {
			"": "home",
			"login": "login",
			"logout": "logout",
			"test": "test",
			"add": "add",
			"search": "search",
			"search/:page": "search",
			"list/:location": "list",
			"view/:code": "view"
		},

		home: function() {
			root.changeState('home');
		},

		test: function() {
			let item = new Item(trigger);
			item.setDefaultFeature("frequency-hz", 12);
			item.setDefaultFeature("brand", "Intelllll");
			item.setDefaultFeature("name", "Atom-ic crap N123");
			item.setFeature("works", "yes");
			item.setCode("CPU-666");
			let itemContainer = ItemView.newContainer();
			let theview = new ItemView(container, item, translations);
			root = theview;

			let button = document.createElement("button");
			container.appendChild(itemContainer).appendChild(button);
			button.textContent = "(s)congela";
			button.onclick = function() {
				if(theview.frozen) {
					theview.unfreeze();
				} else {
					theview.freeze();
				}
			};
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