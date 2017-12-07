class Features {
	/**
	 * Get a sorted map of translated strings for feature values
	 *
	 * @param {Translations} translations
	 * @param {string} name - feature name
	 * @return {Map.<string,string>|null} - map from internal value to translated value, sorted by translated name
	 */
	static getValues(name, translations) {
		if(!Features.isEnum(name)) {
			return null;
		}
		let thisLanguage = Features.getLanguageMap(translations);
		let sortedMap = Features.getNameMap(thisLanguage, name);
		if(sortedMap.size > 0) {
			return sortedMap;
		}

		let translationsArray = [];
		let translationMap = new Map();

		for(let value of Features.list.get(name)) {
			let translated = translations.get(value, translations.featuresList);
			translationsArray.push(translated);
			translationMap.set(translated, value);
		}
		for(let translated of translationsArray.sort()) {
			sortedMap.set(translationMap.get(translated), translated);
		}
		return sortedMap;
	}

	/**
	 * Get a sorted map of translated feature names
	 *
	 * @param {Translations} translations
	 * @return {Map.<string,string>|null} - map from internal feature name to translated feature name, sorted by translated name
	 */
	static getFeatures(translations) {
		let name = 'FEATURES';
		let thisLanguage = Features.getLanguageMap(translations);
		let sortedMap = Features.getNameMap(thisLanguage, name);
		if(sortedMap.size > 0) {
			return sortedMap;
		}

		let translationsArray = [];
		let translationMap = new Map();

		for(let [name,] of Features.list) {
			let translated = translations.get(name, translations.features);
			translationsArray.push(translated);
			translationMap.set(translated, name);
		}
		for(let translated of translationsArray.sort((a, b) => a.localeCompare(b))) {
			sortedMap.set(translationMap.get(translated), translated);
		}
		return sortedMap;
	}

	/**
	 * Is that feature an enum or something else (text or number)?
	 *
	 * @param {string} name
	 */
	static isEnum(name) {
		if(Features.exists(name)) {
			let value = Features.list.get(name);
			return value !== null;
		} else {
			throw new Error('Feature ' + name + ' doesn\'t exist');
		}
	}

	/**
	 * Does that feature exist?
	 *
	 * @param {string} name
	 * @return {boolean}
	 */
	static exists(name) {
		return Features.list.has(name);
	}

	/**
	 * Get map from language code to "sorted map of translated strings"
	 *
	 * @param {Translations} translations
	 * @return {Map.<string,Map.<string,string>>}
	 * @private
	 */
	static getLanguageMap(translations) {
		let namesToMap;
		if(!Features.sortedLists.has(translations.code)) {
			namesToMap = new Map();
			Features.sortedLists.set(translations.code, namesToMap);
		} else {
			namesToMap = Features.sortedLists.get(translations.code);
		}
		return namesToMap;
	}

	/**
	 * Get translations map for a feature name
	 *
	 * @param {Map.<string,Map.<string,string>>} thisLanguage
	 * @param {string} name - feature name
	 * @return {Map.<string,string>|null}
	 */
	static getNameMap(thisLanguage, name) {
		if(thisLanguage.has(name)) {
			return thisLanguage.get(name);
		} else {
			let sortedMap = new Map();
			thisLanguage.set(name, sortedMap);
			return sortedMap;
		}
	}
}


Object.defineProperty(Features, 'sortedLists', {
	enumerable: true,
	configurable: false,
	writable: false,
	value: new Map()
});

Object.defineProperty(Features, 'list', {
	configurable: false,
	enumerable: true,
	writable: false,
	value: new Map()
});

