class ItemUpdate extends Item {
	constructor(trigger, item) {
		super(trigger);
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
		// call on item, then super?
	}

	/**
	 * @see Item.removeInside
	 */
	removeInside(other) {
		// call on item, then super?
	}

	/**
	 * @see Item.setParent
	 */
	setParent(item) {
		this.parent = item;
		return this;
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
	}

	/**
	 * @see Item.setLocation
	 */
	setLocation(location) {
	}
}