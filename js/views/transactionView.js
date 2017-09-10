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

		this.notesElement = this.el.querySelector("textarea.notes");
		this.commitButton = this.el.querySelector("button.commit"); // TODO: redirect away from transaction page if success is achieved
		this._toggleButton(this.transaction.actionsCount > 0);

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
		if(this.transaction.createCount > 0) {
			TransactionView._printTree(this.transaction.create, createElement);
		}

		if(this.transaction.updateCount > 0) {
			TransactionView._printTree(this.transaction.update, updateElement);
		}

		if(this.transaction.removeCount > 0) {
			TransactionView._printTree(this.transaction.remove, removeElement);
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
	 * @param {Iterable.<Item|ItemUpdate>} items
	 * @param {Node} ul
	 * @private
	 */
	static _printTree(items, ul) {
		let li;
		for(let item of items) {
			li = document.createElement("li");
			ul.appendChild(li);
			li.textContent = item.code + ' in ' + item.parent;
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