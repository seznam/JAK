//FIXME ceske texty primo v kodu...
//FIXME co delaji ctecky pro nevidome s placeholderem? neni nutny label?

/**
 * @class Prihlasovaci okenko
 * @signal login-done
 */
JAK.LoginForm = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

//musi probehnout pred koncem BODY
JAK.LoginForm.prototype.$constructor = function(conf) {
	this._conf = {
		serviceId: "",			// nutno vyplnit necim smysluplnym
		submitIframeUrl: JAK.Login.URL + "/beta/nop",	// url pro iframe, do ktereho se submitne form, nemelo by to nic udelat (obrazek,...)
		text: "<strong>Přihlaste se</strong> tam, kam se dosud nikdo nevydal."
	};
	for (var p in conf) { this._conf[p] = conf[p]; }

	if (!this._conf.serviceId) { throw new Error("No serviceId specified"); }
	if (!this._conf.submitIframeUrl) { throw new Error("No submitIframeUrl specified"); }

	this._login = new JAK.LoginForm.Login(this, this._conf);
	this._register = new JAK.LoginForm.Register(this, this._conf);
	this._done = new JAK.LoginForm.Done(this, this._login);
}

JAK.LoginForm.prototype.show = function() {
	this._login.open();
}

JAK.LoginForm.prototype.showRegister = function() {
	/* prolinacka */
	var win1 = this._login.getWindow();
	var win2 = this._register.getWindow();

	win2.getContainer().classList.add("right")

	this._register.open();

	win1.getContainer().classList.add("left")
	win2.getContainer().classList.remove("right")
}

JAK.LoginForm.prototype.showDone = function(user, pass) {
	this._done.open(user, pass);
}

JAK.LoginForm.prototype.buildRow = function() {
	var row = JAK.mel("div");

	for (var i=0;i<arguments.length;i++) {
		var content = arguments[i];
		(content.nodeType ? row.appendChild(content) : row.innerHTML = content);
	}

	return row;
}

JAK.LoginForm.prototype._mwClose = function(e) {
	this.hide();
}
