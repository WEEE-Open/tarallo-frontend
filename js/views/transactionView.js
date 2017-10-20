class TransactionView extends Framework.View {
	/**
	 *
	 * @param {Element} el
	 * @param {Transaction} transaction
	 * @param {Logs} logs
	 * @param {Translations} translations
	 */
	constructor(el, transaction, logs, translations) {
		super(el);
		this.transaction = transaction;
		this.logs = logs;
		this.translations = translations;

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
	 * Recursively create list items containing an item and its content
	 *
	 * @param {Item|ItemUpdate|string} item - current item, aka the key from Transaction maps
	 * @param {boolean} deletable - show a delete button or not? True only if it's a root item
	 * @param {Map} map - a map from Tranasaction, if deletable
	 * @param {string|Item} key - key from that map, if deletable
	 * @return {Element}
	 */
	createListElement(item, deletable=false, map=null, key=null) {
		if(!deletable && (map === null || key === null)) {
			throw new Error("Deletable list items should provide a key and a map to actually be able to delete them");
		}
		let li = document.createElement("li");
		let text = document.createElement("span");

		if(deletable) {
			let deleteButton = TransactionView.getDeleteButton();
			deleteButton.addEventListener('click', this.deleteButtonClick.bind(this, map, key));
			li.appendChild(deleteButton);
		}
		let letter = '';
		if(map !== null) {
			if(map === this.transaction.create) {
				letter = 'C ';
			} else if(map === this.transaction.update) {
				letter = 'U ';
			} else if(map === this.transaction.remove) {
				letter = 'D ';
			}
		}
		try {
			text.textContent = letter + this.translations.toStringLocalized(item);
		} catch(e) {
			text.textContent = letter + item;
		}
		li.appendChild(text);

		if(item instanceof Item || item instanceof ItemUpdate) {
			if(item.inside.size > 0) {
				let sublist = document.createElement('ul');
				for(let subitem of item.inside) {
					let subli = this.createListElement(subitem);
					sublist.appendChild(subli);
				}
				li.appendChild(sublist);
			}
		}

		return li;
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
	 * @param map an Iterable type. PHPStorm suddenly stopped understanding this simple concept and began claiming that Iterable.<Item> is not an Iterable.<Item>.
	 * @param {Node} ul
	 * @private
	 */
	printTree(map, ul) {
		for(let [key, item] of map) {
			let li = this.createListElement(item, true, map, key);
			ul.appendChild(li);
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