class RootView extends Framework.View {
	/**
	 * @param {HTMLElement} body - an HTML element (not body, actually: it's a div)
	 * @param {stateHolder} stateHolder - throw that state somewhere!
	 */
	constructor(body, stateHolder) {
		super(body);

		this.stateHolder = stateHolder;

		this.session = new Session();
		this.logs = new Logs();
		this.translations = new Translations('it-IT');
		this.transaction = new Transaction();

		this.el.appendChild(RootView.createHeader());
		this.container = RootView.createViewHolder();
		this.el.appendChild(this.container);
		this.currentView = null;

		// triggers can be fired from this point on
		this.session.restore();
	}

	/**
	 * Return site header elements
	 *
	 * @return {HTMLElement}
	 * @private
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
	 * @private
	 */
	static createViewHolder() {
		let div = document.createElement("div");
		div.id = "view";
		return div;
	}

	/**
	 * Remove subview and clear its container
	 *
	 * @private
	 */
	clearContainer() {
		RootView.clearContents(this.container);
		this.currentView = null;
	}

	/**
	 * Remove children elements from a container
	 *
	 * @param {HTMLElement} container
	 * @private
	 */
	static clearContents(container) {
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
	changeState(from, to) {
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
				this.login();
				break;
			case null:
			case 'add':
			case 'view':
			case 'transaction':
				this.nav();
				break;
			default:
				this.what();
		}
		return true;
	}

	/**
	 * Go to an "unknown state" page
	 *
	 * @private
	 */
	what() {
		this.clearContainer();
		this.currentView = new TextView(this.container, "What? What's this state?");
	}

	/**
	 * Go to a page with navigation controls
	 *
	 * @private
	 */
	nav() {
		this.clearContainer();
		this.currentView = new NavigationView(this.container, this.logs, this.session, this.stateHolder, this.translations, this.transaction);
	}

	/**
	 * Go to login page
	 *
	 * @private
	 */
	login() {
		this.clearContainer();
		this.currentView = new LoginView(this.container, this.logs, this.session);
	}

	trigger(that, event) {
		let propagate = true;

		// noinspection JSUnresolvedFunction
		if(that instanceof stateHolder && that.equals(this.stateHolder) && event === 'change') {
			propagate = this.changeState(this.stateHolder.getOld(0), this.stateHolder.get(0));
		} else if(that === this.session) {
			switch(event) {
				case 'restore-valid':
					if(this.stateHolder.get(0) === 'login') {
						this.stateHolder.setAll();
					} else if(this.currentView === null) {
						// Go somewhere™ when reloading a page (after restoring session, or else everything will be in vain)
						// TODO: this is ugly. Really, really, ugly.
						// Maybe Session could be moved to BrowserView, while still handling events here for logging?
						this.stateHolder.setAllArray(BrowserView.splitPieces(window.location.hash));
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
					 * - let LogView handle this, adding a reference to session
					 *
					 * Then again, Session and Transaction and some other stuff is created here, so it makes sense
					 * to handle their events here.
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
		} else if(that === this.transaction) {
			switch(event) {
				case 'success':
					this.logs.add('Changes committed successfully', 'S');
					// the "deleted" event will be delayed by the framework until this "succes" event finishes triggering
					this.transaction.clear();
					break;
				case 'failed':
					this.logs.add("Failed committing transaction: " + this.transaction.lastErrorCode + ", " + this.transaction.lastErrorMessage, 'E');
			}
		}

		if(propagate && this.currentView !== null) {
			this.currentView.trigger(that, event);
		}
	}
}
