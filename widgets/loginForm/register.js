/**
 * @class Prihlasovaci okenko - obsah s registraci
 * @signal login-done
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
	this._done = false;

	this._ec = [];
	this._dom = {};
	this._placeholder = {
		user: null,
		ping: null
	}
	this._timeout = {
		user: null,
		pass: null
	}

	this._register = new JAK.Register({serviceId: this._conf.serviceId});
	this._buildForm();
}

JAK.LoginForm.Register.prototype.getForm = function() {
	return this._dom.form;
}

JAK.LoginForm.Register.prototype.show = function() {
	JAK.DOM.clear(this._dom.form);
	this._cud = "";
	this._dom.form.id = "registerForm";
	this._dom.textRow.innerHTML = "<strong>Registrujte se</strong> a získáte obsah všech služeb Seznam.cz přímo na míru vašim potřebám.";
	this._dom.submit.value = "Pokračovat";

	JAK.DOM.append(
		[this._dom.form,
			this._dom.textRow, this._dom.userRow, this._dom.passRow, this._dom.error,
			this._dom.infoRow, this._dom.submit, this._dom.infoRow2
		]
	);

	this._placeholder.user.setValue("");
	this._dom.pass.value = "";
	this._dom.pass2.value = "";

	this._syncUser();
	this._syncPass();
	this._syncPass2();

	this._hideError();
}

JAK.LoginForm.Register.prototype.focus = function() {
	this._dom.user.focus();
}


JAK.LoginForm.Register.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "click":
			if (JAK.Events.getTarget(e) == this._dom.done) {
				this._form.hide();

				var login = this._form._login; /* FIXME */
				login.tryLogin(this._placeholder.user.getValue(), this._dom.pass.value, false);
			} else {
				this._tryRegister();
			}
		break;

		case "submit":
			JAK.Events.cancelDef(e);

			if (this._cud) { /* overeni pinu */
				this._register.verify(this._cud, this._placeholder.pin.getValue()).then(
					this._okVerify.bind(this),
					this._errorVerify.bind(this)
				);
			} else {
				this._tryRegister();
			}
		break;

		case "propertychange":
			if (e.propertyName != "value") { break; }
		case "input":
			var input = JAK.Events.getTarget(e);
			this._hideError();

			if (input == this._dom.user) { this._syncUser(); }
			if (input == this._dom.pass) { this._syncPass(); }
			if (input == this._dom.pass2) { this._syncPass2(); }
		break;

	}
}


JAK.LoginForm.Register.prototype._buildForm = function() {
	this._dom.form = JAK.mel("form", {className:"loginForm"});

	this._dom.user = JAK.mel("input", {type:"text"});
	this._dom.pin = JAK.mel("input", {type:"text"});
	this._dom.pass = JAK.mel("input", {type:"password"});
	this._dom.pass2 = JAK.mel("input", {type:"password"});
	this._dom.passMeter = JAK.mel("div", {id:"passwordMeter", innerHTML:"<div></div>"});

	this._ec.push(JAK.Events.addListener(this._dom.user, "input propertychange", this));
	this._ec.push(JAK.Events.addListener(this._dom.pass, "input propertychange", this));
	this._ec.push(JAK.Events.addListener(this._dom.pass2, "input propertychange", this));

	this._dom.textRow = this._form.buildRow();
	this._dom.userRow = this._form.buildRow(this._dom.user);
	this._dom.passRow = this._form.buildRow(this._dom.pass, this._dom.pass2, this._dom.passMeter);
	this._dom.pinRow = this._form.buildRow(this._dom.pin);

	this._dom.infoRow = this._form.buildRow("Registrací souhlasíte s <a href='#' target='_blank'>podmínkami služby</a>.");

	this._dom.submit = JAK.mel("input", {type:"submit"});

	this._dom.error = this._form.buildRow();
	this._dom.error.classList.add("error");

	this._dom.infoRow2 = this._form.buildRow("<a href='#' target='_blank'>Nemám e-mail a chci ho vytvořit</a>");
	this._dom.infoRow2.classList.add("info");

	this._dom.resend = JAK.mel("input", {type:"button", value:"Zaslat znovu ověřovací kód"});
	this._dom.resendRow = this._form.buildRow("Nepřišel vám kód?");
	this._dom.resendRow.classList.add("resend");

	var host = location.host.split(".").slice(-2).join(".");
	host = host.charAt(0).toUpperCase() + host.substring(1);
	this._dom.done = JAK.mel("input", {type:"button", value:"Vstoupit na "+host});
	this._dom.doneRow = this._form.buildRow(this._dom.done);
	this._dom.doneRow.classList.add("done");

	this._ec.push(JAK.Events.addListener(this._dom.form, "submit", this));	
	this._ec.push(JAK.Events.addListener(this._dom.resend, "click", this));	
	this._ec.push(JAK.Events.addListener(this._dom.done, "click", this));

	this._placeholder.user = new JAK.Placeholder(this._dom.user, "Libovolný e-mail");
	this._placeholder.pin = new JAK.Placeholder(this._dom.pin, "XXXX");
	if ("placeholder" in this._dom.pass) { 
		this._dom.pass.placeholder = "Heslo"; 
		this._dom.pass2.placeholder = "Zopakujte heslo"; 
	}

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
	var nodes = [this._dom.user, this._dom.pass, this._dom.pass2];
	for (var i=0;i<nodes.length;i++) {
		if (!nodes[i].classList.contains("ok")) { return; }
	}
	this._register.register(this._placeholder.user.getValue(), this._dom.pass.value, this._dom.pass2.value).then(
		this._okRegister.bind(this),
		this._errorRegister.bind(this)
	);
}

