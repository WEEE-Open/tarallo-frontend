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
			locationLink.href = '#/View/' + location;
		}
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
			if(ComputerView.mainHardware.has(name)) {
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
			multicomponent = false;
		}

		if(multicomponent) {
			cells.push(this.buildComponentCell(type, components, compact, extended));
		} else {
			for(let component of components) {
				// TODO: compact = ComputerView.singleToString(type, component);
				compact = 'foo';
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
		switch(type) {
			case 'ram':
				let ddr = undefined, freq = undefined, size = undefined, totalSize = 0, counter = 0;
				for(let ram of components) {
					if(typeof ddr === 'undefined') {
						ddr = ram.features.get('ram-socket');
					}
					if(typeof freq === 'undefined') {
						freq = ram.features.get('frequency-hz');
					}
					size = ram.features.get("capacity-byte");
					if(typeof size !== 'undefined') {
						totalSize += parseInt(size);
					}

					counter++;
				}

				// TODO: translations
				ddr = typeof ddr === 'undefined' ? 'RAM ' : ' ' + ddr;
				freq = typeof freq === 'undefined' ? '' : ' ' + freq;

				string += counter + '× ' + ddr + freq + FeatureViewUnit.valueToPrintable('byte', totalSize);
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
	 * @return {string|null}
	 * @private
	 */
	static allToString(type, components) {
		let string = '';
		switch(type) {
			case 'ram':
				let brands = new Set();
				for(let ram of components) {
					if(ram.features.has('brand')) {
						let brand = ram.features.get('brand');
						if(!brands.has(brand)) {
							brands.add(brand);
						}
					}
				}
				if(brands.size === 0) {
					return null;
				} else {
					string = ComputerView.strList(brands);
				}
				break;
			// TODO: implement
			default:
				throw new Error(type + ' cannot be represented as an extended string');
		}

		return string;
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
			string += piece + ', ';
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
