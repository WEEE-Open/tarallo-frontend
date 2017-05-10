var Transaction = Backbone.Model.extend({
	setNotes: function(notes) {
		this.set("notes", notes);
	},

	// TODO: passare già come tree è più facile, ma ha senso? Passarli singoli rende complicato ricostruire l'albero (il server non lo fa e rischia di dare errore se sono in disordine...)
	// TODO: il server al momento non genera codici. Farglieli generare.
	addNew: function(item) {
		var newItems;

		if(this.has("newItems")) {
			newItems = this.get("newItems");

		} else {
			newItems = [];
		}
		newItems.push(item);

		this.set("newItems", newItems);

		return true;
	},

	addUpdated: function(item) {
		var updatedItems;

		if(this.has("updatedItems")) {
			updatedItems = this.get("updatedItems");

		} else {
			updatedItems = [];
		}
		updatedItems.push(item);

		this.set("updatedItems", updatedItems);

		return true;
	},

	/**
	 * @param method
	 * @param model
	 * @param options
	 */
	"sync": function(method, model, options) {
		// TODO: implement
		alert('SYNC! ' + method + " " + model + " " + options);
	}
});
