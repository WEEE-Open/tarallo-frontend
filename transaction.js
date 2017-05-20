class Transaction extends FrameworkObject {
	constructor(trigger) {
		super(trigger);
		this.reset();
	}

	// TODO: passare già come tree è più facile, ma ha senso? Passarli singoli rende complicato ricostruire l'albero (il server non lo fa e rischia di dare errore se sono in disordine...)
	// TODO: il server al momento non genera codici. Farglieli generare.
	/**
	 * Add new Item
	 *
	 * @param {Item} item
	 */
	add(item) {
		this.create.push(item);
	}

	/**
	 * Add an item changeset(?) to upload
	 *
	 * @todo use an ItemUpdate class
	 * @param {Item} item
	 */
	addUpdated(item) {
		this.update.push(item);
	}

	reset() {
		this.create = [];
		this.update = [];
		this.notes = null;
	}
}
