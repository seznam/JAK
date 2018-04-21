JAK.Chart.Backend = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chart.Backend",
	VERSION: "0.1",
	IMPLEMENT: [JAK.ISignals]
})
JAK.Chart.Backend.prototype.availableStyles = [
	"strokeColor",
	"strokeOpacity",
	"fillColor",
	"fillOpacity",
	"lineWidth",
	"lineJoin",
	"lineCap",
	"fontFamily",
	"fontSize",
	"textAlign",
	"textBaseline",
	// css styly
	"style",
	"display"
]

JAK.Chart.Backend.prototype.$constructor = function(width, height, styles) {
	this._width = width;
	this._height = height;
	this._defaultStyles = styles || {};

	this._ev = [];
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'click', this, '_click'));
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'mousemove', this, '_mousemove'));
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'mouseout', this, '_mouseout'));
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'mouseover', this, '_mouseover'));
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'mousedown', this, '_mousedown'));
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'mouseup', this, '_mouseup'));
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'dblclick', this, '_doubleclick'));

	this._ev.push(JAK.Events.addListener(this.getContainer(), 'touchstart', this, '_touchstart'));
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'touchend', this, '_touchend'));
	this._ev.push(JAK.Events.addListener(this.getContainer(), 'gesturechange', this, '_gesturechange'));

	this.resize(width, height);
}

JAK.Chart.Backend.prototype._click = function(event) {};
JAK.Chart.Backend.prototype._mousemove = function(event) {};
JAK.Chart.Backend.prototype._mouseout = function(event) {};
JAK.Chart.Backend.prototype._mouseover = function(event) {};
JAK.Chart.Backend.prototype._mouseup = function(event) {};
JAK.Chart.Backend.prototype._mousedown = function(event) {};
JAK.Chart.Backend.prototype._doubleclick = function(event) {};
JAK.Chart.Backend.prototype._touchstart = function(event) {};
JAK.Chart.Backend.prototype._touchend = function(event) {};
JAK.Chart.Backend.prototype._gesturechange = function(event) {};
JAK.Chart.Backend.prototype.clear = function() {}
JAK.Chart.Backend.prototype.resize = function(width, height) {}
JAK.Chart.Backend.prototype.setScale = function(scale) {}
JAK.Chart.Backend.prototype.getContainer = function() {}
JAK.Chart.Backend.prototype.getContent = function() {}
JAK.Chart.Backend.prototype.drawPolyline = function(coords, style) {}
JAK.Chart.Backend.prototype.drawCircle = function(coords, style) {}
JAK.Chart.Backend.prototype.drawPolygon = function(coords, style) {}
JAK.Chart.Backend.prototype.drawPath = function(coords, style) {}
JAK.Chart.Backend.prototype.drawText = function(coords, text, style) {}

JAK.Chart.Backend.prototype._mergeDefaultStyles = function(styles) {
	var result = {};
	var styles = styles || {};

	for(var i = 0; i < this.availableStyles.length; i++) {
		var key = this.availableStyles[i];
		result[key] = styles[key] || this._defaultStyles[key];
	}
	return result;
};

JAK.Chart.Backend.prototype._applyStyles = function(styles) {
	styles = this._mergeDefaultStyles(styles);

	styles.strokeColor = styles.strokeColor || "#ffffff";
	styles.strokeOpacity = styles.strokeOpacity || 1;
	styles.fillColor = styles.fillColor || "none";
	styles.fillOpacity = styles.fillOpacity || 1;
	styles.lineWidth = styles.lineWidth || 1;
	// todo
	styles.lineJoin = styles.lineJoin || "round"; //"mitter", "bevel"
	styles.lineCap = styles.lineCap || "round"; // "butt", "square"
	// Text
	styles.fontFamily = styles.fontFamily || "Arial";
	styles.fontSize = styles.fontSize || "11px";
	styles.textAlign = styles.textAlign || "start";
	styles.textBaseline = styles.textBaseline || "alphabetic";

	styles.style = styles.style || {};

	return styles;
}
