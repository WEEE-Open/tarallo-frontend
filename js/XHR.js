let XHR = (function() {
	const TIMEOUT = 30000;
	const pathPrefix = 'http://tarallo.local:8081/index.php?path=';

	/**
	 * @param {string} path - URL parameter (e.g. /Login)
	 * @return {XMLHttpRequest}
	 * @see XHR.reqSetHandler
	 *
	 * @param {Function} onfail - function(code, message)
	 * @param {Function} onsuccess - function(data), data is decoded JSON
	 */
	function POST(path, onfail, onsuccess) {
		let req = new XMLHttpRequest();
		req.open("POST", pathPrefix + path, true);
		req.setRequestHeader('Accept', 'application/json');
		req.setRequestHeader('Content-Type', 'application/json');
		req.withCredentials = true;
		req.timeout = TIMEOUT;
		this.reqSetHandler(req, onfail, onsuccess);
		return req;
	}

	/**
	 * @param {string} path URL parameter (e.g. /Login)
	 * @return {XMLHttpRequest}
	 * @see XHR.reqSetHandler
	 *
	 * @param {Function} onfail - function(code, message)
	 * @param {Function} onsuccess - function(data), data is decoded JSON
	 */
	function GET(path, onfail, onsuccess) {
		let req = new XMLHttpRequest();
		req.open("GET", pathPrefix + path, true);
		req.setRequestHeader('Accept', 'application/json');
		req.withCredentials = true;
		req.timeout = TIMEOUT;
		this.reqSetHandler(req, onfail, onsuccess);
		return req;
	}

	/**
	 * Set some event handlers and wire them to two functions: onfail, onsuccess.
	 * 47 lines of code and just as much branches.
	 *
	 * Error codes:
	 * "network-error"
	 * "request-abort"
	 * "request-timeout"
	 * "json-parse-error" for error parsing JSON response ("message" contains the error message)
	 * "malformed-response" for malformed JSend response (missing keys)
	 * "response-error" JSend "error" ("message" contains the error message)
	 * "response-fail" JSend "fail" ("message" contains an hash of error messages or null)
	 * "http-status": got another code (contained in "message") instead of 200
	 *
	 * @param {XMLHttpRequest|EventTarget} xhr - XMLHttpRequest, which implements EventTarget. Had to be specified to stop PHPStorm from complaining.
	 * @param {Function} onfail function(code, message, data) - code is always a string, message is either string or null, data can be whatever (usually null)
	 * @param {Function} onsuccess function(data), data is decoded JSON
	 */
	function reqSetHandler(xhr, onfail, onsuccess) {
		xhr.addEventListener("load", function() {
			if(xhr.status === 200) {
				let json;
				try {
					json = JSON.parse(xhr.responseText);
				} catch(err) {
					onfail("json-parse-error", null, null);
					return;
				}
				if(json.status === "success") {
					if(typeof json.data === 'undefined') {
						onfail("malformed-response", null, null);
					} else {
						onsuccess(json.data);
					}
				} else if(json.status === "error") {
					if(typeof json.message === 'string') {
						onfail("response-error", json.message, null);
					} else {
						onfail("malformed-response", null, null);
					}
				} else if(json.status === "fail") {
					let message;
					if(typeof json.data === 'undefined') {
						json.data = null;
						message = null;
					} else if(typeof json.data !== 'object') {
						onfail("malformed-response", null, null);
					} else if(typeof json.data.message === 'string') {
						message = json.data.message;
					}
					onfail("response-fail", message, json.data);
				} else {
					onfail("malformed-response", "No JSend status", null);
				}
			} else {
				onfail("http-status", xhr.status, null);
			}
		});
		xhr.addEventListener("error", function() {
			onfail("network-error", null, null);
		});
		xhr.addEventListener("abort", function() {
			onfail("request-abort", null, null);
		});
		xhr.addEventListener("timeout", function() {
			onfail("request-timeout", null, null);
		})
	}

	return {
		'POST': POST,
		'GET': GET,
		'reqSetHandler': reqSetHandler
	}
})();