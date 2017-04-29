var Controller = (function () {
	"use strict";

	var loginPage = document.getElementById('login-page');
	var asd = document.getElementById('asd');
	var session;
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
			alert('Pagina "test"');
		},

		login: function() {
			new LoginView().render();
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

	return {
		router: router
	}
})();