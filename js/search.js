class Search extends Framework.Object {
	constructor() {
		super();

		/** @type {Map.<string,int>}
		 *  @private */
		this.keys = new Map();
		/** @type {Set.<Search.Pair>} */
		this.pairs = new Set();
	}

	/**
	 * Add stuff.
	 *
	 * @param {string} key
	 * @param {string|int} value
	 * @return {Search.Pair} new pair
	 */
	add(key, value) {
		let before = this.pairs.size;
		let pair = new Search.Pair(key, value, this.keys.has(value));
		this.addKey(key);
		this.pairs.add(pair);
		if(before === 0) {
			this.trigger('add-content');
		}
		return pair;
	}

	/**
	 * Remove a pair. Get it from this.pairs.
	 *
	 * @see this.pairs
	 * @param {Search.Pair} pair
	 */
	remove(pair) {
		this.pairs.delete(pair);
		// noinspection JSUnresolvedVariable
		this.removeKey(pair.key);
		if(this.pairs.size === 0) {
			this.trigger('remove-content');
		}
	}

	/**
	 * Is there anything here?
	 *
	 * @return {boolean}
	 */
	hasContent() {
		return this.pairs.size > 0;
	}

	/**
	 * Note that a key is present and increment its counter.
	 *
	 * @param {string} key
	 * @private
	 */
	addKey(key) {
		// I wonder if this data structure already exists in a standardized form and if it has a name...
		if(this.keys.has(key)) {
			this.keys.set(key, this.keys.get(key) + 1);
		} else {
			this.keys.set(key, 1);
		}
	}

	/**
	 * Note that a key was removed and decrement its counter.
	 *
	 * @param {string} key
	 * @private
	 */
	removeKey(key) {
		if(this.keys.has(key)) {
			let count = this.keys.get(key);
			if(count > 1) {
				this.keys.set(key, count - 1);
			} else {
				this.keys.delete(key);
			}
		} else {
			throw new Error("Removing unexisting key " + key);
		}
	}

	/**
	 * Does key exist in this search?
	 *
	 * @param {string} key
	 * @return {boolean}
	 */
	containsKey(key) {
		return this.keys.has(key);
	}

	/**
	 * Ever wanted to throw a Search inside StateHolder? No? Well, you can: get an array here and use it on setAll or whatever.
	 *
	 * @return {string[]}
	 */
	serialize() {
		let array = [];
		for(let pair of this.pairs) {
			array.push(pair.key);
			array.push(pair.value);
		}

		return array;
	}
}

/**
 * @class
 * @property {string} Pair.key
 * @property {string} Pair.value
 */
Object.defineProperty(Search, 'Pair', {
	value: class {
		/**
		 * Create a pair. Don't call directly!
		 *
		 * @param {string} key
		 * @param {string|int} value
		 * @param {boolean} duplicate - was this key already encountered?
		 * @private
		 * @see Search.add - use this instead
		 */
		constructor(key, value, duplicate) {
			if(!this.constructor.canDuplicate(key) && duplicate) {
				throw new Error("Duplicate key: Sort");
			}
			this.set(key, value);
		}

		set(key, value) {
			switch(key) {
				case 'Location':
					if(typeof value !== "string" || value === "") {
						throw new Error(" Location must be a non-empty string, " + value + " given");
					}
					break;
				case 'Search':
					// TODO: new SearchTriplet, stuff=things, asd>90001, etc...
					break;
				case 'Sort':
					// TODO: +stuff,-things, etc...
					break;
				case 'Depth':
				case 'Parent':
					value = parseInt(value);
					if(Number.isNaN(value) || value < 0) {
						throw new Error(key + " must be a positive integer, " + value + " given");
					}
					break;
				default:
					throw new Error("Unexpected search key: " + key);
			}
			this.key = key;
			this.value = value;
		}

		/**
		 * Is a key allowed to exist multiple times in the same search?
		 *
		 * @param {string} key
		 * @return {boolean}
		 */
		static canDuplicate(key) {
			switch(key) {
				case 'Depth':
				case 'Parent':
				case 'Sort':
					return false;
				default:
					return true;
			}
		}
	},
	writable: false,
	enumerable: true,
	configurable: false
});
