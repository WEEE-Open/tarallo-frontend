class FrameworkView {
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
	 * @param {FrameworkObject} that - object that changed
	 * @param {string} event - string representing the event (add/delte/remove/push/pop/shift/create/new/whatever)
	 */
	trigger(that, event) {}
}