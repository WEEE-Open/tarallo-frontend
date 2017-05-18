class FrameworkObject {
	/**
	 * @param {Function} trigger - function(this, event)
	 * @see FrameworkView.trigger
	 */
	constructor(trigger) {
		if(typeof trigger !== 'function') {
			throw new TypeError('trigger must be a function');
		}
		this.trigger = trigger.bind(null, this);
	}
}
