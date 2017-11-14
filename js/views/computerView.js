/**
 * View entire computers in a compact form
 */
class ComputerView extends Framework.View {
	/**
	 * View entire computers in a compact form
	 *
	 * @see ItemLocationView ItemLocationView if breadcrumbs/location are also needed
	 * @param {HTMLElement} element - An element where the item div will be placed
	 * @param {Item} item - Item to view, expected to be a computer
	 * @param {Translations} language - Language for translated strings
	 * @param {Logs} logs - Logs, to add error messages
	 */
	constructor(element, item, language, logs) {
		super(element);
		if(item.features.get("type") !== "case") {
			throw new TypeError('Cannot create ComputerView for item type "' + this.item.features.get("type") + '", only "computer" is allowed');
		}

		this.item = item;
		this.translations = language;
		this.logs = logs;

		this.el.appendChild(document.getElementById("template-computer").content.cloneNode(true));
		this.contentsElement = this.el.querySelector(".contents");
		this.notesElement = this.el.querySelector(".notes");
		this.fullTemplate = document.getElementById("template-computer-component-full").content;
		this.emptyTemplate = document.getElementById("template-computer-component-empty").content;

		this.fillTemplate();
		this.buildContents();
	}

	/**
	 * Fill entire ComputerView cell
	 *
	 * @private
	 */
	fillTemplate() {
		let brand = this.item.features.get("brand");
		let model = this.item.features.get("model");
		let notes = this.item.features.get("notes");
		let location = this.item.parent;
		if(location === null && this.item.location.length > 0) {
			location = this.item.location[this.item.location.length - 1];
		}

		if(typeof notes === 'undefined') {
			this.notesElement.style.display = 'none';
		} else {
			this.notesElement.textContent = notes;
		}
		if(typeof brand === 'undefined') {
			this.el.querySelector(".header .brand").textContent = brand;
		}
		if(typeof model === 'undefined') {
			this.el.querySelector(".header .model").textContent = model;
		}
		if(location !== null) {
			let locationLink = this.el.querySelector(".header .location");
			locationLink.textContent = location;
			locationLink.href = '#/view/' + location;
		}
		let aCode = this.el.querySelector(".header .code");
		aCode.textContent = this.item.code;
		aCode.href = '#/view/' + this.item.code;
	}

	/**
	 * Build content of the view from an Item and display it
	 *
	 * @private
	 */
	buildContents() {
		let inside = this.contentsFinder(this.item);
		for(let name of ComputerView.mainHardware) {
			if(inside.has(name)) {
				for(let hardware of this.buildComponents(name, inside.get(name))) {
					this.contentsElement.appendChild(hardware);
				}
			} else {
				this.contentsElement.appendChild(this.buildMissingComponent(name));
			}
		}
		for(let [name, components] of inside) {
			if(!ComputerView.mainHardware.has(name)) {
				for(let hardware of this.buildComponents(name, components)) {
					this.contentsElement.appendChild(hardware);
				}
			}
		}
	}

	/**
	 * Flatten items, return a map.
	 *
	 * @param {Item} item
	 * @return {Map.<string,Set<Item>>} item type to a Set of items
	 * @private
	 */
	contentsFinder(item) {
		/**
		 * @type {Map.<string,Set<Item>>}
		 */
		let inside = new Map();
		for(let subitem of this.contentsFlattener(item)) {
			let type = subitem.features.get('type');
			// works with null, too
			if(!inside.has(type)) {
				inside.set(type, new Set());
			}
			inside.get(type).add(subitem);
		}
		return inside;
	}

	/**
	 * Flatten the Item tree by yielding stuff
	 *
	 * @param {Item} item
	 * @private
	 */
	*contentsFlattener(item) {
		for(let subitem of item.inside) {
			yield subitem;
			for(let subitem2 of this.contentsFlattener(subitem)) {
				yield subitem2;
			}
		}
	}

	/**
	 * Build a card/cell/slot/whatever for multiple components or fall back to a cell for each component.
	 *
	 * @param {string} type - string representing item type
	 * @param {Set.<Item>|Item[]} components - RAMs, CPUs, and so on
	 * @return {Node[]}
	 * @protected
	 */
	buildComponents(type, components) {
		let cells = [];

		let multicomponent = true;
		let compact, extended;
		try {
			extended = ComputerView.allToString(type, components);
			compact = ComputerView.compactToString(type, components);
		} catch(e) {
			//this.logs.add(e, 'W');
			multicomponent = false;
		}

		if(multicomponent) {
			cells.push(this.buildComponentCell(type, components, compact, extended));
		} else {
			for(let component of components) {
				compact = ComputerView.singleToString(type, component);
				cells.push(this.buildComponentCell(type, [component], compact));
			}
		}

		return cells;
	}

