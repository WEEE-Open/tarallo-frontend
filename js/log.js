/**
 * Single log message
 *
 * Do not create directly, use Logs.add() instead.
 * @see Logs.add
 */
class Log {
	/**
	 * Do not use directly, use Logs.add() instead.
	 *
	 * @private
	 * @param {string} message
	 * @param {string} severity - S, I, W, E.
	 * @see Logs.add
	 */
	constructor(message, severity) {
		/**
		 * Severity of the log message. S, I, W, E.
		 *
		 * @type {string}
		 */
		this.severity = this.constructor._parseSeverity(severity);
		/**
		 * Log message. Hopefully string or null or undefined, but could be anything else.
		 */
		this.message = message;
		/**
		 * Date and time.
		 *
		 * @type {Date}
		 */
		this.timedate = new Date();
	}

	static _parseSeverity(severity) {
		if(typeof severity !== "string") {
			return 'I';
		}
		switch(severity) {
			case 'E':
			case 'W':
			case 'I':
			case 'S':
				return severity;
				break;
			default:
				return 'I';
				break;
		}
	}
}

/**
 * Every log message
 */
class Logs extends Framework.Object {
	constructor() {
		super();

		/**
		 * Logged messages
		 * @type {Array}
		 * @private
		 */
		this._logs = [];
	}

	/**
	 * Add a new message
	 *
	 * @param {string} message
	 * @param {string} severity: S, I, W, E.
	 */
	add(message, severity) {
		let newLog = new Log(message, severity);
		if(this._logs.length >= 100) {
			this._logs.shift();
			this.trigger('shift');
		}
		this._logs.push(newLog);
		this.trigger('push');
	}

	getAll() {
		return this._logs;
	}

	/**
	 * clear all
	 * close all
	 * clc
	 */
	clear() {
		this._logs.length = 0;
		this.trigger('clear');
	}

	/**
	 * Get last message. Useful after receiving a "push" event.
	 *
	 * @returns {Log|null} last log message, or null if none
	 */
	getLast() {
		if(this._logs.length > 0) {
			return this._logs[this._logs.length - 1];
		} else {
			return null;
		}
	}
}
