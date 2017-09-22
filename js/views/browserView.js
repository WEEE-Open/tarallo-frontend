class browserView extends Framework.View {
	constructor() {
		super(null);
		// requires a lot of ifs in view constructors for initialization, while triggering an event reuses whatever logic is already in place
		this.state = new stateHolder(this.trigger);
		// noinspection JSPotentiallyInvalidConstructorUsage (hasn't been a warning for 6 months, and now it is!?)
		this.rootView = new rootView(document.getElementById("body"), this.state);
		this.hashchanged = false; // orrible hack.

		// useless:
		//window.onpopstate = this.urlChanged.bind(this);
		window.onhashchange = this.urlChanged.bind(this);
	}

	urlChanged(/*event*/) {
		this.hashchanged = true;
		this.state.setAllArray(browserView.splitPieces(window.location.hash));
	}

	/**
	 * Split URL into pieces.
	 * Trailing slashes and double slashes cause empty string pieces to appear, which is intended behaviour.
	 *
	 * @param {string} string
	 * @return {string[]}
	 */
	static splitPieces(string) {
		let pieces = string.substr(1).split('/');
		// "//////////////Login" is an acceptable URL, whatever.
		while(pieces[0] === '') {
			pieces.shift();
		}
		return pieces;
	}

	/**
	 * Build the URL piece thingamajig from array.
	 *
	 * @return {string}
	 * @private
	 */
	_buildUrl() {
		let path = this.state.getAll();
		if(path.length === 0) {
			return '/';
		}
		let result = '';
		for(let i = 0; i < path.length; i++) {
			result = result + '/' + encodeURIComponent(path[i]);
		}
		return result;
	}

	/**
	 * Set current URL in browser
	 *
	 * @private
	 */
	static _setUrl(url) {
		history.pushState(null, '', '#' + url);
	}

	trigger(that, event) {
		// noinspection JSUnresolvedFunction (there's no way to make PHPStorm understand that "that" is a stateHolder, plain and simple, it ignores @var for no apparent reason)
		if(that instanceof stateHolder && that.equals(this.state)) {
			if(event === 'change') {
				if(this.hashchanged) {
					this.hashchanged = false;
				} else {
					browserView._setUrl(this._buildUrl());
				}
			}
		}
		this.rootView.trigger(that,event);
	}
}
