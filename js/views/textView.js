class TextView extends FrameworkView {
	constructor(el, text) {
		super(el);
		let p = document.createElement("p");
		p.textContent = text;
		this.el.appendChild(p);
	}
}
