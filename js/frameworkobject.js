class FrameworkObject {
	/**
	 * @param {Function} trigger - function(this, event)
	 * @see FrameworkView.trigger
	 */
	constructor(trigger) {
		if(typeof trigger !== 'function') {
			throw new TypeError('trigger must be a function');
		}
		if(trigger.hasOwnProperty('prototype')) {
			throw new TypeError("trigger must be bound");
		}
		if(trigger.length === 2) {
			// "this" bound, binding "that" now, leaving "event" not bound
			// First parameter is always context ("this"), which is already bound and shouldn't be overwritten by null.
			// Hopefully.
			this.trigger = trigger.bind(null, this);
		} else if(trigger.length === 1) {
			// "this" and "that" bound, "event" should not be bound
			this.trigger = trigger;
		} else {
			if(trigger.length === 0) {
				throw new TypeError('trigger bound multiple times or missing "event" parameter')
			} else {
				throw new TypeError('too many unbound parameters for trigger (expected 1, got ' + trigger.length + ')');
			}
		}
	}
}
