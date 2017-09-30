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

		if(state.hasContent()) {
			preset = state.getAll();
		}

		this.el.appendChild(document.getElementById("template-search").content.cloneNode(true));
		this.controlsElement = this.el.querySelector('.searchbuttons');

		/** Maps an element of the search controls to its SearchPair.
		 *  @type {Map.<Node|HTMLElement,SearchView.SearchPair>}
		 */
		this.searchPairs = new Map();
		/** @type {Set.<string>} */
		this.searchKeys = new Set();

		try {
			this.presetPairs(preset);
		} catch(e) {
			this.logs.add(e.message, 'E');
		}
		for(let control of this.searchPairs.keys()) {
			this.controlsElement.appendChild(control);
		}
	}

	/**
	 *
	 * @param {string[]} preset
	 */
	presetPairs(preset) {
		if(preset.length % 2 === 1) {
			throw new Error("Search fields must be even, odd number of fields (" + preset.length + ") given");
		}

		while(preset.length >= 2) {
			let key = preset[preset.length - 2], value = preset[preset.length - 1];

			try {
				let pair = new SearchView.SearchPair(key, value, this.searchKeys.has(key));

				this.searchKeys.add(key);
				this.searchPairs.set(pair.element, pair);
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

Object.defineProperty(SearchView, 'SearchPair', {
	/**
	 * @private
	 */
	value: class SearchPair {
		constructor(key, value, duplicate) {
			switch(key) {
				case 'Location':
					if(typeof value !== "string" || value === "") {
						throw new Error(" Location must be a non-empty string, " + value + " given");
					}
					break;
				case 'Search':
					// TODO: new SearchTriplet, stuff=things, asd>90001, etc...
					break;
				case 'Sort':
					if(duplicate) {
						throw new Error("Duplicate key: Sort");
					}
					// TODO: +stuff,-things, etc...
					break;
				case 'Depth':
				case 'Parent':
					if(duplicate) {
						throw new Error("Duplicate key: " + key);
					}
					value = parseInt(value);
					if(Number.isNaN(value) || value < 0) {
						throw new Error(key + " must be a positive integer, " + value + " given");
					}
					break;
				default:
					throw new Error("Unexpected search key: " + key);
			}
			this.key = key;
			this.value = value;

			this.element = this.createTextBox();
		}

		createTextBox() {
			let control = document.createElement("div");
			control.classList.add("control");
			control.appendChild(document.getElementById("template-control-textbox").content.cloneNode(true));
			control.querySelector('label').firstChild.textContent = this.key + ': '; // TODO: something better.
			control.querySelector('label input').value = this.value;

			return control;
		}
	},
	writable: false,
	enumerable: true,
	configurable: false
});
