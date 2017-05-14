class Item extends FrameworkObject {
	constructor(trigger) {
		super(trigger);
		this.features = {};
		this.defaultFeatures = {};
		this.code = null;
	}

	// TODO: use a proxy to build another object with null features when removed, new features when added, etc... for "update" queries
	/**
	 * Create, Update and Delete features
	 *
	 * @param {string} name feature name
	 * @param {string|int|null} value feature value, null to delete
	 * @returns {boolean} operation succeeded or not (fails only if creating a feature with an invalid name, delete always succeeds)
	 */
	setFeature(name, value) {
		if(value === null) {
			delete this.features[name];
			return true;
		}

		if(Item.isValidFeatureName(name)) {
			this.features[name] = value;
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Same as setFeature, but for default features.
	 *
	 * @param name
	 * @param value
	 * @return {boolean}
	 * @see this.setFeature
	 */
	setDefaultFeature(name, value) {
		if(value === null) {
			delete this.defaultFeatures[name];
			return true;
		}

		if(Item.isValidFeatureName(name)) {
			this.defaultFeatures[name] = value;
			return true;
		} else {
			return false;
		}
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