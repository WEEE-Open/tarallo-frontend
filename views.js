var TemplateView = Backbone.NativeView.extend({
	childViews: [],
	tagName: 'div',

	id: function() {
		return this.viewName + '-view'
	},

	templateId: function() {
		return this.viewName + '-template'
	},

	readTemplate: function() {
		this.el.appendChild(document.getElementById(this.templateId()).content.cloneNode(true));
	},

	remove: function() {
		_.each(this.childViews, function(view) {
			console.log('Removing child view');
			view.remove();
		});
		Backbone.Model.prototype.remove.apply(this, arguments);
	}

	// Basic correct implementation of render():
	// 'render': function() {
	//    this.readTemplate();
	//    return this;
	// },
});

var LoginView = TemplateView.extend({
	viewName: 'login',

	'initialize': function() {
		this.listenTo(this.model, 'invalid', this.loginError);
	},

	loginError: function(model, error) {
		alert(error)
	},

	events: {
		'click #login-login': 'login'
	},

	login: function(e) {
		e.preventDefault();
		this.model.set('username', this.el.querySelector('#login-username').value);
		this.model.set('password', this.el.querySelector('#login-password').value);
		this.model.login();
	}

});

var LogoutView = TemplateView.extend({
	viewName: 'logout',

	'initialize': function() {
		this.listenTo(this.model, 'sync', this.whoami);
	},

	render: function() {
		this.readTemplate();
		this.whoami();
		return this;
	},

	whoami: function() {
		var area = this.el.querySelector('#logout-alreadyloggedmessage');
		var message;
		if(this.model.get('username') === null) {
			message = 'Not currently logged in';
		} else {
			message = 'Logged in as ' + this.model.get('username');
		}
		area.textContent = message;
	},

	events: {
		'click #logout-logout': 'logout'
	},

	logout: function(e) {
		e.preventDefault();
		this.model.logout();
	}
});

var LogsView = TemplateView.extend({
	viewName: 'logs',

	'initialize': function() {
		this.listenTo(this.model, 'add', this.added);
	},

	added: function(model /*, collection, options*/) {
		alert(model.get('datetime') + " " + model.get('message'));
	},

	render: function() {
		this.readTemplate();
		return this;
	}
});