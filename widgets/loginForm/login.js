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
	this._placeholder.setValue(this._autofill.user);
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

	this._dom.infoRow = this._form.buildRow("Nejste zaregistrováni na Seznam.cz? <a href='#'>Registrujte se!</a><br/> <a href='#'>Zaslat zapomenuté heslo</a>");
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
