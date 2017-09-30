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
	 * @param {Search|null} preset - Set these search fields, but don't actually search anything. Will be discarded if state contains anything significant.
	 */
	constructor(element, logs, state, preset) {
		super(element);

		this.state = state;
		this.logs = logs;

		if(state.hasContent()) {
			this.search = this.fromState(state.getAll());
		} else if(preset instanceof Search) {
			this.search = preset;
		} else {
			this.search = new Search();
		}

		this.el.appendChild(document.getElementById("template-search").content.cloneNode(true));
		this.controlsElement = this.el.querySelector('.searchbuttons');
		this.searchButton = this.el.querySelector('.searchbutton');

		this.searchButton.addEventListener('click', this.searchButtonClick.bind(this));

		/** Maps an element of the search controls to its SearchPair.
		 *  @type {Map.<Node|HTMLElement,Search.Pair>}
		 */
		this.elementPairs = new Map();
		this.currentItems = null;
		this.requestedItems = null;

		for(let pair of this.search.pairs) {
			let control = SearchView.createTextBox(pair);
			this.elementPairs.set(control, pair);
			this.controlsElement.appendChild(control);
		}

		this.toggleSearchButton(this.search.hasContent());
	}

	/**
	 * Create a simple textbox with a label.
	 *
	 * @param {Search.Pair} pair - The mighty pair itself, which contains a key and a value due to its class nature, which PHPStorm can't fathom
	 * @param {string} pair.key - This has to be specified JUST BECAUSE.
	 * @param {string} pair.value - This has to be specified JUST BECAUSE.
	 * @return {Element}
	 */
	static createTextBox(pair) {
		let control = document.createElement("div");
		control.classList.add("control");
		control.appendChild(document.getElementById("template-control-textbox").content.cloneNode(true));
		control.querySelector('label').firstChild.textContent = pair.key + ': '; // TODO: something better.
		control.querySelector('label input').value = pair.value;

		return control;
	}

	searchButtonClick() {
		// TODO: set state, if unchanged (see return value) call function directly, else wait for event, then wait for items
		this.inRequest(true);
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
			this.logs.add("Search fields must be even, odd number of fields (" + pieces.length + ") given", 'E');
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

		} else if(that === this.search) {
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
