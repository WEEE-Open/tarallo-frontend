class Transaction extends FrameworkObject {
	constructor(trigger) {
		super(trigger);
		this._reset();
	}

	// TODO: il server al momento non genera codici. Farglieli generare.
	/**
	 * Add new Item
	 *
	 * @param {Item} item
	 */
	add(item) {
		this.create.push(item);
		this.trigger('transaction-add');
	}

	/**
	 * Add an item changeset(?) to upload
	 *
	 * @todo use ItemUpdate class
	 * @param {ItemUpdate} item
	 */
	addUpdated(item) {
		this.update.push(item);
		this.trigger('transaction-add');
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
				this.delete.push(item.code);
			}
		} else {
			let code = Item.sanitizeCode(item);
			this.delete.push(code);
		}
		this.trigger('transaction-add');
	}

	_reset() {
		this.create = [];
		this.update = [];
		this.delete = [];
		this.notes = null;
	}

	completed() {
		this._reset();
		this.trigger('transaction-delete');
	}
}
