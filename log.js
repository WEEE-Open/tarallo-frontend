var Log = Backbone.Model.extend({
	Error: 3,
	Warning: 2,
	Info: 1,

	initialize: function() {
		this.set("timedate", Date.now());
	},

	sync: function() {},

	id: function() {
		return this.get("timedate") + this.cid;
	}
});

var Logs = Backbone.Collection.extend({
	MAX: 100,

	model: Log,

	comparator: "timedate",

	sync: function() {},

	log: function(message) {
		if(this.length >= this.MAX) {
			this.shift();
			this.add({"message": message});
		}
	}
});