	/**
	 * Build a card/cell/slot/whatever with supplied component data
	 *
	 * @param {string} type - string representing item type
	 * @param {Iterable.<Item>} components - Components themselves, to
	 * @param {string|null=null} compact - single description of multiple components, or single component
	 * @param {string|null=null} extended - additional data for for multiple components bundled in a single cell
	 * @return {Node}
	 * @private
	 */
	buildComponentCell(type, components, compact = null, extended = null) {
		let componentDiv = document.createElement("div");
		componentDiv.appendChild(this.fullTemplate.cloneNode(true));
		ComputerView.workingClass(components, componentDiv);
		if(extended === null) {
			extended = '';
		} else {
			extended = '(' + extended +')';
		}
		componentDiv.querySelector('.type').textContent = type + " : ";
		componentDiv.querySelector('.compact').textContent = compact;
		componentDiv.querySelector('.extended').textContent = extended;

		return componentDiv;
	}

	/**
	 * Examine component(s) and decide if they should be marked working or not, and add classes to the supplied div.
	 * Also increases steel production by 500%.
	 *
	 * @param {Iterable.<Item>} components - some items. Or a single one in array.
	 * @param {Node} componentDiv
	 * @private
	 */
	static workingClass(components, componentDiv) {
		let worksYes = 0;
		let worksMaybe = 0;
		let worksNo = 0;
		let worksUnknown = 0;
		for(let component of components) {
			if(component.features.has('works')) {
				switch(component.features.get('works')) {
					case 'yes':
						worksYes++;
						break;
					case 'no':
						worksNo++;
						break;
					case 'maybe':
						worksMaybe++;
						break;
					default:
						worksUnknown++;
				}
			} else {
				worksUnknown++;
			}
		}
		componentDiv.classList.add('works');
		if(worksYes > 0) {
			componentDiv.classList.add('yes');
		}
		if(worksNo > 0) {
			componentDiv.classList.add('no');
		}
		if(worksMaybe > 0) {
			componentDiv.classList.add('maybe');
		}
	}

	/**
	 * Compactly represent multiple items as a string (e.g. sum RAM sizes)
	 *
	 * @param {string} type - item type
	 * @param {Set.<Item>} components - RAM, CPU, and so on
	 * @return {string}
	 * @private
	 */
	static compactToString(type, components) {
		let string = '';
		let features;
		switch(type) {
			case 'ram':
				features = ComputerView.findFeatures(components, ['ram-socket', 'frequency-hertz'], [], ['capacity-byte']);

				// TODO: translations
				let ddr = features.has('ram-socket') ? features.get('ram-socket') + ' ' :  'RAM ';
				let freq = features.has('frequency-hertz') ? features.get('frequency-hertz') + ' ' : '';
				let counter = components.size;
				let size = features.has('capacity-byte') ? features.get('capacity-byte') : 0;

				string += '' + counter + '× ' + ddr + freq + FeatureViewUnit.valueToPrintable('byte', size);
				break;
			// TODO: implement other types
			default:
				throw new Error(type + ' cannot be represented as a compact string');
		}

		return string;
	}

	/**
	 * Represent all items as a string (e.g. print brand and model of each one)
	 *
	 * @param {string} type - item type
	 * @param {Set.<Item>} components - RAM, CPU, and so on
	 * @return {string}
	 * @private
	 */
	static allToString(type, components) {
		let string = '';
		let features;
		switch(type) {
			case 'ram':
				features = ComputerView.findFeatures(components, [], ['brand', 'sn']);
				let couples = [];
				let brands = features.get('brand');
				let sns = features.get('sn');
				for(let i = 0; i < brands.length; i++) {
					let brand = brands[i];
					let sn = sns[i];
					let couple = '';
					if(brand !== null) {
						couple += brand + ' ';
					}
					if(sn !== null) {
						couple += sn;
					}
					couple = couple.trim();
					if(couple === '') {
						couples.push('?');
					} else {
						couples.push(couple);
					}
				}

				string = ComputerView.strList(couples);
				break;
			// TODO: implement others
			default:
				throw new Error(type + ' cannot be represented as an extended string');
		}

		return string;
	}

