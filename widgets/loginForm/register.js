/**
 * @class Prihlasovaci okenko - obsah s registraci
 */
JAK.LoginForm.Register = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm.Register",
	VERSION: "1.0",
	DEPEND: [
		{ sClass: JAK.Register, ver: "1.0" },
		{ sClass: JAK.Placeholder, ver: "2.0" }
	]
});

/**
 * @param {JAK.LoginForm} form
 * @param {object} conf
 */
JAK.LoginForm.Register.prototype.$constructor = function(form, conf) {
	this._form = form;
	this._conf = conf;
	this._cud = ""; /* crypted user data */
	this._lastStatus = 0; /* abychom poznali 427 */

	this._ec = [];
	this._dom = {};
	this._timeout = {
		user: null,
		pass: null
	}

	this._errors = {
		403: "Zadaný kód je neplatný",
		404: "Tento e-mail je u nás již registrován",
		406: "K registraci chybí heslo",
		407: "Pokus o registraci byl dočasně zablokován",
		420: "Vaše heslo je příliš slabé",
		421: "Vaše heslo je příliš slabé",
		422: "Vaše heslo je příliš krátké. Zadejte delší",
		423: "Vaše heslo je příliš dlouhé. Zadejte kratší",
		424: "Heslo obsahuje nepovolené znaky",
		425: "Na začátku či na konci hesla nesmí být mezera",
		426: "Hesla se neshodují",
		427: "Tato schránka ještě neexistuje. Kliknutím na 'Pokračovat' ji zaregistrujete.",
		428: "Je nám líto, ale daná doména je pro registraci emailových adres již obsazena.",
		430: "Příliš krátký e-mail",
		431: "Zadaný e-mail je neplatný",
		500: "Interní chyba systému"
	}

	this._register = new JAK.Register({serviceId: this._conf.serviceId, returnURL: this._conf.returnURL});

	this._buildForm();
	this._win = new JAK.LoginForm.Window(this._dom.form, {className:"register"});
}

JAK.LoginForm.Register.prototype.open = function() {
	JAK.DOM.clear(this._dom.form);
	this._cud = "";
	this._dom.form.id = "registerForm";
	this._dom.textRow.innerHTML = "<strong>Registrujte se</strong> a získáte obsah všech služeb Seznam.cz přímo na míru vašim potřebám.";
	this._dom.submit.value = "Pokračovat";

	JAK.DOM.append(
		[this._dom.form,
			this._dom.textRow, this._dom.userRow, this._dom.passRow, this._dom.error,
			this._dom.infoRow, this._dom.submit, this._dom.infoRow2, this._dom.backRow
		]
	);

	this._dom.user.setValue("");
	this._dom.pass.setValue("");
	this._dom.pass2.setValue("");

	this._syncUser();
	this._syncPass();
	this._syncPass2();

	this._hideError();

	this._win.open();
	this._dom.user.focus();
}

JAK.LoginForm.Register.prototype.getWindow = function() {
	return this._win;
}

JAK.LoginForm.Register.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "click":
			JAK.Events.cancelDef(e);

			if (JAK.Events.getTarget(e) == this._dom.back) {
				this._form.openLogin();
			} else {
				this._tryRegister();
				this._dom.resendRow.classList.add("error");
				this._dom.resendRow.innerHTML = "Zkontrolujte svou e-mailovou schránku, kam jsme vám zaslali nový ověřovací kód.";
			}
		break;

		case "submit":
			JAK.Events.cancelDef(e);

			if (this._cud) { /* overeni pinu */
				this._register.verify(this._cud, this._dom.pin.getValue()).then(
					this._okVerify.bind(this),
					this._errorVerify.bind(this)
				);
			} else {
				this._tryRegister();
			}
		break;

		case "blur":
			this._syncUser(true);
		break;

		case "reset":
		case "change":
			this._hideError();

			var input = JAK.Events.getTarget(e);
			if (input == this._dom.user) { this._syncUser(false); }
			if (input == this._dom.pass) { 
				this._syncPass(); 
				this._syncPass2();
			}
			if (input == this._dom.pass2) { this._syncPass2(); }
		break;

	}
}

