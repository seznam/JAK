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
//FIXME ceske texty primo v kodu...
//FIXME co delaji ctecky pro nevidome s placeholderem? neni nutny label?

/**
 * @class Prihlasovaci okenko - obsah s loginem
 */
JAK.LoginForm.Login = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm.Login",
	VERSION: "1.0",
	DEPEND: [
		{ sClass: JAK.Login, ver: "1.0" },
		{ sClass: JAK.Placeholder, ver: "2.0" }
	]
});

/**
 * @param {JAK.LoginForm} form
 * @param {object} conf
 */
JAK.LoginForm.Login.prototype.$constructor = function(form, conf) {
	this._form = form;
	this._conf = conf;

	this._ec = [];
	this._dom = {};
	this._placeholder = null;
	this._autofill = { // automaticky predvyplnene hodnoty formulare (login+password)
		name: "",
		pass: ""
	};		

	this._login = new JAK.Login({serviceId: this._conf.serviceId});

	this._buildSubmitIframe(); // iframe, do ktereho se odesle loginForm
	this._buildForm();
	this._softHide(); // skryje form a pripravi ho pro zobrazeni

	JAK.Events.onDomReady(this, "_onDomReady");

	this._login.check().then(
		this._okCheck.bind(this),
		this._errorCheck.bind(this)
	);
}

JAK.LoginForm.Login.prototype.getForm = function() {
	return this._dom.form;
}

JAK.LoginForm.Login.prototype.show = function() {
	JAK.DOM.clear(this._dom.form);
	JAK.DOM.append(
		[this._dom.form,
			this._dom.textRow, this._dom.error, this._dom.userRow,
			this._dom.passRow, this._dom.rememberRow, this._dom.infoRow
		]
	);

	this._hideError();
	/* placeholder muze neexistovat, pokud je jeste prilis brzy */
	if (this._placeholder) { this._placeholder.setValue(this._autofill.user); }
	this._dom.pass.value = this._autofill.pass;
}

JAK.LoginForm.Login.prototype.focus = function() {
	this._dom.user.focus();
}

JAK.LoginForm.Login.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "submit":
			this._hideError();

			var name = this._placeholder.getValue();
			if (!name) { return; }

			if (name.indexOf("@") == -1 && (name.match(/\./g) || []).length > 1) {
				location.href = this._login.openId(name);
				return;
			}

			this.tryLogin(name, this._dom.pass.value, this._dom.remember.checked);
		break;

		case "propertychange":
			if (e.propertyName != "value") { break; }
		case "input":
			this._dom.user.classList.remove("error");
			this._dom.pass.classList.remove("error");
		break;

		case "click":
			JAK.Events.cancelDef(e);
			this._form.showRegister();
		break;
	}
}

/**
 * Verejna, aby ji mohl volat reg. formular
 */
JAK.LoginForm.Login.prototype.tryLogin = function(name, pass, remember) {
	this._login.login(name, pass, remember).then(
		this._okLogin.bind(this),
		this._errorLogin.bind(this)
	);
}

/**
 * Sem odesilame formular. To proto, aby si Safari zapamatovalo jeho jmeno/heslo :/
 */
JAK.LoginForm.Login.prototype._buildSubmitIframe = function() {
	var id = JAK.idGenerator();

	if (JAK.Browser.client == "ie" && parseInt(JAK.Browser.version) < 9) {
		var iframe = JAK.mel("<iframe name='" + id + "'>");
	} else {
		var iframe = JAK.mel("iframe");
		iframe.setAttribute("name", id);
	}
	iframe.style.display = "none";

	document.body.insertBefore(iframe, document.body.firstChild);
	this._dom.iframe = iframe;
}

