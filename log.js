/**
 * Single log message
 *
 * Do not create directly, use Logs.add() instead.
 * @see Logs.add
 */
class Log {
	static Error = 3;
	static Warning = 2;
	static Info = 1;
	static Success = 0;

	/**
	 * Severity of the log message.
	 *
	 * @type {number}
	 * @see Log.Error
	 * @see Log.Warning
	 * @see Log.Info
	 * @see Log.Success
	 */
	severity = 1;
	/**
	 * Log message. Hopefully string or null or undefined, but could be anything else.
	 */
	message;
	/**
	 * Date and time.
	 *
	 * @type {Date}
	 */
	timedate;

	/**
	 * Do not use directly, use Logs.add() instead.
	 *
	 * @private
	 * @param {string} message
	 * @param {int} severity
	 * @see Logs.add
	 */
	constructor(message, severity) {
		this.message = message;
		// TODO: MDN says this is the correct way, PHPStorm doesn't warn of anything if I just do this._parseSeverity()...
		this.severity = this.constructor._parseSeverity(severity);
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


/**
 * Every log message
 */
class Logs extends FrameworkObject {
	/**
	 * Logged messages
	 * @type {Array}
	 * @private
	 */
	_logs = [];

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
