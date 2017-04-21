(function () {
	"use strict";

	var controller = document.getElementById('controller');
	var loginPage = document.getElementById('login-page');
	var router = Backbone.Router.extend({

		routes: {
			"": "home",
			"login": "login",
			"location/:location": "search",
			"location/:location/:page": "search"
		},

		home: function() {
			alert("asd");
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
})();