// BEGIN GENERATED CODE
Features.list.set('brand', null);
Features.list.set('model', null);
Features.list.set('owner', null);
Features.list.set('sn', null);
Features.list.set('mac', null);
Features.list.set('type', new Set(['location', 'case', 'motherboard', 'cpu', 'graphics-card', 'ram', 'hdd', 'odd', 'psu', 'audio-card', 'network-card', 'monitor', 'mouse', 'keyboard', 'switch', 'hub', 'modem-router', 'fdd', 'ports-bracket', 'other-card', 'heatsink', 'fan', 'fan-controller']));
Features.list.set('working', new Set(['no', 'yes', 'maybe']));
Features.list.set('capacity-byte', null);
Features.list.set('frequency-hertz', null);
Features.list.set('diameter-mm', null);
Features.list.set('diagonal-inch', null);
Features.list.set('has-gpu', new Set(['no', 'yes']));
Features.list.set('color', new Set(['black', 'white', 'green', 'yellow', 'red', 'blue', 'grey', 'darkgrey', 'lightgrey', 'pink', 'transparent', 'brown', 'orange', 'violet', 'sip-brown', 'lightblue']));
Features.list.set('motherboard-form-factor', new Set(['atx', 'miniatx', 'microatx', 'miniitx', 'proprietary', 'btx', 'flexatx']));
Features.list.set('notes', null);
Features.list.set('agp-sockets-n', null);
Features.list.set('arrival-batch', null);
Features.list.set('capacity-decibyte', null);
Features.list.set('cib', null);
Features.list.set('core-n', null);
Features.list.set('cpu-socket', new Set(['other', 'other-slot', 'other-socket', 'other-dip', 'g1', 'g2', 'socket7', 'm', 'socket370', 'socket462a', 'socket423', 'socket478', 'socket603', 'socket754', 'socket940', 'socket939', 'lga775', 'lga771', 'am1', 'am2', 'am2plus', 'am3', 'am3plus', 'am4', 'fm1', 'fm2', 'fm2plus', 'lga1366', 'lga1156', 'g34', 'c32', 'lga1248', 'lga1567', 'lga1155', 'lga2011', 'lga1150', 'g3', 'lga1151', 'lga3647', 'lga2066']));
Features.list.set('dvi-ports-n', null);
Features.list.set('ethernet-ports-1000m-n', null);
Features.list.set('ethernet-ports-100m-n', null);
Features.list.set('ethernet-ports-10base2-n', null);
Features.list.set('ethernet-ports-10m-n', null);
Features.list.set('hdd-odd-form-factor', new Set(['5.25', '3.5', '2.5', '2.5slim', 'm2', 'm2.2']));
Features.list.set('ide-ports-n', null);
Features.list.set('odd-type', new Set(['cd-r', 'cd-rw', 'dvd-r', 'dvd-rw', 'bd-r', 'bd-rw']));
Features.list.set('pcie-power', new Set(['4pin', '6pin', '8pin', 'more']));
Features.list.set('pcie-sockets-n', null);
Features.list.set('pci-sockets-n', null);
Features.list.set('power-connector', new Set(['c13', 'c19', 'barrel', 'other']));
Features.list.set('power-idle-watt', null);
Features.list.set('power-rated-watt', null);
Features.list.set('ps2-ports-n', null);
Features.list.set('psu-ampere', null);
Features.list.set('psu-socket', new Set(['other', 'at', 'atx', 'atx-p4', 'atx-p4-extended', 'atx-p4-4pin', 'atx-p4-8pin']));
Features.list.set('psu-volt', null);
Features.list.set('ram-socket', new Set(['pc66', 'pc100', 'pc133', 'ddr', 'ddr2', 'ddr3', 'ddr4']));
Features.list.set('sata-ports-n', null);
Features.list.set('software', null);
Features.list.set('usb-ports-n', null);
Features.list.set('vga-ports-n', null);
Features.list.set('windows-serial-number', null);
Features.list.set('windows-serial-version', null);
Features.list.set('soldered-in-place', new Set(['no', 'yes']));
Features.list.set('power-idle-pfc', null);
Features.list.set('firewire-ports-n', null);
Features.list.set('serial-ports-n', null);
Features.list.set('parallel-ports-n', null);
Features.list.set('ram-form-factor', new Set(['dimm', 'so-dimm', 'minidimm', 'microdimm']));
Features.list.set('weight-gram', null);
Features.list.set('spin-rate-rpm', null);
Features.list.set('dms-59-ports-n', null);
// END GENERATED CODE
