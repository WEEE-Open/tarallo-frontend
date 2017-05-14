class FrameworkObject {
	/**
	 * @param {Function} trigger(this, event)
	 */
	constructor(trigger) {
		if(typeof trigger !== 'function') {
			throw new TypeError('trigger must be a function');
		}
		this.trigger = trigger.bind(null, this);
	}
}