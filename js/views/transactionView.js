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

	/**
	 * Handle clicking on the "delete item" button: delete it from Transaction and remove the entire row from view.
	 *
	 * @param {Map} map - one of the maps from Transaction
	 * @param {string|Item} key
	 * @param {Event} event
	 */
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
	 * Handle clicking on a newly added item link, to correctly navigate to the edit page
	 *
	 * @param {Item} item
	 * @param {Event} event
	 */
	itemAddedClick(item, event) {
		if(this.transaction.create.has(item)) {
			// Don't do this at home
			this.transaction.lastAdded = item;
		} else {
			this.logs.add('Item not found in Transaction', 'E');
			event.stopPropagation();
			event.preventDefault();
		}
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
	 * @param map an Iterable type. PHPStorm suddenly stopped understanding this simple concept and began claiming that Iterable.<Item> is not an Iterable.<Item>.
	 * @param {Node} ul
	 * @private
	 */
	printTree(map, ul) {
		for(let [key, item] of map) {
			let innerUl = null;
			let first = true;
			for(let li of this.createListElement(item, true, map, key)) {
				if(first) {
					ul.appendChild(li);
					first = false;
				} else {
					if(innerUl === null) {
						innerUl = document.createElement("ul");
						ul.appendChild(innerUl);
					}
					innerUl.appendChild(li);
				}
			}

		}
	}

	/**
	 * Recursively create list items containing an item and its content
	 *
	 * @param {Item|ItemUpdate|string} item - current item, aka the key from Transaction maps
	 * @param {boolean} deletable - show a delete button or not? True only if it's a root item
	 * @param {Map} map - a map from Tranasaction, if deletable
	 * @param {string|Item} key - key from that map, if deletable
	 * @return {Element} all the li
	 */
	*createListElement(item, deletable=false, map=null, key=null) {
		if(deletable && (map === null || key === null)) {
			throw new Error("Deletable list items should provide a key and a map to actually be able to delete them");
		}
		let li = document.createElement("li");
		let text = document.createElement("a");

		if(deletable) {
			let deleteButton = TransactionView.getDeleteButton();
			deleteButton.addEventListener('click', this.deleteButtonClick.bind(this, map, key));
			li.appendChild(deleteButton);
			if(map === this.transaction.create) {
				text.href = '#/add/last';
				text.addEventListener('click', this.itemAddedClick.bind(this, key));
			} else if(map === this.transaction.update) {
				text.href = '#/view/' + key;
			} else if(map === this.transaction.remove) {
				text.href = '#/view/' + key;
			}
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

		yield li;

		if(item instanceof Item || item instanceof ItemUpdate) {
			let insides = item.inside;
			if(map === this.transaction.update) {
				insides = item.insideDiff.values();
			}
			if(insides.size > 0) {
				for(let subitem of insides) {
					for(let li of this.createListElement(subitem)) {
						yield li;
					}
				}
			}
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