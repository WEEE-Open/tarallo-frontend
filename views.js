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

	dateFormatter: (function() {
		// wrapping in the "anonymous function calling itself" thing just to limit the scope of the "noinspection" commment,
		// since PHPStorm 2017 still hasn't heard of the Intl JS extension.
		//noinspection JSUnresolvedVariable,JSUnresolvedFunction
		return new Intl.DateTimeFormat('it-IT', {hour: 'numeric', minute: 'numeric', second: 'numeric'});
		// TODO: cram the language constant somewhere else (where? app.js and controller.js are loaded after this file...)
	})(),

	'initialize': function() {
		this.listenTo(this.model, 'add', this.added);
	},

	added: function(model /*, collection, options*/) {
		var line = document.createElement("div");
		line.classList.add("new");
		switch(model.get("severity")) {
			case model.get("Success"):
				line.classList.add('success');
				break;
			default:
			case model.get("Info"):
				line.classList.add('info');
				break;
			case model.get("Warning"):
				line.classList.add('warning');
				break;
			case model.get("Error"):
				line.classList.add('error');
				break;
		}
		var date = model.get("timedate");
		var dateContainer = document.createElement("span");
		dateContainer.classList.add("date");
		//noinspection JSUnresolvedFunction
		dateContainer.textContent = this.dateFormatter.format(date);

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

/**
 * Pass:
 * - "model": an Item
 */
var ItemView = TemplateView.extend({
	viewName: 'item',

	id: function() {
		return this.viewName + '-view-' + this.model.id
	},

	'initialize': function() {
		this.listenTo(this.model, 'change:features', this.showFeatures);
		this.listenTo(this.model, 'change:code', this.showCode);
	},

	render: function() {
	    this.readTemplate();
	    this.el.classList.add("item");
	    this.showCode(this.model);
	    this.showFeatures(this.model);
	    return this;
	},

	// TODO: according to official documentation, this is the correct signature. Let's see if it's really this or something else completely random and undocumented.
	showFeatures: function(model /*, this, options*/) {
		var featuresContainer = this._getFeaturesContainer();
		var features = model.get("features");
		var newElement, nameElement, valueElement;

		var keys = Object.keys(features);
		for(var i = 0; i < keys.length; i++) {
			newElement = document.createElement("div");
			newElement.classList.add("feature");
			// TODO: autosuggest values
			nameElement = document.createElement("span");
			nameElement.classList.add("name");
			valueElement = document.createElement("span");
			valueElement.classList.add("value");
			newElement.appendChild(nameElement);
			newElement.appendChild(valueElement);

			nameElement.textContent = keys[i];
			valueElement.textContent = features(keys[i]);
			featuresContainer.appendChild(newElement);
		}
	},

	showCode: function(model /*, this, options*/) {
		var codeContainer = this._getCodeContainer();
		codeContainer.textContent(model.get("code"));
	},

	_getFeaturesContainer: function() {
		return this._getContainer("features");
	},

	_getCodeContainer: function() {
		return this._getContainer("code");
	},

	_getContainer: function(theClass) {
		for(var i = 0; i < this.el.children.length; i++) {
			if(this.el.children[i].className === theClass) {
				return this.el.children[i];
			}
		}
		return null;
	}
});
