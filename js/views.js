class browserView extends FrameworkView {
	constructor() {
		super(window);
		// requires a lor of ifs in view constructors for initialization, while triggering an event reuses whatever logic is already in place
		//this.state = new stateHolder(this.trigger, browserView.splitPieces(window.location.hash));
		this.state = new stateHolder(this.trigger);
		this.rootView = new rootView(document.getElementById("body"), this.state);
		this.hashchanged = false; // orrible hack.

		// useless:
		//window.onpopstate = this.urlChanged.bind(this);
		window.onhashchange = this.urlChanged.bind(this);
		this.urlChanged();
	}

	urlChanged(/*event*/) {
		this.hashchanged = true;
		this.state.setAllArray(browserView.splitPieces(window.location.hash));
	}

	/**
	 * Split URL into pieces.
	 * Trailing slashes and double slashes cause empty string pieces to appear, which is intended behaviour.
	 *
	 * @param {string} string
	 * @return {Array}
	 */
	static splitPieces(string) {
		let pieces = string.substr(1).split('/');
		// "//////////////Login" is an acceptable URL, whatever.
		while(pieces[0] === '') {
			pieces.shift();
		}
		return pieces;
	}

	/**
	 * Build the URL piece thingamajig from array.
	 *
	 * @return {string}
	 * @private
	 */
	_buildUrl() {
		let path = this.state.getAll();
		if(path.length === 0) {
			return '/';
		}
		let result = '';
		for(let i = 0; i < path.length; i++) {
			result = result + '/' + encodeURIComponent(path[i]);
		}
		return result;
	}

	/**
	 * Set current URL in browser
	 *
	 * @private
	 */
	static _setUrl(url) {
		history.pushState(null, '', '#' + url);
	}

	trigger(that, event) {
		if(that instanceof stateHolder && that.equals(this.state)) {
			if(event === 'change') {
				if(this.hashchanged) {
					this.hashchanged = false;
				} else {
					browserView._setUrl(this._buildUrl());
				}
			}
		}
		this.rootView.trigger(that,event);
	}
}

class rootView extends FrameworkView {
	/**
	 * @param {HTMLElement} body - an HTML element (not body, actually: it's a div)
	 * @param {stateHolder} stateHolder - throw that state somewhere!
	 */
	constructor(body, stateHolder) {
		super(body);

		this.stateHolder = stateHolder;

		this.session = new Session(this.trigger);
		this.logs = new Logs(this.trigger);
		this.translations = new Translations(this.trigger, 'it-IT');
		//this.transaction = new Transaction(this.trigger);

		this.el.appendChild(rootView.createHeader());
		this.container = rootView.createViewHolder();
		this.el.appendChild(this.container);
		this.currentView = null;

		// triggers can be fired from this point on
		this.session.restore();
	}

	/**
	 * Return site header elements
	 *
	 * @return {HTMLElement}
	 */
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

	/**
	 * Create some random divs, because that's what "modern" web is all about.
	 *
	 * @return {HTMLElement}
	 */
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

