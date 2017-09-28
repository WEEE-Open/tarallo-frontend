class Translations extends Framework.Object {
	/**
	 * @param {Function} trigger(this, event)
	 * @param {string} code Language code
	 */
	constructor(code) {
		super();
		this._setLanguage(code)
	}

	/**
	 * Set language code and trigger a "change" event.
	 *
	 * @param {String} code
	 * @private
	 */
	setLanguage(code) {
		this._setLanguage(code);
		this.trigger('change');
	}

	/**
	 * Set language code without triggering an event (used in constructor only)
	 *
	 * @param {String} code
	 * @private
	 */
	_setLanguage(code) {
		if(code === 'it-IT') {
			// TODO: this ends up in a "this" that isn't it's "this".
			this.features = Translations.it.features;
		} else {
			// TODO: really handle multiple languages
			new Error('Unknown language ' + code);
		}
	}

	//noinspection JSMethodCanBeStatic
	get(string, map) {
		return typeof map[string] === 'undefined' ? string : map[string];
	}
}
Object.defineProperty(Translations, 'it', {value: {}});

Object.defineProperty(Translations.it, 'features', {
	value: {
		"brand": "Marca",
		"model": "Modello",
		"frequency-hz": "Frequenza",
		"color": "Colore",
		"works": "Funziona"
	},
	writable: false,
	enumerable: true,
	configurable: false
});