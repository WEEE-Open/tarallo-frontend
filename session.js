var Session = Backbone.Model.extend({
	validate: function(attrs, options) {
		if(!this.has('username')) {
			return "Missing username";
		}
		if(!this.has('password')) {
			return "Missing password";
		}
		if(this.get('username') === '') {
			return 'Empty username';
		}
		if(this.get('password') === '') {
			return 'Empty password';
		}
	},

	login: function(username, password) {
		this.save();
	},

	logout: function() {
		this.destroy();
	},

	sync: function(method, model, options) {
		// TODO: implement
		alert('SYNC! ' + method);
		console.log(model);
		console.log(options);
	}
});