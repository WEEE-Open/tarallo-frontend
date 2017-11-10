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
		this.name = name;

		this.label = this.createLabel();
		this.input = this.createInput();

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
		if(typeof old !== 'undefined') {
			if(old === null && to === null) {
				return;
			}
			if((old !== null && to !== null) && to.toString() === old.toString()) {
				return;
			}
		}
		this.item.setFeature(this.name, to);
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
		if(name.endsWith('-byte') || name.endsWith('-decibyte') || name.endsWith('-hz') || name.endsWith('-ampere') || name.endsWith('-volt') || name.endsWith('-watt') || name.endsWith('-inch') || name.endsWith('-n')) {
			return new FeatureViewUnit(el, translations, logs, item, name, value);
		} else if(FeatureViewList.has(name)) {
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
		if(this.value === null) {
			return '';
		} else {
			return this.value;
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
			return 'Hz';
		} else if(this.name.endsWith('-decibyte')) {
			return 'B';
		} else if(this.name.endsWith('-n')) {
			return 'n';
		} else if(this.name.endsWith('-ampere')) {
			return 'A';
		} else if(this.name.endsWith('-volt')) {
			return 'V';
		} else if(this.name.endsWith('-watt')) {
			return 'W';
		} else if(this.name.endsWith('-inch')) {
			return 'in.';
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
	 *
	 * @private
	 */
	renderValue() {
		if(this.value === null) {
			return '';
		}
		if(typeof this.type === 'undefined') {
			this.type = this.parseType();
		}
		FeatureViewUnit.valueToPrintable(this.type, parseInt(this.value));
	}

	/**
	 * Convert that number into something printable
	 *
	 * @param {string} type - byte, Hz, V, W, etc...
	 * @param {int} value
	 * @returns {string}
	 */
	static valueToPrintable(type, value) {
		let prefix = 0;
		switch(type) {
			case 'n':
				return value.toString();
				break;
			case 'byte':
				while(value >= 1024 && prefix <= 6) {
					value /= 1024; // this SHOULD already be optimized internally to use bit shift
					prefix++;
				}
				let i = '';
				if(prefix > 0) {
					i = 'i';
				}
				return '' + value + ' ' + FeatureViewUnit.unitPrefix(prefix) + i +'B';
				break;
			default:
				return FeatureViewUnit.addUnit(value, type);
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
			this.value = this.value; // render old value
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
		} else if(this.type === 'n') {
			let number = parseInt(input);
			if(isNaN(number) || number <= 0) {
				throw new Error(input + " should be a positive integer")
			} else {
				return number;
			}
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
	constructor(el, translations, logs, item, name, value) {
		if(!FeatureViewList.has(name)) {
			throw new Error('No elements for ' + name + ' in FeatureViewList')
		}
		super(el, translations, logs, item, name, value);
	}

	getOptions() {
		let namesToMap;
		if(!FeatureViewList.sortedLists.has(this.translations.code)) {
			namesToMap = new Map();
			FeatureViewList.sortedLists.set(this.translations.code, namesToMap);
		} else {
			namesToMap = FeatureViewList.sortedLists.get(this.translations.code);
		}

		let sortedMap;
		if(namesToMap.has(this.name)) {
			return namesToMap.get(this.name);
		} else {
			sortedMap = new Map();
			namesToMap.set(this.name, sortedMap);
		}

		let translations = [];
		let translationMap = new Map();

		for(let value of FeatureViewList.lists[this.name]) {
			let translated = this.translations.get(value, this.translations.featuresList);
			translations.push(translated);
			translationMap.set(translated, value);
		}
		for(let translated of translations.sort()) {
			sortedMap.set(translationMap.get(translated), translated);
		}
		return sortedMap;
	}

	// noinspection JSUnusedGlobalSymbols it's used and overrides another method
	createInput() {
		let input = document.createElement("select");
		input.classList.add("value");
		input.classList.add("freezable");
		input.id = this.id;

		let first = document.createElement("option");
		first.value = "";
		input.appendChild(first);
		for(let [value, translation] of this.getOptions()) {
			let option = document.createElement("option");
			option.value = value;
			option.textContent = translation;
			input.appendChild(option);
		}

		input.addEventListener('change', this.featureInput.bind(this));
		return input;
	}

	static has(name) {
		return typeof FeatureViewList.lists[name] === 'object';
	}

	readValue() {
		let read = this.input.options[this.input.selectedIndex].value;
		if(read === "") {
			return null;
		} else {
			return read;
		}
	}

	renderValue() {
		return this.value;
	}

	writeValue(value) {
		if(value === null) {
			this.input.firstElementChild.selected = true;
		} else {
			this.input.querySelector('option[value="' + value + '"]').selected = true;
		}
	}
}
// An alternative:
// class FeatureViewType extends FeatureViewList {
// 	constructor(el, translations, logs, item, name, value) {
// 		if(name !== 'type') {
// 			throw new Error("Cannot create FeatureViewType for " + name);
// 		}
// 		super(el, translations, logs, item, name, value);
// 	}
//
// 	setCallback(f) {
// 		if(typeof f !== "function") {
// 			throw new Error("");
// 		} else if(f.length !== 2) {
// 			throw new Error("callback function must be bound and have 2 parameters")
// 		}
// 		this.callback = f;
// 	}
// }

Object.defineProperty(FeatureViewList, 'lists', {
	enumerable: true,
	configurable: false,
	writable: false,
	value: {
		'motherboard-form-factor': new Set(['atx', 'miniatx', 'microatx', 'miniitx', 'proprietary']),
		'type': new Set(['location', 'case', 'cpu', 'ram', 'motherboard', 'psu', 'hdd', 'odd', 'fdd', 'graphics-card', 'ethernet-card', 'modem-card', 'sound-card', 'other-card', 'card-adapter', 'keyboard', 'mouse', 'monitor', 'printer', 'scanner', 'switch', 'hub', 'modem-router', 'access-point', 'adapter', 'other']),
	}
});


Object.defineProperty(FeatureViewList, 'sortedLists', {
	enumerable: true,
	configurable: false,
	writable: false,
	value: new Map()
});
