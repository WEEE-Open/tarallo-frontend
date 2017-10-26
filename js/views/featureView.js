class FeatureView extends Framework.View {
	/**
	 * @param {Element} el - a div
	 * @param {Translations} translations
	 * @param {Logs} logs
	 * @param {Item} item
	 * @param {string} name - internal feature name
	 * @param {string} value - internal feature value
	 * @see FeatureView.factory
	 * @private
	 */
	constructor(el, translations, logs, item, name, value) {
		super(el);
		this.id = FeatureView.nextId();
		this.logs = logs;
		this.translations = translations;
		this.item = item;

		this.label = this.createLabel();
		this.input = this.createInput();

		this.name = name;
		this.value = value;
		this.setLabelTranslated();

		this.el.appendChild(this.label);
		this.el.appendChild(this.input);
	}

	set value(to) {
		/**
		 * Internal value, always updated in real-time (well, sort of)
		 * @see this.value
		 * @type {string|null}
		 * @protected
		 */
		this.internalValue = to;
		this.writeValue(this.renderValue());
		let old = this.item.features.get(this.name);
		if(typeof old === 'undefined') {
			return;
		}
		if(old === null && to === null) {
			return;
		}
		if((old !== null && to !== null) && to.toString() === old.toString()) {
			return;
		}
		this.item.setFeature(this.name, to);
		console.log('Set internal: ' + to);
	}

	get value() {
		return this.internalValue;
	}

	//get renderedValue() {
	//	return this.renderValue();
	//}

	/**
	 * Create the right FeatureView for the situation
	 *
	 * @param {Element} el - a div
	 * @param {Translations} translations
	 * @param {Logs} logs
	 * @param {Item} item
	 * @param {string} name - internal feature name
	 * @param {string} value - internal feature value
	 * @return {FeatureView|FeatureViewUnit}
	 */
	static factory(el, translations, logs, item, name, value) {
		if(name.endsWith('-byte') || name.endsWith('-decibyte') || name.endsWith('-hz')) {
			return new FeatureViewUnit(el, translations, logs, item, name, value);
		} else if(Array.isArray(FeatureViewList.lists[name])) {
			return new FeatureViewList(el, translations, logs, item, name, value);
		} else {
			return new FeatureView(el, translations, logs, item, name, value);
		}
	}

	/**
	 * Handler for inputting anything in the feature box (set/change value)
	 * Empty input counts as no feature.
	 *
	 * @protected
	 */
	featureInput() {
		let value = this.readValue();
		if(value === "") {
			this.value = null;
		} else {
			this.value = value;
		}
	}

	/**
	 * Generate an unique id.
	 *
	 * @return {string}
	 * @private
	 */
	static nextId() {
		return 'feature' + FeatureView.idCounter++;
	}

	/**
	 * Set label text content
	 *
	 * @param {string} text
	 * @protected
	 */
	setLabel(text) {
		this.label.textContent = text;
	}

	/**
	 * Set label text content from translations
	 *
	 * @private
	 */
	setLabelTranslated() {
		this.setLabel(this.translations.get(this.name, this.translations.features));
	}

	/**
	 * Read value from HTML
	 *
	 * @return {string}
	 */
	readValue() {
		return this.input.value;
	}

	/**
	 * Put value into HTML input textbox
	 *
	 * @param {string} value
	 */
	writeValue(value) {
		this.input.value = value;
	}

	renderValue() {
		if(this.internalValue === null) {
			return '';
		} else {
			return this.internalValue;
		}
	}

	/**
	 * Create the input field that has to be place next to the label.
	 *
	 * @protected
	 */
	createInput() {
		let input = document.createElement("input");
		input.classList.add("value");
		input.classList.add("freezable");
		input.id = this.id;
		input.addEventListener('blur', this.featureInput.bind(this));
		return input;
	}

	/**
	 * Create a label for the input and return it.
	 *
	 * @return {Element}
	 * @protected
	 */
	createLabel() {
		let label = document.createElement("label");
		label.classList.add("name");
		label.htmlFor = this.id;
		return label;
	}

	trigger(that, event) {
		if(that === this.translations && event === 'change') {
			this.setLabelTranslated();
		}
	}
}

/**
 * Static counter used to generate IDs
 *
 * @type {int}
 * @private
 */
FeatureView.idCounter = 0;

class FeatureViewUnit extends FeatureView {
	/**
	 * Get feature type from name. Null if none (free text)
	 *
	 * @return {string|null}
	 * @protected
	 */
	parseType() {
		if(this.name.endsWith('-byte')) {
			return 'byte';
		} else if(this.name.endsWith('-hz')) { // TODO: change to -hertz on the server
			return 'hertz';
		} else if(this.name.endsWith('-decibyte')) {
			return 'decibyte';
		} else {
			throw new Error(this.name + ' isn\'t a valid FeatureViewUnit feature name')
		}
	}

	/**
	 * Get unit prefix. 0 is none.
	 *
	 * @param int - 0 to 4
	 * @return {string}
	 */
	static unitPrefix(int) {
		switch(int) {
			case 0:
				return '';
			case 1:
				if(this.type === 'byte') {
					return 'K';
				} else {
					return 'k';
				}
			case 2:
				return 'M';
			case 3:
				return 'G';
			case 4:
				return 'T';
			case 5:
				return 'P';
			case 6:
				return 'E';
		}
		throw new Error('Invalid SI prefix');
	}

