class Item extends FrameworkObject {
	constructor(trigger) {
		super(trigger);
		this.featuresCount = 0;
		this.features = {};
		this.defaultFeaturesCount = 0;
		/**
		 * @type {null|string}
		 */
		this.lastErrorCode = null;
		this.lastErrorMessage = null;
		this.defaultFeatures = {};
		this.inside = [];
		/**
		 * Current parent, available right here and right now, not the real one that may be in the database.
		 * Null if none.
		 *
		 * @type {null|Item}
		 */
		this.parent = null;
		/**
		 * Already exists on the server.
		 * If it exists, code cannot be changed anymore.
		 *
		 * @type {boolean}
		 */
		this.exists = false;
		/**
		 * Unique code
		 * @type {string|null}
		 */
		this.code = null;
		/** @type {Array} location */
		this.location = [];
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
	 * @param {string} name
	 * @param {string|int|null} value
	 * @return {boolean}
	 * @see this.setFeature
	 */
	setDefaultFeature(name, value) {
		if(!Item.isValidFeatureName(name)) {
			throw new Error(name + ' is not a feature name');
		}
		if(value === null) {
			if(typeof this.features[name] === 'undefined') {
				return false;
			} else {
				delete this.defaultFeatures[name];
				this.defaultFeaturesCount--;
				return true;
			}
		}

		if(this.defaultFeatures[name] === value) {
			return false;
		} else {
			this.defaultFeatures[name] = value;
			this.defaultFeaturesCount++;
			return true;
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
		other._setParent(this);
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
			this._removeInsideIndex(pos);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Remove an Item from its index.
	 *
	 * @param {int} pos item to be removed
	 */
	_removeInsideIndex(pos) {
		let old = this.inside.splice(pos, 1);
		old[0]._setParent(null);
	}

	/**
	 * Set parent of an Item. null means "no parent".
	 * This is the immediate parent, available to and visibile on the client, not the real parent that the item may have
	 * somewhere in the database.
	 *
	 * @param {Item|null} item
	 */
	_setParent(item) {
		this.parent = item;
		return this;
	}

	/**
	 * Mark Item as existing on the server. Once it does, code cannot be changed anymore.
	 *
	 * @return {Item} this
	 */
	setExisting() {
		this.exists = true;
		return this;
	}

	/**
	 * Set item code.
	 *
	 * @param {string} code
	 * @return {Item} this
	 */
	setCode(code) {
		if(typeof code === 'number') {
			code = code.toString();
		}
		if(Item.isValidCode(code)) {
			this.code = code;
			this.trigger('code-changed');
			return this;
		} else {
			throw new Error('Invalid code: ' + code);
		}
	}

	/**
	 * Is (default) feature name valid?
	 *
	 * @param {string} name feature name
	 * @return {boolean} valid or not
	 * @private
	 */
	static isValidFeatureName(name) {
		return typeof name === 'string';
	}

	/**
	 * Is this a valid code?
	 *
	 * @param {string} code code
	 * @return {boolean} valid or not
	 */
	static isValidCode(code) {
		return typeof code === 'string' &&
			!code.startsWith('-') &&
			!code.endsWith('-') &&
			/^[A-Za-z0-9-]+$/.test(code);
	}

	/**
	 * Use code, and only code, to get the item from server.
	 * The entire item and its content will be replaced or updated before the "fetch-success" event.
	 *
	 * @return {Item}
	 */
	getFromServer() {
		if(!Item.isValidCode(this.code)) {
			throw Error("Invalid item code: '" + this.code + "'");
		}

		let req = XHR.GET('/Location/' + this.code,
			(code, message) => {
				this.lastErrorCode = code;
				this.lastErrorMessage = message;
				this.trigger('fetch-failed');
			},
			(data) => {
				if(this.parseData(data)) {
					this.trigger('fetch-success');
				} else {
					this.trigger('fetch-failed');
				}
			});
		req.send();

		return this;
	}

	static _isEmpty(something) {
		switch(typeof something) {
			case 'object':
				// these objects are usually quite small, Object.keys shouldn't destroy performance
				return Object.keys(something).length === 0;
				break;
			case 'array':
				return something.length === 0;
			default:
				return true;
		}
	}

	/**
	 * Parse response data, update current object.
	 *
	 * @param {object} data - an object, or anything else if the server messes up
	 */
	parseData(data) {
		if(typeof data !== 'object') {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Expected object from server, got ' + (typeof data);
			return false;
		}

		// TODO: may/should be an array, actually
		if(typeof data.items !== "object") {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Expected an "items" object from server, got ' + (typeof data.items);
			return false;
		}

		if(Item._isEmpty(data.items)) {
			this.lastErrorCode = 'not-found';
			this.lastErrorMessage = 'Item not found';
			return false;
		}

		if(data.items.length > 1) {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Duplicate items returned for the same code (expected 1, got ' + data.items.length + ')';
			return false;
		}

		return this._parseItem(data.items[0]);
	}

	/**
	 * Set location.
	 *
	 * @param {Array} location - complete location from root
	 */
	setLocation(location) {
		if(Array.isArray(location)) {
			this.location = location;
		} else {
			throw new TypeError("Expected location as array, got " + typeof location);
		}
	}

	/**
	 * Build an Item object. Or set some error codes and messages.
	 *
	 * @param {object} item - item to be parsed
	 * @return {boolean} - true for success, false for failure. Of any kind.
	 */
	_parseItem(item) {
		this.setExisting();

		if(typeof item.code === 'number') {
			item.code = item.code.toString();
		}
		if(typeof item.code === 'string') {
			try {
				this.setCode(item.code);
			} catch(e) {
				this.lastErrorCode = 'malformed-response';
				this.lastErrorMessage = e.message;
				return false;
			}
		} else {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Invalid item code: expected string or int, got ' + (typeof item.code);
			return false;
		}

		//noinspection JSUnresolvedVariable
		if(!(this._parseItemFeatures(item.features, this.features, this.setFeature.bind(this), 'features-changed') &&
			this._parseItemFeatures(item.features_default, this.defaultFeatures, this.setDefaultFeature.bind(this), 'default-features-changed'))) {
			return false;
		}

		if(Array.isArray(item.content)) {
			let insideCodes = {};
			// remove items without a code, since they don't exist on the server and cannot be updated
			for(let i = 0; i < this.inside.length; i++) {
				if(this.inside[i].code !== null) {
					this._removeInsideIndex(i);
				}
			}

			// this avoids checking against newly added items, which is pointless
			// note that this will fail catastrophically if addInside sorts or reorders items in any way.
			let previousLength = this.inside.length;

			for(let i = 0; i < item.content.length; i++) {
				if(typeof item.content[i].code === 'number') {
					item.content[i].code = code.toString();
				}

				if(typeof item.content[i].code === 'string') {
					insideCodes[item.content[i].code] = true;
					let previousItem = null;
					for(let i = 0; i < previousLength; i++) {
						if(this.inside[i].code === item.content[i].code) {
							previousItem = this.inside[i];
							break;
						}
					}
					if(previousItem === null) {
						previousItem = new Item(this.trigger);
						try {
							previousItem.setCode(item.content[i].code);
						} catch(e) {
							this.lastErrorCode = 'malformed-response';
							this.lastErrorMessage = e.message;
							return false;
						}
						this.addInside(previousItem);
					}
					previousItem._parseItem(item.content[i]);
				} else {
					this.lastErrorCode = 'malformed-response';
					this.lastErrorMessage = 'Invalid item code: expected string or int, got ' + (typeof item.code);
					return false;
				}
			}

			for(let i = 0; i < previousLength; i++) {
				if(!insideCodes[this.inside[i].code]) {
					this._removeInsideIndex(i);
				}
			}

			// there isn't really a way to detect here if anything has changed inside
			// (functions return true/false for success/failure), so trigger an event anyway.
			// this is in post-order: innermost elements trigger first, outermost last, so
			// the handler can be non-recursive.
			this.trigger('inside-changed');
		}

		if(typeof item.location === 'object') {
			this.setLocation([]);
		} else if(Array.isArray(item.location)) {
			if(item.location.length === 0) {
				this.setLocation([]);
			} else {
				this.setLocation(item.location);
			}
		} else if(typeof item.location !== 'undefined') {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Expected array or nothing for location, ' + typeof item.location + ' given';
			return false;
		}

		return true;
	}

	/**
	 * Update features and default features. All in a single function! Which should be called twice with different parameters!
	 *
	 * @param {undefined|Array|object} newFeatures - item.features or item.features_default
	 * @param {Array} oldFeatures - this.features or this.defaultFeatures
	 * @param {Function} setFeature - this.setFeature or this.setDefaultFeature
	 * @param {string} event - event to fire if anything has changed
	 * @return {boolean}
	 */
	_parseItemFeatures(newFeatures, oldFeatures, setFeature, event) {
		if(typeof newFeatures === 'undefined' || (Array.isArray(newFeatures) && Item._isEmpty(newFeatures))) {
			return true;
		}

		if(typeof newFeatures === 'object') {
			let changed = false;
			for(let old in oldFeatures) {
				if(oldFeatures.hasOwnProperty(old)) {
					if(!newFeatures.hasOwnProperty(old)) {
						changed = setFeature(old, null) || changed;
					}
				}
			}
			for(let feature in newFeatures) {
				if(newFeatures.hasOwnProperty(feature)) {
					changed = setFeature(feature, newFeatures[feature]) || changed;
				}
			}

			if(changed) {
				this.trigger(event);
			}

			return true;
		} else {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Expected "features" to be an object, got ' + (typeof newFeatures);
			return false;
		}
	}
}