class NavigationView extends FrameworkView {
	/**
	 * @param {HTMLElement} el
	 * @param {Logs} logs
	 * @param {Session} session
	 * @param {stateHolder} stateHolder
	 * @param {Translations} translations
	 * @param {Transaction} transaction
	 */
	constructor(el, logs, session, stateHolder, translations, transaction) {
		super(el);
		this.language = translations;
		this.transaction = transaction;
		this.stateHolder = stateHolder;

		let template = document.getElementById('template-navigation').content.cloneNode(true);

		this.el.appendChild(template);
		this.viewItemButton = this.el.querySelector('.viewitembutton');
		this.viewItemTextElement = this.el.querySelector('.viewitemtext');
		this.buttonsArea = this.el.querySelector('.navbuttons');
		this.transactionArea = this.el.querySelector('.transactioncount');
		this._transactionCount(this.transaction.actionsCounter);

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
				this._deleteContent();
				this.innerView = new TextView(this.container, "Questa è la home temporanea.");
				break;
			case 'view':
				if(this.stateHolder.get(1) !== null) {
					this._requestItem(this.stateHolder.get(1));
				}
				break;
			case 'add':
				this._newItem();
				break;
		}
	}

	_requestItem(code) {
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
			this._deleteContent();
		}
		this.currentItem = this.requestedItem;
		this.requestedItem = null;
		if(itemChanged) {
			this._createItemView();
			this.innerView.freezeRecursive();
		}
		this._inRequest(false);
	}

	_newItem() {
		// TODO: does this make sense?
		this.requestedItem = null;
		this.currentItem = new Item(this.trigger);
		this._deleteContent();
		this._createItemView();
		this._createSaveButton();
	}

	_createSaveButton() {
		let button = document.createElement("button");
		button.textContent = "SALVA.";
		button.addEventListener('click', this._weeeSave.bind(this));
		this.buttonsArea.appendChild(button);
	}

	/**
	 * Handler for the save button.
	 * WEEE Save! [cit.]
	 *
	 * @private
	 */
	_weeeSave() {
		// TODO: remove item, add new
		this.transaction.add(this.currentItem);
	}

	_transactionCount(count) {
		if(count === 0) {
			this.transactionArea.style.display = 'none';
		} else {
			this.transactionArea.style.display = '';
			this.transactionArea.textContent = 'Items in transaction: ' + count;
		}
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

	_deleteContent() {
		this.innerView = null;
		while(this.container.lastElementChild) {
			this.container.removeChild(this.container.lastElementChild);
		}
		while(this.buttonsArea.lastElementChild) {
			this.buttonsArea.removeChild(this.buttonsArea.lastElementChild);
		}
	}

	_createItemView() {
		this.innerView = new ItemLocationView(this.container, this.currentItem, this.language);
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

		if(that === this.transaction) {
			this._transactionCount(this.transaction.actionsCounter);
		}


		if(this.innerView !== null) {
			this.innerView.trigger(that, event);
		}

		this.logsView.trigger(that, event);
		this.logoutView.trigger(that, event);
	}
}
