/**
 * Search for items: show controls and textboxes and buttons, fetch results, display them inside an ItemLocationView
 *
 * @see ItemLocationView
 * @see ItemView
 */
class SearchView extends Framework.View {
	/**
	 * Search for items: show controls and textboxes and buttons, fetch results, display them inside an ItemLocationView
	 *
	 * @see ItemLocationView
	 * @see ItemView
	 * @param {HTMLElement} element - An element where controls and results will be placed
	 * @param {stateHolder} state - Current state
	 * @param {string[]|[]|null} preset - Set these search fields, but don't actually search anything. Will be discarded if state contains anything significant.
	 */
	constructor(element, state, preset) {
		super(element);

		this.state = state;
		if(state.hasContent()) {
			preset = state.getAll()
		}
	}

	trigger(that, event) {
		if(that instanceof stateHolder && this.state.equals(that)) {

		}
	}
}
