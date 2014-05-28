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