JAK.LoginForm.Register.prototype._syncUser = function() {
	var node = this._dom.user;
	if (!node.value) {
		node.classList.remove("ok");
		node.classList.remove("error");
		return;
	}

	if (this._timeout.user) { clearTimeout(this._timeout.user); }
	this._timeout.user = setTimeout(this._checkUser.bind(this), 300);
}

JAK.LoginForm.Register.prototype._syncPass = function() {
	var node = this._dom.pass;
	if (!node.value) {
		node.classList.remove("ok");
		node.classList.remove("error");
		this._dom.passMeter.style.display = "none";
		return;
	}

	if (this._timeout.pass) { clearTimeout(this._timeout.pass); }
	this._timeout.pass = setTimeout(this._checkPass.bind(this), 300);
}

JAK.LoginForm.Register.prototype._syncPass2 = function() {
	var node = this._dom.pass2;
	if (!node.value) {
		node.classList.remove("ok");
		node.classList.remove("error");
		return;
	}

	if (this._dom.pass2.value == this._dom.pass.value) {
		this._dom.pass2.classList.remove("error");
		this._dom.pass2.classList.add("ok");
	} else {
		this._dom.pass2.classList.remove("ok");
		this._dom.pass2.classList.add("error");
	}	
}

JAK.LoginForm.Register.prototype._checkUser = function() {
	this._register.checkUser(this._placeholder.user.getValue()).then(
		this._okUser.bind(this),
		this._errorUser.bind(this)
	);
}

JAK.LoginForm.Register.prototype._checkPass = function() {
	this._register.checkPassword(this._dom.pass.value).then(
		this._okPass.bind(this),
		this._errorPass.bind(this)
	);
}

JAK.LoginForm.Register.prototype._okUser = function(data) {
	if (data.status == 200) {
		this._dom.user.classList.add("ok");
		this._dom.user.classList.remove("error");
	} else {
		this._dom.user.classList.add("error");
		this._dom.user.classList.remove("ok");
		this._showError(data.statusMessage);
	}
}

JAK.LoginForm.Register.prototype._errorUser = function(reason) {
	this._showError(reason);
}

JAK.LoginForm.Register.prototype._okPass = function(data) {
	if (data.status == 200) {
		this._dom.pass.classList.add("ok");
		this._dom.pass.classList.remove("error");
		this._dom.passMeter.style.display = "";

		var meter = this._dom.passMeter.firstChild;
		meter.style.width = data.power + "%";
		meter.style.backgroundColor = this._powerToColor(data.power);
	} else {
		this._dom.pass.classList.add("error");
		this._dom.pass.classList.remove("ok");
		this._showError(data.statusMessage);
		this._dom.passMeter.style.display = "none";
	}
}

JAK.LoginForm.Register.prototype._errorPass = function(reason) {
	this._showError(reason);
}

JAK.LoginForm.Register.prototype._okRegister = function(data) {
	if (data.status == 200) {
		this._cud = data.cud;
		this._showVerifyForm();
	} else {
		this._showError(data.statusMessage);
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
	this._placeholder.pin.setValue("");

	JAK.DOM.clear(this._dom.form);
	this._dom.form.id = "verifyForm";
	this._dom.textRow.innerHTML = "Pro dokončení klikněte na odkaz, který jsme vám poslali na e-mail nebo opište zaslaný kód.";
	this._dom.submit.value = "Dokončit";

	JAK.DOM.append(
		[this._dom.form,
			this._dom.textRow, this._dom.pinRow, this._dom.error,
			this._dom.resendRow, this._dom.resend
		]
	);

	this._dom.pinRow.appendChild(this._dom.submit);

	this._hideError();
}

JAK.LoginForm.Register.prototype._okVerify = function(data) {
	if (data.status == 200) {
		this._showDone();
	} else {
		this._showError(data.statusMessage);
	}
}

JAK.LoginForm.Register.prototype._errorVerify = function(reason) {
	this._showError(reason);
}

JAK.LoginForm.Register.prototype._showDone = function() {
	JAK.DOM.clear(this._dom.form);

	this._dom.form.id = "doneForm";
	this._dom.textRow.innerHTML = "<strong>Blahopřejeme,</strong> registrace proběhla úspěšně :)";

	JAK.DOM.append([this._dom.form, this._dom.textRow, this._dom.doneRow]);
}
