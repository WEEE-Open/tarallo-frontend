class LogsView extends FrameworkView {
	/**
	 * Shows log messages.
	 *
	 * @param {HTMLElement} element
	 * @param {Logs} logs
	 */
	constructor(element, logs) {
		super(element);
		this.logs = logs;
		// (locale could be a FrameworkObject, so changes would be propagated via events)
		//noinspection JSUnresolvedFunction,JSUnresolvedVariable
		this.dateFormatter = new Intl.DateTimeFormat('it-IT', {hour: 'numeric', minute: 'numeric', second: 'numeric'});
		this.addAll();
	}

	addAll() {
		let logsArray = this.logs.getAll();
		for(let i = 0; i < logsArray.length; i++) {
			this.append(logsArray[i]);
		}
	}

	/**
	 * Append a Log to the view and return it. Mark it as new if necessary.
	 *
	 * @param {Log} log - log message
	 */
	append(log) {
		let line = document.createElement("div");
		switch(log.severity) {
			case 'S':
				line.classList.add('success');
				break;
			default:
			case 'I':
				line.classList.add('info');
				break;
			case 'W':
				line.classList.add('warning');
				break;
			case 'E':
				line.classList.add('error');
				break;
		}
		let dateContainer = document.createElement("span");
		dateContainer.classList.add("date");
		//noinspection JSUnresolvedFunction
		dateContainer.textContent = this.dateFormatter.format(log.timedate);

		let messageContainer = document.createElement('span');
		messageContainer.classList.add("message");
		messageContainer.textContent = log.message;

		line.appendChild(dateContainer);
		line.appendChild(messageContainer);

		this.el.insertBefore(line, this.el.firstChild);
		// to bottom: this.el.appendChild(line);

		if(new Date() - log.timedate < 11500) {
			line.classList.add("new");
			window.setTimeout(function() {
				line.classList.remove("new");
			}, 12000);
		}
	}

	pushed() {
		let newLog = this.logs.getLast();
		this.append(newLog);
	}

	shifted() {
		if(this.el.lastElementChild) {
			this.el.removeChild(this.el.lastElementChild);
		}
	}

	cleared() {
		while(this.el.firstElementChild) {
			this.el.removeChild(this.el.firstElementChild);
		}
	}

	trigger(that, event) {
		if(that === this.logs) {
			if(event === 'push') {
				this.pushed();
			} else if(event === 'shift') {
				this.shifted();
			} else if(event === 'clear') {
				this.cleared();
			}
		}
	}
}
