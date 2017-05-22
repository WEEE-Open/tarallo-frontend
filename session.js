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

	static validate(username, password) {
		if(typeof username !== 'string' || username.length === 0) {
			return "missing-username";
		}
		if(typeof password !== 'string' || password.length === 0) {
			return "missing-password";
		}
	}

	send(username, password) {
		let req = XHR.POST('/Login',
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
	}

	login(username, password) {
		//this.trigger('login');
		let message = Session.validate(username, password);
		if(typeof message === 'undefined') {
			this.send(username, password);
		} else {
			this.lastError = 'validation-error';
			this.lastErrorDetails = message;
			this.trigger('validation-failed');
		}
	}

	logout() {
		this.trigger('logout');
		this.send(null, null);
	}

	restore() {
		let req = XHR.GET('/Session',
			function(code, message) {
				this.lastError = code;
				this.lastErrorDetails = message;
				this.trigger('restore-error');
			}.bind(this),
			function(data) {
				if(data.username === null) {
					this.trigger('restore-invalid');
				} else if(typeof data.username === 'string') {
					this.username = data.username;
					this.trigger('restore-valid');
				} else {
					this.lastError = "malformed-response";
					this.lastErrorDetails = "Missing 'username' in response";
					this.trigger('restore-error');
				}
			}.bind(this));
		req.send();
	}
}