/**
 * Search for items: show controls and textboxes and buttons, fetch results, display them inside an ItemLocationView
 *
 * @see ItemLocationView
 * @see ItemView
 */
class SearchView extends Framework.View {
	/**
	 * Search for items: show controls and textboxes and buttons, fetch results, display them inside an ItemLocationView
	 *
	 * @see ItemLocationView
	 * @see ItemView
	 * @param {HTMLElement} element - An element where controls and results will be placed
	 * @param {Logs} logs - Logs for logging logs of logs logging logs
	 * @param {Translations} translations - Translations
	 * @param {Transaction} transaction - Used by Item(Location)View when editing
	 * @param {stateHolder} state - Current state
	 * @param {Search|null} preset - Set this Search, but don't actually search anything. Will be discarded if state contains anything significant.
	 */
	constructor(element, logs, translations, transaction, state, preset) {
		super(element);

		this.state = state;
		this.logs = logs;
		this.translations = translations;
		this.transaction = transaction;

		/** Maps an element of the search controls to its SearchPair.
		 *  @type {Map.<Node|HTMLElement,Search.Pair>} */
		this.elementsPairs = new WeakMap();
		/** @type {Set.<Framework.View>} */
		this.subviews = new Set();

		this.useComputerView = false;

		this.el.appendChild(document.getElementById("template-search").content.cloneNode(true));
		this.controlsElement = this.el.querySelector('.searchcontrols');
		this.buttonsElement = this.el.querySelector('.searchbuttons');
		this.searchButton = this.el.querySelector('.searchbutton');
		this.resultsElement = this.el.querySelector('.results');
		this.compactViewCheckbox = this.el.querySelector('.usecompactview');

		this.searchButton.addEventListener('click', this.searchButtonClick.bind(this));
		this.buttonsElement.addEventListener('click', this.addButtonClick.bind(this));
		this.controlsElement.addEventListener('focusout', this.handleSearchControlsFocus.bind(this));
		this.compactViewCheckbox.addEventListener('click', this.compactViewClick.bind(this));

		// Read checkbox status
		this.compactViewClick();
		if(preset instanceof Search && !this.state.hasContent()) {
			this.search = preset;
		} else {
			this.search = new Search();
		}
	}

	/**
	 * @param {Search} to
	 * @private
	 */
	set search(to) {
		this._search = to;
		this.render();
	}

	/**
	 * @return {Search}
	 */
	get search() {
		return this._search;
	}

	/**
	 * Handle clicking on the search button.
	 * Sets the URL and waits for the StateHolder "change" event. If URL is actually unchanged, calls this.doSearch directly.
	 * Empty search fields are also deleted, and nothing is done if no valid search fields remained.
	 *
	 * @private
	 */
	searchButtonClick() {
		this.removeUnpairedControls();

		if(this.search.hasContent()) {
			// setAllAray fires an event before returning, this has to be set before calling setAllArray so that trigger can notice it
			this.searchCommit = true;
			let changed = this.state.setAllArray(this.search.serialize());
			if(!changed) {
				this.searchCommit = false;
				this.doSearch();
			}
		}
	}

	/**
	 * Handle clicking on any of the "add search key" buttons
	 *
	 * @param {Event} event
	 * @private
	 */
	addButtonClick(event) {
		if(event.target.nodeName === "BUTTON") {
			event.stopPropagation();
			let key = event.target.dataset.key;
			if(!Search.Pair.canDuplicate(key) && this.search.containsKey(key)) {
				this.logs.add('Cannot add duplicate key ' + key, 'W');
				return;
			}
			let control = SearchView.createTextBox(key, null);
			this.controlsElement.appendChild(control);
		}
	}

	compactViewClick() {
		this.useComputerView = this.compactViewCheckbox.checked;
	}

	/**
	 * Handle unfocusing stuff (textboxes, and hopefully dropdowns) in controls area.
	 *
	 * @param {Event} event
	 * @private
	 */
	handleSearchControlsFocus(event) {
		/** @type {HTMLElement|EventTarget} */
		let control = event.target;
		while(!control.classList.contains('control') && control.parentNode) {
			control = control.parentNode;
		}
		if(!control.parentNode) {
			return;
		}
		event.stopPropagation();
		// TODO: use elementsPairs/elementsUnpaired to get key, determine which kind of textbox it is, query selectors accordingly
		let box = control.querySelector('input');
		let value = box.value;
		if(value === '') {
			// delete search keys
			if(this.elementsUnpaired.has(control)) {
				this.elementsUnpaired.delete(control);
			} else if(this.elementsPairs.has(control)) {
				this.search.remove(this.elementsPairs.get(control));
			} else {
				this.logs.add("Last removed search key was never created, apparently (this is a bug)", 'W');
			}
			this.controlsElement.removeChild(control);
		} else {
			// add/modify search keys
			let prev = '';
			if(this.elementsUnpaired.has(control)) {
				// promote that pair!
				let newPair = null;
				try {
					newPair = this.search.add(this.elementsUnpaired.get(control), value);
					this.showPair(newPair, control);
				} catch(e) {
					this.logs.add(e.message, 'E');
					// TODO: rollback also depends on textbox type, make a function and use it here
					box.value = prev;
					// avoid broken half-states
					if(newPair !== null) {
						this.search.remove(newPair);
					}
				}
			} else if(this.elementsPairs.has(control)) {
				// edit pair
				let pair = this.elementsPairs.get(control);
				prev = prev.value;
				try {
					pair.set(pair.key, value);
				} catch(e) {
					this.logs.add(e.message, 'E');
					// TODO: rollback thing
					box.value = prev;
				}
			} else {
				this.logs.add("That key didn't actually exist (this is a bug)", 'E');
				this.controlsElement.removeChild(control);
			}
		}
	}

