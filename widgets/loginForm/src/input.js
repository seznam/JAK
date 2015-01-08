/**
 * @class Chytry input s ok/error stavem
 */
JAK.LoginForm.Input = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm.Input",
	VERSION: "1.0",
	DEPEND: [
		{ sClass: JAK.Placeholder, ver: "2.0" }
	]
});

JAK.LoginForm.Input.prototype.$constructor = function(params, events) {
	this._dom = {
		container: JAK.mel("span", {className:"input"}),
		input: JAK.mel("input", params),
		icon: JAK.mel("div", {className:"icon"})
	}

	this._events = {
		change: null,
		reset: null,
		blur: null
	}
	for (var p in events) { this._events[p] = events[p]; }

	this._dom.container.appendChild(this._dom.input);
	this._dom.container.appendChild(this._dom.icon);
	this._placeholder = null;
	this._state = "";

	JAK.Events.addListener(this._dom.input, "input propertychange blur", this);
	JAK.Events.addListener(this._dom.icon, "click", this);
}

JAK.LoginForm.Input.prototype.setPlaceholder = function(placeholder) {
	if (this._dom.input.type == "text") {
		this._placeholder = new JAK.Placeholder(this._dom.input, placeholder);
	} else if ("placeholder" in this._dom.input) {
		this._dom.input.placeholder = placeholder;
	}
}

JAK.LoginForm.Input.prototype.getContainer = function() {
	return this._dom.container;
}

JAK.LoginForm.Input.prototype.getValue = function() {
	return (this._placeholder ? this._placeholder.getValue() : this._dom.input.value);
}

JAK.LoginForm.Input.prototype.setValue = function(value) {
	this._placeholder ? this._placeholder.setValue(value) : this._dom.input.value = value;
}

JAK.LoginForm.Input.prototype.focus = function() {
	this._dom.input.focus();
}

JAK.LoginForm.Input.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "propertychange":
			if (e.propertyName != "value") { break; }
		case "input":
			this._dispatch("change");
		break;

		case "click":
			if (this._dom.container.classList.contains("error")) {
				this.setValue("");
				this._dispatch("reset");
			}
		break;

		case "blur":
			this._dispatch("blur");
		break;
	}
}

JAK.LoginForm.Input.prototype._dispatch = function(type) {
	var listener = this._events[type];
	if (!listener) { return; }

	var event = {
		type: type,
		target: this
	};

	if (typeof(listener) == "function") {
		listener(event);
	} else {
		listener.handleEvent(event);
	}
}

JAK.LoginForm.Input.prototype.setState = function(state) {
	if (this._state) { this._dom.container.classList.remove(this._state); }
	this._state = state;
	if (state) { this._dom.container.classList.add(state); }
}

JAK.LoginForm.Input.prototype.getState = function() {
	return this._state;
}
