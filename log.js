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
	 * @param {int} severity
	 * @see Logs.add
	 */
	constructor(message, severity) {
		/**
		 * Severity of the log message.
		 *
		 * @type {number}
		 * @see Log.Error
		 * @see Log.Warning
		 * @see Log.Info
		 * @see Log.Success
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
		if(typeof severity !== "number") {
			return this.Info;
		}
		switch(severity) {
			case this.Error:
			case this.Warning:
			case this.Info:
			case this.Success:
				return severity;
				break;
			default:
				return this.Info;
				break;
		}
	}
}

Object.defineProperty(Log, 'Error', {
	value: 3,
	writable : false,
	enumerable : true,
	configurable : false
});
Object.defineProperty(Log, 'Warning', {
	value: 2,
	writable : false,
	enumerable : true,
	configurable : false
});
Object.defineProperty(Log, 'Info', {
	value: 1,
	writable : false,
	enumerable : true,
	configurable : false
});
Object.defineProperty(Log, 'Success', {
	value: 0,
	writable : false,
	enumerable : true,
	configurable : false
});

/**
 * Every log message
 */
class Logs extends FrameworkObject {
	constructor(trigger) {
		super(trigger);

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
	 * @param message
	 * @param severity
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
