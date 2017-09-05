class TransactionView extends FrameworkView {
	constructor(el, transaction) {
		super(el);
		this.transaction = transaction;

		// TODO: do something useful
		this.el.textContent = "ciao";
	}
}