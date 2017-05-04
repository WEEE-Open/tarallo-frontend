var Controller = (function () {
	"use strict";

	var pathPrefix = 'http://127.0.0.1:8081/index.php?path=';
	var session = new Session();
	var logs = new Logs();
	session.on("login-successful", function(model, data, options) {
		logs.log("Login successful!");
		console.log(data);
	});
	session.on("login-failed", function(model, data, options) {
		var code = data;
		logs.log("Login failed: " + code);
		console.log("Login failed: " + code);
	});
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
			goTo(new LoginView({"model": session, "logs": logs}).render());
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

	var TIMEOUT = 30000;

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
		req.timeout = TIMEOUT;
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
		req.timeout = TIMEOUT;
		return req;
	}

	/**
	 * Set some event handlers and wire them to two functions: onfail, onsuccess.
	 *
	 * Error codes:
	 * -1 for network error
	 * -2 for abort
	 * -3 for timeout
	 * -4 for error parsing JSON response ("message" contains the error message)
	 * Anything else: HTTP status code (any code except 200 is considered an error)
	 *
	 * @param xhr XMLHttpRequest
	 * @param onfail function(code)
	 * @param onsuccess function(data), data is decoded JSON
	 */
	function reqSetHandler(xhr, onfail, onsuccess) {
		xhr.addEventListener("load", function() {
			if(xhr.status === 200) {
				var json;
				try {
					// TODO: argument object is not assignable to string?
					json = JSON.parse(xhr.response);
				} catch(err) {
					onfail(-4);
					return;
				}
				onsuccess(json);
			} else {
				onfail(xhr.status);
			}
		});
		xhr.addEventListener("error", function() {
			onfail(-1);
		});
		xhr.addEventListener("abort", function() {
			onfail(-2);
		});
		xhr.addEventListener("timeout", function() {
			onfail(-3);
		})
	}

	return {
		router: router,
		'POST': POST,
		'GET': GET,
		'reqSetHandler': reqSetHandler
	}
})();