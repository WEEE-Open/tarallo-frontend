class TransactionView extends Framework.View {
	constructor(el, transaction, logs) {
		super(el);
		/**
		 * @var {Transaction} transaction
		 */
		this.transaction = transaction;
		this.logs = logs;

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
	commitClick(event) {
		event.stopPropagation();
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

	deleteButtonClick(map, key, event) {
		try {
			this.transaction.undo(map, key);
		} catch(e) {
			this.logs.add('Cannot remove element from transaction: ' + e.message, 'E');
			return;
		}
		let deleteMe = event.target.parentNode;
		deleteMe.parentNode.removeChild(event.target.parentNode);
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
			this.printTree(this.transaction.create, createElement);
		}

		if(this.transaction.updateCount > 0) {
			this.printTree(this.transaction.update, updateElement);
		}

		if(this.transaction.removeCount > 0) {
			this.printTree(this.transaction.remove, removeElement);
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
	 * @TODO make recursive, specify operation for each item (e.g. Modify X -> add Y, add Z) instead of separating them by action add a toString to Item and ItemUpdate (may not have codes)
	 * @param map an Iterable type. PHPStorm suddenly stopped understanding this simple concept and began claiming that Iterable.<Item> is not an Iterable.<Item>.
	 * @param {Node} ul
	 * @private
	 */
	printTree(map, ul) {
		for(let [key, item] of map) {
			let li = document.createElement("li");
			let deleteButton = TransactionView.getDeleteButton();
			deleteButton.addEventListener('click', this.deleteButtonClick.bind(this, map, key));
			let text = document.createElement("span");
			if(item instanceof Item) { // TODO: does this work for ItemUpdate, too?
				text.textContent = item.code + ' in ' + item.parent;
			} else if(typeof item === 'string') {
				text.textContent = item;
			}
			ul.appendChild(li);
			li.appendChild(deleteButton);
			li.appendChild(text);
		}
	}

	/**
	 * Create a delete button and return it
	 */
	static getDeleteButton() {
		let button = document.createElement('button');
		button.textContent = 'X';
		button.classList.add("delete");
		return button;
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