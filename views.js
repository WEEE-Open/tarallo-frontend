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
		var line = document.createElement("div");
		line.classList.add("new");
		switch(model.get("severity")) {
			default:
			case model.Info:
				line.classList.add('info');
				break;
			case model.Warning:
				line.classList.add('warning');
				break;
			case model.Error:
				line.classList.add('error');
				break;
		}
		var date = model.get("timedate");
		var dateContainer = document.createElement("span");
		dateContainer.classList.add("date");
		dateContainer.textContent = date.getHours() + ":" + date.getMinutes();

		var messageContainer = document.createElement('span');
		messageContainer.classList.add("message");
		messageContainer.textContent = model.get("message");

		line.appendChild(dateContainer);
		line.appendChild(messageContainer);

		this.el.appendChild(line);

		window.setTimeout(function() {
			line.classList.remove("new");
			console.log("TIMEOUT!");
		}, 12000);
	},

	render: function() {
		//this.readTemplate();
		return this;
	}
});