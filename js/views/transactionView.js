class TransactionView extends FrameworkView {
	constructor(el, transaction) {
		super(el);
		/**
		 * @var {Transaction} transaction
		 */
		this.transaction = transaction;

		this.el.appendChild(document.getElementById("template-transaction").content.cloneNode(true));
		let create = this.el.querySelector('.create');
		let modify = this.el.querySelector('.modify');
		let remove = this.el.querySelector('.remove');

		this.notesElement = this.el.querySelector(".notes");
		this.commitButton = this.el.querySelector("button.commit"); // TODO: redirect away from transaction page if success is achieved
		this._toggleButton(this.transaction.actionsCounter > 0);

		this.notesElement.addEventListener('blur', this._notesInput.bind(this));
		this.commitButton.addEventListener('click', this._commitClick.bind(this));

		this._printAll(create, modify, remove);
	}

	/**
	 * Prints all pending operations
	 *
	 * @param {Node} createElement - ul
	 * @param {Node} updateElement - ul
	 * @param {Node} removeElement - ul
	 * @private
	 */
	_printAll(createElement, updateElement, removeElement) {
		// TODO: replace Array.from with something better, but iterators can't tell how many elements are there,
		// for...of does absolutely nothing for no reason, and documentation is impossible to find since everyone calls
		// plain objects "map" and floods SERPs with useless information from 10 years ago
		let create = Array.from(this.transaction.create);
		if(create.length > 0) {
			TransactionView._printTree(create, createElement);
		}

		let update = Array.from(this.transaction.update);
		if(update.length > 0) {
			TransactionView._printTree(update, updateElement);
		}

		let remove = Array.from(this.transaction.remove);
		if(remove.length > 0) {
			TransactionView._printTree(remove, removeElement);
		}
	}

	/**
	 * Handle clicking the commit button.
	 *
	 * @private
	 */
	_commitClick() {
		this.transaction.commit();
	}

	/**
	 * Enable or disable commit button.
	 * Hint: use transaction.actionsCount.
	 *
	 * @param {Boolean} enabled
	 * @private
	 */
	_toggleButton(enabled) {
		this.commitButton.disabled = !enabled;
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

	/**
	 * Handle writing something in the notes textarea
	 *
	 * @private
	 */
	_notesInput() {
		let notes = this.notesElement.value;
		if(notes === "") {
			this.transaction.setNotes(null);
		} else {
			this.transaction.setNotes(notes);
		}
	}

	trigger(that, event) {
		if(that === this.transaction) {
			if(event === 'transaction-add') {
				this._toggleButton(true);
			} else if(event === 'transaction-delete') {
				this._toggleButton(false);
			}
		}
	}
}