JAK.Login.Iframe = JAK.ClassMaker.makeClass({
	NAME: "JAK.Login.Iframe",
	VERSION: "1.0"
});

JAK.Login.Iframe.isSupported = function() {
	return !!window.postMessage;
}

JAK.Login.Iframe.prototype.$constructor = function() {
	var loginDomain = JAK.Login.URL.match(/\/\/([^.]+)/)[1];
	this._origins = [
		JAK.Login.URL,
		JAK.Register.URL,
		"http://" + loginDomain + "." + window.location.hostname.split(".").slice(-2).join(".")
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
	document.body.insertBefore(this._frame, document.body.firstChild);
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

	document.body.insertBefore(this._frame, document.body.firstChild);
	document.body.insertBefore(form, document.body.firstChild);
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

	return frame;
}

JAK.Login.Iframe.prototype._message = function(e) {
	if (!this._promise) { return; } /* to se muze stat, pokud je vic techto transportu (zprava patri jinemu) */
	if (!this._isAllowedUrl(e.origin)) { return; }

	var promise = this._promise;
	this._promise = null;
	promise.fulfill(JSON.parse(e.data));
}

/**
 * kontrola, zda je url v seznamu povolenych rl
 */
JAK.Login.Iframe.prototype._isAllowedUrl = function(url) {
	var re = /\/\/([^\/]+)/;
	url = url.match(re)[1];
	if (!url) { return false; }
	
	for (var i = 0, max = this._origins.length; i < max; i++) {
		var origin = this._origins[i].match(re)[1];
		if (origin == url) {
			return true;
			break;
		}
	}
	return false;
}
