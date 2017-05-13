/**
 * Single log message
 * @private
 */
class Log {
	static Error = 3;
	static Warning = 2;
	static Info = 1;
	static Success = 0;

	constructor(message, severity) {
		this.message = message;
		// TODO: MDN says this is the correct way, PHPStorm doesn't warn of anything if I just do this._parseSeverity()...
		this.severity = this.constructor._parseSeverity(severity);
		this.timedate = new Date();
	}

	static _parseSeverity(severity) {
		if(typeof severity !== "number") {
			return this.constructor.Info;
		}
		switch(severity) {
			case this.constructor.Error:
			case this.constructor.Warning:
			case this.constructor.Info:
			case this.constructor.Success:
				return severity;
				break;
			default:
				return this.constructor.Info;
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
}
