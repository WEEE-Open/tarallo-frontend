class Transaction extends FrameworkObject {
	constructor(trigger) {
		super(trigger);
		this.actionsCounter = 0;
		this._create = new Map();
		this._update = new Map();
		this._delete = new Map();
		this._notes = null;

		// use getters if this stuff is ever needed externally:
		//get create() {
		//	return this._create.values();
		//}

		this._reset();
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
	 * @throws Error when passing a non-existing item or an item without code
	 * @throws TypeError for invalid parameter type
	 */
	addDeleted(item) {
		if(item instanceof Item) {
			if(item.exists === false) {
				throw new Error('Cannot delete items that don\'t even exist on the server (' + item.code + ')')
			} else if(item.code === null) {
				throw new Error('Cannot delete items without code');
			} else {
				this._push(item, this._delete);
			}
		} else {
			let code = Item.sanitizeCode(item);
			this._push(code, this._delete);
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

	_reset() {
		this.actionsCounter = 0;
		this._create.clear();
		this._update.clear();
		this._delete.clear();
		this._notes = null;
	}

	completed() {
		this._reset();
		this.trigger('transaction-delete');
	}
}
