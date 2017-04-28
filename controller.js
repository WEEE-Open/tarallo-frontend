var Controller = (function () {
	"use strict";

	var controller = document.getElementById('controller');
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

	function render(template) {
		var oldContent;
		while(oldContent = controller.firstChild) {
			controller.removeChild(oldContent);
		}
		controller.appendChild(template.content.cloneNode(true));
	}

	controller.addEventListener('click', function(event) {
		switch(event.target.id) {
			case 'login-login':
				console.log('Event handling, yay!');
				session = new Session({username: document.getElementById('login-username').value, password: document.getElementById('login-password').value});
				session.on('invalid', function(model, error) {alert('VALIDAZIONE FALLITA. PUNTO. ' + error)}); // TODO: use views?
				session.login();
				break;
			default:
				return;
		}
		event.preventDefault(); // default returns, so the events keeps bubbling
	});

	return {
		router: router
	}
})();