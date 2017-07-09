const Controller = (function () {
	"use strict";

	let routerInstance;

	//noinspection ES6ModulesDependencies
	let router = Backbone.Router.extend({
		routes: {
			"": "home",
			"login": "login",
			"logout": "logout",
			"add": "add",
			"search": "search",
			//"search/:page": "search",
		},

		home: function() {
			root.changeState('home');
		},

		login: function() {
			root.changeState('login');
		},

		logout: function() {
			root.changeState('logout');
		},

		search: function(page) {
			alert("ricerca" + ", " + page);
		},

		add: function() {
			root.changeState('addnew');
		}
	});

	routerInstance = new router();
	let root = new rootView(routerInstance);
	Backbone.history.start();
})();

class urlState {
	/**
	 * Keep current URL state, keeps URL current, keeps current state URL.
	 *
	 * @param {int=0} start - starting position, 0 by default
	 * @param {string[]} [path]
	 * @param {Backbone.Router} router
	 */
	contructor(start, path, router) {
		this._router = router;
		if(Number.isInteger(start) && start > 0) {
			this.start = start;
		} else {
			this.start = 0;
		}
		if(Array.isArray(path)) {
			this.path = path;
		} else {
			this.path = [];
		}
	}

	/**
	 * Get specified item from URL pieces, null if it doesn't exist
	 *
	 * @param {int} pos
	 * @return {string|null}
	 */
	get(pos) {
		let index = this.start + pos;
		if(this.path.length <= index) {
			return null;
		} else {
			return this.path[index];
		}
	}

	/**
	 * Get current URL pieces
	 *
	 * @return {string[]}
	 */
	getAll() {
		return this.path.slice(this.start);
	}

	/**
	 * Replace URL pieces with specified array
	 *
	 * @param {string[]} toWhat array of URL components
	 */
	setAll(toWhat) {
		if(!Array.isArray(toWhat)) {
			throw new TypeError('urlState.setAll expected an array, ' + typeof toWhat + ' given');
		}
		this.path.splice(this.start);
		for(let i = 0; i < toWhat.length; i++) {
			if(typeof toWhat[i]) {
				throw new TypeError('Cannot insert ' + typeof toWhat[i] + ' into URL, only strings are allowed');
			}
			this.path.push(toWhat[i]);
		}
		this._setUrl();
	}

	/**
	 * Return another urlState object, starting from a specific URL piece
	 *
	 * @param {int} start - how many URL pieces to skip
	 * @return {urlState}
	 * @todo see if this magically works
	 */
	emit(start) {
		return new this(start, this.path, this._router);
	}

	/**
	 * Set current URL in browser
	 *
	 * @private
	 */
	_setUrl() {
		//noinspection JSUnresolvedFunction
		this._router.trigger('#' + this._buildUrl(), {"trigger": false});
	}

	/**
	 * Build the URL piece thingamjig from array.
	 *
	 * @return {string}
	 * @private
	 */
	_buildUrl() {
		if(this.path.length === 0) {
			return '/';
		}
		let result = '';
		for(let i = 0; i < this.path.length; i++) {
			result = result + '/' + this.path[i];
		}
		return result;
	}

}