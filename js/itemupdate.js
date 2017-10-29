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
		/** @type {Map.<string,string|null>} */
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
		/**
		 * @type {Item}
		 * @private
		 */
		this.originalItem = item;

		this.code = this.originalItem.code;
		this.location = this.originalItem.location;

		this.parentChanged = this.parent !== this.originalItem.parent;

		this.features.clear();
		this.inside.clear();

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

		for(let item of this.originalItem.inside) {
			if(!(this.insideDiff.has(item) && this.insideDiff.get(item) !== null)) {
				this.inside.add(item);
			}
		}

		for(let [item, value] of this.insideDiff) {
			if(value !== null) {
				// insideDiff contains removed (handled right there ↑) or added items,
				// any modified subitem shouldn't be there in the first place
				this.inside.add(item);
			}
		}

		if(this.featuresDiff.size > 0) {
			// note that "this" is an ItemUpdate, not the original Item...
			this.trigger('features-changed');
		}
	}

	/**
	 * Remove original Item, leaving only the changeset
	 *
	 * @return {ItemUpdate} this
	 */
	unsetItem() {
		this.item = null;
		return this;
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
		// this is used only by parseItem, which fortunately never handles ItemUpdate
		throw new Error("Cannot set default features in item changesets (how did you even get here!?)");
	}

	/**
	 * @see Item.addInside
	 */
	addInside(other) {
		if(other instanceof ItemUpdate) {
			throw new Error("Cannot add ItemUpdate inside ItemUpdate");
		}
		if(this.originalItem.inside.has(other)) {
			this.insideDiff.delete(other);
		} else {
			this.insideDiff.set(other, other);
		}
		super.addInside(other);
	}

	/**
	 * @see Item.removeInside
	 */
	removeInside(other) {
		if(other instanceof ItemUpdate) {
			throw new Error("Cannot add/remove ItemUpdate inside ItemUpdate");
		}
		if(this.originalItem.inside.has(other)) {
			this.insideDiff.set(other, null);
		} else {
			this.insideDiff.delete(other);
		}
		super.removeInside(other);
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

	/**
	 * @see Item.empty
	 */
	empty() {
		if(this.featuresDiff.size > 0) {
			return false;
		}
		if(this.insideDiff.size > 0) {
			return false;
		}
		return !this.parentChanged;
	}

	/**
	 * Same as empty(), but only considers outer item (i.e. ignores any inside items)
	 *
	 * @see this.empty
	 * @return {boolean}
	 */
	emptyOutside() {
		if(this.featuresDiff.size > 0) {
			return false;
		}
		return !this.parentChanged;
	}

	//noinspection JSUnusedGlobalSymbols
	/**
	 * @see Item.toJSON
	 */
	toJSON() {
		let simplified = {};

		// TODO: setting/unsetting as default, changing default item

		simplified.code = this.code;
		if(this.parentChanged) {
			simplified.parent = this.parent;
		}
		if(this.featuresDiff.size > 0) {
			simplified.features = {};
			for(let [name, value] of this.featuresDiff) {
				simplified.features[name] = value;
			}
		}
		// Server doesn't allow this, so it's now handled inside Transaction
		// if(this.insideDiff.size > 0) {
		// 	simplified.content = Array.from(this.inside.values());
		// }

		return simplified;
	}
}