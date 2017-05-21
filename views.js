class rootView extends FrameworkView {
	constructor() {
		let body = document.getElementById("body");
		super(body);

		this.session = new Session(this.trigger);
		this.logs = new Logs(this.trigger);
		this.translations = new Translations(this.trigger, 'it-IT'); // TODO: make variable. Which isn't possible because functions inside router won't see it.
		this.transaction = new Transaction(this.trigger);

		this.el.appendChild(rootView.createHeader());
		this.container = rootView.createViewHolder();
		this.el.appendChild(this.container);
		this.currentViews = [];
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

	static clearContents(container) {
		while(container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}

	home() {
		this.currentViews.push(new NavigationView(this.container, this.logs, this.session, this.transaction, this.translations));
	}

	login() {
		this.currentViews.push(new LoginView(this.container, this.logs, this.session));
	}

	trigger(that, event) {

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

		this.contentsElement.addEventListener('click', this.handleClick.bind(this));
	}

	handleClick() {
		// TODO: implement (and determine why it's not working)
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
	}
}
