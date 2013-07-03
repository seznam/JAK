//FIXME ceske texty primo v kodu...
//FIXME co delaji ctecky pro nevidome s placeholderem? neni nutny label?

/**
 * @class Prihlasovaci okenko
 * @signal login-done
 */
JAK.LoginForm = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals],
	DEPEND: [
		{ sClass: JAK.ModalWindow, ver: "1.0" }
	]
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
	this._visible = false;

	// umisteni formu do modalwindow
	this._mw = new JAK.ModalWindow("", {winClass:"login", overlayClass:"login"});
	this.addListener("mw-close", "_mwClose", this._mw);
}

JAK.LoginForm.prototype.show = function() {
	if (this._visible) { return; }
	this._visible = true;

	this._login.show();
	this._mw.setContent(this._login.getForm());
	this._mw.open();
	this._login.focus();
}

JAK.LoginForm.prototype.showRegister = function() {
	this._register.show();
	this._mw.setContent(this._register.getForm());
	this._register.focus();
}

JAK.LoginForm.prototype.showDone = function(user, pass) {
	this._mw._conf.closeActions = false;
	this._mw.setContent(this._done.getForm());
	this._mw.open();
	this._done.show(user, pass);
}

JAK.LoginForm.prototype.hide = function() {	
	if (!this._visible) { return; }
	this._visible = false;

	this._mw.close();
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