JAK.LoginForm.Register.prototype._buildForm = function() {
	this._dom.form = JAK.mel("form", {className:"loginForm"});

	this._dom.user = new JAK.LoginForm.Input({type:"text"}, {change:this, blur:this, reset:this});
	this._dom.pin = new JAK.LoginForm.Input({type:"text"});
	this._dom.pass = new JAK.LoginForm.Input({type:"password"}, {change:this, reset:this});
	this._dom.pass2 = new JAK.LoginForm.Input({type:"password"}, {change:this, reset:this});
	this._dom.passMeter = JAK.mel("div", {id:"passwordMeter", innerHTML:"<div></div>"});

	this._dom.pass.getContainer().appendChild(this._dom.passMeter);
	this._dom.pass2.getContainer().classList.add("second");

	this._dom.textRow = this._form.buildRow();
	this._dom.textRow.classList.add("text");
	this._dom.userRow = this._form.buildRow(this._dom.user.getContainer());
	this._dom.passRow = this._form.buildRow(this._dom.pass.getContainer(), this._dom.pass2.getContainer());
	this._dom.pinRow = this._form.buildRow(this._dom.pin.getContainer());

	this._dom.check = JAK.mel("input", {type:"checkbox"});
	this._dom.infoRow = this._form.buildRow("Registrací souhlasíte s <a href='http://napoveda.seznam.cz/cz/licencni-ujednani.html' target='_blank'>podmínkami služby</a>.");
	this._dom.infoRow.insertBefore(this._dom.check, this._dom.infoRow.firstChild);

	this._dom.submit = JAK.mel("input", {type:"submit"});

	this._dom.error = this._form.buildRow();
	this._dom.error.classList.add("error");

	var url = JAK.Register.URL + "?serviceId=" + encodeURIComponent(this._conf.serviceId) + "&returnURL=" + encodeURIComponent(this._conf.returnURL);
	this._dom.infoRow2 = this._form.buildRow("<a href='" + url + "' target='_blank'>Nemám e-mail a chci ho vytvořit</a>");
	this._dom.infoRow2.classList.add("info");

	var url = JAK.Login.URL + "?serviceId=" + encodeURIComponent(this._conf.serviceId) + "&returnURL=" + encodeURIComponent(this._conf.returnURL);
	this._dom.back = JAK.mel("a", {href:url, innerHTML:"Jsem registrovaný a chci se přihlásit"});
	this._dom.backRow = this._form.buildRow(this._dom.back);

	this._dom.resend = JAK.mel("a", {href:"#", innerHTML:"Zaslat znovu ověřovací kód"});
	this._dom.resendRow = this._form.buildRow();
	this._dom.resendRow.classList.add("resend");

	this._ec.push(JAK.Events.addListener(this._dom.form, "submit", this));	
	this._ec.push(JAK.Events.addListener(this._dom.resend, "click", this));	
	this._ec.push(JAK.Events.addListener(this._dom.back, "click", this));	

	this._dom.user.setPlaceholder("Libovolný e-mail");
	this._dom.pin.setPlaceholder("XXXXXX");
	this._dom.pass.setPlaceholder("Heslo");
	this._dom.pass2.setPlaceholder("Zopakujte heslo");
}

JAK.LoginForm.Register.prototype._showError = function(text) {
	this._dom.error.innerHTML = text;
	this._dom.error.style.display = "";
}

JAK.LoginForm.Register.prototype._hideError = function() {
	this._dom.error.innerHTML = "";
	this._dom.error.style.display = "none";
}

JAK.LoginForm.Register.prototype._tryRegister = function() {
	if (this._lastStatus == 427) { /* presmerovat na registraci */
		var url = JAK.Register.URL;
		var parts = this._dom.user.getValue().split("@");
		url += "/?username=" + encodeURIComponent(parts[0]) + "&domain=" + encodeURIComponent(parts[1]);
		location.href = url;
		return;
	}

	var nodes = [this._dom.user.getContainer(), this._dom.pass.getContainer(), this._dom.pass2.getContainer()];
	for (var i=0;i<nodes.length;i++) {
		if (!nodes[i].classList.contains("ok")) { return; }
	}

	if (!this._dom.check.checked) {
		this._showError("Pro pokračování odsouhlaste podmínky služby");
		return;
	}

	this._register.register(this._dom.user.getValue(), this._dom.pass.getValue(), this._dom.pass2.getValue()).then(
		this._okRegister.bind(this),
		this._errorRegister.bind(this)
	);
}

/**
 * Sync inputu a chybovosti
 * @param {bool} check Chceme se ptat serveru, nebo jen resetovat ikonku?
 */
JAK.LoginForm.Register.prototype._syncUser = function(check) {
	var node = this._dom.user;
	if (!node.getValue()) {
		node.setState("");
		return;
	}

	if (!check) { return; }

	this._checkUser();
}

