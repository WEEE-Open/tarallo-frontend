var TemplateView = Backbone.NativeView.extend({
	'tagName': 'div',

	'id': document.getElementById('template-target'),

	'_container': document.getElementById('page'),

	/**
	 * Copy content of template into the new (or old) node
	 *
	 * @param templateElement Element a "template" element
	 * @return Element new node
	 */
	'renderFrom': function(templateElement) {
		this.el.appendChild(templateElement.content.cloneNode(true));
		return this.el;
	},

	'append': function() {
		//var oldContent;
		//while(oldContent = this._container.firstChild) {
		//	this._container.removeChild(oldContent);
		//}
		this._container.appendChild(this.el);
	}
});

var LoginView = TemplateView.extend({
	'render': function() {
		this.append();
		document.getElementById('login-login').addEventListener('click', function(event) {
			console.log('Event handling, yay!');
			var session = new Session({username: document.getElementById('login-username').value, password: document.getElementById('login-password').value});
			session.on('invalid', function(model, error) {
				alert(error)
			});
			session.login();
		})
	}
});