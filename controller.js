var Controller = (function () {
	"use strict";

	var loginPage = document.getElementById('login-page');
	var asd = document.getElementById('asd');
	var session = new Session();
	var container = document.getElementById('views');
	var currentPage = null;

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
			goTo(null);
			alert('Pagina "test"');
		},

		login: function() {
			append(new LoginView({"model": session}).render());
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

	function append(view) {
		goTo(view);
		container.appendChild(view.el);
	}

	function goTo(mainView) {
		if(currentPage !== null) {
			currentPage.remove();
			//while(oldContent = container.firstChild) {
			//	container.removeChild(oldContent);
			//}
		}
		currentPage = mainView;
	}

	return {
		router: router
	}
})();