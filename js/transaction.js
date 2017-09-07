class Transaction extends FrameworkObject {
	constructor(trigger) {
		super(trigger);
		this.actionsCounter = 0;
		this._create = new Map();
		this._update = new Map();
		this._remove = new Map();
		this._notes = null;

		this._reset();
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

	/**
	 * Layers and layers of abstraction.
	 * Add item to a map, increment counters, fire triggers, and the like.
	 *
	 * @param {*} item
	 * @param {Map} map
	 * @private
	 */
	_push(item, map) {
		if(!map.has(item)) {
			map.set(item, item);
			this.actionsCounter++;
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
		this._push(item, this._create);
	}

	/**
	 * Add an item changeset(?) to upload
	 *
	 * @todo use ItemUpdate class
	 * @param {ItemUpdate} item
	 */
	addUpdated(item) {
		this._push(item, this._update);
	}

	/**
	 * Add item to kill list... er, delete list
	 *
	 * @param {Item|string|int} item - an item with a code, or a code
	 * @throws {Error} when passing a non-existing item or an item without code
	 * @throws {TypeError} for invalid parameter type
	 */
	addDeleted(item) {
		if(item instanceof Item) {
			if(item.exists === false) {
				throw new Error('Cannot delete items that don\'t even exist on the server (' + item.code + ')')
			} else if(item.code === null) {
				throw new Error('Cannot delete items without code');
			} else {
				this._push(item, this._remove);
			}
		} else {
			let code = Item.sanitizeCode(item);
			this._push(code, this._remove);
		}
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
			(code, message) => {
				this.lastErrorCode = code;
				this.lastErrorMessage = message;
				this.trigger('transaction-failed');
			},
			(data) => {
				this.trigger('transaction-success');
			});

		req.send(JSON.stringify(this));
	}

	completed() {
		this._reset();
		this.trigger('transaction-delete');
	}

	_reset() {
		this.actionsCounter = 0;
		this._create.clear();
		this._update.clear();
		this._remove.clear();
		this._notes = null;
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
			simplified.create = Array.from(this._create.entries());
		}
		if(this._update.size > 0) {
			simplified.update = Array.from(this._update.entries());
		}
		if(this._remove.size > 0) {
			simplified.delete = Array.from(this._remove.entries());
		}
		if(this._notes !== null) {
			simplified.notes = this._notes;
		}
		return simplified;
	}
}
