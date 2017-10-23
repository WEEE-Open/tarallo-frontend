class NavigationView extends Framework.View {
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
		this.translations = translations;
		this.transaction = transaction;
		this.stateHolder = stateHolder;
		this.translations = translations;
		this.logs = logs;

		let template = document.getElementById('template-navigation').content.cloneNode(true);

		this.el.appendChild(template);
		this.buttonsArea = this.el.querySelector('.navbuttons');
		this.transactionArea = this.el.querySelector('.transactioncount');

		this.transactionCount(this.transaction.actionsCount);

		this.container = this.el.querySelector('.itemholder');

		// Buttons that show/hide additional controls
		this.quickViewItemButton = this.el.querySelector('.quickbutton.view');
		this.quickMoveItemButton = this.el.querySelector('.quickbutton.move');
		this.quickViewLogsButton = this.el.querySelector('.quickbutton.logsview');

		// the aforementioned additional controls
		this.quickViewItemElement = this.el.querySelector('.quickviewitem');
		this.quickMoveItemElement = this.el.querySelector('.quickmoveitem');
		this.quickViewLogsElement = this.el.querySelector('.quickviewlogs');

		// buttons INSIDE those additional controls
		this.viewItemButton = this.el.querySelector('.viewitembutton');
		this.moveItemButton = this.el.querySelector('.moveitembutton');

		// other additional controls (= textboxes)
		this.viewItemTextElement = this.el.querySelector('.quickviewitem input');
		this.moveItemFromElement = this.el.querySelector('.quickmoveitem input.from');
		this.moveItemToElement = this.el.querySelector('.quickmoveitem input.to');

		/** Whatever subview there's right now
		 *  @var {ItemView|null} */
		this.innerView = null;
		/** Current item (for "add new" and viewing a single item, search results are handled elsewhere)
		 *  @var {Item|null} */
		this.currentItem = null;
		/** Last request item (for "add new" and viewing a single item, search results are handled elsewhere)
		 *  @var {Item|null} */
		this.requestedItem = null;
		/** @var {Search|null}
		 *  @private */
		this.lastSearch = null;

		this.quickMoveItemButton.addEventListener('click', NavigationView.quickActionClick.bind(this,this.quickMoveItemElement));
		this.quickViewItemButton.addEventListener('click', NavigationView.quickActionClick.bind(this,this.quickViewItemElement));
		this.quickViewLogsButton.addEventListener('click', NavigationView.quickActionClick.bind(this,this.quickViewLogsElement));
		this.viewItemButton.addEventListener('click', this.viewItemClick.bind(this));
		this.moveItemButton.addEventListener('click', this.moveItemClick.bind(this));

		this.logoutView = new LogoutView(this.el.querySelector('.logoutview'), session, logs);
		this.logsView = new LogsView(this.el.querySelector('.logs'), logs);
	}

	/**
	 * Handles clicking the "view item" button.
	 *
	 * @param {Event} event
	 * @private
	 */
	viewItemClick(event) {
		event.preventDefault();
		let code = this.viewItemTextElement.value;
		if(typeof code === 'string') {
			code = code.trim();
			if(code !== '') {
				let changed = this.stateHolder.setAll('view', code);
				if(!changed) {
					if(this.innerView !== null && this.currentItem !== null) {
						this.refreshFromServer();
						return;
					} else {
						// TODO: recover from broken view (e.g. server answered 500, user retries with same item)
						// = display a message or retry and rerender or whatever.
						this.logs.add('Crash', 'E');
					}
				} else {
					// viewing a new item: do nothing, already handled by stateHolder change
					return;
				}
			}
		}
		this.logs.add('To view an item type its code', 'I');
	}

	/**
	 * Handle clicking on the "move item" button.
	 *
	 * @private
	 */
	moveItemClick() {
		let code = this.moveItemFromElement.value;
		let to = this.moveItemToElement.value;

		if(typeof code === 'string' && typeof to === 'string') {
			code = code.trim();
			to = to.trim();
			if(code !== '' && to !== '') {
				try {
					if(this.transaction.update.has(code)) {
						let itemUpdate = this.transaction.update.get(code);
						itemUpdate.setParent(to);
					} else {
						let item = new Item().setCode(code).setExisting();
						let itemUpdate = new ItemUpdate(item);
						itemUpdate.setParent(to);
						this.transaction.addUpdated(itemUpdate.unsetItem());
					}
				} catch(e) {
					this.logs.add(e.message, 'E');
				}
				return;
			}
		}
		this.logs.add('To move an item type its code and its new parent code', 'I');
	}

	/**
	 * Handles clicking on the "quick" view/move menu items
	 *
	 * @param {HTMLElement|Node} element - what has to be shown/hidden
	 * @param {Event} event
	 */
	static quickActionClick(element, event) {
		if(event.target.classList.contains('quickopen')) {
			NavigationView.toggleQuickActions(false, event.target, element);
		} else {
			NavigationView.toggleQuickActions(true, event.target, element);
		}
	}

	/**
	 * Toggle open and closed quick actions in the menu bar
	 *
	 * @param {boolean} open - true to open, false to close
	 * @param {HTMLElement|Node|EventTarget} button
	 * @param {HTMLElement|Node} element
	 */
	static toggleQuickActions(open, button, element) {
		if(open) {
			element.style.display = '';
			button.classList.add('quickopen');
			let firstField = element.querySelector('input');
			if(firstField !== null) {
				firstField.focus();
			}
		} else {
			element.style.display = 'none';
			button.classList.remove('quickopen');
		}
	}

	/**
	 * Reload this.currentItem from server and update it.
	 *
	 * @private
	 */
	refreshFromServer() {
		this.logs.add("Refreshing item " + this.currentItem.code, 'I');
		this.requestedItem = this.currentItem;
		this.requestedItem.getFromServer();
		// TODO: this triggers A LOT of code-changed and feature-changed, even though nothing changed: look into this.
	}

	/**
	 * Change state.
	 *
	 * @param {string|null} from - whatever stateHolder said
	 * @param {string|null} to - whatever stateHolder says
	 * @private
	 */
	changeState(from, to) {
		if(from === 'search' && to !== 'search') {
			if(this.innerView instanceof SearchView) {
				/** @type {Search} */
				this.lastSearch = this.innerView.search;
			} else {
				this.lastSearch = null;
			}
		}

		switch(to) {
			case null:
				this.deleteContent();
				this.innerView = new TextView(this.container, "Questa è la home temporanea.");
				break;
			case 'view':
				if(this.stateHolder.get(1) !== null) {
					this.requestItem(this.stateHolder.get(1));
				}
				break;
			case 'add':
				if(this.stateHolder.get(1) === 'last') {
					if(this.transaction.lastAdded instanceof Item) {
						this.newItemView(this.transaction.lastAdded);
					} else {
						this.stateHolder.setAll('add');
					}
				} else {
					this.newItemView(new Item());
				}
				break;
			case 'transaction':
				this.transactionView();
				break;
			case 'search':
				// can't remeber if other states allow this extreme memoization technique or not
				if(from !== 'search') {
					this.searchView();
				}
				break;
		}
	}

	/**
	 * Switch to new item/add item view (create a new item, place it into this.currentItem and show it)
	 *
	 * @param {Item} current
	 *
	 * @private
	 */
	newItemView(current) {
		this.requestedItem = null;
		this.currentItem = current;
		this.deleteContent();
		this.createItemView();
	}

	/**
	 * Show TransactionView
	 *
	 * @private
	 */
	transactionView() {
		this.deleteContent();
		this.innerView = new TransactionView(this.container, this.transaction, this.logs, this.translations);
	}

	/**
	 * Show SearchView
	 *
	 * @private
	 */
	searchView() {
		this.deleteContent();
		this.innerView = new SearchView(this.container, this.logs, this.translations, this.transaction, this.stateHolder.emit(1), this.lastSearch);
	}

	/**
	 * Request an Item from server, or refresh it if it's also this.currentItem.
	 *
	 * @param {string|int|null} code
	 * @private
	 */
	requestItem(code) {
		if((this.innerView instanceof ItemView || this.innerView instanceof ItemLocationView) && this.currentItem !== null && this.currentItem.code === this.code) {
			this.refreshFromServer();
		} else {
			this.innerView = null;
			this.deleteContent();
			this.logs.add("Requested item " + code, 'I');
			try {
				this.requestedItem = new Item().setCode(code).getFromServer();
			} catch(err) {
				this.logs.add('Error getting item: ' + err, 'E');
				this.requestedItem = null;
				// doesn't set inRequest
				return;
			}
		}

		this.inRequest(true);
	}

	/**
	 * Handle failed item requests from server.
	 *
	 * @private
	 */
	requestedFailed() {
		this.logs.add("Failed getting item: " + this.requestedItem.lastErrorCode + ", " + this.requestedItem.lastErrorMessage, 'E');
		this.requestedItem = null;
		this.inRequest(false);
	}

	/**
	 * Handle successful requests from server and render item, or update render.
	 *
	 * @private
	 */
	requestedReady() {
		let itemChanged = this.innerView === null || this.currentItem !== this.requestedItem;

		if(itemChanged) {
			this.deleteContent();
		}
		this.currentItem = this.requestedItem;
		this.requestedItem = null;
		if(itemChanged) {
			this.createItemView();
			this.innerView.freezeRecursive();
		}
		this.inRequest(false);
	}

	/**
	 * Update transaction counter
	 *
	 * @param {int} count
	 * @private
	 */
	transactionCount(count) {
		if(count === 0) {
			this.transactionArea.style.display = 'none';
		} else {
			this.transactionArea.style.display = '';
			this.transactionArea.textContent = 'Pending operations: ' + count;
		}
	}

	/**
	 * Basically disable the "view item" button while an item is loading.
	 *
	 * @param {boolean} state - true if there's a request going on, false otherwise
	 * @private
	 */
	inRequest(state) {
		this.viewItemButton.disabled = state;
		if(this.innerView !== null) {
			if(state) {
				this.innerView.el.classList.add("hidden");
			} else {
				this.innerView.el.classList.remove("hidden");
			}
		}
	}

	/**
	 * Delete subviews and nuke this.innerView
	 *
	 * @private
	 */
	deleteContent() {
		this.innerView = null;
		while(this.container.lastElementChild) {
			this.container.removeChild(this.container.lastElementChild);
		}
		while(this.buttonsArea.lastElementChild) {
			this.buttonsArea.removeChild(this.buttonsArea.lastElementChild);
		}
	}

	/**
	 * Create an Item(Location)View and place it inside this.innerView
	 *
	 * @private
	 */
	createItemView() {
		this.innerView = new ItemLocationView(this.container, this.currentItem, this.translations, this.transaction, this.logs);
	}

	trigger(that, event) {
		if(that instanceof stateHolder && this.stateHolder.equals(that) && event === 'change') {
			this.changeState(this.stateHolder.getOld(0), this.stateHolder.get(0));
		} else if(that === this.requestedItem) {
			if(event === 'fetch-success') {
				this.requestedReady()
			} else if(event === 'fetch-failed') {
				this.requestedFailed()
			}
		} else if(that === this.transaction) {
			// for searching:
			// 'to-add', 'to-update', 'to-delete', 'un-add', 'un-update', 'un-delete'
			if(event.startsWith('to-') || event.startsWith('un-') || event === 'reset') {
				this.transactionCount(this.transaction.actionsCount);
			}
			if(event === 'to-add' && this.transaction.lastAdded === this.currentItem) {
				this.newItemView(new Item());
			}
		} else if(that === this.logs && event === 'push') {
			switch(this.logs.getLast().severity) {
				case 'S':
				case 'W':
				case 'E':
					NavigationView.toggleQuickActions(true, this.quickViewLogsButton, this.quickViewLogsElement);
					break;
			}
		}

		if(this.innerView !== null) {
			this.innerView.trigger(that, event);
		}

		this.logsView.trigger(that, event);
		this.logoutView.trigger(that, event);
	}
}
