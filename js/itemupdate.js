class ItemUpdate extends Item {
	constructor(item) {
		super();
		this.originalItem = item;
	}

	/**
	 * @see Item.setFeature
	 */
	setFeature(name, value) {
		// TODO: this will have a million branches. Draw a CFG to avoid catastrophic bugs and hopefully find a pattern.
		if(typeof this.originalItem.features[name] !== 'undefined') {

		}
		if(super.setFeature(name, value)) {
			if(value === null) {

			}
		}
	}

	/**
	 * @see Item.setDefaultFeature
	 */
	setDefaultFeature(name, value) {
		// TODO: implement
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