class stateHolder extends Framework.Object {
	/**
	 * Keep current URL state, keeps URL current, keeps current state URL.
	 *
	 * @param {int=0} start - starting position, 0 by default
	 * @param {string[]} [path]
	 * @param {string[]} [previousPath]
	 */
	constructor(path, start, previousPath) {
		super();
		if(Number.isInteger(start) && start > 0) {
			this.start = start;
		} else {
			this.start = 0;
		}
		if(Array.isArray(path)) {
			this.path = path;
		} else {
			this.path = [];
		}
		if(Array.isArray(previousPath)) {
			this.previousPath = previousPath;
		} else {
			this.previousPath = [];
		}
	}

	/**
	 * Get specified item from URL pieces, null if it doesn't exist
	 *
	 * @param {int} pos
	 * @return {string|null}
	 */
	get(pos) {
		let index = this.start + pos;
		if(this.path.length <= index) {
			return null;
		} else {
			return this.path[index];
		}
	}

	/**
	 * Get specified item from previous URL pieces, null if it doesn't exist
	 *
	 * @param {int} pos
	 * @return {string|null}
	 * @see stateHolder.get
	 */
	getOld(pos) {
		let index = this.start + pos;
		if(this.previousPath.length <= index) {
			return null;
		} else {
			return this.previousPath[index];
		}
	}

	/**
	 * Get current URL pieces
	 *
	 * @return {string[]}
	 */
	getAll() {
		return this.path.slice(this.start);
	}

	/**
	 * Get previous URL pieces
	 *
	 * @return {string[]}
	 * @see stateHolder.getAll
	 */
	getAllOld() {
		return this.path.slice(this.start);
	}

	/**
	 * Replace URL pieces with specified array.
	 * Don't pass any parameter to remove this URL part ("null" will throw an error)
	 *
	 * @param {string} toWhat URL components
	 * @return {boolean} any changes?
	 */
	setAll(...toWhat) {
		return this.setAllArray(toWhat);
	}

	/**
	 * Set state but don't trigger anything. Useful for initialization only.
	 *
	 * @see stateHolder.setAllArray
	 * @param {string[]} toWhat - array of URL components
	 * @return {boolean} any changes?
	 */
	presetAllArray(toWhat) {
		if(stateHolder.same(this.getAll(), toWhat)) {
			return false;
		}

		this.backupPath();
		if(Array.isArray(toWhat)) {
			this.path.splice(this.start);
			this.appendAll(toWhat);
		} else {
			// Should never happen anyway
			throw new TypeError('urlState.setAll expected an array, ' + typeof toWhat + ' given');
		}
		return true;
	}

	/**
	 * Set state from an array of pieces.
	 *
	 * @see stateHolder.setAll
	 * @param {string[]} toWhat array of URL components
	 * @return {boolean} any changes?
	 */
	setAllArray(toWhat) {
		let changed = this.presetAllArray(toWhat);
		if(changed) {
			this.trigger('change');
		}
		return changed;
	}

	/**
	 * Is there anything in the visibile portion of the state?
	 *
	 * @return {boolean}
	 */
	hasContent() {
		return this.path.length > start;
	}

	/**
	 * Return another urlState object, starting from a specific URL piece
	 *
	 * @param {int} start - how many URL pieces to skip
	 * @return {stateHolder}
	 * @see this.equals
	 */
	emit(start) {
		return new this.constructor(this.path, start + this.start, this.previousPath);
	}

	/**
	 * Shallow check of equality for arrays.
	 *
	 * @param {string[]} before
	 * @param {string[]} after
	 * @return {boolean} are they identical?
	 * @private
	 */
	static same(before, after) {
		if(after.length === before.length) {
			let equal = true;
			for(let i = 0; i < after.length; i++) {
				if(after[i] !== before[i]) {
					equal = false;
					break;
				}
			}
			if(equal) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Append strings to state
	 *
	 * @param {string[]} what
	 * @private
	 */
	appendAll(what) {
		for(let i = 0; i < what.length; i++) {
			this.appendOne(what[i]);
		}
	}

	/**
	 * Append exactly one string to state
	 *
	 * @param {string} what
	 * @private
	 */
	appendOne(what) {
		if(typeof what !== 'string') {
			throw new TypeError('Cannot insert ' + typeof what + ' into state, only strings are allowed');
		}
		this.path.push(what);
	}

	/**
	 * Save path as this.previousPath
	 *
	 * @private
	 */
	backupPath() {
		while(this.previousPath.length > 0) {
			this.previousPath.pop();
		}
		for(let i = 0; i < this.path.length; i++) {
			this.previousPath.push(this.path[i]);
		}
	}

	/**
	 * Checks if two stateHolder "instances" are the same
	 * (= one derived from the other via emit)
	 *
	 * @see this.emit
	 */
	equals(other) {
		// Note that this is a pointer comparison
		return this.path === other.path && this.previousPath === other.previousPath;
	}

}