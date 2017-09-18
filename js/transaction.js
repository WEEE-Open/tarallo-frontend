class Transaction extends Framework.Object {
	constructor(trigger) {
		super(trigger);
		this._create = new Map();
		this._update = new Map();
		this._remove = new Map();
		this._notes = null;
	}

	get actionsCount() {
		return this._create.size + this._update.size + this._remove.size;
	}

	get create() {
		return this._create.values();
	}

	get update() {
		return this._update.values();
	}

	get remove() {
		return this._remove.values();
	}

	get createCount() {
		return this._create.size;
	}

	get updateCount() {
		return this._update.size;
	}

	get removeCount() {
		return this._remove.size;
	}

	/**
	 * Layers and layers of abstraction.
	 * Add item to a map, increment counters, fire triggers, and the like.
	 *
	 * @param {*} key
	 * @param {*} value
	 * @param {Map} map
	 * @private
	 */
	_push(key, value, map) {
		if(!map.has(key)) {
			map.set(key, value);
			this.trigger('transaction-add');
		}
	}

	// TODO: il server al momento non genera codici. Farglieli generare.
	/**
	 * Add new Item
	 *
	 * @param {Item} item
	 */
	add(item) {
		this._push(item, item, this._create);
	}

	/**
	 * Add an item changeset(?) to upload
	 *
	 * @param {ItemUpdate} itemUpdate
	 * @throws {Error} Items that don't exist or don't have codes
	 * @throws {TypeError} if item is not an ItemUpdate, to prevent Item objects accidentally slipping in this method
	 */
	addUpdated(itemUpdate) {
		if(!(itemUpdate instanceof ItemUpdate)) {
			throw new TypeError("Item updates should be instances of ItemUpdate, " + typeof itemUpdate + " given");
		}
		if(!itemUpdate.exists) {
			// This is kind of complicated to explain to an user, but hopefully this message shouldn't turn up anywhere during normal operation
			throw new Error("Cannot submit patches to items that don't exist yet, edit the new item waiting to be committed instead");
		}
		if(itemUpdate.code === null) {
			throw new Error("Cannot edit items without code");
		}
		this._push(itemUpdate.code, itemUpdate, this._update);
	}

	/**
	 * Add item to kill list... er, delete list
	 *
	 * @param {Item|string|int} item - an item with a code, or a code. Always pass an Item if available.
	 * @throws {Error} when passing a non-existing item or an item without code
	 * @throws {TypeError} for invalid parameter type
	 */
	addDeleted(item) {
		let code;
		if(item instanceof Item) {
			if(item.exists === false) {
				throw new Error('Cannot delete items that don\'t even exist on the server (' + item.code + ')')
			} else if(item.code === null) {
				throw new Error('Cannot delete items without code');
			} else {
				code = item.code;
			}
		} else {
			// "item" is actually a string here, so it needs sanitization
			code = Item.sanitizeCode(item);
		}
		this._push(code, code, this._remove);
	}

	/**
	 * Set notes.
	 *
	 * @param {null|string} notes
	 */
	setNotes(notes) {
		if(notes === null || typeof notes === 'string') {
			this._notes = notes;
		} else {
			throw new TypeError('Notes must be null or string, ' + typeof notes + ' given');
		}
	}

	commit() {
		let req = XHR.POST('/Edit',
			(code, data) => {
				// TODO: this needs to be handled inside XHR... maybe this function should be (code, message, data)?
				let message;
				if(typeof data === 'undefined' || data === null) {
					message = null;
				} else if(typeof data === 'string') {
					message = data;
				} else {
					message = typeof data.message === 'undefined' ? "no message (!?)" : data.message;
				}
				this.lastErrorCode = code;
				this.lastErrorMessage = message;
				this.trigger('transaction-failed');
			},
			(data) => {
				console.log(data); // TODO: remove
				this.trigger('transaction-success');
			});

		req.send(JSON.stringify(this));
	}

	completed() {
		this._create.clear();
		this._update.clear();
		this._remove.clear();
		this._notes = null;
		this.trigger('transaction-delete');
	}

	//noinspection JSUnusedGlobalSymbols
	/**
	 * Serialize to JSON. Actually, convert to a serializable object. This gets called by JSON.stringify internally.
	 *
	 * @return {{}} whatever, JSON.stringify will serialize it
	 */
	toJSON() {
		let simplified = {};
		if(this._create.size > 0) {
			// I wonder if this is O(n) or it's optimized somehow...
			simplified.create = Array.from(this._create.values());
		}
		if(this._update.size > 0) {
			simplified.update = Array.from(this._update.values());
		}
		if(this._remove.size > 0) {
			simplified.delete = Array.from(this._remove.values());
		}
		if(this._notes !== null) {
			simplified.notes = this._notes;
		}
		return simplified;
	}
}
