class Translations extends Framework.Object {
	/**
	 * @param {string} code Language code
	 */
	constructor(code) {
		super();
		this.code = code;
		this._setLanguage(code);
	}

	/**
	 * Set language code and trigger a "change" event.
	 *
	 * @param {String} code
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
			this.features = Translations.it.features;
			this.featuresList = Translations.it.featuresList;
		} else {
			// TODO: really handle multiple languages
			throw new Error('Unknown language ' + code);
		}
		// noinspection JSUnresolvedVariable, JSUnresolvedFunction - it clearly exists, but PHPStorm
		//this.collator = new Intl.Collator(code);
		this.translations = code;
	}

	/**
	 * Convert some objects to a localized string
	 *
	 * @param object - an object
	 * @throws {Error} if object cannot be translated into a string
	 */
	toStringLocalized(object) {
		if(object instanceof Item) {
			// Also ItemUpdate
			// TODO: implement something better
			return object.code + ' in ' + object.parent;
		} else {
			throw new Error("Cannot convert unknown object into string");
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
		"frequency-hertz": "Frequenza",
		"color": "Colore",
		"type": "Tipo",
		"works": "Funziona"
	},
	writable: false,
	enumerable: true,
	configurable: false
});

Object.defineProperty(Translations.it, 'featuresList', {
	value: {
		'atx': 'ATX',
		'miniatx': 'MiniATX',
		'microatx': 'MicroATX',
		'miniitx': 'MiniITX',
		'proprietary': 'Proprietario'
	},
	writable: false,
	enumerable: true,
	configurable: false
});
