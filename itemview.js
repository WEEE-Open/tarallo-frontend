class ItemView extends FrameworkView {

	/**
	 * View and edit an item.
	 *
	 * @param {HTMLElement} element
	 * @param {Item} item
	 * @param {Translations} language
	 */
	constructor(element, item, language) {
		super(element);
		this.item = item;
		this.language = language;
		this.frozen = false;
		this.subitems = [];
		this.el.appendChild(document.getElementById("template-item").content.cloneNode(true));

		this.codeElement = this.el.querySelector(':not(.subitem) .code');
		this.featuresElement = this.el.querySelector(':not(.subitem) .features');
		this.defaultFeaturesElement = this.el.querySelector(':not(.subitem) .defaultfeatures');
		this.insideElement = this.el.querySelector(':not(.subitem) .inside');
		this.selectFeatureElement = this.el.querySelector(":not(.subitem) .featuretextbox");

		if(item.code !== null) {
			this.showCode(item.code);
			this.freezeCode();
		}
		// needs to be done before features, for the duplicate check to work
		if(item.defaultFeaturesCount > 0) {
			this.showDefaultFeatures();
		}
		if(item.featuresCount > 0) {
			this.showFeatures();
		}
		if(item.inside.length > 0) {
			this.showInsideItems();
		}

		this.featuresElement.addEventListener('click', this.featureClick.bind(this));
		this.featuresElement.addEventListener('input', this.featureInput.bind(this));
		this.el.querySelector('.addfield').addEventListener('click', this.addFeatureClick.bind(this));
		this.selectFeatureElement.addEventListener('click', ItemView.populateFeatureDropdown.bind(this, false));
	}

	/**
	 * Handler for clicking anywhere in the feature box (delete features)
	 *
	 * @param {Event} event
	 */
	featureClick(event) {
		if(event.target.classList.contains("featuredeletebutton")) {
			// plainly unreadable.
			event.stopPropagation();
			event.preventDefault();
			let name = event.target.parentElement.dataset.name;
			this.item.setFeature(name, null);
			this.setDefaultFeatureDuplicate(name, false); // TODO: use a proxy?
			event.target.parentElement.parentElement.removeChild(event.target.parentElement);
		}
	}

	/**
	 * Handler for the "add feature" button
	 *
	 * @param {Event} event
	 */
	addFeatureClick(event) {
		event.stopPropagation();
		event.preventDefault();
		let select = event.target.parentElement.querySelector("select");
		if(select.value !== '') {
			this.appendFeatureElement(select.value, '');
		}
	}

	/**
	 * Handler for changing a feature value
	 *
	 * @param {Event} event
	 */
	featureInput(event) {
		event.stopPropagation();
		event.preventDefault();
		if(event.target.value === "") {
			this.item.setFeature(event.target.parentElement.dataset.name, null);
		} else {
			this.item.setFeature(event.target.parentElement.dataset.name, event.target.value);
		}
	}

	/**
	 * Set item as non-editable.
	 *
	 * @see this.unfreeze
	 */
	freeze() {
		this.freezeCode();
		this._toggleInputs(true);
		this._toggleControls(true);
		this.frozen = true;
	}

	_toggleInputs(disabled) {
		let inputs = this.el.querySelectorAll(':not(.subitem) input.freezable, :not(.subitem) button.freezable');
		for(let i = 0; i < inputs.length; i++) {
			inputs[i].disabled = disabled;
		}
	}

	_toggleControls(disabled) {
		let controls = this.el.querySelectorAll(':not(.subitem) .freezable-controls');
		for(let i = 0; i < controls.length; i++) {
			if(disabled) {
				controls[i].classList.add("disabled");
			} else {
				controls[i].classList.remove("disabled");
			}
		}
	}

	/**
	 * Set item as editable again (except for the code)
	 *
	 * @see this.freeze
	 */
	unfreeze() {
		this._toggleInputs(false);
		this._toggleControls(false);
		this.frozen = false;
	}

	/**
	 * Display features from the item, in editable format. Use freeze() to make them not editable.
	 *
	 * @see this.freeze
	 */
	showFeatures() {
		for(let name in this.item.features) {
			// hasOwnProperty is probably useless
			if(this.item.features.hasOwnProperty(name)) {
				this.appendFeatureElement(name, this.item.features[name]);
			}
		}
	}

	/**
	 * Tries to append a new row in the feature box. Does nothing if that feature already exists.
	 * Also marks default features as duplicates, if needed.
	 *
	 * @param {string} name feature name
	 * @param {string} value feature value
	 * @see this._createFeatureElement
	 */
	appendFeatureElement(name, value) {
		let features = this.featuresElement.children;
		let i = features.length;
		while(i--) {
			if(features[i].dataset.name === name) {
				return;
			}
		}

		this.featuresElement.appendChild(this._createFeatureElement(name, value));
		this.setDefaultFeatureDuplicate(name, true);
	}

	/**
	 * Mark a default feature as duplicate/overridden by a feature. Or unmark it.
	 *
	 * @param {string} name feature name
	 * @param {boolean} duplicate is duplicate
	 */
	setDefaultFeatureDuplicate(name, duplicate) {
		let row = this.defaultFeaturesElement.querySelector('[data-name="' + name + '"]');
		if(row !== null) {
			if(duplicate) {
				row.classList.add("duplicate");
			} else {
				row.classList.remove("duplicate");
			}
		}
	}

	/**
	 * Create a row for the feature box and return it.
	 *
	 * @param {string} name feature name
	 * @param {string} value feature value
	 * @return {Element} new element
	 */
	_createFeatureElement(name, value) {
		let newElement, nameElement, valueElement, deleteButton;
		newElement = document.createElement("div");
		newElement.classList.add("feature");
		newElement.dataset.name = name;

		nameElement = document.createElement("span");
		nameElement.classList.add("name");

		valueElement = document.createElement("input");
		valueElement.classList.add("value");
		valueElement.classList.add("freezable");

		deleteButton = document.createElement("button");
		deleteButton.classList.add("featuredeletebutton");
		deleteButton.classList.add("freezable");
		deleteButton.classList.add("freezable-controls");
		deleteButton.textContent = "-";

		newElement.appendChild(deleteButton);
		newElement.appendChild(nameElement);
		newElement.appendChild(valueElement);

		nameElement.textContent = typeof this.language.features[name] === 'undefined' ? name : this.language.features[name];
		valueElement.value = value;

		return newElement;
	}

	/**
	 * Display default features. These are never editable.
	 */
	showDefaultFeatures() {
		// looks very much like showFeatures, but there are many subtle differences, using a single function didn't work too well...
		let newElement, nameElement, valueElement;

		for(let name in this.item.defaultFeatures) {
			if(this.item.defaultFeatures.hasOwnProperty(name)) {
				newElement = document.createElement("div");
				newElement.classList.add("feature");
				newElement.dataset.name = name;

				nameElement = document.createElement("span");
				nameElement.classList.add("name");

				valueElement = document.createElement("input");
				valueElement.classList.add("value");
				valueElement.disabled = true;

				newElement.appendChild(nameElement);
				newElement.appendChild(valueElement);

				nameElement.textContent = typeof this.language.features[name] === 'undefined' ? name : this.language.features[name];
				valueElement.value = this.item.defaultFeatures[name];
				this.defaultFeaturesElement.appendChild(newElement);
			}
		}
	}

	showInsideItems() {
		let subitem, container;
		this.removeInsideItems();
		for(let i = 0; i < this.item.inside.length; i++) {
			subitem = this.item.inside[i];
			container = ItemView.newContainer();
			this.subitems.push(new ItemView(container, subitem, this.language));
			this.el.appendChild(container);
		}
	}

	removeInsideItems() {
		while(this.insideElement.lastElementChild) {
			this.insideElement.removeChild(this.insideElement.lastElementChild);
		}
	}

	static newContainer() {
		let container = document.createElement("div");
		container.classList.add("item");
		return container;
	}

	showCode(code) {
		this.codeElement.value = code;
	}

	freezeCode() {
		this.codeElement.disabled = true;
	}

	/**
	 * Populate the dropdown. Useful for not filling read-only pages with a million option tags.
	 *
	 * @param {boolean} force repopulate if already populated or not
	 */
	static populateFeatureDropdown(force) {
		force = force || false;
		if(!force && !!this.selectFeatureElement.lastElementChild) {
			return;
		}
		while(this.selectFeatureElement.lastElementChild) {
			this.selectFeatureElement.removeChild(this.selectFeatureElement.lastElementChild);
		}
		for(let f in this.language.features) {
			if(this.language.features.hasOwnProperty(f)) {
				let option = document.createElement("option");
				option.value = f;
				option.textContent = this.language.features[f];
				this.selectFeatureElement.appendChild(option);
			}
		}
	}

	trigger(that, event) {
		if(that === this.language) {
			if(event === 'change') {
				// TODO: update view
			}
		}
	}

}
