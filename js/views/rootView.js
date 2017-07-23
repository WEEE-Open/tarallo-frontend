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
