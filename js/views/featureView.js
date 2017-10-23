class FeatureView extends Framework.View {
	/**
	 * @param {Element} el - a div
	 * @param {Translations} translations
	 * @param {Logs} logs
	 * @param {string} name - internal feature name
	 * @param {string} value - internal feature value
	 * @private
	 */
	constructor(el, translations, logs, name, value) {
		super(el);
		this.id = FeatureView.nextId();
		this.logs = logs;
		this.translations = translations;
		this.name = name;
		/**
		 * Internal value, always updated in real-time (well, sort of)
		 * @see this.value
		 * @type {string|null}
		 * @protected
		 */
		this.internalValue = value;

		this.label = this.createLabel(this.translations.get(this.name, this.translations.features));
		this.input = this.createInput(value);

		this.el.appendChild(this.label);
		this.el.appendChild(this.input);
	}

	set value(to) {
		this.internalValue = to;
		this.writeValue(this.renderValue());
	}

	get value() {
		return this.internalValue;
	}

	get renderedValue() {
		return this.renderValue();
	}

	/**
	 * Handler for inputting anything in the feature box (set/change value)
	 * Empty input counts as no feature.
	 *
	 * @private
	 */
	featureInput() {
		let value = this.readValue();
		if(value === "") {
			this.value = null;
		} else {
			try {
				this.parseInput(value);
			} catch(e) {
				// rollback (value is already internalValue, but this triggers writeValue)
				this.logs.add(e.message, 'E');
				this.value = this.internalValue;
			}
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
	 * @param {string} value
	 * @protected
	 */
	createInput(value) {
		let input = document.createElement("input");
		input.classList.add("value");
		input.classList.add("freezable");
		input.id = this.id;
		input.value = value;
		input.addEventListener('blur', this.featureInput.bind(this));
		return input;
	}

	/**
	 * Create a label for the input and return it.
	 *
	 * @param {string} text - label text (translated, to be displayed)
	 * @return {Element}
	 * @protected
	 */
	createLabel(text) {
		let label = document.createElement("label");
		label.classList.add("name");
		label.htmlFor = this.id;
		this.setLabel(text);
		return label;
	}

	/**
	 * Parse input (from HTML) and set internal value.
	 *
	 * @param {string} input - a non-empty string
	 * @throws Error if input is in wrong format
	 * @private
	 */
	parseInput(input) {
		this.value = input;
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
	constructor(el, translations, logs, name, value) {
		super(el, translations, logs, name, value);
		this.type = FeatureViewUnit.parseType(name);
	}

	/**
	 * Get feature type from name. Null if none (free text)
	 *
	 * @param {string} name
	 * @return {string|null}
	 * @protected
	 */
	static parseType(name) {
		if(name.endsWith('-byte')) {
			return 'byte';
		} else if(name.endsWith('-hertz')) {
			return 'hertz';
		} else if(name.endsWith('-decibyte')) {
			return 'decibyte';
		} else {
			return null;
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
				return 'k';
			case 2:
				return 'M';
			case 3:
				return 'G';
			case 4:
				return 'T';
		}
		throw new Error('Invalid SI prefix');
	}

	/**
	 * Convert value to human-readable format
	 */
	renderValue() {
		if(this.internalValue === null) {
			return '';
		}
		let value = this.internalValue;
		switch(this.type) {
			case null:
			default:
				return value;
			case 'byte':
				value = parseInt(value);
				let prefix = 0;
				while(value >= 1024 && prefix <= 4) {
					value /= 1024; // this SHOULD be optimized internally to use bit shift
					prefix++;
				}

				let i = '';
				if(prefix > 0) {
					i = 'i';
				}
				return '' + value + ' ' + FeatureView.unitPrefix(prefix) + i +'B';
				break;
			case 'decibyte':
				// TODO: implement
				break;
			case 'hertz':
				// TODO: implement
				break;
		}
	}

	parseInput(input) {
		if(input === null) {
			this.value = null;
		}
		switch(this.type) {
			case null:
				return input;
			case 'byte':

				break;
			case 'decibyte':
				break;
			case 'hertz':
				break;
			default:
				break;
		}
	}
}
