const Controller = (function () {
	"use strict";

	let rootView = null;
	let container = document.getElementById('views');
	let routerInstance;

	let trigger = function(that, event) {
		if(that === session && event === 'success') {
			routerInstance.navigate("", {"trigger": true});
		}
		if(rootView !== null) {
			rootView.trigger(that, event);
		}
	};

	const pathPrefix = 'http://127.0.0.1:8081/index.php?path=';
	const session = new Session(trigger);
	const logs = new Logs(trigger);
	const translations = new Translations(trigger, 'it-IT'); // TODO: make variable. Which isn't possible because functions inside router won't see it.
	const transaction = new Transaction(trigger);

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
			rootView = new NavigationView(container, logs, session, transaction, translations);
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
			rootView = theview;

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
			rootView = new LoginView(container, logs, session);
		},

		logout: function() {
			rootView = new LogoutView(container, session);
		},

		list: function(location) {
			// TODO: tearing down the entire page and re-rendering an exact copy every time looks like a waste...
			rootView = new NavigationView(container, logs, session, transaction, translations);
			rootView.addLocation(/* TODO: path or what? */);
		},

		view: function(code) {
			rootView = new NavigationView(container, logs, session, transaction, translations);
		},

		search: function(page) {
			alert("ricerca" + ", " + page);
		},

		add: function() {
			rootView = new LocationView(document.createElement("div"), ['Polito', 'Chernobyl', 'ArmadioL'], translations);
			container.appendChild(rootView.el);
		},

		'execute': function(callback, args /*, name*/) {
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

	routerInstance = new router();
	Backbone.history.start();

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