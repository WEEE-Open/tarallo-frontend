class ItemView extends FrameworkView {
	/**
	 * View and edit an item.
	 *
	 * @param {HTMLElement} element - An element where the item div will be placed
	 * @param {Item} item - Item to view
	 * @param {Translations} language - Language for translated strings
	 * @param {ItemView|null=null} parentItemView - parent view for subitems, null if it's a root element
	 */
	constructor(element, item, language, parentItemView) {
		super(element);
		this.item = item;
		this.language = language;
		this.frozen = false;
		/**
		 * @type {ItemView|null}
		 */
		this.parentItemView = parentItemView ? parentItemView : null;
		this.subViews = [];
		this.el.appendChild(ItemView._newElement());

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
			// TODO: this should be more of a "permanent freeze" (or permafrost)
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
		this.featuresElement.addEventListener('focusin', this.featureInput.bind(this)); // an alternative to "input", which fires after every key press
		this.featuresElement.addEventListener('focusout', this.featureInput.bind(this));
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
			event.stopPropagation();
			event.preventDefault();
			let name = event.target.parentElement.dataset.name;
			this.removeFeatureElement(name, event.target.parentElement);
		}
	}

	/**
	 * Handler for inputting anything in the feature box (set/change value)
	 * Empty input counts as no feature. Or as a feature with empty content. Still undecided.
	 *
	 * @param {Event} event
	 */
	featureInput(event) {
		if(event.target.classList.contains('value')) {
			event.stopPropagation();
			event.preventDefault();
			let name = event.target.parentElement.dataset.name;
			if(event.target.value === "") {
				this.item.setFeature(name, null);
			} else {
				this.item.setFeature(name, event.target.value);
			}
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
		let container = document.createElement("div");

		let view = new ItemView(container, item, this.language, this);
		this.subViews.push(view);
		this.insideElement.appendChild(container);
	}

	/**
	 * Set item as non-editable.
	 *
	 * @see this.unfreeze
	 */
	freeze() {
		this.frozen = true;
		this.freezeCode();
		this.freezeDelete();
		this._toggleFreezable(true);
	}

	/**
	 * @see this.freeze
	 */
	freezeRecursive() {
		for(let i = 0; i < this.subViews.length; i++) {
			this.subViews[i].freezeRecursive();
		}
		this.freeze();
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
		this.frozen = false;
		this._toggleFreezable(false);
	}

	/**
	 * @see this.unfreeze
	 */
	unfreezeRecursive() {
		for(let i = 0; i < this.subViews.length; i++) {
			this.subViews[i].unfreezeRecursive();
		}
		this.unfreeze();
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
	 * Tries to remove a feature from the feature box. Does nothing if that feature doesn't exist.
	 * Also unmarks default features as duplicates, if needed.
	 *
	 * @param {string} name - feature name
	 * @param {Node} [element] - outermost element to delete, if already known (avoids a for loop)
	 */
	removeFeatureElement(name, element) {
		let thisFeature;
		if(element instanceof Node) {
			thisFeature = element;
		} else {
			thisFeature = null;
			let features = this.featuresElement.children;
			let i = features.length;
			while(i--) {
				if(features[i].dataset.name === name) {
					thisFeature = features[i];
					break;
				}
			}
		}

		if(element === null) {
			return;
		}

		this.item.setFeature(name, null);
		this.setDefaultFeatureDuplicate(name, false);
		this.featuresElement.removeChild(thisFeature);
	}

	/**
	 * Mark a default feature as duplicate/overridden by a feature. Or unmark it.
	 * Or do nothing if there's no default feature.
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
		// TODO: reuse same items if possible
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
	 * Create a container element, for a single item, and return it.
	 *
	 * @return {HTMLElement} container
	 */
	static _newElement() {
		let container = document.createElement("div");
		container.classList.add("item");
		container.appendChild(document.getElementById("template-item").content.cloneNode(true));
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
			throw new Error('Cannot delete items that already exist');
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
	static populateFeatureDropdown(force = false) {
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


class ItemLocationView extends ItemView {
	/**
	 * Show an item, and its location as breadcrumbs.
	 * Use for top-level items only.
	 *
	 * @param {HTMLElement} element - an HTML element
	 * @param {Item} item - item to show
	 * @param {Translations} language - Language for translated strings
	 */
	constructor(element, item, language) {
		super(element, item, language, null);
		let locationContainer = document.createElement("div");
		let locationContent = document.getElementById("template-location").content.cloneNode(true);
		locationContainer.appendChild(locationContent);

		this.contentsElement = locationContainer.querySelector('.contents');
		this.breadcrumbsElement = locationContainer.querySelector('.breadcrumbs');
		this.locationTextBox = null;

		this.breadcrumbsElement.addEventListener('focusin', this.parentInput.bind(this));
		this.breadcrumbsElement.addEventListener('focusout', this.parentInput.bind(this));

		this.createBreadcrumbs();

		while(element.firstChild) {
			this.contentsElement.appendChild(element.firstChild);
		}
		element.insertBefore(locationContainer, this.el.firstChild);
	}

	/**
	 * Handle inserting parent code in breadcrumbs textbox
	 *
	 * @param {Event} event
	 * @todo strike out breadcrumbs if anything has been inserted (copy whatever features + default features does)
	 */
	parentInput(event) {
		// TODO: are these necessary?
		//event.preventDefault();
		//event.stopPropagation();
		if(this.locationTextBox !== null) {
			let value = this.locationTextBox.value;
			if(value !== null && value !== '') {
				this.item.setParent(this.locationTextBox.value);
				event.stopPropagation();
			}
		}
	}

	deleteBreadcrumbs() {
		this.locationTextBox = null;
		while(this.breadcrumbsElement.lastChild) {
			this.breadcrumbsElement.removeChild(this.breadcrumbsElement.lastChild);
		}
	}

	createBreadcrumbs(frozen) {
		this.deleteBreadcrumbs();
		let len = this.item.location.length;
		if(len > 0) {
			for(let i = 0; i < len; i++) {
				if(i !== 0) {
					this.breadcrumbsElement.appendChild(document.createTextNode(" > "));
				}
				let piece = document.createElement("a");
				piece.dataset.href = piece.href = "#/view/" + this.item.location[i];
				piece.textContent = this.item.location[i];
				this.breadcrumbsElement.appendChild(piece);
			}
		}
		this._appendEditableBreadcrumbs(this.item.exists, len > 0, frozen, this.item.getParent() !== null);
	}

	/**
	 * Decides wether to append the "set parent" textbox to breadcrumbs, and does that.
	 * The "decides" part involved drawing a CFG, but the resulting code would have been wider than taller and
	 * absolutely unreadable. To make it at least more compact a truth table has been drawn and Karnaugh tables were
	 * used to simplify the logic. This would have been useful if I were to implement this in hardware, but in software
	 * was a bit pointless. Well, at least the code appears more readable (but still doesn't make sense).
	 *
	 * @param {boolean} exists - item.exists
	 * @param {boolean} location - does item have a "location"?
	 * @param {boolean} frozen - is item frozen (or transitioning to frozen)?
	 * @param {boolean} parent - does item have a "parent" (user-defined, not yet saved on server)
	 * @private
	 */
	_appendEditableBreadcrumbs(exists, location, frozen, parent) {
		if(
			!exists && !location && !frozen ||
			!exists && parent ||
			location && parent ||
			location && !frozen ||
			exists && !frozen
		) {
			let label = document.createElement('label');
			label.textContent = 'Location: ';
			this.locationTextBox = document.createElement('input');
			label.appendChild(this.locationTextBox);
			this.breadcrumbsElement.appendChild(label);
		}
	}

	/**
	 * Make breadcrumbs clickable or not clickable (enabled/disabled)
	 *
	 * @param {boolean} enable
	 * @private
	 */
	_toggleBreadcrumbsNavigation(enable) {
		let bread = this.breadcrumbsElement.querySelectorAll('a');
		for(let crumb = 0; crumb < bread.length; crumb++) {
			if(enable) {
				bread[crumb].href = bread[crumb].dataset.href;
				bread[crumb].removeAttribute('data-href');
			} else {
				bread[crumb].dataset.href = bread[crumb].href;
			}
		}
		if(this.locationTextBox instanceof HTMLElement) {
			this.locationTextBox.disabled = !enable;
		}
	}

	/**
	 * Make "set parent" textbox in breadcrumbs editable or not
	 *
	 * @param {boolean} enable
	 * @private
	 */
	_toggleBreadcrumbsEdit(enable) {
		let breadbox = this.breadcrumbsElement.querySelector('label input');
		if(breadbox !== null) {
			breadbox.disabled = !enable;
		}
	}

	freeze() {
		super.freeze();
		this._toggleBreadcrumbsNavigation(true); // yes this is reversed, it's intended behaviour
		this._toggleBreadcrumbsEdit(false);
	}

	unfreeze() {
		super.unfreeze();
		this._toggleBreadcrumbsNavigation(false); // yes this is reversed, it's intended behaviour
		this._toggleBreadcrumbsEdit(true);
	}

	/**
	 * Get user selected location for new items, or null if none/not modified/deleted
	 *
	 * @deprecated use events to edit item directly instead
	 * @return {string|null} non-empty string if there's some location in the textbox, or null
	 */
	getNewLocation() {
		if(this.locationTextBox instanceof HTMLElement) { // TODO: does this work?
			if(this.locationTextBox.value instanceof 'string' && this.locationTextBox.value.length > 0) {
				return this.locationTextBox.value;
			}
		}
		return null;
	}
}

