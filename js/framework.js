Framework = {
	inEvent: false,
	depth: -1,
	/** @type {StoredEvent[]} */
	nextEvents: [],
	StoredEvent: class StoredEvent {
		constructor(that, event) {
			this.that = that;
			this.event = event;
		}
	},

	Object: class {
		constructor() {
			// TODO: prevent double binding?
			this.trigger = Framework.trigger.bind(Framework, this);
		}
	},

	View: class {
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
		 * @param {Framework.Object} that - object that changed
		 * @param {string} event - string representing the event (add/delte/remove/push/pop/shift/create/new/whatever)
		 */
		trigger(that, event) {}
	},

	trigger: function(that, event) {
		if(this.inEvent) {
			this.nextEvents.push(new this.StoredEvent(that, event));
			return;
		}

		this.inEvent = true;
		this.depth++;

		this.rootView.trigger(that, event);

		this.inEvent = false;
		if(this.depth <= 0) {
			while(this.nextEvents.length > 0) {
				let stored = this.nextEvents.shift();
				this.trigger(stored.that, stored.event);
			}
		}
		this.depth--;
	},

	/**
	 * @param view - some sublclass of Framework.View (a concept that apparently cannot be expressed in JSDoc)
	 */
	setRootView: function(view) {
		this.rootView = view;
	}
};
