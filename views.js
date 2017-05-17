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
		this.frozen = false;
		this.subitems = [];
		this.el.appendChild(document.getElementById("template-item").content.cloneNode(true));

		this.codeElement = this.el.querySelector(':not(.subitem) .code');
		this.featuresElement = this.el.querySelector(':not(.subitem) .features');
		this.defaultFeaturesElement = this.el.querySelector(':not(.subitem) .defaultfeatures');
		this.insideElement = this.el.querySelector(':not(.subitem) .inside');
		this.datalistElement = document.getElementById("featurelist");
		this.featureInputElement = this.el.querySelector(":not(.subitem) .featuretextbox");

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
		if(item.inside.length > 0) {
			this.showInsideItems();
		}

		this._toggleFeatureInput();
		this.populateFeatureDatalist();

		this.featuresElement.addEventListener('click', ItemView.featureClick.bind(this));
	}

	/**
	 *
	 * @param {Event} event
	 */
	static featureClick(event) {
		/**
		 * @var {HTMLElement} this
		 */
		if(event.target.classList.contains("featuredeletebutton")) {
			// plainly unreadable.
			this.item.setFeature(event.target.parentElement.querySelector('.name').dataset.name, null);
			event.target.parentElement.parentElement.removeChild(event.target.parentElement);
		}
	}

	/**
	 * Set item as non-editable.
	 *
	 * @see this.unfreeze
	 */
	freeze() {
		this.freezeCode();
		this._toggleInputs(true);
		this._toggleControls(true);
		this._toggleFeatureInput();
		this.frozen = true;
	}

	_toggleInputs(disabled) {
		let inputs = this.el.querySelectorAll(':not(.subitem) input.freezable, :not(.subitem) button.freezable');
		for(let i = 0; i < inputs.length; i++) {
			inputs[i].disabled = disabled;
		}
	}

	_toggleControls(disabled) {
		let controls = this.el.querySelectorAll(':not(.subitem) .freezable-controls');
		for(let i = 0; i < controls.length; i++) {
			if(disabled) {
				controls[i].classList.add("disabled");
			} else {
				controls[i].classList.remove("disabled");
			}
		}
	}

	/**
	 * Set item as editable again (except for the code)
	 *
	 * @see this.freeze
	 */
	unfreeze() {
		this._toggleInputs(false);
		this._toggleControls(false);
		this._toggleFeatureInput();
		this.frozen = false;
	}

	//static search(where, classname) {
	//	for(let i = 0; i < where.length; i++) {
	//		if(where[i].classList.contains(classname)) {
	//			return where[i];
	//		}
	//	}
	//}

	/**
	 * Display features from the item, in editable format. Use freeze() to make them not editable.
	 *
	 * @see this.freeze
	 */
	showFeatures() {
		let newElement;

		for(let name in this.item.features) {
			// hasOwnProperty is probably useless
			if(this.item.features.hasOwnProperty(name)) {
				newElement = ItemView.createFeatureElement(name, this.item.features[name]);
				this.featuresElement.appendChild(newElement);
			}
		}
	}

	static createFeatureElement(name, value) {
		let newElement, nameElement, valueElement, deleteButton;
		newElement = document.createElement("div");
		newElement.classList.add("feature");

		nameElement = document.createElement("span");
		nameElement.classList.add("name");
		nameElement.dataset.name = name;

		valueElement = document.createElement("input");
		valueElement.classList.add("value");
		valueElement.classList.add("freezable");

		deleteButton = document.createElement("button");
		deleteButton.classList.add("featuredeletebutton");
		deleteButton.classList.add("freezable");
		deleteButton.classList.add("freezable-controls");
		deleteButton.textContent = "-";

		newElement.appendChild(deleteButton);
		newElement.appendChild(nameElement);
		newElement.appendChild(valueElement);

		nameElement.textContent = name;
		valueElement.value = value;

		return newElement;
	}

	/**
	 * Display default features. These are never editable.
	 */
	showDefaultFeatures() {
		// looks very much like showFeatures, but there are many subtle differences, using a single function didn't work too well...
		let newElement, nameElement, valueElement;

		for(let name in this.item.defaultFeatures) {
			if(this.item.defaultFeatures.hasOwnProperty(name)) {
				newElement = document.createElement("div");
				newElement.classList.add("feature");

				nameElement = document.createElement("span");
				nameElement.classList.add("name");

				valueElement = document.createElement("input");
				valueElement.classList.add("value");
				valueElement.disabled = true;

				newElement.appendChild(nameElement);
				newElement.appendChild(valueElement);

				nameElement.textContent = name;
				valueElement.value = this.item.defaultFeatures[name];
				this.defaultFeaturesElement.appendChild(newElement);
			}
		}
	}

	showInsideItems() {
		let subitem, container;
		this.removeInsideItems();
		for(let i = 0; i < this.item.inside.length; i++) {
			subitem = this.item.inside[i];
			container = ItemView.newContainer();
			this.subitems.push(new ItemView(container, subitem));
			this.el.appendChild(container);
		}
	}

	removeInsideItems() {
		while(this.insideElement.lastElementChild) {
			this.insideElement.removeChild(this.insideElement.lastElementChild);
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

	populateFeatureDatalist() {
		if(!this.featureDatalistAvailable()) {
			// TODO: set data-requested=true, fetch via XHR, use callback to populate (even if page changes, it will still work), remove data-requested only if XHR fails, don't send more requests if data-requested == true
			let features = {"frequency-hz": "Frequenza", "color": "Colore", "example": "Esempio"};

			for(let f in features) {
				if(features.hasOwnProperty(f)) {
					let option = document.createElement("option");
					option.dataset.value = f;
					option.textContent = features[f];
					this.datalistElement.appendChild(option);
				}
			}
		}
	}

	featureDatalistAvailable() {
		// TODO: null, undefined or what?
		// TODO: why is PHPStorm complaining that "request" is unresolved? Obviously it is, but a few lines above the same thing works...............
		return !!this.datalistElement.firstChild;
	}

	_toggleFeatureInput() {
		if(this.featureDatalistAvailable()) {
			this.featureInputElement.placeholder = "";
			this.featureInputElement.disabled = false;
		} else {
			this.featureInputElement.placeholder = "Caricamento in corso...";
			this.featureInputElement.disabled = true;
		}
	}
}
