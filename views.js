class LoginView extends FrameworkView {
	/**
	 * Shows a login form and log messages.
	 *
	 * @param {HTMLElement} element an HTML element
	 * @param {Logs} logs
	 * @param {Session} session
	 * @see FrameworkView.constructor
	 */
	constructor(element, logs, session) {
		super(element);
		this.logsView = new LogsView(this.el.querySelector('.logs'), logs);
		this.session = session;
		this.el.querySelector('#login-login').addEventListener('click', this.login.bind(this));
	}

	login(e) {
		e.preventDefault();
		this.session.tryLogin(this.el.querySelector('#login-username').value, this.el.querySelector('#login-password').value);
	}

	trigger(that, event) {
		this.logsView.trigger(that, event);
	}
}


class LogoutView extends FrameworkView {
	/**
	 * Shows which user is currently logged in, and a logout button.
	 *
	 * @param {HTMLElement} element
	 * @param {Session} session
	 * @see FrameworkView.constructor
	 */
	constructor(element, session) {
		super(element);
		this.session = session;
		this.el.querySelector('#logout-logout').addEventListener('click', this.logout.bind(this));
		this.messageArea = this.el.querySelector('#logout-alreadyloggedmessage');
		this.whoami();
	}

	whoami() {
		let message;
		if(typeof this.session.username === 'string') {
			message = 'Logged in as ' + this.session.username;
		} else {
			message = 'Not currently logged in';
		}
		this.messageArea.textContent = message;
	}

	logout(e) {
		e.preventDefault();
		this.session.logout();
	}

	trigger(that, event) {
		if(that === this.session && event === 'logout') {
			this.whoami();
		}
	}
}

class LogsView extends FrameworkView {
	/**
	 * Shows log messages.
	 *
	 * @param {HTMLElement} element
	 * @param {Logs} logs
	 */
	constructor(element, logs) {
		super(element);
		this.logs = logs;
		// TODO: pass locale via parameters when actually needed
		// (locale could be a FrameworkObject, so changes would be propagated via events)
		//noinspection JSUnresolvedFunction,JSUnresolvedVariable
		this.dateFormatter = new Intl.DateTimeFormat('it-IT', {hour: 'numeric', minute: 'numeric', second: 'numeric'});
	}

	pushed() {
		let newLog = this.logs.getLast();
		let line = document.createElement("div");
		line.classList.add("new");
		switch(newLog.severity) {
			case newLog.constructor.Success:
				line.classList.add('success');
				break;
			default:
			case newLog.constructor.Info:
				line.classList.add('info');
				break;
			case newLog.constructor.Warning:
				line.classList.add('warning');
				break;
			case newLog.constructor.Error:
				line.classList.add('error');
				break;
		}
		let dateContainer = document.createElement("span");
		dateContainer.classList.add("date");
		//noinspection JSUnresolvedFunction
		dateContainer.textContent = this.dateFormatter.format(newLog.timedate);

		let messageContainer = document.createElement('span');
		messageContainer.classList.add("message");
		messageContainer.textContent = newLog.message;

		line.appendChild(dateContainer);
		line.appendChild(messageContainer);

		this.el.appendChild(line);

		window.setTimeout(function() {
			line.classList.remove("new");
		}, 12000);
	}

	shifted() {
		if(this.el.firstElementChild) {
			this.el.removeChild(this.el.firstElementChild);
		}
	}

	cleared() {
		while(this.el.firstElementChild) {
			this.el.removeChild(this.el.firstElementChild);
		}
	}

	trigger(that, event) {
		if(that === this.logs) {
			if(event === 'push') {
				this.pushed();
			} else if(event === 'shift') {
				this.shifted();
			} else if(event === 'clear') {
				this.cleared();
			}
		}
	}
}

/*
 * Pass:
 * - "model": an Item
 */
// var ItemView = TemplateView.extend({
// 	viewName: 'item',
//
// 	id: function() {
// 		return this.viewName + '-view-' + this.model.id
// 	},
//
// 	'initialize': function() {
// 		this.listenTo(this.model, 'change:features', this.showFeatures);
// 		this.listenTo(this.model, 'change:code', this.showCode);
// 	},
//
// 	render: function() {
// 	    this.readTemplate();
// 	    this.el.classList.add("item");
// 	    this.showCode(this.model);
// 	    this.showFeatures(this.model);
// 	    return this;
// 	},
//
// 	// TODO: according to official documentation, this is the correct signature. Let's see if it's really this or something else completely random and undocumented.
// 	showFeatures: function(model /*, this, options*/) {
// 		var featuresContainer = this._getFeaturesContainer();
// 		var features = model.get("features");
// 		var newElement, nameElement, valueElement;
//
// 		var keys = Object.keys(features);
// 		for(var i = 0; i < keys.length; i++) {
// 			newElement = document.createElement("div");
// 			newElement.classList.add("feature");
// 			// TODO: autosuggest values
// 			nameElement = document.createElement("span");
// 			nameElement.classList.add("name");
// 			valueElement = document.createElement("span");
// 			valueElement.classList.add("value");
// 			newElement.appendChild(nameElement);
// 			newElement.appendChild(valueElement);
//
// 			nameElement.textContent = keys[i];
// 			valueElement.textContent = features(keys[i]);
// 			featuresContainer.appendChild(newElement);
// 		}
// 	},
//
// 	showCode: function(model /*, this, options*/) {
// 		var codeContainer = this._getCodeContainer();
// 		codeContainer.textContent(model.get("code"));
// 	},
//
// 	_getFeaturesContainer: function() {
// 		return this._getContainer("features");
// 	},
//
// 	_getCodeContainer: function() {
// 		return this._getContainer("code");
// 	},
//
// 	_getContainer: function(theClass) {
// 		for(var i = 0; i < this.el.children.length; i++) {
// 			if(this.el.children[i].className === theClass) {
// 				return this.el.children[i];
// 			}
// 		}
// 		return null;
// 	}
// });
