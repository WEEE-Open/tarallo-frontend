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

		/** Subviews of Pair
		 *  @type {Set.<PairView>} */
		this.pairViews = new Set();
		/** Subviews of Item
		 *  @type {Set.<Framework.View>} */
		this.itemViews = new Set();

		this.useComputerView = false;

		this.el.appendChild(document.getElementById("template-search").content.cloneNode(true));
		this.controlsElement = this.el.querySelector('.searchcontrols');
		this.buttonsElement = this.el.querySelector('.searchbuttons');
		this.searchButton = this.el.querySelector('.searchbutton');
		this.resultsElement = this.el.querySelector('.results');
		this.compactViewCheckbox = this.el.querySelector('.usecompactview');

		this.searchButton.addEventListener('click', this.searchButtonClick.bind(this));
		this.buttonsElement.addEventListener('click', this.searchGroupButtonClick.bind(this));
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
	 * (which also remove them, actually)
	 *
	 * @param {Event} event
	 * @private
	 */
	searchGroupButtonClick(event) {
		if(event.target.nodeName === "BUTTON") {
			let key = event.target.dataset.key;
			let pairView;
			if(!SearchPair.canDuplicate(key) && (pairView = this.findPairViewFor(key)) !== null) {
				// TODO: once server supports it completely, add multiple fields instead of removing them
				//this.logs.add('Cannot add duplicate key ' + key, 'W');
				//pairView.focus();
				this.pairViews.delete(pairView);
				this.controlsElement.removeChild(pairView.el);
				this.search.set(pairView.pair, null);
			} else {
				this.showPair(this.search.newPair(key, null));
			}
		}
	}

	/**
	 * Find SearchPairView for a given search key, by scanning through current search pairs.
	 * This is needed because empty SearchPairs may be not present in Search.
	 *
	 * @param {string} key
	 * @return {PairView} view or null if not found
	 * @private
	 */
	findPairViewFor(key) {
		for(let pairView of this.pairViews) {
			if(pairView.pair.key === key) {
				return pairView;
			}
		}
		return null;
	}

	/**
	 * Handle clicking on the "use compact view" checkbox
	 *
	 * @private
	 */
	compactViewClick() {
		this.useComputerView = this.compactViewCheckbox.checked;
	}

	/**
	 * Remove unpaired controls from page.
	 *
	 * @private
	 */
	removeUnpairedControls() {
		for(let pairView of this.pairViews) {
			if(!this.search.pairs.has(pairView.pair)) {
				this.controlsElement.removeChild(pairView.el);
				this.pairViews.delete(pairView);
			}
		}
	}

	/**
	 * Create textboxes for current search keys and display them
	 *
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
	 *
	 * @param {SearchPair} pair
	 * @private
	 */
	showPair(pair) {
		let view;
		switch(pair.key) {
			case 'Search':
			case 'Parent':
				view = new SearchPairView(this.search, pair, this.logs, this.translations);
				break;
			case 'Sort':
				view = new SortPairView(this.search, pair, this.logs, this.translations);
				break;
			case 'Depth':
				view = new DepthPairView(this.search, pair, this.logs, this.translations);
				break;
			case 'Location':
			case 'Code':
				view = new LocationPairView(this.search, pair, this.logs, this.translations);
				break;
			default:
				throw new Error('No PairView for key ' + pair.key);
		}
		this.pairViews.add(view);
		this.controlsElement.appendChild(view.el);
		view.focus();
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
			this.itemViews.add(view);
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
	 * Enable/disable search button.
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
				pair = search.newPair(key, value);
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
					if(Array.isArray(results) && results.length > 0) {
						this.logs.add('Search done, ' + results.length + ' items found', 'S');
						this.displayResults(results);
					} else {
						this.logs.add('Search done but lost results along the way somehow (this is a bug)', 'W');
					}
					break;
				case 'failed':
					this.inRequest(false);
					if(this.search.lastErrorCode === 'not-found') {
						this.logs.add('Search done, nothing found', 'S');
					} else {
						this.logs.add('Search failed (' + this.search.lastErrorCode + '): ' + this.search.lastErrorMessage, 'E');
					}
					break;
			}
		}

		for(let subview of this.itemViews) {
			subview.trigger(that, event);
		}
	}
}

class PairView extends Framework.View {
	/**
	 * @param {Search} search
	 * @param {SearchPair} pair
	 * @param {Logs} logs
	 * @param {Translations} translations
	 */
	constructor(search, pair, logs, translations) {
		let el = document.createElement('div');
		el.classList.add("control");
		super(el);
		this.search = search;
		this.pair = pair;
		this.logs = logs;
		this.translations = translations;
	}

	/**
	 * Focus the input area.
	 */
	focus() {}

	/**
	 * Serialize to string, e.g. Location = Tavolo becomes "Tavolo" (will be placed inside the URL, like "/Location/Tavolo/")
	 *
	 * @return {string}
	 */
	toString() {
		return 'Implement-this';
	}
}

class LocationPairView extends PairView {
	constructor(search, pair, logs, translations) {
		super(search, pair, logs, translations);

		this.el.appendChild(document.getElementById("template-control-textbox").content.cloneNode(true));

		this.inputElement = this.el.querySelector('label input');
		this.inputElement.value = this.pair.value;
		this.el.querySelector('label').firstChild.textContent = this.pair.key + ': '; // TODO: something better.

		this.inputElement.addEventListener('blur', this.parseInput.bind(this));
	}

	parseInput() {
		let value = this.inputElement.value.trim();
		//if(typeof value !== "string") {
		//	this.logs.add("Location must be a string", 'E');
		//	this.inputElement.value = this.pair.value === null ? '' : this.pair.value;
		//} else if(value === "") {
		if(value === "") {
			this.search.set(this.pair, null);
		} else {
			this.search.set(this.pair, value);
		}
	}

