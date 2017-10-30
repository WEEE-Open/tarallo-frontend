class Item extends Framework.Object {
	constructor() {
		super();
		/**
		 * @type {null|string}
		 */
		this.lastErrorCode = null;
		this.lastErrorMessage = null;

		/**
		 * @type {Map.<string,string|int>}
		 */
		this.features = new Map();
		/**
		 * @type {Map.<string,string|int>}
		 */
		this.defaultFeatures = new Map();
		/**
		 * @type {Set.<Item>}
		 */
		this.inside = new Set();
		/**
		 * User-defined parent, to replace location. Available only if explicitly set by the user.
		 *
		 * @type {null|string}
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
		/**
		 * Current item location.
		 *
		 *
		 * @type {Array}
		 */
		this.location = [];
	}

	get featuresCount() {
		return this.features.size;
	}

	get defaultFeaturesCount() {
		return this.features.size;
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
		// TODO: trigger event?
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
			if(this.features.has(name)) {
				this.features.delete(name);
				return true;
			} else {
				return false;
			}
		} else {
			if(this.features.get(name) === value) {
				return false;
			} else {
				this.features.set(name, value);
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
			if(typeof this.defaultFeatures[name] === 'undefined') {
				return false;
			} else {
				delete this.defaultFeatures[name];
				return true;
			}
		}

		if(this.defaultFeatures[name] === value) {
			return false;
		} else {
			this.defaultFeatures[name] = value;
			return true;
		}
	}

	/**
	 * Insert an Item
	 *
	 * @param {Item} other item to be place inside
	 */
	addInside(other) {
		this.inside.add(other);
	}

	/**
	 * Remove an Item.
	 *
	 * @param {Item} other item to be removed
	 * @returns {boolean} true if found and removed, false if not found
	 */
	removeInside(other) {
		let found = this.inside.has(other);
		if(found) {
			this.inside.delete(other);
		}
		return found;
	}

	/**
	 * Mark Item as existing on the server. Once it does, code cannot be changed anymore.
	 *
	 * @return {Item} this
	 */
	setExisting() {
		if(this.code === null) {
			throw new Error("Existing items must have a code");
		}
		this.exists = true;
		return this;
	}

	/**
	 * Set item code.
	 * Null to unset.
	 *
	 * @param {string|int|null} code
	 * @return {Item} this
	 * @throws {Error} if code is invalid
	 * @throws {Error} if item exists
	 */
	setCode(code) {
		if(this.code === code) {
			return this;
		}
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
	 * @throws {Error} if code is invalid
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

		let req = XHR.GET(['Location', this.code],
			(code, message/*, data*/) => {
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

		return this.parseItem(data.items[0]);
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
		if(this.features.size > 0) {
			return false;
		}
		if(this.code !== null) {
			return false;
		}
		if(this.defaultCode !== null) {
			return false;
		}
		if(this.inside.size > 0) {
			for(let subitem of this.inside) {
				if(!subitem.empty()) {
					return false;
				}
			}
		}
		return !this.exists;

	}

	/**
	 * Build an Item object. Or set some error codes and messages.
	 *
	 * @param {object} item - item to be parsed
	 * @return {boolean} - true for success, false for failure. Of any kind.
	 */
	parseItem(item) {
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

		//noinspection JSUnresolvedVariable - item is parsed JSON, not this item
		if(!(this._parseItemFeatures(item.features, this.features, this.setFeature.bind(this), 'features-changed') &&
			this._parseItemFeatures(item.features_default, this.defaultFeatures, this.setDefaultFeature.bind(this), 'default-features-changed'))) {
			return false;
		}

		if(Array.isArray(item.location)) {
			if(item.location.length === 0) {
				this.setLocation([]);
			} else {
				let changed = false;
				let oldLocation = this.location;
				this.setLocation(item.location);
				if(oldLocation !== null && oldLocation.length === this.location.length) {
					for(let i = 0; i < oldLocation.length; i++) {
						if(oldLocation[i] !== this.location[i]) {
							changed = true;
							break;
						}
					}
				} else {
					changed = true;
				}
				if(changed) {
					this.trigger('location-changed');
				}
			}
		} else if(typeof item.location === 'object' && Object.keys(item.location).length === 0) {
			this.setLocation([]);
		} else if(typeof item.location !== 'undefined') {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Expected array or nothing for location, ' + typeof item.location + ' given';
			return false;
		} else if(this.location === null) {
			// make location always available
			// if this is an inner item, item.location won't be present and this.location will have been already set a few lines down from there, just before the recursive call
			this.setLocation([]);
		}

		if(Array.isArray(item.content)) {
			let changedInside = false;
			let newInsideCodes = {};
			/** @type {Map.<string,Item>} */
			let currentlyInside = new Map();
			// remove items without a code, since they don't exist on the server and cannot be updated
			// and map whatever remains with its code. This will crash and burn if there are duplicate codes,
			// which should be impossible.
			for(let item of this.inside) {
				if(item.code !== null) {
					changedInside = true;
					this.inside.delete(item);
				}
				currentlyInside.set(item.code, item);
			}

			for(let i = 0; i < item.content.length; i++) {
				if(typeof item.content[i].code === 'number') {
					item.content[i].code = code.toString();
				}

				if(typeof item.content[i].code === 'string') {
					newInsideCodes[item.content[i].code] = true;
					let previousItem = currentlyInside.get(item.content[i].code);
					if(typeof previousItem === 'undefined') {
						// new item (get returns undefined when not found)
						previousItem = new Item();
						try {
							previousItem.setCode(item.content[i].code);
						} catch(e) {
							this.lastErrorCode = 'malformed-response';
							this.lastErrorMessage = e.message;
							return false;
						}
						this.addInside(previousItem);
						changedInside = true;
					}
					let location = this.location.slice(0);
					location.push(this.code);
					previousItem.setLocation(location);
					previousItem.parseItem(item.content[i]);
				} else {
					this.lastErrorCode = 'malformed-response';
					this.lastErrorMessage = 'Invalid item code: expected string or int, got ' + (typeof item.code);
					return false;
				}
			}

			for(let [code, item] of currentlyInside) {
				if(!newInsideCodes[code]) {
					changedInside = true;
					this.inside.delete(item);
				}
			}

			// this is in post-order: innermost elements trigger first, outermost last.
			// inside-changed means there are new or removed elements inside, it says nothing on what happened to existing items
			if(changedInside) {
				this.trigger('inside-changed');
			}
		}

		// last things last: this would prevent setCode if it was elsewhere
		this.setExisting();

		return true;
	}

	/**
	 * Update features and default features. All in a single function! Which should be called twice with different parameters!
	 *
	 * @param {undefined|Array|object} newFeatures - item.features or item.features_default
	 * @param {Map} oldFeatures - this.features or this.defaultFeatures
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
			for(let old of oldFeatures.keys()) {
				if(!newFeatures.hasOwnProperty(old)) {
					changed = setFeature(old, null) || changed;
				}
			}
			for(let feature in newFeatures) {
				if(newFeatures.hasOwnProperty(feature)) {
					changed = setFeature(feature, newFeatures[feature]) || changed;
				}
			}

			if(changed) {
				// features-changed or default-features-changed
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
		if(this.features.size > 0) {
			simplified.features = {};
			for(let [name, value] of this.features) {
				simplified.features[name] = value;
			}
		}
		if(this.inside.size > 0) {
			simplified.content = Array.from(this.inside.values());
		}

		return simplified;
	}
}