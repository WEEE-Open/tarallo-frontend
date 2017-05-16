class Item extends FrameworkObject {
	constructor(trigger) {
		super(trigger);
		this.featuresCount = 0;
		this.features = {};
		this.defaultFeaturesCount = 0;
		this.defaultFeatures = {};
		this.inside = [];
		/**
		 * Unique code
		 * @type {string|null}
		 */
		this.code = null;
	}

	// TODO: use a proxy to build another object with null features when removed, new features when added, etc... for "update" queries
	/**
	 * Create, Update and Delete features
	 *
	 * @param {string} name feature name
	 * @param {string|int|null} value feature value, null to delete
	 * @returns {boolean} anything actually changed (false if deleting non-existing features, etc...)
	 */
	setFeature(name, value) {
		if(!Item.isValidFeatureName(name)) {
			throw new Error(name + ' is not a feature name');
		}
		if(value === null) {
			if(typeof this.features[name] === 'undefined') {
				return false;
			} else {
				delete this.features[name];
				this.featuresCount--;
				return true;
			}
		} else {
			if(this.features[name] === value) {
				return false;
			} else {
				this.features[name] = value;
				this.featuresCount++;
				return true;
			}
		}
	}

	/**
	 * Same as setFeature, but for default features.
	 *
	 * @todo copy this.setFeature
	 * @param name
	 * @param value
	 * @return {boolean}
	 * @see this.setFeature
	 */
	setDefaultFeature(name, value) {
		if(!Item.isValidFeatureName(name)) {
			throw new Error(name + ' is not a feature name');
		}
		if(value === null) {
			delete this.defaultFeatures[name];
			this.defaultFeaturesCount--;
			return true;
		}

		if(Item.isValidFeatureName(name)) {
			this.defaultFeatures[name] = value;
			this.defaultFeaturesCount++;
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Insert an Item
	 *
	 * @param {Item} other item to be place inside
	 */
	addInside(other) {
		// not every item may have a code, so using an associative array / object / hash table / map isn't possible
		this.inside.push(other);
	}

	/**
	 * Remove an Item. Beware of the O(n) complexity.
	 *
	 * @param {Item} other item to be removed
	 * @returns {boolean} true if found and removed, false if not found
	 */
	removeInside(other) {
		// not every item may have a code, so using an associative array / object / hash table / map isn't possible
		let pos = this.inside.indexOf(other);
		if(pos > -1) {
			let old = this.inside.splice(pos, 1);
			old.setParent(null);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Set parent of an Item. null means "no parent".
	 * This is the immediate parent, available to and visibile on the client, not the real parent that the item may have
	 * somewhere in the database.
	 *
	 * @param {Item|null} item
	 */
	setParent(item) {

	}

	/**
	 * Set item code.
	 *
	 * @param {string} code
	 * @return {boolean}
	 */
	setCode(code) {
		if(Item.isValidCode(code)) {
			this.code = code;
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Is (default) feature name valid?
	 *
	 * @param name feature name
	 * @return {boolean} valid or not
	 * @private
	 */
	static isValidFeatureName(name) {
		return typeof name === 'string';
	}

	/**
	 * Is this a valid code?
	 *
	 * @param code code
	 * @return {boolean} valid or not
	 */
	static isValidCode(code) {
		return Item.isValidFeatureName(code);
	}
}