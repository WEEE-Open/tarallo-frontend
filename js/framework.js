class TheFramework {
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
		};

		let mainTrigger = this.trigger;

		this.Object = class {
			constructor() {
				this.trigger = mainTrigger.bind(this, this);
			}
		};

		this.View = class {
			/**
			 * Pass some container element in which the view should be rendered.
			 * New element, already existing element, cloned element returned from HTML template, anything is acceptable.
			 *
			 * @param {HTMLElement} element - an HTML element
			 */
			constructor(element) {
				this.el = element;
			}

			/**
			 * Implement this function: consume any necessary event, pass others down to subviews.
			 *
			 * @param {TheFramework.Object} that - object that changed
			 * @param {string} event - string representing the event (add/delte/remove/push/pop/shift/create/new/whatever)
			 */
			trigger(that, event) {}
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

	/**
	 * Implement this function: pass events down to any existing view.
	 *
	 * @see TheFramework.View
	 * @param {TheFramework.Object} that - object that changed
	 * @param {string} event - string representing the event (add/delte/remove/push/pop/shift/create/new/whatever)
	 */
	propagate(that, event) {}
}