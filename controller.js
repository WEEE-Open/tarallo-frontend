var Controller = (function () {
	"use strict";

	var controller = document.getElementById('controller');
	var loginPage = document.getElementById('login-page');
	var router = Backbone.Router.extend({
		routes: {
			"": "home",
			"login": "login",
			"test": "test",
			"location/:location": "search",
			"location/:location/:page": "search"
		},

		home: function() {
			alert("asd");
		},

		test: function() {
			alert("TEST. FUNZIONA.");
		},

		login: function() {
			do {
				controller.appendChild(loginPage.firstChild);
			} while (loginPage.firstChild);
		},

		search: function(location, page) {
			alert(location + ", " + page);
		}

	});

	return {
		router: router
	}
})();