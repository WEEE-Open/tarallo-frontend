class Translations extends FrameworkObject {
	/**
	 * @param {Function} trigger(this, event)
	 * @param {string} code Language code
	 */
	constructor(trigger, code) {
		super(trigger);
		this.setLanguage(code)
	}

	setLanguage(code) {
		if(code === 'it-IT') {
			this.features = Translations.it.features;
		} else {
			// TODO: really handle multiple languages
			new Error('Unknown language ' + code);
		}
		this.trigger('change');
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