var TemplateView = Backbone.NativeView.extend({
	'tagName': 'div',

	'id': function() {
		return this.viewName + '-view'
	},

	'templateId': function() {
		return this.viewName + '-template'
	},

	'render': function() {
		this.el.appendChild(document.getElementById(this.templateId()).content.cloneNode(true));
		this.updateRender();
		return this;
	},

	/**
	 * Override this!
	 */
	'updateRender': function() {

	}
});

var LoginView = TemplateView.extend({
	'viewName': 'login',

	'initialize': function() {
		this.listenTo(this.model, 'invalid', this.loginError);
	},

	'loginError': function(model, error) {
		alert(error)
	},

	'events': {
		'click #login-login': 'login'
	},

	'login': function(e) {
		e.preventDefault();
		this.model.set('username', document.getElementById('login-username').value);
		this.model.set('password', document.getElementById('login-password').value);
		this.model.login();
	}

});

var LogoutView = TemplateView.extend({
	'viewName': 'logout',

	'initialize': function() {
		this.listenTo(this.model, 'sync', this.whoami);
	},

	'updateRender': function() {
		this.whoami();
	},

	'whoami': function() {
		var area = this.el.querySelector('#logout-alreadyloggedmessage');
		var message;
		if(this.model.get('username') === null) {
			message = 'Not currently logged in';
		} else {
			message = 'Logged in as ' + this.model.get('username');
		}
		area.textContent = message;
	},

	'events': {
		'click #logout-logout': 'logout'
	},

	'logout': function(e) {
		e.preventDefault();
		this.model.logout();
	}
});