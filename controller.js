const Controller = (function () {
	"use strict";

	let rootView = null;
	let container = document.getElementById('views');

	let trigger = function(that, event) {
		if(rootView !== null) {
			rootView.trigger(that, event);
		}
	};

	const pathPrefix = 'http://127.0.0.1:8081/index.php?path=';
	const session = new Session(trigger);
	const logs = new Logs(trigger);

	/* session.fetch(); */

	let router = Backbone.Router.extend({
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
			goTo(new LoginView(document.getElementById('views'), logs, session));
		},

		logout: function() {
			goTo(new LogoutView(document.getElementById('views'), session).render());
		},

		list: function(location, page) {
			alert(location + ", " + page);
		},

		search: function(page) {
			alert("ricerca" + ", " + page);
		},

		add: function() {
			alert("a(s)dd");
		},

		execute: function(callback, args, name) {
			while(container.firstChild) {
				container.removeChild(container.firstChild);
			}
			if(callback) {
				// IT'S A FUNCTION. IT HAS AN APPLY METHOD. PHPSTORM PLS.
				//noinspection JSUnresolvedFunction
				callback.apply(this, args);
			}
		}
	});


	function goTo(mainView) {
		rootView = mainView;
	}

	const TIMEOUT = 30000;

	/**
	 * @param path URL parameter (e.g. /Login)
	 * @return XMLHttpRequest
	 */
	function POST(path) {
		let req = new XMLHttpRequest();
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
		let req = new XMLHttpRequest();
		req.open("GET", pathPrefix + path, true);
		req.setRequestHeader('Accept', 'application/json');
		req.withCredentials = true;
		req.timeout = TIMEOUT;
		return req;
	}

	/**
	 * Set some event handlers and wire them to two functions: onfail, onsuccess.
	 * 44 lines of code and just as much branches.
	 *
	 * Error codes:
	 * "network-error"
	 * "request-abort"
	 * "request-timeout"
	 * "json-parse-error" for error parsing JSON response ("message" contains the error message)
	 * "malformed-response" for malformed JSend response (missing keys)
	 * "response-error" JSend "error" ("message" contains the error message)
	 * "response-fail" JSend "fail" ("message" contains an hash of error messages or null)
	 * "http-code": got another code (contained in "message") instead of 200
	 *
	 * @param xhr XMLHttpRequest
	 * @param onfail function(code, message)
	 * @param onsuccess function(data), data is decoded JSON
	 */
	function reqSetHandler(xhr, onfail, onsuccess) {
		xhr.addEventListener("load", function() {
			if(xhr.status === 200) {
				let json;
				try {
					// TODO: argument object is not assignable to string?
					json = JSON.parse(xhr.response);
				} catch(err) {
					onfail("json-parse-error");
					return;
				}
				if(json.status === "success") {
					if(typeof json.data !== 'undefined') {
						onsuccess(json.data);
					} else {
						onfail("malformed-response");
					}
				} else if(json.status === "error") {
					if(typeof json.message === 'string') {
						onfail("response-error", json.message);
					} else {
						onfail("malformed-response");
					}
				} else if(json.status === "fail") {
					if(typeof json.data === 'undefined') {
						json.data = null;
					} else if(typeof json.data !== 'object') {
						onfail("malformed-response");
					}
					onfail("response-fail", json.data);
				}
			} else {
				onfail("http-code", xhr.status);
			}
		});
		xhr.addEventListener("error", function() {
			onfail("network-error");
		});
		xhr.addEventListener("abort", function() {
			onfail("request-abort");
		});
		xhr.addEventListener("timeout", function() {
			onfail("request-timeout");
		})
	}

	return {
		router: router,
		'POST': POST,
		'GET': GET,
		'reqSetHandler': reqSetHandler
	}
})();