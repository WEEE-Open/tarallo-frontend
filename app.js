// TODO: this is horrible. Do something else.
const path = 'http://127.0.0.1:8081/index.php?path=';
(function() {
	new Controller.router();
	Backbone.history.start();
})();