JAK.LoginForm.Login.prototype._buildForm = function() {
	var name = this._dom.iframe.name;
	this._dom.form = JAK.mel("form", {id:"loginForm", className:"loginForm", target:name, action:this._conf.submitIframeUrl, method:"post"});

	/* atribut name nutny kvuli zapamatovani v safari */
	this._dom.user = JAK.mel("input", {type:"text", name:"username"});
	this._dom.pass = JAK.mel("input", {type:"password", name:"password"});

	this._ec.push(JAK.Events.addListener(this._dom.user, "input propertychange", this));
	this._ec.push(JAK.Events.addListener(this._dom.pass, "input propertychange", this));

	this._dom.textRow = this._form.buildRow(this._conf.text);
	this._dom.textRow.classList.add("text");

	this._dom.userRow = this._form.buildRow(this._dom.user);
	this._dom.passRow = this._form.buildRow(this._dom.pass, JAK.mel("input", {type:"submit", value:"Přihlásit se"}));

	this._dom.remember = JAK.mel("input", {type:"checkbox", checked:true});
	var label = JAK.mel("label", {innerHTML: "Pamatovat si mě na tomto počítači (<a href='http://napoveda.seznam.cz/cz/login/prihlaseni/' target='_blank'>?</a>)"});
	label.insertBefore(this._dom.remember, label.firstChild);
	this._dom.rememberRow = this._form.buildRow(label);

	this._dom.error = this._form.buildRow();
	this._dom.error.classList.add("error");

	this._dom.infoRow = this._form.buildRow("Nejste zaregistrováni na Seznam.cz? <a href='#'>Registrujte se!</a><br/> <a href='http://napoveda.seznam.cz/cz/zapomenute-heslo.html'>Zaslat zapomenuté heslo</a>");
	this._dom.infoRow.classList.add("info");

	var registerLink = this._dom.infoRow.querySelector("a");
	this._ec.push(JAK.Events.addListener(registerLink, "click", this));	

	this._ec.push(JAK.Events.addListener(this._dom.form, "submit", this));	
}

JAK.LoginForm.Login.prototype._onDomReady = function() {
	setTimeout(this._onFormsReady.bind(this), 100);
}

/**
 * Touto dobou uz by mel byt formular predvyplneny automaticky ulozenym jmenem/heslem
 */
JAK.LoginForm.Login.prototype._onFormsReady = function() {
	this._autofill.user = this._dom.user.value;
	this._autofill.pass = this._dom.pass.value;
	
	this._placeholder = new JAK.Placeholder(this._dom.user, "Libovolný e-mail");
	if ("placeholder" in this._dom.pass) { this._dom.pass.placeholder = "Heslo"; }
}

/**
 * umistime prozatim form do elementu, ktery je pripnuty v DOMu 
 * - nutne pro automaticke predvyplneni hesel v nekterych prohlizecich
 */
JAK.LoginForm.Login.prototype._softHide = function() {
	var placer = JAK.mel("div", {}, {
		position: "absolute",
		width: "1px",
		height: "1px",
		overflow: "hidden",
		top: "-5000px",
		left: "-5000px"
	});
	placer.appendChild(this._dom.form);

	document.body.insertBefore(placer, document.body.firstChild);
}

JAK.LoginForm.Login.prototype._showError = function(text, href) {
	this._dom.error.innerHTML = "";
	this._dom.error.style.display = "";

	var strong = JAK.mel("strong");
	strong.appendChild(JAK.ctext(text));
	this._dom.error.appendChild(strong);

	if (href) {
		var link = JAK.mel("a", {href:href, target:"_blank", innerHTML:"?"});
		this._dom.error.appendChild(JAK.ctext(" ("));
		this._dom.error.appendChild(link);
		this._dom.error.appendChild(JAK.ctext(")"));
	}


	this._dom.user.focus();

	if (window.Audio) {
		var a = new Audio();
		var ext = a.canPlayType("audio/ogg") ? "ogg" : "mp3";
		a.src = "http://seznam.github.io/JAK/widgets/loginForm/alert." + ext;
		a.play();
	}
}

JAK.LoginForm.Login.prototype._hideError = function() {
	this._dom.error.innerHTML = "";
	this._dom.error.style.display = "none";
	this._dom.user.classList.remove("error");
	this._dom.pass.classList.remove("error");
}

JAK.LoginForm.Login.prototype._weakPassword = function(crypted) {
	var ul = JAK.mel("ul");
	var li1 = JAK.mel("li");
	var li2 = JAK.mel("li");

	var changeURL = this._login.change(crypted);
	var a1 = JAK.mel("a", {href:changeURL, innerHTML:"Změnit heslo"});
	var a2 = JAK.mel("a", {href:"#", innerHTML:"Pokračovat se současným heslem"});

	JAK.DOM.clear(this._dom.form);
	JAK.DOM.append(
		[li1, a1], [li2, a2],
		[ul, li1, li2],
		[this._dom.form, this._dom.error, ul]
	);
	this._showError("Vaše heslo je příliš jednoduché!");

	JAK.Events.addListener(a2, "click", function(e) {
		JAK.Events.cancelDef(e);
		this._acceptweak();
	}.bind(this));
}

JAK.LoginForm.Login.prototype._acceptweak = function() {
	this._hideError();
	this._login.acceptweak().then(
		this._okLogin.bind(this),
		this._errorLogin.bind(this)
	);
}

