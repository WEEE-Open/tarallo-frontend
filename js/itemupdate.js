class ItemUpdate extends Item {
	/**
	 * Create a changeset for an existing item.
	 *
	 * @param {Item} item
	 */
	constructor(item) {
		if(!item.exists) {
			if(item.code === null) {
				throw new Error("Cannot create a changeset for an item that doesn't exist on the server")
			} else {
				// TODO: this would be a good place to call item.toString, if it existed...
				throw new Error("Cannot create a changeset for an item that doesn't exist on the server (" + item.code + ")");
			}
		}

		super();
		this.exists = true;
		this.parentChanged = false;
		this.featuresDiff = new Map();
		/** @type {Map.<Item,Item|null>} */
		this.insideDiff = new Map();

		this.setItem(item);
	}

	/**
	 * Set the item to be proxied and merge its content and the current changeset.
	 * This ItemUpdate will then act as a modified Item.
	 *
	 * @param {Item} item
	 */
	setItem(item) {
		this.originalItem = item;

		this.code = this.originalItem.code;

		if(this.parent === this.originalItem.parent) {
			this.parentChanged = true;
			this.parent = this.originalItem.parent;
		} else {
			this.parentChanged = false;
		}

		this.features.clear();

		for(let [k,v] of this.originalItem.features) {
			this.features.set(k,v);
		}

		for(let [k,v] of this.featuresDiff) {
			if(v === null) {
				this.features.delete(k);
			} else {
				this.features.set(k, v);
			}
		}
		if(this.featuresDiff.size > 0) {
			// note that "this" is an ItemUpdate, not the original Item...
			this.trigger('features-changed');
		}

		this.inside.clear();

		for(let [subitem, setTo] of this.insideDiff) {
			if(setTo !== null) {
				this.inside.add(subitem);
			}
		}

		for(let subitem of this.originalItem.inside) {
			// this.inside contains added or modified items.
			// If this item isn't here and isn't marked as deleted, add it
			if(!this.inside.has(subitem) && this.insideDiff.get(subitem) !== null) {
				this.inside.add(subitem);
			}
		}

	}

	/**
	 * Remove original Item, leaving only the changeset
	 */
	unsetItem() {
		this.item = null;
	}

	/**
	 * @see Item.setFeature
	 */
	setFeature(name, value) {
		if(this.originalItem.features.get(name) === value) {
			this.featuresDiff.delete(value);
		} else {
			this.featuresDiff.set(name, value);
		}
		super.setFeature(name, value);
	}

	/**
	 * @see Item.setDefaultFeature
	 */
	setDefaultFeature(name, value) {
		throw new Error("Cannot set default features in item changesets (how did you even get here!?)");
	}

	/**
	 * @see Item.addInside
	 */
	addInside(other) {
		// TODO: implement
	}

	/**
	 * @see Item.removeInside
	 */
	removeInside(other) {
		// TODO: implement
	}

	/**
	 * Does nothing, on ItemUpdate
	 *
	 * @see Item.setExisting
	 */
	setExisting() {
		return this;
	}

	// always fails since item exists:
	// setCode(code)

	/**
	 * @see Item.setParent
	 */
	setParent(code) {
		this.parentChanged = this.originalItem.parent !== code;
		super.setParent(code);
	}

	//noinspection JSUnusedGlobalSymbols
	/**
	 * Serialize to JSON. Actually, convert to a serializable object. This gets called by JSON.stringify internally.
	 *
	 * @return {{}} whatever, JSON.stringify will serialize it
	 */
	toJSON() {
		// TODO: implement
	}
}