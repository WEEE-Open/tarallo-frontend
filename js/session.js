class Session extends Framework.Object {
	constructor() {
		super();

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
		let req = XHR.POST(['session'],
			(code, message/*, data*/) => {
				this.lastError = code;
				this.lastErrorDetails = message;
				if(username === null) {
					this.trigger('logout-error');
				} else {
					this.trigger('login-error');
				}
			},
			(/*data*/) => {
				this.username = username;
				this.password = password;
				this.lastError = null;
				this.lastErrorDetails = null;
				if(username === null) {
					this.trigger('logout-success');
				} else {
					this.trigger('login-success');
				}
			});
		if(username === null) {
			this.trigger('logout-try');
		} else {
			this.trigger('login-try');
		}
		req.send(JSON.stringify({username: username, password: password}));
	}

	login(username, password) {
		let message = Session.validate(username, password);
		if(typeof message === 'undefined') {
			this.send(username, password);
		} else {
			this.lastError = 'validation-error';
			this.lastErrorDetails = message;
			this.trigger('validation-error');
		}
	}

	logout() {
		this.send(null, null);
	}

	restore() {
		let req = XHR.GET(['session'],
			(code, message/*, data*/) => {
				this.lastError = code;
				this.lastErrorDetails = message;
				this.trigger('restore-error');
			},
			(data) => {
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
			});
		req.send();
	}
}
