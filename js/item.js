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
		 * User-defined parent, to replace location. Available only if explicitly set by the user.
		 *
		 * @type {null|string}
		 */
		this.parent = null;
		/**
		 * Current parent, available right here and right now, not the real one that may be in the database.
		 * Null if none.
		 *
		 * @type {null|Item}
		 */
		this.treeParent = null;
		/**
		 * Already exists on the server.
		 * If it exists, code cannot be changed anymore.
		 *
		 * @type {boolean}
		 */
		this.exists = false;
		/**
		 * Unique code
		 *
		 * @type {string|null}
		 */
		this.code = null;
		/**
		 * Code of the default item that lends its features to this one
		 *
		 * @type {string|null}
		 */
		this.defaultCode = null;
		/**
		 * Is this a default item?
		 *
		 * @type {boolean}
		 */
		this.default = false;
		/** @type {Array} location */
		this.location = [];
	}

	/**
	 * Set parent to replace location once saved on the server
	 *
	 * @param {string|int|null} code
	 */
	setParent(code) {
		if(code === null) {
			this.parent = null;
		} else {
			code = Item.sanitizeCode(code);
			this.parent = code;
		}
	}

	/**
	 * Get user-defined parent, which will replace location once saved to the server.
	 * Or null if not set.
	 *
	 * @return {string|null}
	 */
	getParent() {
		return this.parent;
	}

	// TODO: use a proxy to build another object with null features when removed, new features when added, etc... for "update" queries
	/**
	 * Create, Update and Delete features
	 *
	 * @param {string} name - feature name
	 * @param {string|int|null} value - feature value, null to delete
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
		other._setTreeParent(this);
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
	 * @private
	 */
	_removeInsideIndex(pos) {
		let old = this.inside.splice(pos, 1);
		old[0]._setTreeParent(null);
	}

	/**
	 * Set parent of an Item. null means "no parent".
	 * This is the immediate parent, an Item object available right here and right now to be displayed to the user,
	 * not the real parent that the item may have somewhere in the database, nor the item code set as parent by the user.
	 *
	 * @param {Item|null} item
	 * @private
	 */
	_setTreeParent(item) {
		this.treeParent = item;
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
	 * @param {string|int|null} code
	 * @return {Item} this
	 */
	setCode(code) {
		if(this.exists) {
			throw new Error("Cannot change code for existing items (" + this.code + ")");
		}
		if(code === null) {
			this.code = null;
		} else {
			code = Item.sanitizeCode(code);
			this.code = code;
		}
		//this.trigger('code-changed');
		return this;
	}

	/**
	 * Cast code to string, validate and return it
	 *
	 * @param {string} code
	 * @throws Error if code is invalid
	 * @return {string} code
	 */
	static sanitizeCode(code) {
		if(typeof code === 'number') {
			code = code.toString();
		}
		if(Item.isValidCode(code)) {
			return code;
		} else {
			throw new Error('Invalid code: "' + code + '"');
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
			throw new Error("Invalid item code: '" + this.code + "'");
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

	/**
	 * Check if something is an empty array or object.
	 * If it's some other type this function returns true anyway for reasons I can't remember.
	 *
	 * @param something
	 * @return {boolean} true if empty
	 * @private
	 */
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
	 * Set location. Use only if it's a root item in the forest of results.
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
	 * Does this item contain anything useful or is it an empty shell floating aimlessly in the vastness of the address space?
	 * i.e. does it exist or have any feature or a code or anything meaningful?
	 *
	 * @return {boolean} false if it has some meaning and could be stored on the server, true if it's completely pointless
	 */
	empty() {
		if(this.featuresCount > 0) {
			return false;
		}
		if(this.code !== null) {
			return false;
		}
		if(this.parent !== null) {
			return false;
		}
		if(this.inside.length > 0) {
			return false;
		}
		if(this.location.length > 0) {
			return false;
		}
		if(this.defaultCode !== null) {
			return false;
		}
		return !this.exists;

	}

	/**
	 * Build an Item object. Or set some error codes and messages.
	 *
	 * @param {object} item - item to be parsed
	 * @return {boolean} - true for success, false for failure. Of any kind.
	 * @private
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

		if(Array.isArray(item.location)) {
			if(item.location.length === 0) {
				this.setLocation([]);
			} else {
				this.setLocation(item.location);
			}
		} else if(typeof item.location === 'object' && Object.keys(item.location).length === 0) {
			this.setLocation([]);
		} else if(typeof item.location !== 'undefined') {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Expected array or nothing for location, ' + typeof item.location + ' given';
			return false;
		} else {
			// make location always available
			// it should never be undefined in normal conditions, actually, but still...
			this.setLocation([]);
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
	 * @private
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

	//noinspection JSUnusedGlobalSymbols
	/**
	 * Serialize to JSON. Actually, convert to a serializable object. This gets called by JSON.stringify internally.
	 *
	 * @return {{}} whatever, JSON.stringify will serialize it
	 */
	toJSON() {
		let simplified = {};
		simplified.is_default = this.default;
		if(this.defaultCode !== null) {
			simplified.default = this.defaultCode;
		}
		if(this.code !== null) {
			simplified.code = this.code;
		}
		if(this.parent !== null) {
			simplified.parent = this.parent;
		}
		if(this.features) {
			// TODO: use map.
		}
		if(this.inside.length > 0) {
			simplified.content = this.inside;
		}
	}
}