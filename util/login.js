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
/**
 * @class Registrace - komunikace s registračním backendem
 * @group jak-utils
 */
JAK.Register = JAK.ClassMaker.makeClass({
	NAME: "JAK.Login",
	VERSION: "1.0"
});

JAK.Register.URL = "https://registrace.seznam.cz";

JAK.Register.isSupported = function() {
	return (JAK.Login.Request.isSupported() || JAK.Login.Iframe.isSupported());
}

JAK.Register.getTransport = function(conf) {
	return (JAK.Login.Request.isSupported() ? new JAK.Login.Request(conf) : new JAK.Login.Iframe(conf));
}

JAK.Register.prototype.$constructor = function(conf) {
	this._methods = {
		passwordcheck: "/beta/passwordcheck",
		usercheck: "/beta/usercheck",
		userdomainscheck: "/beta/userdomainscheck",
		registration: "/beta/registration",
		verifypin: "/beta/verifypin"
	}

	this._conf = {
		serviceId: "email",
		returnURL: location.href,
		local: false
	}
	for (var p in conf) { this._conf[p] = conf[p]; }

	this._transport = JAK.Register.getTransport();
}

/**
 * Ověření hesla
 * @param {string} password
 * @param {string} [user] ve tvaru username@domain
 */
JAK.Register.prototype.checkPassword = function(password, user) {
	var url = JAK.Register.URL + this._methods.passwordcheck;

	var data = this._commonData();
	data.password = password;
	if (user) { data.user = user; }

	return this._transport.post(url, data);
}

/**
 * Ověření uživ. jména
 */
JAK.Register.prototype.checkUser = function(user) {
	var url = JAK.Register.URL + this._methods.usercheck;

	var data = this._commonData();
	data.user = user;

	return this._transport.get(url, data);
}

/**
 * Ověření uživ. jména a dostupných domén
 */
JAK.Register.prototype.checkUserDomains = function(user) {
	var url = JAK.Register.URL + this._methods.userdomainscheck;

	var data = this._commonData();
	data.user = user;

	return this._transport.get(url, data);
}

/**
 * Registrace
 * @param {string} user včetně zavináče a domény
 * @param {string} password
 * @param {string} password2
 */
JAK.Register.prototype.register = function(user, password, password2) {	
	var url = JAK.Register.URL + this._methods.registration;

	var data = this._commonData();
	data.user = user;
	data.password = password;
	data.password2 = password2;

	return this._transport.post(url, data);
}

/**
 * Dokončení registrace
 * @param {string} cud
 * @param {string} pin
 */
JAK.Register.prototype.verify = function(cud, pin) {
	var url = JAK.Register.URL + this._methods.verifypin;

	var data = this._commonData();
	data.cud = cud;
	data.pin = pin;

	return this._transport.post(url, data);
}

JAK.Register.prototype._commonData = function() {
	var data = {
		serviceId: this._conf.serviceId,
		returnURL: this._conf.returnURL
	}
	if (this._conf.local) { data.local = 1; }
	return data;
}
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
