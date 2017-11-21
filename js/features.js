class Features {
	/**
	 * Get a sorted map of translated strings
	 *
	 * @param {Translations} translations
	 * @param {string} name - feature name
	 * @return {Map.<string,string>|null} - map from internal feature name to translated feature name, sorted by translated name
	 */
	static getSorted(name, translations) {
		if(!Features.isEnum(name)) {
			return null;
		}
		let thisLanguage = Features.getMap(translations);

		let sortedMap;
		if(thisLanguage.has(name)) {
			return thisLanguage.get(name);
		} else {
			sortedMap = new Map();
			thisLanguage.set(name, sortedMap);
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
	static getMap(translations) {
		let namesToMap;
		if(!Features.sortedLists.has(translations.code)) {
			namesToMap = new Map();
			Features.sortedLists.set(translations.code, namesToMap);
		} else {
			namesToMap = Features.sortedLists.get(translations.code);
		}
		return namesToMap;
	}
}


Object.defineProperty(FeatureViewList, 'sortedLists', {
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

Features.list.set('brand', null);
Features.list('model', null);
Features.list('owner', null);
Features.list('sn', null);
Features.list('mac', null);
Features.list('type', new Set(['location', 'case', 'motherboard', 'cpu', 'graphics-card', 'ram', 'hdd', 'odd', 'psu', 'audio-card', 'network-card', 'monitor', 'mouse', 'keyboard', 'switch', 'hub', 'modem-router', 'fdd', 'ports-bracket', 'other-card', 'heatsink', 'fan', 'fan-controller']));
Features.list('working', new Set(['no', 'yes', 'maybe']));
Features.list('capacity-byte', null);
Features.list('frequency-hertz', null);
Features.list('diameter-mm', null);
Features.list('diagonal-inch', null);
Features.list('has-gpu', new Set(['no', 'yes']));
Features.list('color', new Set(['black', 'white', 'green', 'yellow', 'red', 'blue', 'grey', 'darkgrey', 'lightgrey', 'pink', 'transparent', 'brown', 'orange', 'violet', 'sip-brown', 'lightblue']));
Features.list('motherboard-form-factor', new Set(['atx', 'miniatx', 'microatx', 'miniitx', 'proprietary', 'btx', 'flexatx']));
Features.list('notes', null);
Features.list('agp-sockets-n', null);
Features.list('arrival-batch', null);
Features.list('capacity-byte', null);
Features.list('capacity-decibyte', null);
Features.list('cib', null);
Features.list('core-n', null);
Features.list('cpu-socket', new Set(['other', 'other-slot', 'other-socket', 'other-dip', 'g1', 'g2', 'socket7', 'm', 'socket370', 'socket462a', 'socket423', 'socket478', 'socket603', 'socket754', 'socket940', 'socket939', 'lga775', 'lga771', 'am1', 'am2', 'am2plus', 'am3', 'am3plus', 'am4', 'fm1', 'fm2', 'fm2plus', 'lga1366', 'lga1156', 'g34', 'c32', 'lga1248', 'lga1567', 'lga1155', 'lga2011', 'lga1150', 'g3', 'lga1151', 'lga3647', 'lga2066']));
Features.list('dvi-ports-n', null);
Features.list('ethernet-ports-1000m-n', null);
Features.list('ethernet-ports-100m-n', null);
Features.list('ethernet-ports-10base2-n', null);
Features.list('ethernet-ports-10m-n', null);
Features.list('hdd-odd-form-factor', new Set(['5.25', '3.5', '2.5', '2.5slim', 'm2']));
Features.list('ide-ports-n', null);
Features.list('odd-type', new Set(['cd-r', 'cd-rw', 'dvd-r', 'dvd-rw', 'bd-r', 'bd-rw']));
Features.list('pcie-power', new Set(['4pin', '6pin', '8pin']));
Features.list('pcie-sockets-n', null);
Features.list('pci-sockets-n', null);
Features.list('power-connector', new Set(['other', 'other-barrell', '']));
Features.list('power-idle-watt', null);
Features.list('power-rated-watt', null);
Features.list('ps2-ports-n', null);
Features.list('psu-ampere', null);
Features.list('psu-socket', new Set(['other', 'at', 'atx', 'atx-p4', 'atx-p4-extended', 'atx-p4-4pin', 'atx-p4-8pin', 'atx-p4-8pin']));
Features.list('psu-volt', null);
Features.list('ram-socket', new Set(['pc66', 'pc100', 'pc133', 'ddr', 'ddr2', 'ddr3', 'ddr4']));
Features.list('sata-ports-n', null);
Features.list('software', null);
Features.list('usb-ports-n', null);
Features.list('vga-ports-n', null);
Features.list('windows-serial-number', null);
Features.list('windows-serial-version', null);
Features.list('soldered-in-place', new Set(['no', 'yes']));
Features.list('power-idle-pfc', null);
Features.list('firewire-ports-n', null);
Features.list('serial-ports-n', null);
Features.list('parallel-ports-n', null);
Features.list('ram-form-factor', new Set(['dimm', 'so-dimm', 'minidimm', 'microdimm']));
