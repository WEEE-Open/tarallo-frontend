/**
 * Show an item, and its location as breadcrumbs.
 * Use for top-level items only.
 *
 * @param {HTMLElement} element - an HTML element
 * @param {Item} item - item to show
 * @param {Translations} language - Language for translated strings
 * @param {Transaction} transaction - Transaction, to edit and delete items
 * @param {Logs} logs - Logs, to add error messages
 */
class ItemLocationView extends ItemView {
	/**
	 * Show an item, and its location as breadcrumbs.
	 * Use for top-level items only.
	 *
	 * @param {HTMLElement} element - an HTML element
	 * @param {Item} item - item to show
	 * @param {Translations} language - Language for translated strings
	 * @param {Transaction} transaction - Transaction, to edit and delete items
	 * @param {Logs} logs - Logs, to add error messages
	 */
	constructor(element, item, language, transaction, logs) {
		super(element, item, language, logs, transaction, null);
		let locationContainer = document.createElement("div"); // TODO: too many divs?
		locationContainer.classList.add("itemandlocation");
		locationContainer.appendChild(document.getElementById("template-location").content.cloneNode(true));

		this.contentsElement = locationContainer.querySelector('.contents');
		this.breadcrumbsElement = locationContainer.querySelector('.breadbox .breadcrumbs');
		this.breadsetterElement = locationContainer.querySelector('.breadbox .breadsetter');
		this.parentTextbox = locationContainer.querySelector('.breadbox .breadsetter input');

		this.parentTextbox.addEventListener('focusout', this.parentInput.bind(this));

		this.createBreadcrumbs();
		this.toggleParentTextboxVisibilityOnCondition(this.item.exists, this.item.location.length > 0, this.frozen, this.item.getParent() !== null);
		this.moveElements();

		this.el.appendChild(locationContainer);
	}

	/**
	 * Take elements from this.el (i.e. ItemView) and move into this.contentsElement.
	 */
	moveElements() {
		while(this.el.firstChild) {
			this.contentsElement.appendChild(this.el.firstChild);
		}
	}

	/**
	 * Handle inserting parent code in breadcrumbs textbox
	 *
	 * @param {Event} event
	 */
	parentInput(event) {
		//event.preventDefault();
		//event.stopPropagation();
		let value = this.parentTextbox.value;
		let prevParentString = this.item.getParent();
		if(prevParentString === null) {
			prevParentString = '';
		}
		if(value === '') {
			try {
				this.item.setParent(null);
			} catch(e) {
				this.logs.add(e.message, 'E');
				return;
			}
			this._toggleBreadcrumbsDuplicate(false);
			event.stopPropagation();
		} else {
			try {
				this.item.setParent(this.parentTextbox.value);
			} catch(e) {
				this.logs.add('Cannot set parent to "' + value + '": ' + e.message, 'E');
				this.parentTextbox.value = prevParentString;
				return;
			}
			this._toggleBreadcrumbsDuplicate(true);
			event.stopPropagation();
		}
	}

	createBreadcrumbs() {
		this.deleteBreadcrumbs();
		let len = this.item.location.length;
		if(len > 0) {
			for(let i = 0; i < len; i++) {
				if(i !== 0) {
					this.breadcrumbsElement.appendChild(document.createTextNode(" > "));
				}
				let piece = document.createElement("a");
				piece.dataset.href = piece.href = "#/view/" + this.item.location[i];
				piece.textContent = this.item.location[i];
				this.breadcrumbsElement.appendChild(piece);
			}
		}
		this.toggleParentTextboxVisibilityOnCondition(this.item.exists, len > 0, this.frozen, this.item.getParent() !== null);
	}

	deleteBreadcrumbs() {
		while(this.breadcrumbsElement.lastChild) {
			this.breadcrumbsElement.removeChild(this.breadcrumbsElement.lastChild);
		}
	}

	/**
	 * Decides wether to show the "set parent" textbox or not, and does that.
	 * The "decides" part involved drawing a CFG, but the resulting code would have been wider than taller and
	 * absolutely unreadable.
	 * To make it at least more compact a truth table has been drawn and Karnaugh maps were used to simplify the
	 * resulting logic. This would have been useful if I were to implement this in hardware, but in software
	 * was a bit pointless. Well, at least the code appears more readable (but still doesn't make sense).
	 *
	 * @param {boolean} exists - item.exists
	 * @param {boolean} location - does item have a "location"?
	 * @param {boolean} frozen - is item frozen (or transitioning to frozen)?
	 * @param {boolean} parent - does item have a "parent" (user-defined, not yet saved on server)
	 * @private
	 */
	toggleParentTextboxVisibilityOnCondition(exists, location, frozen, parent) {
		if(
			!exists && !location && !frozen ||
			!exists && parent ||
			location && parent ||
			location && !frozen ||
			exists && !frozen
		) {
			this.toggleParentTextboxVisibility(true);
		} else {
			this.toggleParentTextboxVisibility(false);
		}
	}

	toggleParentTextboxVisibility(enabled) {
		if(enabled) {
			this.breadsetterElement.style.visibility = "visible";
		} else {
			this.breadsetterElement.style.visibility = "hidden";
		}
	}

	/**
	 * Make breadcrumbs clickable or not clickable (enabled/disabled)
	 *
	 * @param {boolean} enable
	 * @private
	 */
	_toggleBreadcrumbsNavigation(enable) {
		let bread = this.breadcrumbsElement.querySelectorAll('a');
		for(let crumb = 0; crumb < bread.length; crumb++) {
			if(enable) {
				bread[crumb].href = bread[crumb].dataset.href;
				bread[crumb].removeAttribute('data-href');
			} else {
				bread[crumb].dataset.href = bread[crumb].href;
			}
		}
	}

	toggleParentTextboxEnabled(enable) {
		this.parentTextbox.disabled = !enable;
	}

	/**
	 * Strike out breadcrumbs if a parent has been set.
	 *
	 * @param {boolean} duplicate
	 * @private
	 */
	_toggleBreadcrumbsDuplicate(duplicate) {
		let a;
		if(duplicate) {
			a = this.breadcrumbsElement.querySelectorAll('a:not(.duplicate)');
		} else {
			a = this.breadcrumbsElement.querySelectorAll('a.duplicate');
		}
		for(let i = 0; i < a.length; i++) {
			if(duplicate) {
				a[i].classList.add('duplicate');
			} else {
				a[i].classList.remove('duplicate');
			}
		}
	}

	freeze() {
		super.freeze();
		this._toggleBreadcrumbsNavigation(true); // yes this is reversed, it's intended behaviour
		this.toggleParentTextboxEnabled(false);
		this.toggleParentTextboxVisibilityOnCondition(this.item.exists, this.item.location.length > 0, true, this.item.getParent() !== null);
	}

	unfreeze() {
		super.unfreeze();
		this._toggleBreadcrumbsNavigation(false); // yes this is reversed, it's intended behaviour
		this.toggleParentTextboxEnabled(true);
		this.toggleParentTextboxVisibilityOnCondition(this.item.exists, this.item.location.length > 0, false, this.item.getParent() !== null);
	}
}
