class FeatureView extends Framework.View {
	/**
	 * @param {Element} el - a div
	 * @param {Translations} translations
	 * @param {Logs} logs
	 * @param {string} name - internal feature name
	 * @param {string} value - internal feature value
	 * @todo make separate FeatureViewText and FeatureViewSelect, make a factory
	 */
	constructor(el, translations, logs, name, value) {
		super(el);
		this.id = FeatureView.nextId();
		this.logs = logs;
		this.translations = translations;
		this.name = name;
		this.value = value;
		this.type = FeatureView.parseType(name);

		this.label = this.createLabel(this.translations.get(this.name, this.translations.features));
		this.input = this.createInput(value);

		this.el.appendChild(this.label);
		this.el.appendChild(this.input);
	}

	/**
	 * Handler for inputting anything in the feature box (set/change value)
	 * Empty input counts as no feature.
	 *
	 * @private
	 */
	featureInput() {
		let value = this.getRawValue();
		if(value === "") {
			this.setValue(null);
			this.renderValue();
		} else {
			try {
				this.setValue(value);
			} catch(e) {
				this.logs.add(e.message, 'E');
			}
			this.renderValue();
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
	 * Parse input and set internal value. If null, set to null.
	 *
	 * @param {string|null} input
	 * @throws Error if input is in wrong format
	 * @private
	 */
	setValue(input) {
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
