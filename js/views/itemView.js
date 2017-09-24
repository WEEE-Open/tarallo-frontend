/**
 * View and edit an item.
 *
 * @see ItemLocationView ItemLocationView if breadcrumbs/location are also needed
 */
class ItemView extends Framework.View {
	/**
	 * View and edit an item.
	 *
	 * @see ItemLocationView ItemLocationView if breadcrumbs/location are also needed
	 * @param {HTMLElement} element - An element where the item div will be placed
	 * @param {Item} item - Item to view
	 * @param {Translations} language - Language for translated strings
	 * @param {Logs} logs - Logs, to add error messages
	 * @param {Transaction} transaction - Transaction, to edit and delete items
	 * @param {ItemView|null=null} parentItemView - parent view for subitems, null if it's a root element
	 */
	constructor(element, item, language, logs, transaction, parentItemView) {
		super(element);
		this.item = item;
		this.language = language;
		this.logs = logs;
		this.transaction = transaction;
		this.frozen = false;
		/**
		 * @type {ItemView|null}
		 */
		this.parentItemView = parentItemView ? parentItemView : null;
		this.subViews = [];
		this.itemEl = ItemView.newElement();
		this.el.appendChild(this.itemEl);

		// querySelector uses depth-first search, so as long as these are before .inside there should be no problem.
		// also, no subitems should exist at this stage...
		this.codeElement = this.itemEl.querySelector('.code');
		this.featuresElement = this.itemEl.querySelector('.features');
		this.defaultFeaturesElement = this.itemEl.querySelector('.defaultfeatures');
		this.insideElement = this.itemEl.querySelector('.inside');
		this.selectFeatureElement = this.itemEl.querySelector('.featuretextbox');
		this.deleteItemButton = this.itemEl.querySelector('.itemdeletebutton');
		this.editItemButton = this.itemEl.querySelector('.itemeditbutton');
		this.saveItemButton = this.itemEl.querySelector('.itemsavebutton');
		let addFieldButton = this.itemEl.querySelector('.addfield');
		let addItemButton = this.itemEl.querySelector('.additem');

		this.showSaveButton = !(this.parentItemView !== null && !this.parentItemView.item.exists && !this.item.exists);

		this.toggleButtons(false);

		if(item.code !== null) {
			this.codeElement.value = item.code;
		}
		if(item.exists) {
			this.toggleCode(false);
		}
		if(this.item.code !== null && this.transaction.remove.has(this.item.code)) {
			this.toggleDeleted(true);
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
		this.featuresElement.addEventListener('focusout', this.featureInput.bind(this)); // an alternative to "input", which fires after every key press
		this.codeElement.addEventListener('blur', this.codeInput.bind(this)); // blur doesn't bubble, but codeElement is already the textbox (featuresElement contains lots of stuff instead)
		addFieldButton.addEventListener('click', this.addFeatureClick.bind(this));
		addItemButton.addEventListener('click', this.addItemClick.bind(this));
		this.selectFeatureElement.addEventListener('click', ItemView.populateFeatureDropdown.bind(this, false));
		this.deleteItemButton.addEventListener('click', this.deleteItemClick.bind(this));
		this.editItemButton.addEventListener('click', this.editItemButtonClick.bind(this));
		this.saveItemButton.addEventListener('click', this.saveItemButtonClick.bind(this));
	}

	/**
	 * Handler for clicking anywhere in the feature box (delete features)
	 *
	 * @param {Event} event
	 * @private
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
	 * @private
	 */
	featureInput(event) {
		if(event.target.classList.contains('value')) {
			event.stopPropagation();
			let name = event.target.parentElement.dataset.name;
			if(event.target.value === "") {
				this.item.setFeature(name, null);
			} else {
				this.item.setFeature(name, event.target.value);
			}
		}
	}

	/**
	 * Handle inserting a code
	 *
	 * @param {Event} event
	 * @private
	 */
	codeInput(event) {
		event.stopPropagation();
		let code = this.codeElement.value;
		try {
			if(code === "") {
				this.item.setCode(null);
			} else {
				this.item.setCode(code);
			}
		} catch(e) {
			let previous = this.item.code === null ? "none" : '"' + this.item.code + '"';
			this.codeElement.value = this.item.code;
			this.logs.add(e.message + ", keeping previous code: " + previous, "E");
		}
	}

	/**
	 * Handler for the "add feature" button
	 *
	 * @param {Event} event
	 * @private
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
	 * @private
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
	 * @protected
	 */
	addInside(item) {
		let container = document.createElement("div");

		let view = new ItemView(container, item, this.language, this.logs, this.transaction, this);
		this.subViews.push(view);
		this.insideElement.appendChild(container);
	}

	/**
	 * Handle clicking on the "edit" button to unfreeze the item.
	 *
	 * @private
	 */
	editItemButtonClick() {
		this.unfreeze();
	}

	/**
	 * Handle clicking on the "save" button, to save modifications and freeze the element
	 * WEEE Save! [cit.]
	 *
	 * @private
	 */
	saveItemButtonClick() {
		if(!this.item.empty()) {
			this.transaction.add(this.item);
		}
		// if the element has been removed from DOM, don't bother freezing...
		if(!!this.el.parentNode) {
			this.freezeRecursive();
		}
	}

	/**
	 * Handler for clicking the "delete item" button.
	 * Deleting a root element is ignored, the event keeps propagating.
	 *
	 * @private
	 */
	deleteItemClick() {
		//if(this.parentItemView === null) {
		//	return;
		//}

		if(this.item.exists) {
			try {
				this.transaction.addDeleted(this.item);
			} catch(e) {
				this.logs.add(e.message, 'E');
			}
		} else {
			this.parentItemView.deleteItemInside(this);
		}
	}

	/**
	 * Show (or rather not show) an item that has been deleted. Or show it if it gets "undeleted".
	 *
	 * @param {boolean} deleted
	 * @protected
	 */
	toggleDeleted(deleted) {
		// TODO: show undo button?
		if(deleted) {
			this.itemEl.classList.add("deleted");
		} else {
			this.itemEl.classList.remove("deleted");
		}
	}

	/**
	 * Set item as non-editable.
	 *
	 * @see this.unfreeze
	 */
	freeze() {
		this.frozen = true;
		this.toggleFreezable(true);
		this.toggleButtons(true);
		this.toggleCode(false);
	}

	/**
	 * @see this.freeze
	 */
	freezeRecursive() {
		this.freeze();
		for(let i = 0; i < this.subViews.length; i++) {
			this.subViews[i].freezeRecursive();
		}
	}

	/**
	 * Really freeze stuff.
	 * Don't call directly!
	 *
	 * @see this.freeze
	 * @see this.unfreeze
	 * @param {boolean} disabled
	 * @private
	 */
	toggleFreezable(disabled) {
		this._toggleFreezable(this.itemEl, disabled);
	}

	/**
	 * Freeze an HTML element, recursively, depending on its classlist.
	 * Don't even think to use this directly.
	 *
	 * @see this.freeze
	 * @see this.unfreeze
	 * @param {Node|HTMLElement} el
	 * @param {boolean} disabled
	 * @private
	 */
	_toggleFreezable(el, disabled) {
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
			this._toggleFreezable(elements[i], disabled);
		}
	}

