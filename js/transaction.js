class Transaction extends Framework.Object {
	constructor() {
		super();
		/** @type {Map.<Item,Item>} this.create */
		this.create = new Map();
		/** @type {Map.<string,ItemUpdate>} this.update */
		this.update = new Map();
		/** @type {Map.<string,string>} this.remove */
		this.remove = new Map();
		this.notes = null;
		this.inProgress = false;
		/**
		 * Any "add" event that fires refers to this item key.
		 * Null if last operation was anything else (undo, commit, etc...)
		 *
		 * @type {null|string|Item}
		 */
		this.lastAdded = null;
	}

	get actionsCount() {
		return this.create.size + this.update.size + this.remove.size;
	}

	/**
	 * Add item to a map if doesn't exist.
	 *
	 * @param {*} key
	 * @param {*} value
	 * @param {Map} map
	 * @private
	 */
	static _push(key, value, map) {
		if(this.inProgress) {
			throw new Error("Cannot modify a Transaction while it's in progress");
		}
		if(!map.has(key)) {
			map.set(key, value);
		}
	}

	/**
	 * Add new Item
	 *
	 * @param {Item} item
	 */
	addNew(item) {
		Transaction._push(item, item, this.create);
		this.lastAdded = item;
		this.trigger('to-add');
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
		Transaction._push(itemUpdate.code, itemUpdate, this.update);
		this.lastAdded = itemUpdate.code;
		this.trigger('to-update');
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
		Transaction._push(code, code, this.remove);
		this.lastAdded = code;
		this.trigger('to-delete');
	}

	/**
	 * Remove something from transaction.
	 *
	 * @param {Map} from - one of the maps from Transaction
	 * @param {string|Item} key - key in that map
	 */
	undo(from, key) {
		if(this.inProgress) {
			throw new Error("Cannot modify a Transaction while it's in progress");
		}

		if(from === this.update) {
			from.delete(key);
			this.lastAdded = null;
			this.trigger('un-update');
		} else if(from === this.create) {
			from.delete(key);
			this.lastAdded = null;
			this.trigger('un-create');
		} else if(from === this.remove) {
			from.delete(key);
			this.lastAdded = null;
			this.trigger('un-delete');
		} else {
			throw new Error('Invalid map supplied to Transaction');
		}
	}

	/**
	 * Set notes.
	 *
	 * @param {null|string} notes
	 */
	setNotes(notes) {
		if(this.inProgress) {
			throw new Error("Cannot modify a Transaction while it's in progress");
		}
		if(notes === null || typeof notes === 'string') {
			this.notes = notes;
		} else {
			throw new TypeError('Notes must be null or string, ' + typeof notes + ' given');
		}
	}

	commit() {
		let req = XHR.POST(['Edit'],
			(code, message /*, data*/) => {
				this.lastErrorCode = code;
				this.lastErrorMessage = message === null ? 'No message (!?)' : message;
				this.inProgress = false;
				this.trigger('failed');
			},
			(/*data*/) => {
				this.inProgress = false;
				this.trigger('success');
			});

		this.inProgress = true;
		this.lastAdded = null;
		req.send(JSON.stringify(this));
	}

	clear() {
		this.create.clear();
		this.update.clear();
		this.remove.clear();
		this.notes = null;
		this.lastAdded = null;
		this.trigger('reset');
	}

	//noinspection JSUnusedGlobalSymbols
	/**
	 * Serialize to JSON. Actually, convert to a serializable object. This gets called by JSON.stringify internally.
	 *
	 * @return {{}} whatever, JSON.stringify will serialize it
	 */
	toJSON() {
		let simplified = {};
		if(this.create.size > 0) {
			// I wonder if this is O(n) or it's optimized somehow...
			simplified.create = Array.from(this.create.values());
		}
		if(this.update.size > 0) {
			simplified.update = Array.from(this.update.values());
		}
		if(this.remove.size > 0) {
			simplified.delete = Array.from(this.remove.values());
		}
		if(this.notes !== null) {
			simplified.notes = this.notes;
		}
		return simplified;
	}
}
