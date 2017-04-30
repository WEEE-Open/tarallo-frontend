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
		console.log('SYNC! ' + method + ' id: ' + model.get('id'));
		//console.log(model);
		//console.log(options);
		if(method === 'delete' || (model.get('username') === null && model.get('password') === null)) {
			model.unset('id');
		} else {
			var req = Controller.POST('/Login');
			req.onreadystatechange = function() {
				if(req.readyState === XMLHttpRequest.DONE) {
					console.log(req.status);
					console.log(req);
					if(_.isFunction(options.success)) {
						options.success();
					}
					model.trigger('sync');
					model.set('id', model.get('username'));
					// model.trigger('error');
				}
			};
			req.send(JSON.stringify({username: model.get('username'), password: model.get('password')}));
			if(_.isFunction(options.success)) {
				options.success();
			}
			model.trigger('sync');
			model.set('id', model.get('username'));
			// model.trigger('error');
		}

		// WHY.
		//noinspection JSUnresolvedVariable,JSUnresolvedFunction
		console.log('ora id: ' + model.get('id'));
	},

	login: function() {
		this.save();
	},

	logout: function() {
		this.save({'username': null, 'password': null}, {"validate": false});
	}
});