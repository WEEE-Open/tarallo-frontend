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
	 * @param {stateHolder} state - Current state
	 * @param {string[]|[]|null} preset - Set these search fields, but don't actually search anything. Will be discarded if state contains anything significant.
	 */
	constructor(element, state, preset) {
		super(element);

		this.state = state;
		if(state.hasContent()) {
			preset = state.getAll();
		}

		this.pairs = new Map();
		this.presetPairs(preset);
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
			let pair = new this.SearchPair(preset[preset.length - 2], preset[preset.length - 1]);
			this.pairs.set(pair.element, pair);
			preset.pop();
			preset.pop();
		}
	}

	trigger(that, event) {
		if(that instanceof stateHolder && this.state.equals(that)) {

		}
	}
}

Object.defineProperty(SearchView.SearchPair, 'features', {
	/**
	 * @private
	 */
	value: class SearchPair {
		constructor(key, value) {
			switch(key) {
				case 'Location':
					if(typeof value !== "string" || value === "") {
						throw new TypeError(" Location must be a non-empty string, " + value + " given");
					}
					break;
				case 'Search':
					// TODO: new SearchTriplet, stuff=things, asd>90001, etc...
				case 'Sort':
					// TODO: +stuff,-things, etc...
				case 'Depth':
				case 'Parent':
					value = parseInt(value);
					if(Number.isNaN(value) || value < 0) {
						throw new TypeError(key + " must be a positive integer, " + value + " given");
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
			let element = document.createElement("div");
			element.classList.add("control");


			return element;
		}
	},
	writable: false,
	enumerable: true,
	configurable: false
});
