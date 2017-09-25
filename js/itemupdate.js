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

		this.originalItem = item;

		this.parentChanged = false;
		this.featuresDiff = new Map();
		for(let [k,v] of this.originalItem.features) {
			this.features.set(k,v);
		}
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
		// TODO: implement (or not?)
		// call on item, then super?
	}

	/**
	 * @see Item.removeInside
	 */
	removeInside(other) {
		// TODO: implement (or not?)
		// call on item, then super?
	}

	/**
	 * Does nothing, on ItemUpdate
	 *
	 * @see Item.setExisting
	 */
	setExisting() {
		return this;
	}

	// always fails since item exists (which is obvious, as it's getting updated...)
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