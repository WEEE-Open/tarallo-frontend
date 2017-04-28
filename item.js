var Item = Backbone.Model.extend({
	_validateFeature: function(name, value) {
		return typeof name === "string" && typeof value === "string";
	},

	setFeature: function(name, value) {
		var features;

		if(!this._validateFeature(name, value)) {
			return false;
		}

		if(this.has("features")) {
			features = this.get("features");
		} else {
			features = [];
		}
		features[name] = value;

		this.set("features", features);

		return true;
	},

	/**
	 * @see http://stackoverflow.com/questions/5096549/how-to-override-backbone-sync
	 *
	 * @param method
	 * @param model
	 * @param options
	 */
	"sync": function(method, model, options) {
		// TODO: implement
		alert('SYNC! ' + method + " " + model + " " + options);
	}
});