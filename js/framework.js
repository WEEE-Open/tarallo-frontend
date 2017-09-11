class Framework {
	constructor() {
		this.inEvent = false;
		this.depth = -1;
		/** @type {StoredEvent[]} */
		this.nextEvents = [];

		this.StoredEvent = class StoredEvent {
			constructor(that, event) {
				this.that  = that;
				this.event = event;
			}
		}
	}


	trigger(that, event) {
		if(this.inEvent) {
			this.nextEvents.push(new this.StoredEvent(that, event));
			return;
		}

		this.inEvent = true;
		this.depth++;

		this.propagate(that, event);

		this.inEvent = false;
		if(this.depth <= 0) {
			while(this.nextEvents.length > 0) {
				let stored = this.nextEvents.shift();
				this.trigger(stored.that, stored.event);
			}
		}
		this.depth--;
	}
}