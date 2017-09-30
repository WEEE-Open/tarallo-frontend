class Search extends Framework.Object {
	constructor() {
		super();

		/** @type {Set.<string>} */
		this.keys = new Set();
		/** @type {Set.<Search.Pair>} */
		this.pairs = new Set();
	}
}

Object.defineProperty(Search, 'Pair', {
	/**
	 * @private
	 */
	value: class SearchPair {
		constructor(key, value, duplicate) {
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
					if(duplicate) {
						throw new Error("Duplicate key: Sort");
					}
					// TODO: +stuff,-things, etc...
					break;
				case 'Depth':
				case 'Parent':
					if(duplicate) {
						throw new Error("Duplicate key: " + key);
					}
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


	},
	writable: false,
	enumerable: true,
	configurable: false
});
