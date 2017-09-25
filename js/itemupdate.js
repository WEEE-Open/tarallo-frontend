class ItemUpdate extends Item {
	constructor(item) {
		super();
		this.originalItem = item;

		this.featuresDiff = new Map();
		this.featuresMerged = new Map();

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
		// call on item, then super?
	}

	/**
	 * @see Item.removeInside
	 */
	removeInside(other) {
		// TODO: implement
		// call on item, then super?
	}

	/**
	 * TODO: turn into a NOP?
	 *
	 * @see Item.setExisting
	 */
	setExisting() {
		this.exists = true;
		return this;
	}

	/**
	 * @see Item.setCode
	 */
	setCode(code) {
		// TODO: implement
	}

	/**
	 * @see Item.setLocation
	 */
	setLocation(location) {
		// TODO: implement
	}

	/**
	 * @see Item.setParent
	 */
	setParent(code) {
		// TODO: implement
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