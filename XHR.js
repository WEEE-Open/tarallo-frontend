let XHR = (function() {
	const TIMEOUT = 30000;
	const pathPrefix = 'http://127.0.0.1:8081/index.php?path=';

	/**
	 * @param path URL parameter (e.g. /Login)
	 * @return XMLHttpRequest
	 * @see Controller.reqSetHandler
	 *
	 * @param {Function} onfail function(code, message)
	 * @param {Function} onsuccess function(data), data is decoded JSON
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
	 * @param path URL parameter (e.g. /Login)
	 * @return XMLHttpRequest
	 * @see Controller.reqSetHandler
	 *
	 * @param {Function} onfail function(code, message)
	 * @param {Function} onsuccess function(data), data is decoded JSON
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
	 * 44 lines of code and just as much branches.
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
	 * @param xhr XMLHttpRequest
	 * @param {Function} onfail function(code, message)
	 * @param {Function} onsuccess function(data), data is decoded JSON
	 */
	function reqSetHandler(xhr, onfail, onsuccess) {
		xhr.addEventListener("load", function() {
			if(xhr.status === 200) {
				let json;
				try {
					// TODO: argument object is not assignable to string?
					json = JSON.parse(xhr.response);
				} catch(err) {
					onfail("json-parse-error");
					return;
				}
				if(json.status === "success") {
					if(typeof json.data !== 'undefined') {
						onsuccess(json.data);
					} else {
						onfail("malformed-response");
					}
				} else if(json.status === "error") {
					if(typeof json.message === 'string') {
						onfail("response-error", json.message);
					} else {
						onfail("malformed-response");
					}
				} else if(json.status === "fail") {
					if(typeof json.data === 'undefined') {
						json.data = null;
					} else if(typeof json.data !== 'object') {
						onfail("malformed-response");
					}
					onfail("response-fail", json.data);
				}
			} else {
				onfail("http-status", xhr.status);
			}
		});
		xhr.addEventListener("error", function() {
			onfail("network-error");
		});
		xhr.addEventListener("abort", function() {
			onfail("request-abort");
		});
		xhr.addEventListener("timeout", function() {
			onfail("request-timeout");
		})
	}

	return {
		'POST': POST,
		'GET': GET,
		'reqSetHandler': reqSetHandler
	}
})();