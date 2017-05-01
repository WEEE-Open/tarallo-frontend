var Log = Backbone.Model.extend({
	Error: 3,
	Warning: 2,
	Info: 1,

	sync: function() {},

	id: function() {
		return this.get("timedate") + this.cid;
	}
});

var Logs = Backbone.Collection.extend({
	model: Log,

	comparator: "timedate",

	sync: function() {}
});