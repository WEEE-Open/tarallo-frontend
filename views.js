class rootView extends FrameworkView {
	constructor(router) {
		let body = document.getElementById("body");
		super(body);

		this.state = 'root';
		this.prevState = 'root';
		this.trigger = this.trigger.bind(this);
		this.router = router;

		this.session = new Session(this.trigger);
		this.logs = new Logs(this.trigger);
		this.translations = new Translations(this.trigger, 'it-IT');
		this.transaction = new Transaction(this.trigger);
		this.currentItem = null;

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
				this.router.navigate('#/logout');
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
				this.router.navigate('#/login');
				break;
			case 'home':
				this.clearContainer();
				this._home();
				this.router.navigate('#/');
				break;
			case 'item':
				switch(this.state) {
					case 'home':
					default:
						this.clearContainer();
						this._item();
						break;
				}
				break;
			//case 'content':
			//	// when switching between content and item, recover subitem itemViews and use them.
			//	switch(this.state) {
			//		case 'item':
			//		case 'home':
			//		default:
			//			this.clearContainer();
			//			this._content();
			//			break;
			//	}
			//	break;
			default:
				throw Error('Unknown state ' + state);
				return;
		}

		this.prevState = this.state;
		this.state = state;
	}

	rollbackState() {
		this.changeState(this.prevState);
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
		let anotherContainer = ItemView.newContainer();
		this.currentView = new ItemView(anotherContainer, this.currentItem, this.language);
		this.container.appendChild(anotherContainer);
	}

	trigger(that, event) {
		if(that === this.session) {
			switch(event) {
				case 'restore-valid':
					if(this.state === 'login' || this.state === 'root') {
						this.changeState('home');
					}
					break;
				case 'restore-invalid':
					if(this.state !== 'login') {
						this.logs.add("Not logged in", Log.Warning);
					}
					this.changeState('login');
					break;
				case 'restore-error':
					// TODO: better message
					this.logs.add('Error restoring previous session: ' + this.session.lastError + ', ' + this.session.lastErrorDetails, Log.Error);
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

		this.currentView.trigger(that, event);
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
					this.logs.add('Login successful. Welcome, ' + this.session.username, Log.Success);
					return;
				case 'login-error':
				case 'validation-error':
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
	 * @param {Logs} logs
	 * @see FrameworkView.constructor
	 */
	constructor(element, session, logs) {
		super(element);
		this.session = session;
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
				this.logs.add('Logout successful, bye', Log.Success);
			} else if(event === 'logout-error') {
				this.logs.add('Can\'t log out: ' + this.session.lastError + ', ' + this.session.lastErrorDetails, Log.Error);
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

class LocationView extends FrameworkView {
	/**
	 * Show items inside a specific location, and also a breadcrumb for navigation.
	 *
	 * @param {HTMLElement} element - an HTML element
	 * @param {string|string[]} path - array of items representing a path, or single item if there's only one ancestor
	 * @param {Translations} language - Language for translated strings
	 */
	constructor(element, path, language) {
		super(element);
		/** @type {ItemView[]} */
		this.el.appendChild(document.getElementById("template-location").content.cloneNode(true));
		this.itemViews = [];
		this.language = language;
		this.contentsElement = this.el.querySelector('.contents');
		this.navigationElement = this.el.querySelector('.breadcrumbs');

		if(typeof path === 'string') {
			path = [path];
		}
		this.path = path;

		this.createBreadcrumbs();

		this.contentsElement.addEventListener('click', this.handleNavigation.bind(this));
	}

	handleNavigation() {
		// TODO: implement
		alert("CLICK");
	}

	/**
	 * Insert an Item in this view. Will create an ItemView and store it inside.
	 *
	 * @param {Item} item - to be added inside.
	 */
	addItem(item) {
		for(let i = 0; i < this.itemViews.length; i++) {
			if(this.itemViews[i].item === this.item) {
				throw Error('Item already inserted');
			}
		}

		let container = ItemView.newContainer();
		let view = new ItemView(container, item, this.language, null);
		this.contentsElement.appendChild(container);
		this.itemViews.push(view);
	}

	trigger(that, event) {

	}

	createBreadcrumbs() {
		for(let i = 0; i < this.path.length; i++) {
			if(i !== 0) {
				this.navigationElement.appendChild(document.createTextNode(" > "));
			}
			let piece = document.createElement("a");
			piece.href = "#/location/" + this.path[i];
			piece.textContent = this.path[i];
			this.navigationElement.appendChild(piece);
		}


	}

}

class NavigationView extends FrameworkView {
	constructor(el, logs, session, transaction, translations) {
		super(el);
		let template = document.getElementById('template-navigation').content.cloneNode(true);

		this.logsView = new LogsView(template.querySelector('.logs'), logs);

		this.el.appendChild(template);
		this.el.querySelector('#main').addEventListener('click', this.handleNavigation.bind(this));
		this.logoutView = new LogoutView(this.el.querySelector('.logoutview'), session);
	}

	/**
	 * Handles navigation.
	 *
	 * @param {Event} event - click on the #main navigation element
	 */
	handleNavigation(event) {
		// TODO: do something, make links work (= place "#/login" and similiar in href, as a fallback)
		event.preventDefault();
		let classes = event.target.classList;
		if(classes.contains('homebutton')) {

		} else if(classes.contains('addnewbutton')) {

		} else if(classes.contains('searchbutton')) {

		} else if(classes.contains('viewitembutton')) {

		} else if(classes.contains('viewcontentsbutton')) {

		}
	}
}
