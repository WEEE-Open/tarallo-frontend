class TransactionView extends Framework.View {
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
		this.toggleButton(this.transaction.actionsCount > 0);

		this.notesElement.addEventListener('blur', this.notesInput.bind(this));
		this.commitButton.addEventListener('click', this.commitClick.bind(this));

		this.printAll(create, modify, remove);
	}

	/**
	 * Handle clicking the commit button.
	 *
	 * @private
	 */
	commitClick() {
		this.transaction.commit();
	}

	/**
	 * Handle writing something in the notes textarea
	 *
	 * @private
	 */
	notesInput() {
		let notes = this.notesElement.value;
		if(notes === "") {
			this.transaction.setNotes(null);
		} else {
			this.transaction.setNotes(notes);
		}
	}

	/**
	 * Prints all pending operations
	 *
	 * @param {Node} createElement - ul
	 * @param {Node} updateElement - ul
	 * @param {Node} removeElement - ul
	 * @private
	 */
	printAll(createElement, updateElement, removeElement) {
		if(this.transaction.createCount > 0) {
			TransactionView.printTree(this.transaction.create.values(), createElement);
		}

		if(this.transaction.updateCount > 0) {
			TransactionView.printTree(this.transaction.update.values(), updateElement);
		}

		if(this.transaction.removeCount > 0) {
			TransactionView.printTree(this.transaction.remove.values(), removeElement);
		}
	}

	/**
	 * Enable or disable commit button.
	 * Hint: use transaction.actionsCount.
	 *
	 * @param {Boolean} enabled
	 * @private
	 */
	toggleButton(enabled) {
		this.commitButton.disabled = !enabled;
	}

	/**
	 * @TODO make recursive, add a toString to Item and ItemUpdate (may not have codes)
	 * @param items an Iterable type. PHPStorm suddenly stopped understanding this simple concept and began claiming that Iterable.<Item> is not an Iterable.<Item>.
	 * @param {Node} ul
	 * @private
	 */
	static printTree(items, ul) {
		let li;
		for(let item of items) {
			li = document.createElement("li");
			ul.appendChild(li);
			if(item instanceof Item) { // TODO: does this work for ItemUpdate, too?
				li.textContent = item.code + ' in ' + item.parent;
			} else if(typeof item === 'string') {
				li.textContent = item;
			}
		}
	}

	trigger(that, event) {
		if(that === this.transaction) {
			if(event === 'to-add' || event === 'to-update' || event === 'to-delete') {
				this.toggleButton(true);
			} else if(event === 'reset') {
				this.toggleButton(false);
			}
		}
	}
}