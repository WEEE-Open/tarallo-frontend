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
				options.error(code);
				model.trigger("complete");
			}, function(data) {
				model.set('id', model.get('username'));
				model.trigger('sync'); // TODO: does success already fire sync?
				options.success(data);
				model.trigger("complete");

				// TODO: remove this
				// WHY.
				//noinspection JSUnresolvedVariable,JSUnresolvedFunction
				console.log('ora id: ' + model.get('id'));
			});
			req.send(JSON.stringify({username: model.get('username'), password: model.get('password')}));
		}
	},

	login: function(options) {
		this.save(null, options);
	},

	logout: function() {
		this.save({'username': null, 'password': null}, {"validate": false});
	}
});