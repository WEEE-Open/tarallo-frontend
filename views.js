/**
 * Do not use directly
 */
var TemplateView = Backbone.NativeView.extend({
	tagName: 'div',

	id: function() {
		return this.viewName + '-view'
	},

	templateId: function() {
		return this.viewName + '-template'
	},

	readTemplate: function() {
		this.el.appendChild(document.getElementById(this.templateId()).content.cloneNode(true));
	}

	// Basic correct implementation of render():
	// 'render': function() {
	//    this.readTemplate();
	//    return this;
	// },
});

/**
 * Pass:
 * - "model": Session model
 * - "logs": Logs collection
 */
var LoginView = TemplateView.extend({
	viewName: 'login',

	logView: null,

	'initialize': function(options) {
		this.logs = options.logs;
		this.listenTo(this.model, 'invalid', this.loginError);
	},

	render: function() {
		this.logView = new LogsView({"model": this.logs}).render();
		this.readTemplate();
		this.el.appendChild(this.logView.el);
		return this;
	},

	remove: function() {
		this.logView.remove();
		//console.log("removed logView!");
		Backbone.View.prototype.remove.apply(this);
	},

	loginError: function(model, error) {
		this.get("logs").log(error);
	},

	events: {
		'click #login-login': 'login'
	},

	login: function(e) {
		e.preventDefault();
		var thisView = this;
		this.model.set('username', this.el.querySelector('#login-username').value);
		this.model.set('password', this.el.querySelector('#login-password').value);
		this.model.login({"success": function(model, data, options) {
			thisView.model.trigger("login-successful", model, data, options);
		}, "error": function(model, data, options) {
			thisView.model.trigger("login-failed", model, data, options);
		}, "complete": function() {
			console.log("complete!");
		}});
	}

});

/**
 * Pass:
 * - "model": Session model
 */
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

/**
 * Pass:
 * - "model": Logs collection
 */
var LogsView = TemplateView.extend({
	viewName: 'logs',

	'initialize': function() {
		this.listenTo(this.model, 'add', this.added);
	},

	added: function(model /*, collection, options*/) {
		// TODO: add this thing to the DOM. FINALLY. HERE. NOW. IMMEDIATELY.
		alert(model.get('timedate') + " " + model.get('message'));
	},

	render: function() {
		//this.readTemplate();
		return this;
	}
});