class ItemView extends FrameworkView {
	/**
	 * View and edit an item.
	 *
	 * @param {HTMLElement} element - Container element
	 * @param {Item} item - Item to view
	 * @param {Translations} language - Language for translated strings
	 * @param {ItemView|null=} parentItemView - parent view for subitems, null if it's a root element
	 */
	constructor(element, item, language, parentItemView) {
		super(element);
		this.item = item;
		this.language = language;
		/**
		 * @type {ItemView|null}
		 */
		this.parentItemView = parentItemView ? parentItemView : null;
		this.frozen = false;
		this.subViews = [];
		this.el.appendChild(document.getElementById("template-item").content.cloneNode(true));

		// querySelector uses depth-first search, so as long as these are before .inside there should be no problem.
		// also, no subitems should exist at this stage...
		this.codeElement = this.el.querySelector('.code');
		this.featuresElement = this.el.querySelector('.features');
		this.defaultFeaturesElement = this.el.querySelector('.defaultfeatures');
		this.insideElement = this.el.querySelector('.inside');
		this.selectFeatureElement = this.el.querySelector('.featuretextbox');
		this.deleteItemButton = this.el.querySelector('.itemdeletebutton');
		let addFieldButton = this.el.querySelector('.addfield');
		let addItemButton = this.el.querySelector('.additem');

		if(item.code !== null) {
			this.showCode(item.code);
		}
		if(item.exists) {
			this.freezeCode();
			this.freezeDelete();
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
		addFieldButton.addEventListener('click', this.addFeatureClick.bind(this));
		addItemButton.addEventListener('click', this.addItemClick.bind(this));
		this.selectFeatureElement.addEventListener('click', ItemView.populateFeatureDropdown.bind(this, false));
		this.deleteItemButton.addEventListener('click', this.deleteItemClick.bind(this));
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
	 * Handler for the "add item" button
	 *
	 * @param {Event} event
	 */
	addItemClick(event) {
		event.stopPropagation();
		event.preventDefault();
		let item = new Item(this.trigger);
		this.addInside(item);
	}

	/**
	 * Create a container, attach a view and add it to the current view, for the supplied item.
	 *
	 * @param {Item} item - an item
	 */
	addInside(item) {
		let container = ItemView.newContainer();
		this.item.addInside(item);

		let view = new ItemView(container, item, this.language, this);
		this.subViews.push(view);
		this.insideElement.appendChild(container);
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
		this.freezeDelete();
		this._toggleFreezable(true);
		this.frozen = true;
	}

	_toggleFreezable(disabled) {
		this.__toggleFreezable(this.el, disabled);
	}

	__toggleFreezable(el, disabled) {
		let elements = el.children;
		for(let i = 0; i < elements.length; i++) {
			if(elements[i].classList.contains("inside")) {
				continue;
			}
			if((elements[i].tagName === 'INPUT' || elements[i].tagName === 'BUTTON') && elements[i].classList.contains("freezable")) {
				elements[i].disabled = disabled;
				continue;
			}
			if(elements[i].classList.contains('freezable-hide')) {
				if(disabled) {
					elements[i].classList.add('disabled');
				} else {
					elements[i].classList.remove('disabled');
				}
			}
			this.__toggleFreezable(elements[i], disabled);
		}
	}

	/**
	 * Set item as editable again (except for the code)
	 *
	 * @see this.freeze
	 */
	unfreeze() {
		this._toggleFreezable(false);
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

		let parent, newElement = this._createFeatureElement(name, value);
		let translation = this.language.get(name, this.language.features);
		let inserted = false;

		// TODO: implement binary search to insert in O(n·logn) time, currently it's O(n²). Or don't, who cares for small n.
		let translatedNames = this.featuresElement.querySelectorAll(".name");
		for(i = 0; i < translatedNames.length; i++) {
			if(translation < translatedNames[i].textContent) {
				parent = translatedNames[i].parentElement;
				this.featuresElement.insertBefore(newElement, parent);
				inserted = true;
				break;
			}
		}
		if(!inserted) {
			this.featuresElement.appendChild(newElement);
		}
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
		deleteButton.classList.add("freezable-hide");
		deleteButton.textContent = "-";

		newElement.appendChild(deleteButton);
		newElement.appendChild(nameElement);
		newElement.appendChild(valueElement);

		nameElement.textContent = this.language.get(name, this.language.features);
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

				nameElement.textContent = this.language.get(name, this.language.features);
				valueElement.value = this.item.defaultFeatures[name];
				this.defaultFeaturesElement.appendChild(newElement);
			}
		}
	}

	showInsideItems() {
		let subitem;
		this.removeInsideItems();
		for(let i = 0; i < this.item.inside.length; i++) {
			subitem = this.item.inside[i];
			this.addInside(subitem);
		}
	}

	removeInsideItems() {
		while(this.insideElement.lastElementChild) {
			this.insideElement.removeChild(this.insideElement.lastElementChild);
		}
	}

	/**
	 * Create a top-level container element and return it.
	 *
	 * Do not use for subitems!
	 *
	 * @return {HTMLElement} container
	 */
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

	freezeDelete() {
		this.deleteItemButton.disabled = true;
	}

	/**
	 * Handler for clicking the "delete item" button.
	 * Deleting a root element is ignored, the event keeps propagating.
	 *
	 * @param {Event} event
	 */
	deleteItemClick(event) {
		if(this.parentItemView === null) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		if(this.item.exists) {
			throw Error('Cannot delete items that already exist');
		}

		/**
		 * For some absurd reason, PHPStorm insists this is an Item,
		 * ignoring all the JSDoc, and keeps suggesting Item methods.
		 *
		 * @type {ItemView|null}
		 */
		this.parentItemView.deleteItemInside(this);
	}

	/**
	 * Delete a subitem via its ItemView.
	 *
	 * @param {ItemView} removeThis - item view to delete
	 */
	deleteItemInside(removeThis) {
		this.item.removeInside(removeThis.item);
		this.insideElement.removeChild(removeThis.el);
		removeThis.parentItemView = null;
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

				let inserted = false;
				for(let i = 0; i < this.selectFeatureElement.length; i++) {
					if(option.textContent < this.selectFeatureElement[i].textContent) {
						this.selectFeatureElement.insertBefore(option, this.selectFeatureElement[i]);
						inserted = true;
						break;
					}
				}
				if(!inserted) {
					this.selectFeatureElement.appendChild(option);
				}
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