	/**
	 * Convert value to human-readable format
	 */
	renderValue() {
		if(this.value === null) {
			return '';
		}
		if(typeof this.type === 'undefined') {
			this.type = this.parseType();
		}
		let value = parseInt(this.value);
		let prefix = 0;
		switch(this.type) {
			case null:
			default:
				throw new Error('Unknown type ' + this.type + ' in FeatureViewUnit');
			case 'byte':
				while(value >= 1024 && prefix <= 6) {
					value /= 1024; // this SHOULD be optimized internally to use bit shift
					prefix++;
				}
				let i = '';
				if(prefix > 0) {
					i = 'i';
				}
				return '' + value + ' ' + FeatureViewUnit.unitPrefix(prefix) + i +'B';
				break;
			case 'decibyte':
				return FeatureViewUnit.addUnit(value, 'B');
				break;
			case 'hertz':
				return FeatureViewUnit.addUnit(value, 'Hz');
				break;
		}
	}

	/**
	 * Reduce a number to 3 digits (+ decimals) and add a unit to it
	 *
	 * @param {int} value
	 * @param {string} unit
	 * @return {string} "3.2 MHz" and the like
	 */
	static addUnit(value, unit) {
		let prefix = 0;
		while(value >= 1000 && prefix <= 6) {
			value /= 1000;
			prefix++;
		}
		return '' + value + ' ' + FeatureViewUnit.unitPrefix(prefix) + unit;
	}

	// noinspection JSUnusedGlobalSymbols: overrides another function only called in an event handler, so PHPStorm doesn't understand there may be the remote possibility of this function being actually called
	featureInput() {
		let value = this.readValue();
		try {
			this.value = this.parseUnit(value);
		} catch(e) {
			this.logs.add(e.message, 'E');
		}
	}

	/**
	 * Parse input (from HTML) and convert to internal value.
	 *
	 * @param {string} input - a non-empty string
	 * @throws Error if input is in wrong format
	 * @private
	 */
	parseUnit(input) {
		/** @type {string} */
		let string = input.trim();
		if(string === "") {
			return null;
		}
		let i;
		for(i = 0; i < string.length; i++) {
			if (!((string[i] >= '0' && string[i] <= '9') || string[i] === '.' || string[i] === ',')) {
				break;
			}
		}
		if(i === 0) {
			throw new Error('"' + string + '" should start with a positive number');
		}
		let number = parseFloat(string.substr(0, 0 + i));
		if(isNaN(number)) {
			throw new Error('Cannot parse ' + string.substr(0, 0 + i) + ' as a number')
		}
		let exp = 0;
		for(; i < string.length; i++) {
			let lower = string[i].toLowerCase();
			if(lower >= 'a' && lower <= 'z') {
				exp = FeatureViewUnit.parsePrefix(lower);
				break;
			}
		}
		let base;
		if(this.type === 'byte') {
			base = 1024;
		} else {
			base = 1000;
		}
		return number * (base ** exp);
	}

	/**
	 * Parse the unit prefix and return exponent (or 0 if it isn't a prefix)
	 *
	 * @param {string} char - lowercase character
	 * @returns {number} exponent
	 */
	static parsePrefix(char) {
		switch(char) {
			case 'k':
				return 1;
			case 'm':
				return 2;
			case 'g':
				return 3;
			case 't':
				return 4;
			case 'p':
				return 5;
			case 'e':
				return 6;
			default:
				return 0;
		}
	}
}

class FeatureViewList extends FeatureView {
	// noinspection JSUnusedGlobalSymbols it's used and overrides another method
	createInput() {
		if(!Array.isArray(FeatureViewList.lists[this.name])) {
			throw new Error('No elements for ' + this.name + ' in FeatureViewList')
		}
		let input = document.createElement("select");
		input.classList.add("value");
		input.classList.add("freezable");
		input.id = this.id;
		let translations = [];
		let translationMap = new Map(); // TODO: memoize
		for(let value of FeatureViewList.lists[this.name]) {
			let translated = this.translations.get(value, Translations.featuresList);
			translations.push(translated);
			translationMap.set(translated, value);
		}
		// TODO: does this work?
		for(let translated of translations.sort()) {
			let option = document.createElement("option");
			option.value = translationMap.get(translated);
			option.textContent = translated;
			input.appendChild(option);
		}

		input.addEventListener('blur', this.featureInput.bind(this)); // TODO: another event?
		return input;
	}

	featureInput() {
		//TODO: reimplement
		let value = this.readValue();
		if(value === "") {
			this.value = null;
		} else {
			this.value = value;
		}
	}

	writeValue(value) {
		//TODO: reimplement
	}

	readValue() {
		//TODO: reimplement?
		return this.input.value;
	}
}

Object.defineProperty(FeatureViewList, 'lists', {
	enumerable: true,
	configurable: false,
	writable: false,
	value: {
		'motherboard-form-factor': new Set(['atx', 'miniatx', 'microatx', 'miniitx', 'proprietary']),
		'type': new Set(['location', 'case', 'cpu', 'ram', 'motherboard', 'psu', 'hdd', 'odd', 'fdd', 'graphics-card', 'ethernet-card', 'modem-card', 'sound-card', 'other-card', 'card-adapter', 'keyboard', 'mouse', 'monitor', 'printer', 'scanner', 'switch', 'hub', 'modem-router', 'access-point', 'adapter', 'other']),
	}
});
