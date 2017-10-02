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
	 * @param {stateHolder} state - Current state
	 * @param {Search|null} preset - Set this Search, but don't actually search anything. Will be discarded if state contains anything significant.
	 */
	constructor(element, logs, state, preset) {
		super(element);

		this.state = state;
		this.logs = logs;

		/** Maps an element of the search controls to its SearchPair.
		 *  @type {Map.<Node|HTMLElement,Search.Pair>} */
		this.elementsPairs = new WeakMap();
		/** Nodes that don't exist in Search (yet), mapped to their key
		 *  @type {WeakMap.<Node|HTMLElement, string>} */
		this.elementsUnpaired = new WeakMap();

		this.el.appendChild(document.getElementById("template-search").content.cloneNode(true));
		this.controlsElement = this.el.querySelector('.searchcontrols');
		this.buttonsElement = this.el.querySelector('.searchbuttons');
		this.searchButton = this.el.querySelector('.searchbutton');

		this.searchButton.addEventListener('click', this.searchButtonClick.bind(this));
		this.buttonsElement.addEventListener('click', this.addButtonClick.bind(this));
		this.controlsElement.addEventListener('focusout', this.handleSearchControlsFocus.bind(this));

		if(preset instanceof Search && !this.state.hasContent()) {
			this.search = preset;
		} else {
			this.search = new Search();
		}
	}

	/**
	 * @param {Search} to
	 */
	set search(to) {
		this._search = to;
		this.render();
		this.toggleSearchButton(to.hasContent());
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
	 */
	searchButtonClick() {
		this.inRequest(true);
		// setAllAray fires an event before returning, this has to be set before calling setAllArray so that trigger can notice it
		this.searchCommit = true;
		let changed = this.state.setAllArray(this.search.serialize());
		if(!changed) {
			this.searchCommit = false;
			this.doSearch();
		}
	}

	/**
	 * Handle clicking on any of the "add search key" buttons
	 *
	 * @param {Event} event
	 */
	addButtonClick(event) {
		if(event.target.nodeName === "BUTTON") {
			event.stopPropagation();
			let key = event.target.dataset.key;
			if(!Search.Pair.canDuplicate(key)) {
				let duplicate = false;
				if(this.search.containsKey(key)) {
					duplicate = true;
				} else {
					let controls = this.controlsElement.querySelectorAll('.control');
					for(let control of controls) {
						if(this.elementsUnpaired.get(control) === key) {
							duplicate = true;
							break;
						}
					}
				}
				if(duplicate) {
					this.logs.add('Cannot add duplicate key ' + key, 'W');
					return;
				}
			}
			let control = SearchView.createTextBox(key, null);
			this.controlsElement.appendChild(control);
			this.elementsUnpaired.set(control, key);
		}
	}

	/**
	 * Handle unfocusing stuff (textboxes, and hopefully dropdowns) in controls area.
	 *
	 * @param {Event} event
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
					this.addPair(newPair, control);
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
	 * Create textboxes for current search keys and display them
	 */
	render() {
		while(this.controlsElement.lastChild) {
			this.controlsElement.removeChild(this.controlsElement.lastChild);
		}

		for(let pair of this.search.pairs) {
			this.addPair(pair);
		}

		this.toggleSearchButton(this.search.hasContent());
	}

	/**
	 * Add a Pair to current page, display it, place it into the map.
	 * Removing is unnecessary since it's a weakmap, just delete the element from the page.
	 *
	 * @param {Search.Pair} pair - a real & true Pair, as recognized by international laws and by Search (i.e. it must be in this.search.pairs)
	 * @param {Node|HTMLElement|null} control=null - current element. Will be created if null.
	 */
	addPair(pair, control = null) {
		if(!this.search.pairs.has(pair)) {
			// noinspection JSUnresolvedVariable
			throw new Error("Cannot add pair (" + pair.key + " : " + pair.value + ") to SearchView since it doesn't exist in Search");
		}

		if(control === null) {
			// noinspection JSUnresolvedVariable
			control = SearchView.createTextBox(pair.key, pair.value);
			this.controlsElement.appendChild(control);
		} else {
			this.elementsUnpaired.delete(control);
		}
		this.elementsPairs.set(control, pair);
	}

	/**
	 * Create a simple textbox with a label.
	 *
	 * @param {string} key
	 * @param {string|null} value
	 * @return {Element}
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

	doSearch() {
		if(!this.search.hasContent()) {
			throw new Error("Trying to do an empty search");
		}
		// TODO: XHR + wait for results (or let Search do this?)
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
	 * Show/hide search button.
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
				case 'add-content':
					this.toggleSearchButton(true);
					break;
				case 'remove-content':
					this.toggleSearchButton(false);
					break;
			}
		}
	}
}
