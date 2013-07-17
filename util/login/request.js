JAK.Login.Request = JAK.ClassMaker.makeClass({
	NAME: "JAK.Login.Request",
	VERSION: "1.0"
});

JAK.Login.Request.isSupported = function() {
	return (window.XMLHttpRequest && "withCredentials" in new XMLHttpRequest() && JAK.Browser.client == "gecko"); /* :-( */
}

JAK.Login.Request.prototype.get = function(url, data) {
	return this._send(url, data, "get");
}

JAK.Login.Request.prototype.post = function(url, data) {
	return this._send(url, data, "post");
}

JAK.Login.Request.prototype._send = function(url, data, method) {
	var promise = new JAK.Promise();

	var request = new JAK.Request(JAK.Request.TEXT, {method:method, withCredentials:true});
	request.setHeaders({"Accept": "application/json"});
	request.setCallback(function(data, status) {
		if (status == 200) {
			try {
				data = JSON.parse(data);
				promise.fulfill(data);
			} catch (e) {
				promise.reject(e.message);
			}
		} else {
			promise.reject(data);
		}
	});
	request.send(url, data);

	return promise;
}