	/**
	 * Represent a single item as a string
	 *
	 * @param type
	 * @param {string} type - item type
	 * @param {Item} component - CPU, graphics card and so on
	 */
	static singleToString(type, component) {
		let it = component.features;
		let brand = it.has('brand') ? it.get('brand') + ' ' : '';
		let model = it.has('model') ? it.get('model') + ' ' : '';
		let string = '';
		if(type === 'cpu') {
			let freq = it.has('frequency-hertz') ? '@ ' + FeatureViewUnit.valueToPrintable('Hz', it.get('frequency-hertz')) : '';
			let socket = it.has('cpu-socket') ? '(' + it.get('cpu-socket') + ')' : '';
			let core = it.has('core-n') ? it.get('core-n') : '';
			if (core !== '') {
				if (core === '1') {
					core = 'single core ';
				} else {
					core = core + ' cores ';
				}
			}
			string = brand + model + core + freq + socket;
		} else if(type === 'motherboard') {
			let formFactor = it.has('motherboard-form-factor') ? ' ' + it.get('motherboard-form-factor') : '';
			let agp = it.has('agp-sockets-n') ? '' + it.get('agp-sockets-n') + '× AGP ' : '';
			let pci = it.has('pci-sockets-n') ? '' + it.get('pci-sockets-n') + '× PCI ' : '';
			let pcie = it.has('pcie-sockets-n') ? '' + it.get('pcie-sockets-n') + '× PCIe ' : '';
			let sata = it.has('sata-ports-n') ? '' + it.get('sata-ports-n') + '× SATA ' : '';
			let ide = it.has('ide-ports-n') ? '' + it.get('ide-ports-n') + '× IDE ' : '';
			let psu = it.has('psu-socket') ? '' + it.get('psu-socket') + ' ' : '';
			let ports = '';
			if (agp !== '' || pci !== '' || pcie !== '' || sata !== '' || ide !== '') {
				ports = '(' + agp + pci + pcie + sata + ide;
				ports = ports.trim() + ')';
			}

			string = brand + model + formFactor + psu + ports;
		} else if(type === 'psu') {
			let socket = it.has('psu-socket') ? ' ' + it.get('psu-socket') : '';
			let connector = it.has('power-connector') ? ' ' + it.get('power-connector') : '';
			let v = it.has('psu-volt') ? ' ' + FeatureViewUnit.valueToPrintable('volt', parseInt(it.get('psu-volt'))) : '';
			let i = it.has('psu-ampere') ? ' ' + FeatureViewUnit.valueToPrintable('ampere', parseInt(it.get('psu-ampere'))) : '';
			let p = it.has('power-rated-watt') ? ' ' + FeatureViewUnit.valueToPrintable('watt', parseInt(it.get('power-rated-watt'))) : '';

			string = (brand + model + socket + connector).trim();
			string = string === '' ? '' : string + ', ';
			string += ComputerView.strList([v, i, p]);
		} else if(type === 'hdd') {
			let sata = it.has('sata-ports-n') && parseInt(it.get('sata-ports-n')) > 0;
			let ide = it.has('ide-ports-n') && parseInt(it.get('ide-ports-n')) > 0;
			let size = it.has('capacity-decibyte') ? ' ' + FeatureViewUnit.valueToPrintable('decibyte', parseInt(it.get('capacity-decibyte'))) : '';
			let ff = it.has('hdd-form-factor') ? ' ' + it.get('hdd-form-factor') : '';
			string = brand + model + ff + size;
			if(sata && ide) {
				string += ' (SATA + IDE!?)';
			} else if(sata) {
				string += ' (SATA)';
			} else {
				string += ' (IDE)';
			}
		} else {
			string = brand + model;
		}
		return string;
	}

	/**
	 * Find features in multiple items
	 *
	 * @param {Iterable.<Item>} components
	 * @param {string[]=array} first - find first item with a feature of this type
	 * @param {string[]=array} all - Set of those features or null, for each item in same order
	 * @param {string[]=array} sum - cast to int and sum
	 *
	 * @return {Map.<string,string|string[]|int>}
	 */
	static findFeatures(components, first=[], all=[], sum=[]) {
		/**
		 * @type {Map.<string,string|string[]|int>}
		 */
		let results = new Map();

		for(let piece of components) {
			for(let type of sum) {
				if(piece.features.has(type)) {
					let int = parseInt(piece.features.get(type));
					if(results.has(type)) {
						results.set(type, results.get(type) + int);
					} else {
						results.set(type, int)
					}
				}
			}
			for(let type of all) {
				if(!results.has(type)) {
					results.set(type, []);
				}
				if(piece.features.has(type)) {
					results.get(type).push(piece.features.get(type));
				} else {
					results.get(type).push(null);
				}
			}
			for(let type of first) {
				if(!results.has(type) && piece.features.has(type)) {
					results.set(type, piece.features.get(type));
				}
			}
		}
		return results;
	}

	/**
	 * Take an iterable list and turn it into a comma-separated string
	 * Empty list returns an empty string
	 *
	 * @param {Iterable.<string>} list
	 * @return {string}
	 */
	static strList(list) {
		let string = '';
		for(let piece of list) {
			if(piece !== '') {
				string += piece + ', ';
			}
		}

		return string.substr(0, string.length - 2);
	}

	/**
	 * Build a card/cell/slot/whatever for a missing component/item.
	 *
	 * @param {string} type - RAM, CPU, and so on
	 * @return {Node}
	 * @private
	 */
	buildMissingComponent(type) {
		// TODO: translations + handle nulls
		let newThing = document.createElement("div");
		newThing.appendChild(this.emptyTemplate.cloneNode(true));
		newThing.querySelector(".type").textContent = type;
		newThing.classList.add("component");
		newThing.classList.add("missing");
		return newThing;
	}
}

Object.defineProperty(ComputerView, 'mainHardware', {
	value: new Set(['cpu', 'ram', 'motherboard', 'psu', 'hdd', 'odd', 'graphics-card']),
	writable: false,
	enumerable: false,
	configurable: false
});