	/**
	 * Remove children elements from a container
	 *
	 * @param {HTMLElement} container
	 * @private
	 */
	static _clearContents(container) {
		while(container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}

	/**
	 * Perform state transition
	 *
	 * @param {String} from
	 * @param {String} to
	 * @return {boolean} - keep propagating change or not?
	 * @private
	 */
	_changeState(from, to) {
		// Going where guests can't go
		if(this.session.username === null && to !== 'login') {
			this.stateHolder.setAll('login');
			return false;
		}

		if(from === to) {
			// from /view/foo to /view/bar: "view" is unchanged but the rest isn't, so keep propagating
			return true;
		}

		switch(to) {
			case 'login':
				this._login();
				break;
			case null:
			case 'add':
			case 'view':
				this._nav();
				break;
			default:
				this._what();
		}
		return true;
	}

	_what() {
		this.clearContainer();
		this.currentView = new TextView(this.container, "What? What's this state?");
	}

	_nav() {
		this.clearContainer();
		this.currentView = new NavigationView(this.container, this.logs, this.session, this.stateHolder, this.translations);
	}

	_login() {
		this.clearContainer();
		this.currentView = new LoginView(this.container, this.logs, this.session);
	}

	trigger(that, event) {
		let propagate = true;

		if(that instanceof stateHolder && that.equals(this.stateHolder) && event === 'change') {
			propagate = this._changeState(this.stateHolder.getOld(0), this.stateHolder.get(0));
		} else if(that === this.session) {
			switch(event) {
				case 'restore-valid':
					if(this.stateHolder.get(0) === 'login' || this.stateHolder.get(0) === null) {
						this.stateHolder.setAll();
					}
					break;
				case 'restore-invalid':
					if(this.stateHolder.get(0) !== 'login') {
						this.logs.add("Not logged in", 'W');
					}
					this.stateHolder.setAll('login');
					break;
				case 'restore-error':
					// TODO: better message
					this.logs.add('Error restoring previous session: ' + this.session.lastError + ', ' + this.session.lastErrorDetails, 'E');
					this.stateHolder.setAll('login');
					break;
				case 'login-success':
					/*
					 * This feels very wrong here, but the alternatives are even worse:
					 * - let LoginView handle this during trigger cascades, right before being deleted
					 * - let LogView handlet this, adding a reference to session
					 */
					this.logs.add('Login successful. Welcome, ' + this.session.username, 'S');
					this.stateHolder.setAll();
					break;
				case 'logout-success':
					// same as above
					this.logs.add('Logout successful, bye', 'S');
					this.stateHolder.setAll('login');
					break;
			}
		}

		if(propagate && this.currentView !== null) {
			this.currentView.trigger(that, event);
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
			if(event === 'logout-error') {
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
	 * @param {stateHolder} stateHolder
	 * @param {Translations} translations
	 */
	constructor(el, logs, session, stateHolder, translations) {
		super(el);
		this.language = translations;
		this.stateHolder = stateHolder;

		let template = document.getElementById('template-navigation').content.cloneNode(true);

		this.el.appendChild(template);
		this.viewItemButton = this.el.querySelector('.viewitembutton');
		this.viewItemTextElement = this.el.querySelector('.viewitemtext');

		this.container = this.el.querySelector('.itemholder');
		/** @var {ItemView|null} */
		this.innerView = null;
		/** @var {Item|null} */
		this.currentItem = null;
		/** @var {Item|null} */
		this.requestedItem = null;

		this.viewItemButton.addEventListener('click', this._handleViewItem.bind(this));

		this.logoutView = new LogoutView(this.el.querySelector('.logoutview'), session, logs);
		this.logsView = new LogsView(this.el.querySelector('.logs'), logs);
	}

	/**
	 * Handles clicking the "view item" button.
	 *
	 * @param {Event} event
	 */
	_handleViewItem(event) {
		event.preventDefault();
		let code = this.viewItemTextElement.value;
		if(typeof code === 'string') {
			code = code.trim();
			if(code !== '') {
				let changed = this.stateHolder.setAll('view', code);
				if(!changed) {
					this._refresh();
				}
			} else {
				this.logsView.logs.add('To view an item type its code', 'I');
			}
		}
	}

	_refresh() {
		this.logsView.logs.add("Refreshing item " + this.currentItem.code, 'I');
		this.requestedItem = this.currentItem;
		this.requestedItem.getFromServer();
		// TODO: this triggers A LOT of code-changed and feature-changed, even though nothing changed: look into this.
	}

	_changeState(from, to) {
		switch(to) {
			case null:
				if(from === null) {
					break;
				}
				this._deleteItemViews();
				this.innerView = new TextView(this.container, "Questa è la home temporanea.");
				break;
			case 'view':
				if(this.stateHolder.get(1) !== null) {
					this._requestItem(this.stateHolder.get(1));
				}
				break;
		}
	}

	_requestItem(code) {
		// TODO: use LocationView
		if(this.innerView !== null && this.currentItem.code === this.code) {
			this._refresh();
		} else {
			this.logsView.logs.add("Requested item " + code, 'I');
			try {
				this.requestedItem = new Item(this.trigger).setCode(code).getFromServer();
			} catch(err) {
				this.logsView.logs.add('Error getting item: ' + err, 'E');
				this.requestedItem = null;
				// doesn't set _inRequest
				return;
			}
		}

		this._inRequest(true);
	}

	_requestedFailed() {
		this.logsView.logs.add("Failed getting item: " + this.requestedItem.lastErrorCode + ", " + this.requestedItem.lastErrorMessage, 'E');
		this.requestedItem = null;
		this._inRequest(false);
	}

	_requestedReady() {
		let itemChanged = this.innerView === null || this.currentItem !== this.requestedItem;

		if(itemChanged) {
			this._deleteItemViews();
		}
		this.currentItem = this.requestedItem;
		this.requestedItem = null;
		if(itemChanged) {
			this._createItemView();
			this.innerView.freezeRecursive();
		}
		this._inRequest(false);
	}

	/**
	 * Basically disable the "view item" button while an item is loading.
	 *
	 * @param {boolean} state - true if there's a request going on, false otherwise
	 */
	_inRequest(state) {
		this.viewItemButton.disabled = state;
		if(this.innerView !== null) {
			if(state) {
				this.innerView.el.classList.add("hidden");
			} else {
				this.innerView.el.classList.remove("hidden");
			}
		}
	}

	_deleteItemViews() {
		// TODO: use locationView
		this.innerView = null;
		while(this.container.lastElementChild) {
			this.container.removeChild(this.container.lastElementChild);
		}
	}

	_createItemView() {
		// TODO: use locationView
		this.innerView = new ItemView(this.container, this.currentItem, this.language);
	}

	trigger(that, event) {
		if(that instanceof stateHolder && that.equals(this.stateHolder) && event === 'change') {
			this._changeState(this.stateHolder.getOld(0), this.stateHolder.get(0));
		} else if(that === this.requestedItem) {
			if(event === 'fetch-success') {
				this._requestedReady()
			} else if(event === 'fetch-failed') {
				this._requestedFailed()
			}
		}

		if(this.innerView !== null) {
			this.innerView.trigger(that, event);
		}

		this.logsView.trigger(that, event);
		this.logoutView.trigger(that, event);
	}
}

class TextView extends FrameworkView {
	constructor(el, text) {
		super(el);
		let p = document.createElement("p");
		p.textContent = text;
		this.el.appendChild(p);
	}
}
