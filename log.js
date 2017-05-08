var Log = Backbone.Model.extend({
	Error: 3,
	Warning: 2,
	Info: 1,

	'initialize': function() {
		this.set("timedate", new Date());
	},

	sync: function() {}

	// this works according to documentation, but doesn't according to empirical evidence.
	//id: function() {
	//	return this.get("timedate") + this.cid;
	//}
});

var Logs = Backbone.Collection.extend({
	MAX: 100,

	model: Log,

	comparator: "timedate",

	sync: function() {},

	log: function(message, severity) {
		if(typeof severity !== "number") {
			severity = Log.Info;
		}
		if(this.length >= this.MAX) {
			this.shift();
		}
		this.add({"message": message, "severity": severity});
	}
});