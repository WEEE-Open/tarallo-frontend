function Log(message, severity) {
	console.log("NEW LOG");
	this.message = message;
	this.severity = this._parseSeverity(severity);
	this.timedate = new Date();
	this.add();
}

Log.Error = Log.prototype.Error = 3;
Log.Warning = Log.prototype.Warning = 2;
Log.Info = Log.prototype.Info = 1;
Log.Success = Log.prototype.Success = 0;
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
Log.list = Log.prototype.list = []; // TODO: WHY doesn't this work if I invert the first 2 assignments(?)?

Log.prototype.add = function() {
	console.log("ADD");
	if(this.list.length >= 100) {
		this.list.shift();
	}
	this.list.push(this);
};
