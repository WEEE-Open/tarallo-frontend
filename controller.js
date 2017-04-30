var Controller = (function () {
	"use strict";

	var pathPrefix = 'http://127.0.0.1:8081/index.php?path=';
	var session = new Session();
	/* session.fetch(); */
	var container = document.getElementById('views');
	var currentPage = null;

	var router = Backbone.Router.extend({
		routes: {
			"": "home",
			"login": "login",
			"logout": "logout",
			"test": "test",
			"add": "add",
			"search": "search",
			"search/:page": "search",
			"location/:location": "list",
			"location/:location/:page": "list"
		},

		home: function() {
			alert("FUNZIONA.");
		},

		test: function() {
			alert('Pagina "test"');
		},

		login: function() {
			goTo(new LoginView({"model": session}).render());
		},

		logout: function() {
			goTo(new LogoutView({"model": session}).render());
		},

		list: function(location, page) {
			alert(location + ", " + page);
		},

		search: function(page) {
			alert("ricerca" + ", " + page);
		},

		add: function() {
			alert("a(s)dd");
		}

	});

	function goTo(mainView) {
		if(currentPage !== null) {
			currentPage.remove();
		}
		currentPage = mainView;
		container.appendChild(mainView.el);
	}

	/**
	 * @param path URL parameter (e.g. /Login)
	 * @return XMLHttpRequest
	 */
	function POST(path) {
		var req = new XMLHttpRequest();
		req.open("POST", pathPrefix + path, true);
		req.setRequestHeader('Accept', 'application/json');
		req.setRequestHeader('Content-Type', 'application/json');
		req.withCredentials = true;
		return req;
	}

	/**
	 * @param path URL parameter (e.g. /Login)
	 * @return XMLHttpRequest
	 */
	function GET(path) {
		var req = new XMLHttpRequest();
		req.open("GET", pathPrefix + path, true);
		req.setRequestHeader('Accept', 'application/json');
		req.withCredentials = true;
		return req;
	}

	return {
		router: router,
		'POST': POST,
		'GET': GET
	}
})();