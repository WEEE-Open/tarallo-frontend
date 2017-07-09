class rootView extends FrameworkView {
	constructor(router) {
		let body = document.getElementById("body");
		super(body);

		this.state = 'root';
		this.prevState = 'root';
		/** @deprecated */
		this._router = router;

		this.session = new Session(this.trigger);
		this.logs = new Logs(this.trigger);
		this.translations = new Translations(this.trigger, 'it-IT');
		this.transaction = new Transaction(this.trigger);

		this.el.appendChild(rootView.createHeader());
		this.container = rootView.createViewHolder();
		this.el.appendChild(this.container);
		this.currentView = null;

		// triggers can be fired from this point on
		this.session.restore();
	}

	static createHeader() {
		let header = document.createElement("header");
		let h1 = document.createElement("h1");
		// TODO: this allows translating strings...
		h1.textContent = "T.A.R.A.L.L.O.";
		let p = document.createElement("p");
		p.textContent = "Trabiccolo Amministrazione Rottami e Assistenza, Legalmente-noto-come L'inventario Opportuno";
		header.appendChild(h1);
		header.appendChild(p);
		return header;
	}

	static createViewHolder() {
		let div = document.createElement("div");
		div.id = "view";
		return div;
	}

	clearContainer() {
		rootView._clearContents(this.container);
		// TODO: delete current view to prevent unnoticed memory leaks?
		this.currentView = null;
	}

	static _clearContents(container) {
		while(container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}

	/**
	 * Perform state transition
	 *
	 * @param {String} state
	 */
	changeState(state) {
		// Going where we're already
		if(state === this.state) {
			// Yay!
			return;
		}

		// Going where guests can't go
		if(this.session.username === null && state !== 'login') {
			this.changeState('login');
			return;
		}

		switch(state) {
			case 'logout':
				this._logout();
				this.navigate('#/logout');
				break;
			case 'login':
				switch(this.state) {
					case 'root':
						this._login();
						break;
					default:
						this.clearContainer();
						this._login();
						break;
				}
				this.navigate('#/login');
				break;
			case 'home':
				this.clearContainer();
				this._home();
				this.navigate('#/');
				break;
			case 'itemloading':
				alert("Should never happen, remove?");
				this._itemloading();
				break;
			case 'item':
				switch(this.state) {
					default:
						this.clearContainer();
						this._home();
					case 'home': // yep, fallthrough.
						this._item();
						break;
				}
				break;
			default:
				throw Error('Unknown state ' + state);
				return;
		}

		this.prevState = this.state;
		this.state = state;
		this.currentView.trigger(this, 'changestate');
	}

	rollbackState() {
		this.changeState(this.prevState);
		this.prevState = this.state; // prevents further rollbacks
	}

	/**
	 * @deprecated
	 * @param {string} url
	 */
	navigate(url) {
		this._router.trigger(url, {"trigger": false});
	}

	_logout() {

	}

	_login() {
		this.currentView = new LoginView(this.container, this.logs, this.session);
	}

	_home() {
		this.currentView = new NavigationView(this.container, this.logs, this.session, this.transaction, this.translations);
	}

	_item() {
		// TODO: what?
	}

	trigger(that, event) {
		if(this.currentView !== null) {
			this.currentView.trigger(that, event);
		}

		if(that === this.session) {
			switch(event) {
				case 'restore-valid':
					if(this.state === 'login' || this.state === 'root') {
						this.changeState('home');
					}
					break;
				case 'restore-invalid':
					if(this.state !== 'login') {
						this.logs.add("Not logged in", 'W');
					}
					this.changeState('login');
					break;
				case 'restore-error':
					// TODO: better message
					this.logs.add('Error restoring previous session: ' + this.session.lastError + ', ' + this.session.lastErrorDetails, 'E');
					this.changeState('login');
					break;
				case 'login-success':
					this.changeState('home');
					break;
				case 'logout-try':
					this.changeState('logout');
					break;
				case 'logout-success':
					this.changeState('login');
					break;
				case 'logout-error':
					this.rollbackState();
					break;
			}
		}
	}
}

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
				case 'login-success':
					this.logs.add('Login successful. Welcome, ' + this.session.username, 'S');
					return;
				case 'login-error':
				case 'validation-error':
					if(typeof this.session.lastErrorDetails === 'string') {
						this.logs.add("Login failed: " + this.session.lastErrorDetails, 'E');
					} else {
						this.logs.add("Login failed: " + this.session.lastError, 'E');
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
	 * @param {Logs} logs
	 * @see FrameworkView.constructor
	 */
	constructor(element, session, logs) {
		super(element);
		this.session = session;
		this.logs = logs;
		this.el.appendChild(document.getElementById('template-logout').content.cloneNode(true));
		this.el.querySelector('.logoutbutton').addEventListener('click', this.logout.bind(this));
		this.messageArea = this.el.querySelector('.logoutmessage');
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
		e.stopPropagation();
		this.session.logout();
	}

	trigger(that, event) {
		if(that === this.session) {
			if(event === 'logout-success') {
				this.logs.add('Logout successful, bye', 'S');
			} else if(event === 'logout-error') {
				this.logs.add('Can\'t log out: ' + this.session.lastError + ', ' + this.session.lastErrorDetails, 'E');
			}
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
		// (locale could be a FrameworkObject, so changes would be propagated via events)
		//noinspection JSUnresolvedFunction,JSUnresolvedVariable
		this.dateFormatter = new Intl.DateTimeFormat('it-IT', {hour: 'numeric', minute: 'numeric', second: 'numeric'});
		this.addAll();
	}

	addAll() {
		let logsArray = this.logs.getAll();
		for(let i = 0; i < logsArray.length; i++) {
			this.append(logsArray[i]);
		}
	}

	/**
	 * Append a Log to the view and return it. Mark it as new if necessary.
	 *
	 * @param {Log} log - log message
	 */
	append(log) {
		let line = document.createElement("div");
		switch(log.severity) {
			case 'S':
				line.classList.add('success');
				break;
			default:
			case 'I':
				line.classList.add('info');
				break;
			case 'W':
				line.classList.add('warning');
				break;
			case 'E':
				line.classList.add('error');
				break;
		}
		let dateContainer = document.createElement("span");
		dateContainer.classList.add("date");
		//noinspection JSUnresolvedFunction
		dateContainer.textContent = this.dateFormatter.format(log.timedate);

		let messageContainer = document.createElement('span');
		messageContainer.classList.add("message");
		messageContainer.textContent = log.message;

		line.appendChild(dateContainer);
		line.appendChild(messageContainer);

		this.el.insertBefore(line, this.el.firstChild);
		// to bottom: this.el.appendChild(line);

		if(new Date() - log.timedate < 11500) {
			line.classList.add("new");
			window.setTimeout(function() {
				line.classList.remove("new");
			}, 12000);
		}
	}

	pushed() {
		let newLog = this.logs.getLast();
		this.append(newLog);
	}

	shifted() {
		if(this.el.lastElementChild) {
			this.el.removeChild(this.el.lastElementChild);
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

class NavigationView extends FrameworkView {
	/**
	 * @param {HTMLElement} el
	 * @param {Logs} logs
	 * @param {Session} session
	 * @param {Transaction} transaction
	 * @param {Translations} translations
	 */
	constructor(el, logs, session, transaction, translations) {
		super(el);
		this.language = translations;

		let template = document.getElementById('template-navigation').content.cloneNode(true);

		this.el.appendChild(template);
		this.viewItemButton = this.el.querySelector('.viewitembutton');
		this.viewItemTextElement = this.el.querySelector('.viewitemtext');

		this.itemContainer = this.el.querySelector('.itemholder');
		/** @var {Item|null} */
		this.itemView = null;
		/** @var {Item|null} */
		this.currentItem = null;
		/** @var {Item|null} */
		this.requestedItem = null;

		this.viewItemButton.addEventListener('click', this.handleViewItem.bind(this));

		this.logoutView = new LogoutView(this.el.querySelector('.logoutview'), session, logs);
		this.logsView = new LogsView(this.el.querySelector('.logs'), logs);
	}

	/**
	 * Handles clicking the "view item" button.
	 *
	 * @param {Event} event
	 */
	handleViewItem(event) {
		event.preventDefault();
		let code = this.viewItemTextElement.value;
		if(typeof code === 'string') {
			code = code.trim();
			if(code !== '') {
				this.requestItem(code);
			} else {
				this.logsView.logs.add('To view an item type its code', 'I');
			}
		}
	}

	requestItem(code) {
		if(this.itemView !== null && this.itemView.item.code === this.code) {
			this.logsView.logs.add("Refreshing item " + code, 'I');
			this.requestedItem = this.itemView.item;
			this.requestedItem.getFromServer();
		} else {
			this.logsView.logs.add("Requested item " + code, 'I');
			try {
				this.requestedItem = new Item(this.trigger).setCode(code).getFromServer();
			} catch(err) {
				this.logsView.logs.add('Error getting item: ' + err, 'E');
				this.requestedItem = null;
				return;
			}
		}

		this.inRequest(true);
	}

	requestedFailed() {
		this.logsView.logs.add("Failed getting item: " + this.requestedItem.lastErrorCode + ", " + this.requestedItem.lastErrorMessage, 'E');
		this.requestedItem = null;
		this.inRequest(false);
	}

	requestedReady() {
		this.currentItem = this.requestedItem;
		this.requestedItem = null;

		if(this.itemView === null || this.itemView.item !== this.item) {
			this.deleteItemViews();
			this.createItemView();
			this.itemView.freezeRecursive();
		}
		this.inRequest(false);
	}

	/**
	 * Basically disable the "view item" button while an item is loading.
	 *
	 * @param {boolean} state - true if there's a request going on, false otherwise
	 */
	inRequest(state) {
		this.viewItemButton.disabled = state;
		if(this.itemView !== null) {
			if(state) {
				this.itemView.el.classList.add("hidden");
			} else {
				this.itemView.el.classList.remove("hidden");
			}
		}
	}

	deleteItemViews() {
		// TODO: use locationView
		this.itemView = null;
		while(this.itemContainer.lastElementChild) {
			this.itemContainer.removeChild(this.itemContainer.lastElementChild);
		}
	}

	createItemView() {
		// TODO: use locationView
		this.itemView = new ItemView(this.itemContainer, this.currentItem, this.language);
	}

	trigger(that, event) {
		if(that === this.requestedItem) {
			if(event === 'fetch-success') {
				this.requestedReady()
			} else if(event === 'fetch-failed') {
				this.requestedFailed()
			}
		}

		if(this.itemView !== null) {
			this.itemView.trigger(that, event);
		}

		this.logsView.trigger(that, event);
		this.logoutView.trigger(that, event);
	}
}