	/**
	 * Remove unpaired controls from page.
	 */
	removeUnpairedControls() {
		for(let [element, pair] of this.elementsPairs) {
			if(!this.search.pairs.has(pair)) {
				this.controlsElement.removeChild(element);
			}
		}
	}

	/**
	 * Create textboxes for current search keys and display them
	 * @private
	 */
	render() {
		while(this.controlsElement.lastChild) {
			this.controlsElement.removeChild(this.controlsElement.lastChild);
		}

		for(let pair of this.search.pairs) {
			this.showPair(pair);
		}
	}

	/**
	 * Add a Pair to current page, display it, place it into the map.
	 * Removing is unnecessary since it's a weakmap, just delete the element from the page.
	 *
	 * @param {Search.Pair} pair
	 * @param {Node|HTMLElement|null=null} control - current element. Will be created if null.
	 * @private
	 */
	showPair(pair, control = null) {
		if(control === null) {
			// noinspection JSUnresolvedVariable
			control = SearchView.createTextBox(pair.key, pair.value);
			this.controlsElement.appendChild(control);
		}
		this.elementsPairs.set(control, pair);
	}

	/**
	 * Create a simple textbox with a label.
	 *
	 * @param {string} key
	 * @param {string|null} value
	 * @return {Element}
	 * @private
	 */
	static createTextBox(key, value) {
		let control = document.createElement("div");
		control.classList.add("control");
		control.appendChild(document.getElementById("template-control-textbox").content.cloneNode(true));
		control.querySelector('label').firstChild.textContent = key + ': '; // TODO: something better.
		if(value !== null) {
			control.querySelector('label input').value = value;
		}

		return control;
	}

	/**
	 * Search. SEARCH. NOW.
	 * @private
	 */
	doSearch() {
		this.inRequest(true);
		this.clearResults();
		try {
			this.search.getFromServer();
		} catch(e) {
			this.logs.add(e.message, 'E');
			this.inRequest(false);
		}
	}

	/**
	 * Remove all results from display
	 *
	 * @private
	 */
	clearResults() {
		while(this.resultsElement.lastChild) {
			this.resultsElement.removeChild(this.resultsElement.lastChild);
		}
	}

	/**
	 * Remove all results from display
	 *
	 * @param {Item[]} results
	 * @private
	 */
	displayResults(results) {
		for(let item of results) {
			let container = document.createElement("div");
			this.resultsElement.appendChild(container);

			let view;
			if(this.useComputerView && item.features.get("type") === "case") {
				view = new ComputerView(container, item, this.translations, this.logs);
			} else {
				view = new ItemLocationView(container, item, this.translations, this.transaction, this.logs);
				view.freezeRecursive();
			}
			this.subviews.add(view);
		}
	}

	/**
	 * Basically disable the search button while results are loading.
	 *
	 * @param {boolean} state - true if there's a request going on, false otherwise
	 * @see NavigationView.inRequest - feeling a bit of déjà vu?
	 * @private
	 */
	inRequest(state) {
		this.toggleSearchButton(!state);
	}

	/**
	 * Enalbe/disable search button.
	 *
	 * @param {boolean} enabled
	 * @private
	 */
	toggleSearchButton(enabled) {
		this.searchButton.disabled = !enabled;
	}

	/**
	 * Put those strings into a Search!
	 *
	 * @param {string[]} pieces - StateHolder pieces or anything similar
	 * @return {Search}
	 * @private
	 */
	fromState(pieces) {
		let search = new Search();

		if(pieces.length % 2 === 1) {
			this.logs.add("Search key-values pairs must be even, odd number of pairs (" + pieces.length + ") given", 'E');
			return search;
		}

		while(pieces.length >= 2) {
			let key = pieces[pieces.length - 2], value = pieces[pieces.length - 1];
			let pair;
			try {
				pair = search.add(key, value);
			} catch(e) {
				this.logs.add(e.message, 'E');
				pair = null;
			}

			pieces.pop();
			pieces.pop();
		}

		return search;
	}

	trigger(that, event) {
		if(that instanceof stateHolder && this.state.equals(that)) {
			if(this.searchCommit) {
				this.searchCommit = false;
				this.doSearch();
			} else if(this.state.hasContent()) {
				this.search = this.fromState(this.state.getAll());
				this.doSearch();
			}
		} else // noinspection JSValidateTypes - PHPStorm decided that Search isn't a Framework.Object anymore, just because there's a getter
			if(that === this.search) {
			switch(event) {
				case 'success':
					this.inRequest(false);
					let results = this.search.results;
					if(results === null) {
						this.logs.add('Search done, nothing found', 'S');
					} else if(results.length === 0) {
						this.logs.add('Search done but lost results along the way somehow (this is a bug)', 'W');
					} else {
						this.logs.add('Search done, ' + results.length + ' items found', 'S');
						this.displayResults(results);
					}
					break;
				case 'failed':
					this.inRequest(false);
					this.logs.add('Search failed (' + this.search.lastErrorCode + '): ' + this.search.lastErrorMessage, 'E');
					break;
			}
		}

		for(let subview of this.subviews) {
			subview.trigger(that, event);
		}
	}
}
