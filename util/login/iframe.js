JAK.Login.Iframe = JAK.ClassMaker.makeClass({
	NAME: "JAK.Login.Iframe",
	VERSION: "1.0"
});

JAK.Login.Iframe.isSupported = function() {
	return !!window.postMessage;
}

JAK.Login.Iframe.prototype.$constructor = function() {
	this._origins = [
		JAK.Login.URL,
		"http://login." + window.location.hostname // http://login.sluzba.cz
	];


	this._id = "iframe" + JAK.idGenerator();
	this._promise = null;
	this._frame = this._buildIframe();

	JAK.Events.addListener(window, "message", this, "_message");
}

JAK.Login.Iframe.prototype.get = function(url, data) {
	this._promise = new JAK.Promise();

	var arr = [];
	for (var name in data) {
		arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
	}
	this._frame.src = url + "?" + arr.join("&");

	return this._promise;
}

JAK.Login.Iframe.prototype.post = function(url, data) {
	this._promise = new JAK.Promise();

	var form = JAK.mel("form", {method:"post", target:this._id, action:url});

	for (var name in data) {
		var value = data[name];
		var input = JAK.mel("input", {type:"hidden", name:name, value:value});
		form.appendChild(input);
	}

	document.body.appendChild(form);
	form.submit();
	form.parentNode.removeChild(form);

	return this._promise;
}

JAK.Login.Iframe.prototype._buildIframe = function() {
	if (JAK.Browser.client == "ie" && parseInt(JAK.Browser.version) < 9) {
		var frame = JAK.mel("<iframe name='" + this._id + "'>");
	} else {
		var frame = JAK.mel("iframe");
		frame.setAttribute("name", this._id);
	}
	frame.style.display = "none";

	document.body.insertBefore(frame, document.body.firstChild);
	return frame;
}

JAK.Login.Iframe.prototype._message = function(e) {
	if (!this._isAllowedUrl(e.origin)) { return; }

	this._promise.fulfill(e.data);
	this._promise = null;
}

/**
 * kontrola, zda je url v seznamu povolenych rl
 */
JAK.Login.Iframe.prototype._isAllowedUrl = function(url) {
	url = url.split("//")[1];
	if (!url) { return false; }
	
	for (var i = 0, max = this._origins.length; i < max; i++) {
		var origin = this._origins[i].split('//')[1];
		if (origin && origin == url) {
			return true;
			break;
		}
	}
	return false;
}
