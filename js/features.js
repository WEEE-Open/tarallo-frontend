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
Features.list.set('type', new Set(['location', 'case', 'motherboard', 'cpu', 'graphics-card', 'ram', 'hdd', 'odd', 'psu', 'audio-card', 'ethernet-card', 'monitor', 'mouse', 'keyboard', 'network-switch', 'network-hub', 'modem-router', 'fdd', 'ports-bracket', 'other-card', 'heatsink', 'fan', 'fan-controller', 'modem-card', 'scsi-card', 'wifi-card', 'bluetooth-card', 'external-psu', 'zip-drive', 'printer', 'scanner', 'inventoried-object', 'adapter', 'usbhub']));
Features.list.set('working', new Set(['no', 'yes', 'maybe']));
Features.list.set('capacity-byte', null);
Features.list.set('frequency-hertz', null);
Features.list.set('diameter-mm', null);
Features.list.set('diagonal-inch', null);
Features.list.set('isa', new Set(['x86-32', 'x86-64', 'ia-64', 'arm']));
Features.list.set('color', new Set(['black', 'white', 'green', 'yellow', 'red', 'blue', 'grey', 'darkgrey', 'lightgrey', 'pink', 'transparent', 'brown', 'orange', 'violet', 'sip-brown', 'lightblue', 'yellowed', 'transparent-dark', 'golden']));
Features.list.set('motherboard-form-factor', new Set(['atx', 'miniatx', 'microatx', 'miniitx', 'proprietary', 'btx', 'flexatx', 'proprietary-laptop', 'eatx']));
Features.list.set('notes', null);
Features.list.set('agp-sockets-n', null);
Features.list.set('arrival-batch', null);
Features.list.set('capacity-decibyte', null);
Features.list.set('cib', null);
Features.list.set('core-n', null);
Features.list.set('cpu-socket', new Set(['other', 'other-slot', 'other-socket', 'other-dip', 'g1', 'g2', 'socket7', 'm', 'p', 'am1', 'am2', 'am2plus', 'am3', 'am3plus', 'am4', 'fm1', 'fm2', 'fm2plus', 'g34', 'c32', 'g3', 'slot1', 'socket370', 'socket462a', 'socket423', 'socket478', 'socket479a', 'socket479c', 'socket479m', 'socket495', 'socket603', 'socket754', 'socket940', 'socket939', 'lga775', 'lga771', 'lga1366', 'lga1156', 'lga1248', 'lga1567', 'lga1155', 'lga2011', 'lga1150', 'lga1151', 'lga3647', 'lga2066']));
Features.list.set('dvi-ports-n', null);
Features.list.set('ethernet-ports-1000m-n', null);
Features.list.set('ethernet-ports-100m-n', null);
Features.list.set('ethernet-ports-10base2-bnc-n', null);
Features.list.set('ethernet-ports-10m-n', null);
Features.list.set('hdd-odd-form-factor', new Set(['5.25', '3.5', '2.5', '2.5-15mm', 'm2', 'm2.2', '2.5-7mm', '2.5-9.5mm', 'laptop-odd-standard', 'laptop-odd-slim']));
Features.list.set('ide-ports-n', null);
Features.list.set('odd-type', new Set(['cd-r', 'cd-rw', 'dvd-r', 'dvd-rw', 'bd-r', 'bd-rw']));
Features.list.set('pcie-power-pin-n', null);
Features.list.set('pcie-sockets-n', null);
Features.list.set('pci-sockets-n', null);
Features.list.set('power-connector', new Set(['other', 'c13', 'c19', 'barrel', 'miniusb', 'microusb', 'proprietary', 'da-2']));
Features.list.set('power-idle-watt', null);
Features.list.set('power-rated-watt', null);
Features.list.set('ps2-ports-n', null);
Features.list.set('psu-ampere', null);
Features.list.set('psu-connector-motherboard', new Set(['proprietary', 'at', 'atx-20pin', 'atx-24pin', 'atx-20pin-aux']));
Features.list.set('psu-volt', null);
Features.list.set('ram-type', new Set(['simm', 'edo', 'sdr', 'ddr', 'ddr2', 'ddr3', 'ddr4']));
Features.list.set('sata-ports-n', null);
Features.list.set('software', null);
Features.list.set('usb-ports-n', null);
Features.list.set('vga-ports-n', null);
Features.list.set('os-license-code', null);
Features.list.set('os-license-version', null);
Features.list.set('power-idle-pfc', null);
Features.list.set('firewire-ports-n', null);
Features.list.set('serial-ports-n', null);
Features.list.set('parallel-ports-n', null);
Features.list.set('ram-form-factor', new Set(['simm', 'dimm', 'sodimm', 'minidimm', 'microdimm', 'fbdimm']));
Features.list.set('weight-gram', null);
Features.list.set('spin-rate-rpm', null);
Features.list.set('dms-59-ports-n', null);
Features.list.set('check', new Set(['missing-data', 'wrong-data', 'wrong-location', 'wrong-content', 'missing-content', 'wrong-data-and-content', 'wrong-location-and-data']));
Features.list.set('ram-ecc', new Set(['no', 'yes']));
Features.list.set('other-code', null);
Features.list.set('hdmi-ports-n', null);
Features.list.set('scsi-sca2-ports-n', null);
Features.list.set('scsi-db68-ports-n', null);
Features.list.set('mini-ide-ports-n', null);
Features.list.set('data-erased', new Set(['yes']));
Features.list.set('surface-scan', new Set(['fail', 'pass']));
Features.list.set('smart-data', new Set(['fail', 'old', 'ok']));
Features.list.set('wireless-receiver', new Set(['inside', 'near', 'missing']));
Features.list.set('rj11-ports-n', null);
Features.list.set('ethernet-ports-10base5-aui-n', null);
Features.list.set('midi-ports-n', null);
Features.list.set('mini-jack-ports-n', null);
Features.list.set('rca-mono-ports-n', null);
Features.list.set('tv-out-ports-n', null);
Features.list.set('s-video-ports-n', null);
Features.list.set('composite-video-ports-n', null);
Features.list.set('serial-db25-ports-n', null);
Features.list.set('isa-sockets-n', null);
Features.list.set('mini-pcie-sockets-n', null);
Features.list.set('mini-pci-sockets-n', null);
Features.list.set('brand-reseller', null);
Features.list.set('psu-form-factor', new Set(['atx', 'cfx', 'lfx', 'sfx-lowprofile', 'sfx-topfan', 'sfx-topfan-reduceddepth', 'sfx', 'sfx-ps3', 'sfx-l', 'tfx', 'flexatx', 'proprietary', 'eps']));
Features.list.set('cib-old', null);
Features.list.set('restrictions', new Set(['loan', 'in-use', 'bought', 'training', 'ready', 'other']));
Features.list.set('displayport-ports-n', null);
Features.list.set('pci-low-profile', new Set(['no', 'possibile', 'dual', 'yes']));
Features.list.set('psu-connector-cpu', new Set(['none', '4pin', '6pin', '8pin', 'proprietary']));
Features.list.set('jae-ports-n', null);
Features.list.set('game-ports-n', null);
// END GENERATED CODE
