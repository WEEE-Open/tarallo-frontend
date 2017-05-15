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
		this.logs = logs;
		this.session = session;
		this.el.appendChild(document.getElementById("template-login").content.cloneNode(true));
		this.el.querySelector('#login-login').addEventListener('click', this.login.bind(this));
		this.logsView = new LogsView(this.el.querySelector('.logs'), logs);
	}

	login(e) {
		e.preventDefault();
		this.session.login(this.el.querySelector('#login-username').value, this.el.querySelector('#login-password').value);
	}

	trigger(that, event) {
		if(that === this.session) {
			switch(event) {
				case 'success':
					this.logs.add("Login successful!", Log.Success);
					return;
				case 'error':
				case 'validation-failed':
					// TODO: better code & message handling (for i18n)
					if(typeof this.session.lastErrorDetails === 'string') {
						this.logs.add("Login failed: " + this.session.lastErrorDetails, Log.Error);
					} else {
						this.logs.add("Login failed: " + this.session.lastError, Log.Error);
					}
					return;
			}
		}

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

		this.el.insertBefore(line, this.el.firstChild);
		// to bottom: this.el.appendChild(line);

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

class ItemView extends FrameworkView {

	/**
	 * View and edit an item.
	 *
	 * @param {HTMLElement} element
	 * @param {Item} item
	 */
	constructor(element, item) {
		super(element);
		this.item = item;
		this.el.appendChild(document.getElementById("template-item").content.cloneNode(true));

		this.codeElement = this.el.querySelector(':not(.subitem) .code');
		this.featuresElement = this.el.querySelector(':not(.subitem) .features');
		this.defaultFeaturesElement = this.el.querySelector(':not(.subitem) .defaultfeatures');
		this.insideElement = this.el.querySelector(':not(.subitem) .inside');

		if(item.code !== null) {
			this.showCode(item.code);
			this.freezeCode();
		}
		if(item.featuresCount > 0) {
			this.showFeatures();
		}
		if(item.defaultFeaturesCount > 0) {
			this.showDefaultFeatures();
		}
	}

	//static search(where, classname) {
	//	for(let i = 0; i < where.length; i++) {
	//		if(where[i].classList.contains(classname)) {
	//			return where[i];
	//		}
	//	}
	//}

	showFeatures() {
		ItemView._showFeatures(this.item.features, this.featuresElement);
	}

	showDefaultFeatures() {
		ItemView._showFeatures(this.item.defaultFeatures, this.defaultFeaturesElement);
	}

	static _showFeatures(featuresOrDefaultFeatures, where) {
		let newElement, nameElement, valueElement;

		for(let name in featuresOrDefaultFeatures) {
			// hasOwnProperty is probably useless
			if(featuresOrDefaultFeatures.hasOwnProperty(name)) {
				newElement = document.createElement("div");
				newElement.classList.add("feature");
				// TODO: autosuggest values
				nameElement = document.createElement("span");
				nameElement.classList.add("name");
				valueElement = document.createElement("span");
				valueElement.classList.add("value");
				newElement.appendChild(nameElement);
				newElement.appendChild(valueElement);

				nameElement.textContent = name;
				valueElement.textContent = featuresOrDefaultFeatures[name];
				where.appendChild(newElement);
			}
		}
	}

	static newContainer() {
		let container = document.createElement("div");
		container.classList.add("item");
		return container;
	}

	showCode(code) {
		this.codeElement.value = code;
	}

	freezeCode() {
		this.codeElement.disabled = true;
	}

}
