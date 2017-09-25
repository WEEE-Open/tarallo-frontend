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
		this.originalItem = item;

		this.featuresDiff = new Map();
		this.featuresMerged = new Map();

		this.exists = true;
		this.changeParent = false;

		// TODO: is this needed?
		for(let [k,v] of this.originalItem.features) {
			this.featuresMerged.set(k,v);
		}
	}

	get features() {
		return this.featuresMerged;
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

		if(value === null) {
			this.featuresMerged.delete(name);
		} else {
			this.featuresMerged.set(name, value);
		}
	}

	get featuresCount() {
		// TODO: this - features set to null + new features
		//return this.features.size;
		return 9001;
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
		this.changeParent = this.originalItem.parent !== code;
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