JAK.LoginForm.Login.prototype._okLogin = function(data) {
	switch (data.status) {
		case 200:
			this._form.makeEvent("login-done", {auto:false});
		break;

		case 403:
		case 406:
			this._showError("Neexistující uživatel nebo chybné heslo!", "http://napoveda.seznam.cz/cz/login/jak-na-zapomenute-heslo/");
			this._dom.user.classList.add("error");
			this._dom.pass.classList.add("error");
		break;

		case 405:
			this._showError("Váš účet je zablokován.", "http://napoveda.seznam.cz/cz/login/blokace-seznam-uctu/");
		break;

		case 420: /* slabe, ale ne moc */
			this._weakPassword(data.crypted);
		break;

		case 421: /* moc slabe */
			location.href = this._login.change(data.crypted);
		break;

		case 500:
			this._showError("Interní chyba systému.");
		break;

		default:
			this._showError(data.statusMessage);
		break;
	}
}

JAK.LoginForm.Login.prototype._errorLogin = function(reason) {
	this._showError(reason);
}

JAK.LoginForm.Login.prototype._okCheck = function(logged) {
	if (!logged) { return; } /* neni prihlaseny, nic se nedeje */

	this._login.autologin().then( /* zavolame autologin */
		this._okAutologin.bind(this),
		this._errorAutologin.bind(this)
	);
}

JAK.LoginForm.Login.prototype._errorCheck = function(reason) {
	/* FIXME asi nic, je to na pozadi? */
}

JAK.LoginForm.Login.prototype._okAutologin = function(data) {
	if (data.status == 200) {
		this._form.makeEvent("login-done", {auto:true});
	} else {
		/* FIXME neni jak zpracovat, neni videt */
	}
}

JAK.LoginForm.Login.prototype._errorAutologin = function(reason) {
	this._showError(reason);
}
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

	this._errors = {
		403: "Pin se neshoduje",
		404: "Toto jméno je u nás již registrováno",
		406: "K registraci chybí heslo",
		422: "Vaše heslo je příliš krátké. Zadejte delší",
		422: "Vaše heslo je příliš krátké. Zadejte delší",
		423: "Vaše heslo je příliš dlouhé. Zadejte kratší",
		424: "Heslo obsahuje nepovolené znaky",
		425: "Na začátku či na konci hesla nesmí být mezera",
		426: "Hesla nejsou stejná!",
		427: "Je potřeba jiná registrace",
		430: "Příliš kráké jméno",
		431: "Zadané jméno je neplatné",
		500: "Interní chyba systému"
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

	this._dom.infoRow = this._form.buildRow("Registrací souhlasíte s <a href='https://registrace.seznam.cz/licenceScreen' target='_blank'>podmínkami služby</a>.");

	this._dom.submit = JAK.mel("input", {type:"submit"});

	this._dom.error = this._form.buildRow();
	this._dom.error.classList.add("error");

	this._dom.infoRow2 = this._form.buildRow("<a href='https://registrace.seznam.cz/' target='_blank'>Nemám e-mail a chci ho vytvořit</a>");
	this._dom.infoRow2.classList.add("info");

	this._dom.resend = JAK.mel("input", {type:"button", value:"Zaslat znovu ověřovací kód"});
	this._dom.resendRow = this._form.buildRow("Nepřišel vám kód?");
	this._dom.resendRow.classList.add("resend");

	this._ec.push(JAK.Events.addListener(this._dom.form, "submit", this));	
	this._ec.push(JAK.Events.addListener(this._dom.resend, "click", this));	

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
		this._showError(this._formatError(data.status, data.statusMessage));
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
		this._showError(this._formatError(data.status, data.statusMessage));
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
		this._form.showDone(this._placeholder.user.getValue(), this._dom.pass.value);
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
JAK.LoginForm.Done.prototype.$constructor = function(form, login) {
	this._form = form;
	this._login = login;

	this._user = "";
	this._pass = "";

	this._ec = [];
	this._dom = {};

	this._buildForm();
}

JAK.LoginForm.Done.prototype.getForm = function() {
	return this._dom.form;
}

/**
 * @param {string} user uzivatel nebo url
 * @param {string} [pass] heslo, pokud je user = uzivatel
 */
JAK.LoginForm.Done.prototype.show = function(user, pass) {
	this._user = user;
	this._pass = pass;

	var url = (pass ? location.href : user);
	var host = url.match(/\/\/(.*?)\//)[1];
	host = host.split(".").slice(-2).join(".");
	host = host.charAt(0).toUpperCase() + host.substring(1);
	this._dom.done.value = "Vstoupit na "+host;

	var node = this._dom.form;
	while (node) {
		if (node.classList && node.classList.contains("mw-window")) {
			node.classList.add("done");
			break;
		}
		node = node.parentNode;
	}
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
