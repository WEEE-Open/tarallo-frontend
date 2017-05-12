/**
 * Every log message
 */
class Logs {
	static Error = 3;
	static Warning = 2;
	static Info = 1;
	static Success = 0;

	_logs = [];

	static _parseSeverity(severity) {
		if(typeof severity !== "number") {
			return Logs.Info;
		}
		switch(severity) {
			case Logs.Error:
			case Logs.Warning:
			case Logs.Info:
			case Logs.Success:
				return severity;
				break;
			default:
				return Logs.Info;
				break;
		}
	}

	add(message, severity, controller) {
		this.message = message;
		this.severity = Logs._parseSeverity(severity);
		this.timedate = new Date();

		if(this._logs.length >= 100) {
			// TODO: this or a string?
			controller.trigger(this, 'pop');
			this._logs.shift();
		}
		controller.trigger(this, 'push');
		this._logs.push(this);
	}
}
