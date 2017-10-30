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
		if(item.code !== null && transaction.update.has(item.code)) {
			/** @type {Item|ItemUpdate} */
			this.item = transaction.update.get(item.code);
			this.item.setItem(item);
		} else {
			/** @type {Item|ItemUpdate} */
			this.item = item;
		}
		this.translations = language;
		this.logs = logs;
		this.transaction = transaction;
		this.frozen = false;
		/**
		 * @type {ItemView|null}
		 */
		this.parentItemView = parentItemView ? parentItemView : null;
		this.subViews = [];
		/**
		 * Map feature names to their FeatureView
		 * @type {Map.<string,FeatureView>}
		 */
		this.featureViews = new Map();
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
		this.undoDeleteButton = this.itemEl.querySelector('.undobutton');
		this.itemDeletedElement = ItemView.createItemDeletedElement();

		let addFieldButton = this.itemEl.querySelector('.addfield');
		let addItemButton = this.itemEl.querySelector('.additem');

		// This only works because new items can only be added when parent item is in "edit mode"
		this.showSaveButton = this.parentItemView === null || (this.item.exists && this.parentItemView.item.exists);

		this.toggleButtons(false);

		if(item.code !== null) {
			this.codeElement.value = item.code;
		}
		if(item.exists) {
			this.toggleCode(false);
		}
		if(this.item.code !== null && this.transaction.remove.has(this.item.code)) {
			this.toggleDeleted(true);
		} else {
			this.toggleDeleted(false);
		}
		// needs to be done before features, for the duplicate check to work
		if(item.defaultFeaturesCount > 0) {
			this.showDefaultFeatures();
		}
		if(item.featuresCount > 0) {
			this.showFeatures();
		}
		if(item.inside.size > 0) {
			this.showInsideItems();
		}

		this.codeElement.addEventListener('blur', this.codeInput.bind(this)); // blur doesn't bubble, but codeElement is already the textbox (featuresElement contains lots of stuff instead)
		addFieldButton.addEventListener('click', this.addFeatureClick.bind(this));
		addItemButton.addEventListener('click', this.addItemClick.bind(this));
		this.selectFeatureElement.addEventListener('click', ItemView.populateFeatureDropdown.bind(this, false));
		this.deleteItemButton.addEventListener('click', this.deleteItemClick.bind(this));
		this.editItemButton.addEventListener('click', this.editItemButtonClick.bind(this));
		this.saveItemButton.addEventListener('click', this.saveItemButtonClick.bind(this));
		this.undoDeleteButton.addEventListener('click', this.undoButtonClick.bind(this))
	}

	/**
	 * Handler for clicking the feature delete button
	 *
	 * @param {string} name - feature name
	 * @param {Event} event
	 * @private
	 */
	deleteFeatureClick(name, event) {
		event.stopPropagation();
		event.preventDefault();
		this.removeFeature(name);
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
			this.appendFeatureElement(select.value, null);
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
		let newItem = new Item();
		this.addInside(newItem);
		this.item.addInside(newItem);
	}

	/**
	 * Create a container, attach a view and add it to the current view, for the supplied item.
	 *
	 * @param {Item} item - an item
	 * @protected
	 */
	addInside(item) {
		let container = document.createElement("div");

		let view = new ItemView(container, item, this.translations, this.logs, this.transaction, this);
		this.subViews.push(view);
		this.insideElement.appendChild(container);
	}

	/**
	 * Handle clicking on the "edit" button to unfreeze the item.
	 *
	 * @private
	 */
	editItemButtonClick() {
		if(this.item.exists) {
			if(!(this.item instanceof ItemUpdate)) {
				this.item = new ItemUpdate(this.item);
				// FeatureView objects also have a reference to this.item
				for(let view of this.featureViews.values()) {
					view.item = this.item;
				}
			}
		}
		this.unfreeze();
	}

	/**
	 * Handle clicking on the "save" button, to save modifications and freeze the element
	 * WEEE Save! [cit.]
	 *
	 * @private
	 */
	saveItemButtonClick() {
		let saved = false;
		this.removeEmptyInside();
		if(this.item.exists) {
			if(!(this.item instanceof ItemUpdate)) {
				this.logs.add('Inconsistent internal state (item exists and isn\'t an ItemUpdate), try reloading items from server (go to another page and come back)', 'E');
				return;
			}
			try {
				/**
				 * @type {ItemUpdate}
				 */
				if(this.item.empty()) {
					this.logs.add('No changes to commit in item ' + this.item.code, 'W');
					saved = true; // still allow freezing
				} else {
					this.transaction.addUpdated(this.item);
					this.item.unsetItem();
					saved = true;
				}
			} catch(e) {
				this.logs.add(e.message, 'E');
				return;
			}
			if(saved) {
				this.freezeUnsaveableRecursive();
			}
		} else {
			/**
			 * @var {Item} this.item
			 */
			if(this.item.empty()) {
				this.logs.add('Empty item, nothing done', 'W');
			} else {
				this.transaction.addNew(this.item);
				saved = true;
			}

			// if the element has been removed from DOM, don't bother freezing...
			if(saved && !!this.el.parentNode) {
				this.freezeRecursive();
			}
		}
	}

	/**
	 * Remove empty subitems
	 */
	removeEmptyInside() {
		// empty() is recursive, this is recursive, worst-case complexity is probably something absurd.
		// But worst case should never happen in practice so nobody cares.
		for(let subview of this.subViews) {
			if(subview.item.empty()) {
				this.item.removeInside(subview.item);
			} else {
				subview.removeEmptyInside();
			}
		}
	}

	/**
	 * Handler for clicking the "delete item" button.
	 *
	 * @private
	 */
	deleteItemClick() {
		if(this.item.exists) {
			try {
				this.transaction.addDeleted(this.item);
			} catch(e) {
				this.logs.add(e.message, 'E');
			}
		} else {
			if(this.transaction.create.has(this.item)) {
				this.transaction.undo(this.transaction.create, this.item);
			}
			if(this.parentItemView === null) {
				this.toggleDeleted(true);
			} else {
				this.parentItemView.deleteItemInside(this);
			}
		}
	}

	/**
	 * Handler for the "undo delete" button
	 */
	undoButtonClick() {
		if(this.item.exists) {
			this.transaction.undo(this.transaction.remove, this.item.code);
		} else {
			this.toggleDeleted(false);
		}
	}

	/**
	 * Show (or rather not show) an item that has been deleted. Or show it if it gets "undeleted".
	 *
	 * @param {boolean} deleted
	 * @protected
	 */
	toggleDeleted(deleted) {
		if(deleted) {
			this.freeze();
			this.itemEl.classList.add("deleted");
			this.undoDeleteButton.style.display = '';
			this.itemEl.appendChild(this.itemDeletedElement);
		} else {
			this.itemEl.classList.remove("deleted");
			this.undoDeleteButton.style.display = 'none';
			try {
				this.itemEl.removeChild(this.itemDeletedElement);
			} catch(e) {}
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
		for(let subview of this.subViews) {
			subview.freezeRecursive();
		}
	}

	/**
	 * Recursively freeze views that don't have a "save" button (e.g. new items).
	 * Stops when encountering a view with a save button, so it doesn't explore the entire view tree.
	 *
	 * @see this.freeze
	 */
	freezeUnsaveableRecursive() {
		this.freeze();
		for(let subview of this.subViews) {
			if(!subview.showSaveButton) {
				subview.freezeUnsaveableRecursive();
			}
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
		this.toggleItemFreezable(this.itemEl, disabled);
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
	toggleItemFreezable(el, disabled) {
		let elements = el.children;
		for(let i = 0; i < elements.length; i++) {
			if(elements[i].classList.contains("inside")) {
				continue;
			}
			if((elements[i].tagName === 'INPUT' || elements[i].tagName === 'SELECT' || elements[i].tagName === 'BUTTON') && elements[i].classList.contains("freezable")) {
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
			this.toggleItemFreezable(elements[i], disabled);
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
	 * @param {string} name - feature name (internal, untranslated version)
	 * @param {string|null} value - feature value
	 * @private
	 */
	appendFeatureElement(name, value) {
		if(this.featureViews.has(name)) {
			return;
		}

		let newElement = this.createFeatureElement(name, value);
		let translation = this.translations.get(name, this.translations.features);

		let translatedNames = this.featuresElement.querySelectorAll(".name");
		if(translatedNames.length === 0) {
			this.featuresElement.appendChild(newElement);
		} else {
			let next = ItemView.searchNextGreater(translation, translatedNames);
			if(next >= translatedNames.length) {
				this.featuresElement.appendChild(newElement);
			} else {
				let otherElement = translatedNames[next].parentElement;
				this.featuresElement.insertBefore(newElement, otherElement);
				if(translatedNames[next].textContent === translation) {
					// replace element (should never happen, but still...)
					this.featuresElement.removeChild(otherElement);
				}
			}
		}

		this.setDefaultFeatureDuplicate(name, true);
	}

	/**
	 * Search for a textContent inside a NodeList.
	 * Returns index of next greater element, which may equal
	 * "length" if needle is greater than anything in the haystack
	 *
	 * @param {string} needle
	 * @param {NodeList} haystack
	 * @return {int}
	 */
	static searchNextGreater(needle, haystack) {
		// https://stackoverflow.com/a/6554035
		let m, l = 0, h = haystack.length;
		while(l < h) {
			m = Math.floor((l + h)/2);
			if(haystack[m].textContent < needle) {
				l = m + 1;
			} else if(haystack[m].textContent === needle) {
				return m;
			} else {
				h = m;
			}
		}
		return h;
	}

	/**
	 * Tries to remove a feature from the feature box. Does nothing if that feature doesn't exist.
	 * Also unmarks default features as duplicates, if needed.
	 *
	 * @param {string} name - feature name
	 * @private
	 */
	removeFeature(name) {
		if(this.featureViews.has(name)) {
			this.featuresElement.removeChild(this.featureViews.get(name).el);
			this.featureViews.delete(name);
		}

		this.item.setFeature(name, null);
		this.setDefaultFeatureDuplicate(name, false);
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
	 * @param {string} name - feature name (internal version)
	 * @param {string} value - feature value (internal version)
	 * @return {Element} new element
	 * @private
	 */
	createFeatureElement(name, value) {
		let newElement, deleteButton;
		newElement = document.createElement("div");
		newElement.classList.add("feature");

		deleteButton = document.createElement("button");
		deleteButton.classList.add("featuredeletebutton");
		deleteButton.classList.add("freezable");
		deleteButton.classList.add("freezable-hide");
		deleteButton.textContent = "-";
		deleteButton.addEventListener('click', this.deleteFeatureClick.bind(this, name));

		newElement.appendChild(deleteButton);
		let view = FeatureView.factory(newElement, this.translations, this.logs, this.item, name, value);
		this.featureViews.set(name, view);

		return newElement;
	}

	/**
	 * Display default features. These are never editable.
	 * @private
	 */
	showDefaultFeatures() {
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

				nameElement.textContent = this.translations.get(name, this.translations.features);
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
		this.removeInsideItems(); // TODO: reuse same items if possible
		for(let subitem of this.item.inside) {
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

	static createItemDeletedElement() {
		let div = document.createElement('div');
		div.classList.add('message');

		let p = document.createElement('p');
		p.textContent = "Deleted";
		div.appendChild(p);

		return div;
	}

	/**
	 * Delete a subitem via its ItemView, remove from transaction
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
		for(let f in this.translations.features) {
			if(this.translations.features.hasOwnProperty(f)) {
				let option = document.createElement("option");
				option.value = f;
				option.textContent = this.translations.features[f];

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
		if(that === this.translations) {
			if(event === 'change') {
				// TODO: update view
			}
		} else if(that === this.transaction) {
			switch(event) {
				case 'to-delete':
					if(this.item.exists && this.transaction.remove.has(this.item.code)) {
						this.toggleDeleted(true);
						return; // stop propagation, unless items can be inside themselves
					}
					break;
				case'un-delete':
					// some item was un-deleted, so it's not in transaction.remove anymore
					if(this.item.exists && this.transaction.lastUndo === this.item.code) {
						this.toggleDeleted(false);
						return
					}
			}
		} else if(that === this.item) {
			if(event === 'change') {
				// TODO: do stuff
				return;
			}
		}

		for(let i = 0; i < this.subViews.length; i++) {
			this.subViews[i].trigger(that, event);
		}
	}
}
