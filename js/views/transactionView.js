class TransactionView extends Framework.View {
	constructor(el, transaction, logs) {
		super(el);
		/**
		 * @var {Transaction} transaction
		 */
		this.transaction = transaction;
		this.logs = logs;

		this.el.appendChild(document.getElementById("template-transaction").content.cloneNode(true));
		let pending = this.el.querySelector('.pending');

		this.notesElement = this.el.querySelector("textarea.notes");
		this.commitButton = this.el.querySelector("button.commit"); // TODO: redirect away from transaction page if success is achieved
		this.toggleButton(this.transaction.actionsCount > 0);

		this.notesElement.addEventListener('blur', this.notesInput.bind(this));
		this.commitButton.addEventListener('click', this.commitClick.bind(this));

		this.printAll(pending);
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
	 * @param {Node} pendingElement - ul
	 * @private
	 */
	printAll(pendingElement) {
		if(this.transaction.actionsCount > 0) {
			this.printTree(this.transaction.create, pendingElement);
			this.printTree(this.transaction.update, pendingElement);
			this.printTree(this.transaction.remove, pendingElement);
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
	 * @TODO make recursive, specify operation for each item (e.g. Modify X -> add Y, add Z), add a toString to Item and ItemUpdate (may not have codes)
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
			if(map === this.transaction.create) {
				text.textContent = 'new '
			} else if(map === this.transaction.update) {
				text.textContent = 'update '
			} else {
				text.textContent = 'remove '
			}
			if(item instanceof Item) { // TODO: does this work for ItemUpdate, too?
				text.textContent += item.code + ' in ' + item.parent;
			} else if(typeof item === 'string') {
				text.textContent += item;
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
			// for searching:
			// 'to-add', 'to-update', 'to-delete', 'un-add', 'un-update', 'un-delete', 'reset'
			if(this.transaction.actionsCount > 0) {
				this.toggleButton(true);
			} else {
				this.toggleButton(false);
			}
		}
	}
}