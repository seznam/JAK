/**
 * @class Prihlasovaci okenko - podekovani za registraci
 */
JAK.LoginForm.Done = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm.Done",
	VERSION: "1.0"
});

/**
 * @param {JAK.LoginForm} form
 */
JAK.LoginForm.Done.prototype.$constructor = function(form, login, conf) {
	this._form = form;
	this._login = login;
	this._conf = conf;

	this._user = "";
	this._pass = "";

	this._ec = [];
	this._dom = {};

	this._buildForm();
	this._win = new JAK.LoginForm.Window(this._dom.form, {className:"done", close:false});
}

/**
 * @param {string} user uzivatel nebo url
 * @param {string} [pass] heslo, pokud je user = uzivatel
 */
JAK.LoginForm.Done.prototype.open = function(user, pass) {
	this._user = user;
	this._pass = pass;

	var url = (pass ? this._conf.returnURL : user);

	var r = url.match(/\/\/([^\/]*)/);
	if (r) {
		var host = r[1];
		host = host.split(".").slice(-2).join(".");
		host = host.charAt(0).toUpperCase() + host.substring(1);
		this._dom.done.value = "Vstoupit na "+host;
	} else {
		this._dom.done.value = "Přihlásit se";
	}

	this._win.open();
}

JAK.LoginForm.Done.prototype.getWindow = function() {
	return this._win;
}

JAK.LoginForm.Done.prototype._buildForm = function() {
	this._dom.form = JAK.mel("form", {className:"loginForm", id:"doneForm"});

	this._dom.textRow = this._form.buildRow("<strong>Blahopřejeme,</strong> registrace proběhla úspěšně :)");

	this._dom.done = JAK.mel("input", {type:"button"});
	this._dom.doneRow = this._form.buildRow(this._dom.done);
	this._dom.doneRow.classList.add("done");

	this._ec.push(JAK.Events.addListener(this._dom.done, "click", this, "_click"));
	JAK.DOM.append([this._dom.form, this._dom.textRow, this._dom.doneRow]);
}

JAK.LoginForm.Done.prototype._click = function(e) {
	if (this._pass) {
		this._login.tryLogin(this._user, this._pass, false);
	} else {
		location.href = this._user;
	}
}
