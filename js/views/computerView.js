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
		if (this.item.features.get("type") !== "computer") {
			throw new TypeError('Cannot create ComputerView for item type "' + this.item.features.get("type") + '", only "computer" is allowed');
		}

		this.item = item;
		this.translations = language;
		this.logs = logs;

		this.el.appendChild(document.getElementById("template-computer").content.cloneNode(true));
		this.contentsElement = this.el.querySelector(".contents");
		this.fullTemplate = document.getElementById("template-computer-component-full").content;
		this.emptyTemplate = document.getElementById("template-computer-component-empty").content;

		this.fillTemplate();
		this.buildContents();

		this.el.querySelector(".header button").addEventListener("click", this.editClick.bind(this));
	}

	editClick() {
		// TODO: implement?
	}

	fillTemplate() {
		let brand = this.item.features.get("brand");
		let model = this.item.features.get("model");
		let location = this.item.parent;
		if(location === null && this.item.location.length > 0) {
			location = this.item.location[this.item.location.length - 1];
		}

		// TODO: handle nulls (features, location, etc...)
		if(brand !== null) {
			this.el.querySelector(".header .brand").textContent = brand;
		}
		if(model !== null) {
			this.el.querySelector(".header .model").textContent = model;
		}
		if(location !== null) {
			let aLocation = this.el.querySelector(".header .location").textContent = location;
			aLocation.href = '#/View/' + location;
		}
	}

	buildContents() {
		this.contentsFinder(this.item);
	}

	/**
	 *
	 * @param {Item} item
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
	 *
	 * @param {Item} item
	 */
	*contentsFlattener(item) {
		for(let subitem of item.inside) {
			yield subitem;
			// TODO: does this work? (probably not)
			for(let subitem of this.contentsFlattener(subitem)) {
				yield subitem;
			}
		}
	}

	/**
	 *
	 * @param {Item} component
	 */
	buildComponent(component) {
		// TODO: translations + handle nulls
		// querySelector(".type").textContent = component.features.get("type");
	}


	/**
	 * Build a card/cell/slot/whatever for a missing component/item.
	 *
	 * @param {string} type - RAM, CPU, and so on
	 * @return {Node}
	 */
	buildMissingComponent(type) {
		// TODO: translations + handle nulls
		let newThing = this.emptyTemplate.cloneNode(true);
		newThing.querySelector(".type").textContent = type;
		newThing.classList.add("component");
		newThing.classList.add("missing");
		return newThing;
	}
}
