class Session extends FrameworkObject {
	constructor(trigger) {
		super(trigger);

		/**
		 * Current username, or null if logged out
		 *
		 * @type {string|null}
		 */
		this.username = null;
		/**
		 * Current password, or null if unknown or logged out
		 *
		 * @type {string|null}
		 */
		this.password = null;
		/** @type {string|null} */
		this.lastError = null;
		/** @type {*|null} */
		this.lastErrorDetails = null;
	}

	validate() {
		if(typeof this.username !== 'string' || this.username.length === 0) {
			return "missing-username";
		}
		if(typeof this.password !== 'string' || this.password.length === 0) {
			return "missing-password";
		}
	}

	send(username, password) {
		let req = Controller.POST('/Login');
		Controller.reqSetHandler(req,
			function(code, message) {
				this.lastError = code;
				this.lastErrorDetails = message;
				this.trigger('error');
			}.bind(this),
			function() {
				this.username = username;
				this.password = password;
				this.lastError = null;
				this.lastErrorDetails = null;
				this.trigger('success');
			}.bind(this));
		req.send(JSON.stringify({username: username, password: password}));
		this.trigger('sent');
	}

	login(username, password) {
		let message = this.validate(username, password);
		if(typeof message === 'undefined') {
			this.send(username, password);
		} else {
			this.trigger('validation-failed', message);
		}
	}

	logout() {
		this.send(null, null);
	}
}