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
		'click #login-login': 'send'
	},

	'send': function(e) {
		e.preventDefault();
		console.log('Event handling, yay!');
		this.model.set('username', document.getElementById('login-username').value);
		this.model.set('password', document.getElementById('login-password').value);
		this.model.login();
	}
});