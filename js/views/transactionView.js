class TransactionView extends FrameworkView {
	constructor(el, transaction) {
		super(el);
		/**
		 * @var {Transaction} transaction
		 */
		this.transaction = transaction;

		let create = document.createElement("div");
		let edit = document.createElement("div");
		let remove = document.createElement("div");
		// TODO: headings (or usa a template, MAYBE)
		this.el.appendChild(create);
		this.el.appendChild(edit);
		this.el.appendChild(remove);
		this._printAll(create, edit, remove);
	}

	/**
	 *
	 * @param {Node} createElement
	 * @param {Node} updateElement
	 * @param {Node} removeElement
	 * @private
	 */
	_printAll(createElement, updateElement, removeElement) {
		let ul, create = Array.from(this.transaction.create);
		// TODO: replace Array.from with something better, but iterators can't tell how many elements are there, for...of does absolutely nothing for no reason, and documentation is impossible to find since everyone calls plain objects "map" and flood SERPs with useless information from 10 years ago
		if(create.length > 0) {
			ul = document.createElement("ul");
			createElement.appendChild(ul);
			TransactionView._printTree(create, ul);
		}

		let update = Array.from(this.transaction.update);
		if(update.length > 0) {
			ul = document.createElement("ul");
			updateElement.appendChild(ul);
			TransactionView._printTree(update, ul);
		}

		let remove = Array.from(this.transaction.delete);
		if(remove.length > 0) {
			ul = document.createElement("ul");
			removeElement.appendChild(ul);
			TransactionView._printTree(remove, ul);
		}
	}

	/**
	 * @TODO make recursive, add a toString to Item and ItemUpdate (may not have codes)
	 * @param {Item[]|ItemUpdate[]} items
	 * @param {Node} ul
	 * @private
	 */
	static _printTree(items, ul) {
		let i, li, len = items.length;
		for(i = 0; i < len; i++) {
			li = document.createElement("li");
			ul.appendChild(li);
			li.textContent = items[i].code + ' in ' + items[i].parent;
		}
	}
}