function Log(message, severity) {
	this.message = message;
	this.severity = this._parseSeverity(severity);
	this.timedate = new Date();
	this.add();
}

Log.Error = 3;
Log.Warning = 2;
Log.Info = 1;
Log.Success = 0;
Log.prototype._parseSeverity = function(severity) {
	if(typeof severity !== "number") {
		return Log.Info;
	}
	switch(severity) {
		case Log.Error:
		case Log.Warning:
		case Log.Info:
		case Log.Success:
			return severity;
			break;
		default:
			return Log.Info;
			break;
	}
};

/**
 * Every log message
 * @type {Array}
 */
Log.list = [];

Log.prototype.add = function() {
	if(Log.list.length >= 100) {
		Log.list.shift();
	}
	Log.list.push(this);
};
