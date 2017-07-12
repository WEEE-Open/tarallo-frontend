class stateHolder extends FrameworkObject {
	/**
	 * Keep current URL state, keeps URL current, keeps current state URL.
	 *
	 * @param {int=0} start - starting position, 0 by default
	 * @param {string[]} [path]
	 * @param {string[]} [previousPath]
	 * @param {Function} trigger
	 */
	constructor(trigger, start, path, previousPath) {
		super(trigger);
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
	 * Get current URL pieces
	 *
	 * @return {string[]}
	 */
	getAll() {
		return this.path.slice(this.start);
	}

	/**
	 * Replace URL pieces with specified array
	 *
	 * @param {string} toWhat array of URL components
	 */
	setAll(...toWhat) {
		this._backupPath();
		if(Array.isArray(toWhat)) {
			this.path.splice(this.start);
			this._appendAll(toWhat);
			this.trigger('change');
		} else {
			// Should never happen anyway
			throw new TypeError('urlState.setAll expected an array, ' + typeof toWhat + ' given');
		}
	}

	rollback() {
		this.path.splice(this.start);
		this._appendAll(this.previousPath.splice(this.start));
		// "erase" previous path to prevent further rollbacks or rollforwards (which only bring chaos and destruction)
		this._backupPath();
	}

	/**
	 * Return another urlState object, starting from a specific URL piece
	 *
	 * @param {int} start - how many URL pieces to skip
	 * @return {stateHolder}
	 * @todo see if this magically works
	 */
	emit(start) {
		return new this(this.trigger, start, this.path, this.previousPath);
	}

	/**
	 * Append strings to state
	 *
	 * @param {string[]} what
	 * @private
	 */
	_appendAll(what) {
		for(let i = 0; i < what.length; i++) {
			this._appendOne(what[i]);
		}
	}

	/**
	 * Append exactly one string to state
	 *
	 * @param {string} what
	 * @private
	 */
	_appendOne(what) {
		if(typeof what !== 'string') {
			throw new TypeError('Cannot insert ' + typeof what + ' into state, only strings are allowed');
		}
		this.path.push(what);
	}

	_backupPath() {
		while(this.previousPath.length > 0) {
			this.previousPath.pop();
		}
		for(let i = 0; i < this.path.length; i++) {
			this.previousPath.push(this.path[i]);
		}
	}

}