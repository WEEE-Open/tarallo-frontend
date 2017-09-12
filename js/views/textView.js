class TextView extends Framework.View {
	constructor(el, text) {
		super(el);
		let p = document.createElement("p");
		p.textContent = text;
		this.el.appendChild(p);
	}
}