	focus() {
		this.inputElement.focus();
	}

	toString() {
		return this.pair.value;
	}
}

class SearchPairView extends PairView {
	constructor(search, pair, logs, translations) {
		super(search, pair, logs, translations);

		/**
		 * @type {Map.<FeatureView,Element>}
		 * @private
		 */
		this.featureViews = new Map();
		if(typeof this.pair.value === 'string') {
			this.parseTriplets(this.pair.value);
		}

		this.el.appendChild(document.getElementById("template-control-search").content.cloneNode(true));
		this.featureSelect = this.el.querySelector('.featureselect');
		this.addFeatureButton = this.el.querySelector('.addfeaturebutton');
		this.featuresArea = this.el.querySelector('.features');

		this.addFeatureButton.addEventListener('click', this.addFeatureClick.bind(this));
		this.featuresArea.addEventListener('focusout', this.parseInput.bind(this)); // fires after leaving any textbox, but apparently there's no other way

		this.clearFeatures(); // not really useful
		this.createFeaturesList();
	}

	/**
	 * Handler for the "add" feature search button
	 *
	 * @private
	 */
	addFeatureClick() {
		this.addFeature(this.featureSelect.value, null);
	}

	/**
	 * Handle any significant input in search area
	 */
	parseInput() {
		let stringified = this.toString();
		this.search.set(this.pair, stringified === '' ? null : stringified);
	}

	focus() {
		this.featureSelect.focus();
	}

	/**
	 * Create list of searchable features
	 *
	 * @private
	 */
	createFeaturesList() {
		for(let [name, translated] of Features.getFeatures(this.translations)) {
			let option = document.createElement('option');
			option.value = name;
			option.textContent = translated;
			this.featureSelect.appendChild(option);
		}
	}

	/**
	 * Clear all features
	 *
	 * @private
	 */
	clearFeatures() {
		while(this.featuresArea.lastElementChild) {
			this.featuresArea.removeChild(this.featuresArea.lastElementChild);
		}
		this.featureViews.clear();
	}

	/**
	 * Create and append feature search fields
	 *
	 * @param {string} name - feature name
	 * @param {string} [comparison] - <, >, =.
	 * @param {string|null} [value] - feature value
	 * @private
	 */
	addFeature(name, comparison = '=', value = null) {
		let newElement = this.createFeatureElement(name, comparison, value);
		this.featuresArea.appendChild(newElement);
	}

	/**
	 * Create new feature element.
	 *
	 * @param {string} name - feature name
	 * @param {string} [comparison] - <, >, =.
	 * @param {string|null} [value] - feature value
	 * @return {Element}
	 * @private
	 */
	createFeatureElement(name, comparison = '=', value = null) {
		let newElement, deleteButton;
		newElement = document.createElement("div");
		newElement.classList.add("feature");

		deleteButton = document.createElement("button");
		deleteButton.textContent = "X";

		newElement.appendChild(deleteButton);
		let view = FeatureView.factory(newElement, this.translations, this.logs, null, name, value);
		this.featureViews.set(view, newElement);

		deleteButton.addEventListener('click', this.deleteFeatureClick.bind(this, view));

		let select = document.createElement('select');
		let selected = false;
		select.classList.add('operatorselector');
		if(!(view instanceof FeatureViewUnit)) {
			select.disabled = true;
		}
		for(let operator of ['>', '<', '=']) {
			let option = document.createElement('option');
			option.value = operator;
			option.textContent = operator;
			if(!selected && (comparison === operator || operator === '=')) {
				option.selected = true;
				selected = true;
			}
			select.appendChild(option);
		}
		newElement.insertBefore(select, view.label.nextElementSibling);

		return newElement;
	}


	/**
	 * Handler for clicking the feature delete button
	 *
	 * @param {FeatureView} featureView
	 * @private
	 */
	deleteFeatureClick(featureView) {
		this.removeFeature(featureView);
	}

	/**
	 * Removes feature from the search area.
	 *
	 * @param {FeatureView} featureView -
	 * @private
	 */
	removeFeature(featureView) {
		this.featuresArea.removeChild(featureView.el);
		this.featureViews.delete(featureView);
	}

	/**
	 * Read a string of triplets, create views.
	 *
	 * @param {string} string - stuff=things,whatever>99,...
	 * @private
	 */
	parseTriplets(string) {
		if(typeof string !== 'string') {
			return;
		}
		this.triplets = [];
		for(let tripletString of string.split(',')) {
			let triplet = null;
			for(let operator of ['>', '<', '=']) {
				if(tripletString.indexOf(operator) > -1) {
					let pieces = tripletString.split(operator, 2);
					triplet = this.addFeature(pieces[0], operator, pieces[1].toString());
					break;
				}
			}
			if(triplet === null) {
				throw new TypeError(tripletString + ' isn\'t a valid search triplet');
			} else {
				triplet = null;
			}
		}
	}

	toString() {
		let result = '';
		for(let [view, element] of this.featureViews) {
			if(view.value !== null) {
				let operator = element.querySelector('.operatorselector').value;
				result += view.name + operator + view.value + ',';
			}
		}
		if(result.length > 0) {
			result = result.substr(0, result.length - 1);
		}
		return result;
	}
}

class SortPairView extends PairView {

}

class DepthPairView extends PairView {
	// case 'Depth':
	// value = parseInt(value);
	// if(Number.isNaN(value) || value < 0) {
	// 	throw new Error(this.key + " must be a positive integer, " + value + " given");
	// }
	// break;
}
