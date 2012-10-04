/**
 * @class Dvoustavovy prepinac a la apple
 * @group jak-widgets
 * @signal switch-change
 */
JAK.TwoStateSwitch = JAK.ClassMaker.makeClass({
	NAME: "JAK.TwoStateSwitch",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals
});

/**
 * @param {bool} state Vychozi stav
 * @param {object} [options] Konfigurace
 * @param {string} [options.label="..."] Popisek tlacitka
 * @param {int} [options.delay=100] Cas animace v msec
 * @param {string[]} [options.labels=[]] Pole popisku
 */
JAK.TwoStateSwitch.prototype.$constructor = function(state, options) {
	this._ec = [];
	this._state = null;
	this._options = {
		label: "&bull; &bull; &bull;",
		delay: 100,
		labels: []
	};
	for (var p in options) { this._options[p] = options[p]; }
	
	this._dom = {
		container: JAK.mel("div", {className:"two-state-switch"}),
		button: JAK.mel("button", {innerHTML:this._options.label})
	};
	this._build();
	this.setState(state);
}

JAK.TwoStateSwitch.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
}

JAK.TwoStateSwitch.prototype.getState = function() {
	return this._state;
}

JAK.TwoStateSwitch.prototype.setState = function(state) {
	if (state === this._state) { return; }
	this._state = state;
	
	if (this._state) {
		JAK.DOM.removeClass(this._dom.container, "state-0");
		JAK.DOM.addClass(this._dom.container, "state-1");
	} else {
		JAK.DOM.removeClass(this._dom.container, "state-1");
		JAK.DOM.addClass(this._dom.container, "state-0");
	}
	
	this.makeEvent("switch-change");
}

JAK.TwoStateSwitch.prototype.getContainer = function() {
	return this._dom.container;
}

JAK.TwoStateSwitch.prototype.getButton = function() {
	return this._dom.button;
}

JAK.TwoStateSwitch.prototype._build = function() {
	for (var i=0;i<this._options.labels.length;i++) {
		var label = this._options.labels[i];
		var span = JAK.mel("span", {innerHTML:label, className:"label-"+i});
		this._dom.container.appendChild(span);
	}
	JAK.DOM.append([this._dom.container, this._dom.button]);
	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));
	
	var props = ["transition", "MozTransition", "WebkitTransition", "OTransition"];
	
	for (var i=0;i<props.length;i++) {
		this._dom.button.style[props[i]] = "all " + this._options.delay + "ms ease";
	}

}

JAK.TwoStateSwitch.prototype._click = function(e, elm) {
	this._dom.button.blur();
	this.setState(!this._state);
}
