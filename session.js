var Session = Backbone.Model.extend({
	defaults: {
		'username': null,
		'password': null
	},

	validate: function(attrs, options) {
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
		// TODO: implement
		console.log('SYNC! ' + method + ' id: ' + model.get('id'));
		//console.log(model);
		//console.log(options);
		if(method === 'delete') {
			delete model.unset('id');
		} else {
			model.set('id', model.get('username'));
		}

		// WHY.
		//noinspection JSUnresolvedVariable,JSUnresolvedFunction
		if(_.isFunction(options.success)) {
			options.success();
		}
		console.log('ora id: ' + model.get('id'));
	},

	login: function() {
		this.save();
	},

	logout: function() {
		this.save({'username': null, 'password': null}, {"validate": false});
	}
});