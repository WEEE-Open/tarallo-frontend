var Session = Backbone.Model.extend({
	defaults: {
		'username': null,
		'password': null
	},

	validate: function(/*attrs, options*/) {
		if(this.get('username') !== null || this.get('password') !== null) {
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
		}
	},

	sync: function(method, model, options) {
		if(method === 'delete' || (model.get('username') === null && model.get('password') === null)) {
			model.unset('id');
		} else {
			var req = Controller.POST('/Login');
			Controller.reqSetHandler(req, function(code) {
				// model, response, options
				options.error(code);
				model.trigger("complete"); // TODO: needed? Backbone doesn't trigger this in default sync() implementation, but neither does it in fetch() et al...
			}, function(data) {
				model.set('id', model.get('username'));
				// model, response, options
				options.success(data);
				model.trigger("complete"); // TODO: ditto
			});
			req.send(JSON.stringify({username: model.get('username'), password: model.get('password')}));
			model.trigger('request', model, req, options); // TODO: does this even work after send? Backbone.js does it here. Or so it seems.
		}
	},

	login: function(options) {
		this.save(null, options);
	},

	logout: function() {
		this.save({'username': null, 'password': null}, {"validate": false});
	}
});