var Controller = (function () {
	"use strict";

	var controller = document.getElementById('controller');
	var loginPage = document.getElementById('login-page');
	var asd = document.getElementById('asd');
	var router = Backbone.Router.extend({
		routes: {
			"": "home",
			"login": "login",
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
			render(asd)
		},

		login: function() {
			render(loginPage);
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

	function render(div) {
		var child;
		while(child = controller.firstChild) {
			controller.removeChild(child);
		}
		do {
			controller.appendChild(div.firstChild);
		} while(div.firstChild);
	}

	return {
		router: router
	}
})();