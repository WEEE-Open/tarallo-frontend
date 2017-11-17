class Search extends Framework.Object {
	constructor() {
		super();

		this.lastErrorCode = null;
		this.lastErrorMessage = null;
		this.results = null;

		/** @type {Map.<string,int>}
		 *  @private */
		this.keysCounter = new Map();
		/** @type {Set.<Search.Pair>} */
		this.pairs = new Set();
	}

	/**
	 * add key and value.
	 *
	 * @param {string} key
	 * @param {string|int} value
	 * @return {Search.Pair} new pair
	 */
	add(key, value) {
		let pair = new Search.Pair(key, value, this.keysCounter.has(value));
		this.incrementKeyCounter(key);
		this.pairs.add(pair);
		return pair;
	}

	/**
	 * Set value to a pair. Use null to remove.
	 *
	 * @param {Search.Pair} pair
	 * @param {string|int|null} value
	 */
	set(pair, value) {
		if(value === null) {
			this.pairs.delete(pair);
			this.decrementKeyCounter(pair.key);
		} else {
			// noinspection JSUnresolvedFunction
			pair.set(pair.key, value);
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
	incrementKeyCounter(key) {
		// I wonder if this data structure already exists in a standardized form and if it has a name...
		if(this.keysCounter.has(key)) {
			this.keysCounter.set(key, this.keysCounter.get(key) + 1);
		} else {
			this.keysCounter.set(key, 1);
		}
	}

	/**
	 * Note that a key was removed and decrement its counter.
	 *
	 * @param {string} key
	 * @private
	 */
	decrementKeyCounter(key) {
		if(this.keysCounter.has(key)) {
			let count = this.keysCounter.get(key);
			if(count > 1) {
				this.keysCounter.set(key, count - 1);
			} else {
				this.keysCounter.delete(key);
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
		return this.keysCounter.has(key);
	}

	/**
	 * Send query, get response.
	 * All results will be parsed before the "success" event and will be available in this.results.
	 *
	 * @return {Search}
	 */
	getFromServer() {
		this.results = null;

		if(!this.hasContent()) {
			throw new Error("Trying to do an empty search");
		}

		let req = XHR.GET(this.serialize(),
			(code, message/*, data*/) => {
				this.lastErrorCode = code;
				this.lastErrorMessage = message;
				this.trigger('failed');
			},
			(data) => {
				if(this.parseData(data)) {
					this.trigger('success');
				} else {
					this.trigger('failed');
				}
			});
		req.send();

		return this;
	}

	/**
	 * Parse data straight from server.
	 *
	 * @param {object} data
	 * @return {boolean}
	 * @private
	 */
	parseData(data) {
		if(typeof data !== 'object') {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Expected object from server, got ' + (typeof data);
			return false;
		}

		if(!Array.isArray(data.items)) {
			this.lastErrorCode = 'malformed-response';
			this.lastErrorMessage = 'Expected an "items" array from server, got ' + (typeof data.items);
			return false;
		}

		if(data.items.length === 0) {
			this.lastErrorCode = 'not-found';
			this.lastErrorMessage = 'No results';
			return false;
		}

		let itemRoots = [];
		for(let rawItem of data.items) {
			let item = new Item();
			let success = item.parseItem(rawItem);
			if(!success) {
				this.lastErrorCode = item.lastErrorCode;
				this.lastErrorMessage = item.lastErrorMessage;
				return false;
			} else {
				itemRoots.push(item);
			}
		}

		this.results = itemRoots;

		return true;
	}

	/**
	 * Ever wanted to throw a Search inside StateHolder?
	 * No? Well, now you can: get an array here and use it on setAll or whatever.
	 *
	 * @return {string[]}
	 */
	serialize() {
		let array = [];
		for(let pair of this.pairs) {
			array.push(pair.key);
			array.push(pair.value); // TOOD: use toString
		}

		return array;
	}
}

/**
 * @class
 * @property {string} Search.Pair.key
 * @property {string} Search.Pair.value
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
		 * @see Search.set - use this instead
		 */
		constructor(key, value, duplicate) {
			if(!this.constructor.canDuplicate(key) && duplicate) {
				throw new Error("Duplicate key: Sort");
			}
			this.key = key;
			this.set(key, value);
		}

		set(value) {
			switch(this.key) {
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
						throw new Error(this.key + " must be a positive integer, " + value + " given");
					}
					break;
				default:
					throw new Error("Unexpected search key: " + this.key);
			}
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