	/**
	 * Set item as editable again (except for the code)
	 *
	 * @see this.freeze
	 */
	unfreeze() {
		this.frozen = false;
		this.toggleFreezable(false);
		this.toggleButtons(false);
		this.toggleCode(true);
	}

	/**
	 * Show and hide the edit, save and delete buttons
	 *
	 * @param {boolean} frozen - item currently frozen/not in edit mode?
	 */
	toggleButtons(frozen) {
		if(frozen) {
			this.editItemButton.style.display = '';
			this.saveItemButton.style.display = 'none';
			this.deleteItemButton.style.display = 'none';
		} else {
			this.editItemButton.style.display = 'none';
			this.saveItemButton.style.display = this.showSaveButton ? '' : 'none';
			this.deleteItemButton.style.display = '';
		}
	}

	/**
	 * Enable and disable the code input box
	 *
	 * @param {boolean} enabled
	 * @protected
	 */
	toggleCode(enabled) {
		this.codeElement.disabled = !(enabled && !this.item.exists);
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
	 * @private
	 */
	showFeatures() {
		for(let [name, value] of this.item.features) {
			this.appendFeatureElement(name, value);
		}
	}

	/**
	 * Tries to append a new row in the feature box. Does nothing if that feature already exists.
	 * Also marks default features as duplicates, if needed.
	 *
	 * @param {string} name feature name
	 * @param {string} value feature value
	 * @see this.createFeatureElement
	 * @private
	 */
	appendFeatureElement(name, value) {
		let features = this.featuresElement.children;
		let i = features.length;
		while(i--) {
			if(features[i].dataset.name === name) {
				return;
			}
		}

		let parent, newElement = this.createFeatureElement(name, value);
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
	 * @private
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
	 * @private
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
	 * @private
	 */
	createFeatureElement(name, value) {
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
	 * @private
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

	/**
	 * Exactly what it says on the tin
	 *
	 * @protected
	 */
	showInsideItems() {
		let subitem;
		this.removeInsideItems(); // TODO: reuse same items if possible
		for(let i = 0; i < this.item.inside.length; i++) {
			subitem = this.item.inside[i];
			this.addInside(subitem);
		}
	}

	/**
	 * Remove items located inside this item from the view
	 *
	 * @protected
	 */
	removeInsideItems() {
		while(this.insideElement.lastElementChild) {
			this.insideElement.removeChild(this.insideElement.lastElementChild);
		}
	}

	/**
	 * Create a container element, for a single item, and return it.
	 * This is necessary since the containing "el" isn't owned by the view so it shouldn't be changed, but hiding deleted items or other such things require hiding the entire container...
	 *
	 * @return {HTMLElement} container
	 * @private
	 */
	static newElement() {
		let container = document.createElement("div");
		container.classList.add("item");
		container.appendChild(document.getElementById("template-item").content.cloneNode(true));
		return container;
	}

	/**
	 * Delete a subitem via its ItemView.
	 *
	 * @param {ItemView} removeThis - item view to delete
	 * @protected
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
	 * @private
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

		if(that === this.transaction) {
			if(event === 'to-delete') {
				if(this.item.exists && this.transaction.remove.has(this.item.code)) {
					this.toggleDeleted(true);
					return; // stop propagation, unless items can be inside themselves
				}
			}
		}

		if(that === this.item) {
			if(event === 'change') {
				this.permafreeze();
				return;
			}
		}

		for(let i = 0; i < this.subViews.length; i++) {
			this.subViews[i].trigger(that, event);
		}
	}
}
