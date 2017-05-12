class View {
	constructor(element) {
		this.el = element;
	}

	static fromTemplate(name) {
		this.el = document.getElementById("template-" + name).content.cloneNode(true);
	}
}