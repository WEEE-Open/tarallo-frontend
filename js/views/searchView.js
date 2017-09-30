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
	 * @param {string[]|[]|null} preset - Set these search fields, but don't actually search anything. Will be discarded if state contains anything significant.
	 */
	constructor(element, logs, state, preset) {
		super(element);

		this.state = state;
		this.logs = logs;
		this.search = new Search();

		if(state.hasContent()) {
			preset = state.getAll();
		}

		this.el.appendChild(document.getElementById("template-search").content.cloneNode(true));
		this.controlsElement = this.el.querySelector('.searchbuttons');
		this.searchButton = this.el.querySelector('.searchbutton');

		this.searchButton.addEventListener('click', this.searchButtonClick.bind(this));

		/** Maps an element of the search controls to its SearchPair.
		 *  @type {Map.<Node|HTMLElement,Search.Pair>}
		 */
		this.pairs = new Map();

		try {
			this.presetPairs(preset, search);
		} catch(e) {
			this.logs.add(e.message, 'E');
		}

		for(let pair of this.search.pairs) {
			let control = SearchView.createTextBox(pair.key, pair.value);
			this.pairs.set(control, pair);
			this.controlsElement.appendChild(control);
		}
	}

	static createTextBox(key, value) {
		let control = document.createElement("div");
		control.classList.add("control");
		control.appendChild(document.getElementById("template-control-textbox").content.cloneNode(true));
		control.querySelector('label').firstChild.textContent = key + ': '; // TODO: something better.
		control.querySelector('label input').value = value;

		return control;
	}

	searchButtonClick() {
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
		this.searchButton.disabled = state;
	}

	/**
	 * Put those strings into a Search!
	 *
	 * @param {string[]} preset - StateHolder pieces or anything similar
	 * @param {Search} search - Search.
	 */
	presetPairs(preset, search) {
		if(preset.length % 2 === 1) {
			throw new Error("Search fields must be even, odd number of fields (" + preset.length + ") given");
		}

		while(preset.length >= 2) {
			let key = preset[preset.length - 2], value = preset[preset.length - 1];

			try {
				let pair = new SearchView.Pair(key, value, this.keys.has(key));

				this.keys.add(key);
				this.pairs.set(pair.element, pair);
			} catch(e) {
				this.logs.add(e.message, 'E');
			}

			preset.pop();
			preset.pop();
		}
	}

	trigger(that, event) {
		if(that instanceof stateHolder && this.state.equals(that)) {

		}
	}
}
