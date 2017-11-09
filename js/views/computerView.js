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
		for(let hardware of ComputerView.mainHardware) {
			if(inside.has(hardware)) {
				this.contentsElement.appendChild(this.buildComponent(inside.get(hardware)));
			} else {
				this.contentsElement.appendChild(this.buildMissingComponent(hardware));
			}
		}
		for(let [name, hardware] of inside) {
			if(ComputerView.mainHardware.has(name)) {
				this.contentsElement.appendChild(this.buildComponent(hardware));
			}
		}
	}

	/**
	 * Flatten items, return a map.
	 *
	 * @param {Item} item
	 * @return {Map.<string,Set<Item|ItemUpdate>>} item type to a Set of items
	 * @private
	 */
	contentsFinder(item) {
		/**
		 * @type {Map.<string,Set<Item|ItemUpdate>>}
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
	 * Build a card/cell/slot/whatever for available components.
	 *
	 * @param {Set.<Item>} components - RAM, CPU, and so on
	 * @return {Node}
	 */
	buildComponent(components) {
		let componentDiv = document.createElement("div");
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
		componentDiv.appendChild(this.fullTemplate.cloneNode(true));
		componentDiv.classList.add('maybe');
		if(worksYes > 0) {
			componentDiv.classList.add('yes');
		}
		if(worksNo > 0) {
			componentDiv.classList.add('no');
		}
		if(worksMaybe > 0) {
			componentDiv.classList.add('maybe');
		}

		// TODO: better implementation
		let brand = Array.from(components.values())[0].features.get('brand');
		let model = Array.from(components.values())[0].features.get('model');
		componentDiv.querySelector('.items').textContent = brand + ' ' + model;

		return componentDiv;
	}

	/**
	 * Build a card/cell/slot/whatever for a missing component/item.
	 *
	 * @param {string} type - RAM, CPU, and so on
	 * @return {Node}
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