JAK.LoginForm.Register.prototype._syncPass = function() {
	var node = this._dom.pass;
	if (!node.getValue()) {
		node.setState("");
		this._setMeter(0);
		return;
	}

	if (this._timeout.pass) { clearTimeout(this._timeout.pass); }
	this._timeout.pass = setTimeout(this._checkPass.bind(this), 300);
}

JAK.LoginForm.Register.prototype._syncPass2 = function() {
	var node = this._dom.pass2;
	if (!node.getValue()) {
		node.setState("");
		return;
	}

	if (this._dom.pass2.getValue() == this._dom.pass.getValue() && this._dom.pass.getState() == "ok") {
		this._dom.pass2.setState("ok");
	} else {
		this._dom.pass2.setState("error");
		if (this._dom.pass.getState() == "ok") { /* pokud u prvniho neni chyba, zobrazit tuto */
			this._showError(this._formatError(426));
		}
	}	
}

JAK.LoginForm.Register.prototype._checkUser = function() {
	this._register.checkUser(this._dom.user.getValue()).then(
		this._okUser.bind(this),
		this._errorUser.bind(this)
	);
}

JAK.LoginForm.Register.prototype._checkPass = function() {
	this._register.checkPassword(this._dom.pass.getValue()).then(
		this._okPass.bind(this),
		this._errorPass.bind(this)
	);
}

JAK.LoginForm.Register.prototype._okUser = function(data) {
	this._lastStatus = data.status;
	if (data.status == 200) {
		this._dom.user.setState("ok");
	} else {
		this._dom.user.setState("error");
		this._showError(this._formatError(data.status, data.statusMessage));
	}
}

JAK.LoginForm.Register.prototype._errorUser = function(reason) {
	this._showError(reason);
}

JAK.LoginForm.Register.prototype._okPass = function(data) {
	this._setMeter(data.power || 0);

	if (data.status == 200) {
		this._dom.pass.setState("ok");
	} else {
		this._dom.pass.setState("error");
		this._showError(this._formatError(data.status, data.statusMessage));
	}
	this._syncPass2();
}

JAK.LoginForm.Register.prototype._setMeter = function(power) {
	var meter = this._dom.passMeter.firstChild;
	meter.style.width = power + "%";
	meter.style.backgroundColor = this._powerToColor(power);
}

JAK.LoginForm.Register.prototype._errorPass = function(reason) {
	this._showError(reason);
}

JAK.LoginForm.Register.prototype._okRegister = function(data) {
	if (data.status == 200) {
		if (!this._cud) { this._showVerifyForm(); }
		this._cud = data.cud;
	} else {
		this._showError(this._formatError(data.status, data.statusMessage));
	}
}

JAK.LoginForm.Register.prototype._errorRegister = function(reason) {
	this._showError(reason);
}

JAK.LoginForm.Register.prototype._powerToColor = function(power) {
	var c1 = [238, 14, 14];
	var c2 = [157, 201, 48];
	var c = c1.slice();
	for (var i=0;i<3;i++) {
		c[i] += Math.round((c2[i]-c1[i])*power/100);
	}
	return "rgb("+c.join(",")+")";
}

JAK.LoginForm.Register.prototype._showVerifyForm = function() {
	this._dom.pin.setValue("");

	JAK.DOM.clear(this._dom.form);
	this._dom.form.id = "verifyForm";
	this._dom.textRow.innerHTML = "Pro dokončení klikněte na odkaz, který jsme vám poslali na e-mail nebo opište zaslaný kód.";
	this._dom.submit.value = "Dokončit";

	this._dom.resendRow.innerHTML = "Nepřišel vám kód? ";
	this._dom.resendRow.appendChild(this._dom.resend);
	this._dom.resendRow.classList.remove("error");

	JAK.DOM.append(
		[this._dom.form,
			this._dom.textRow, this._dom.pinRow, 
			this._dom.error, this._dom.resendRow
		]
	);

	this._dom.pinRow.appendChild(this._dom.submit);

	this._hideError();
	this._dom.pin.focus();
}

JAK.LoginForm.Register.prototype._okVerify = function(data) {
	if (data.status == 200) {
		this._win.close();
		this._form.openDone(this._dom.user.getValue(), this._dom.pass.getValue());
	} else {
		this._showError(this._formatError(data.status, data.statusMessage));
	}
}

JAK.LoginForm.Register.prototype._errorVerify = function(reason) {
	this._showError(reason);
}

JAK.LoginForm.Register.prototype._formatError = function(code, message) {
	return this._errors[code] || message;
}
