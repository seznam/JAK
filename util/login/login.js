/**
 * @class Login - komunikace s RUSem na pozadi, pomoci iframe a window.postMessage() nebo CORS.
 * @group jak-utils
 */
JAK.Login = JAK.ClassMaker.makeClass({
	NAME: "JAK.Login",
	VERSION: "1.0"
});

JAK.Login.URL = "https://login.szn.cz";

JAK.Login.isSupported = function() {
	return (JAK.Login.Request.isSupported() || JAK.Login.Iframe.isSupported());
}

JAK.Login.getTransport = function(conf) {
	return (JAK.Login.Request.isSupported() ? new JAK.Login.Request(conf) : new JAK.Login.Iframe(conf));
}

JAK.Login.prototype.$constructor = function(conf) {
	this._methods = {
		status: "/beta/status",
		login: "/beta/login",
		autologin: "/beta/autologin",
		acceptweak: "/beta/acceptweak",
		change: "/changeScreen",
		openId: "/loginOIProcess",
		licence: "/beta/confirmLicence"
	}

	this._conf = {
		serviceId: "email",
		returnURL: location.href
	}
	for (var p in conf) { this._conf[p] = conf[p]; }

	this._transport = JAK.Login.getTransport();
	this._loginCookie = true;
}

/**
 * Ověření stavu uživatele. Z pohledu služby není přihlášený, co na to login?
 */
JAK.Login.prototype.check = function() {
	var promise = new JAK.Promise();
	var url = JAK.Login.URL + this._methods.status;
	var data = this._commonData();

	this._transport.get(url, data).then(function(data) {
		this._loginCookie = data.cookie;
		promise.fulfill(data.logged);
	}.bind(this), function(reason) {
		promise.reject(reason); 
	});
	return promise;
}

/**
 * Povýšení přihlášení na tuto službu
 */
JAK.Login.prototype.autologin = function() {
	var url = JAK.Login.URL + this._methods.autologin;
	var data = this._commonData();

	return this._transport.get(url, data)
}

/**
 * Ano, chceme pokračovat se slabým heslem
 */
JAK.Login.prototype.acceptweak = function() {
	var url = JAK.Login.URL + this._methods.acceptweak;
	var data = this._commonData();

	return this._transport.get(url, data);
}

/**
 * Chceme nastavit souhlas s novými licenčními podmínkami
 */
JAK.Login.prototype.confirmLicence = function(cdata, agree) {
	var url = JAK.Login.URL + this._methods.licence;
	var data = this._commonData();
	data.cdata = cdata;
	if (agree) { data.setlicence = 1; }

	return this._transport.post(url, data);
}

/**
 * Vyrobit URL na změnu hesla
 */
JAK.Login.prototype.change = function(crypted) {
	var data = this._commonData();
	data.cPassPower = crypted;

	var arr = [];
	for (var p in data) { arr.push(p + "=" + encodeURIComponent(data[p])); }

	return JAK.Login.URL + this._methods.change + "?" + arr.join("&");
}

/**
 * Vyrobit URL na přihlášení s OpenID
 */
JAK.Login.prototype.openId = function(openId) {
	var data = this._commonData();
	data.openid = openId;

	var arr = [];
	for (var p in data) { arr.push(p + "=" + encodeURIComponent(data[p])); }

	return JAK.Login.URL + this._methods.openId + "?" + arr.join("&");
}

/**
 * Přihlášení
 * @param {string} name včetně zavináče a domény
 * @param {string} pass
 * @param {bool} rembember
 */
JAK.Login.prototype.login = function(name, pass, remember) {	
	var url = JAK.Login.URL + this._methods.login;

	var data = this._commonData();
	data.user = name;
	data.password = pass;
	data.remember = (remember ? 1 : 0);
	data.ajax = (this._loginCookie ? 1 : 0);

	if (!this._loginCookie) { /* presmerovat celou stranku */
		var form = JAK.mel("form", {action:url, method:"post"});
		for (var p in data) {
			var input = JAK.mel("input", {type:"hidden", name:p, value:data[p]});
			form.appendChild(input);
		}
		document.body.appendChild(form);
		form.submit();
		return new JAK.Promise();
	}

	return this._transport.post(url, data);
}

JAK.Login.prototype._commonData = function() {
	return {
		serviceId: this._conf.serviceId,
		returnURL: this._conf.returnURL
	}
}
