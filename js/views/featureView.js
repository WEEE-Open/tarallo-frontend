class FeatureView extends Framework.View {
	constructor(el, label, value) {
		super(el);
		this.id = FeatureView.nextId();
		console.log(this.id);

		this.label = this.createLabel(label);
		this.input = this.createInput(value);

		this.el.appendChild(label);
		this.el.appendChild(value);
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
	 */
	setLabel(text) {
		this.label.textContent = text;
	}

	/**
	 * Create the input field that has to be place next to the label.
	 *
	 * @param {string} value
	 * @protected
	 */
	createInput(value) {
		let input = document.createElement("input");
		input.id = this.id;
		input.value = value;
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
		label.htmlFor = this.id;
		this.setLabel(text);
		return label;
	}
}

/**
 * Static counter used to generate IDs
 *
 * @type {int}
 * @private
 */
FeatureView.idCounter = 0;
