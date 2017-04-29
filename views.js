var TemplateView = Backbone.NativeView.extend({
	'tagName': 'div',

	'_container': document.getElementById('views'),

	'initialize': function() {
		this.el.appendChild(document.getElementById(this.templateId()).content.cloneNode(true));
	},

	'append': function(element) {
		element = this.el;
		//var oldContent;
		//while(oldContent = this._container.firstChild) {
		//	this._container.removeChild(oldContent);
		//}
		this._container.appendChild(element);
	},

	'id': function() {
		return this.viewName + '-view'
	},

	'templateId': function() {
		return this.viewName + '-template'
	}
});

var LoginView = TemplateView.extend({
	'viewName': 'login',

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