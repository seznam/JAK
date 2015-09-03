/**
 * @class Prihlasovaci okenko
 * @signal login-done
 * @signal login-close
 * @signal login-open
 */
JAK.LoginForm = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

/** Prave otevreny loginform */
JAK.LoginForm.active = null;

//musi probehnout pred koncem BODY
JAK.LoginForm.prototype.$constructor = function(conf) {
	this._conf = {
		serviceId: "",			// nutno vyplnit necim smysluplnym
		submitIframeUrl: JAK.Login.URL + "/beta/nop",	// url pro iframe, do ktereho se submitne form, nemelo by to nic udelat (obrazek,...)
		text: "<strong>Přihlaste se</strong> tam, kam se dosud nikdo nevydal.",
		autoClose: true,
		autoLogin: true,
		checkCookie: false,
		zoneId: "seznam.login.medium.rectangle",
		returnURL: location.href
	};
	for (var p in conf) { this._conf[p] = conf[p]; }

	if (!this._conf.serviceId) { throw new Error("No serviceId specified"); }
	if (!this._conf.submitIframeUrl) { throw new Error("No submitIframeUrl specified"); }

	this._login = new JAK.LoginForm.Login(this, this._conf);
	this._register = new JAK.LoginForm.Register(this, this._conf);
	this._done = new JAK.LoginForm.Done(this, this._login, this._conf);
	this._current = null;
}

JAK.LoginForm.prototype.useLink = function(link) {
	JAK.Events.addListener(link, "click", this);
}

JAK.LoginForm.prototype.open = function(conf) {
	for (var p in conf) { this._conf[p] = conf[p]; }
	this.openLogin();
}

JAK.LoginForm.prototype.close = function() {
	if (!this._current) { return; }

	this._current.getWindow().close();
	this._current = null;
	this.constructor.active = null;

	this.makeEvent("login-close");
}

JAK.LoginForm.prototype.getLogin = function() {
	return this._login.getLogin();
}

JAK.LoginForm.prototype.openLogin = function() {
	if (this._current == this._login) { return; }
	this.constructor.active = this;

	var win1 = this._login.getWindow();

	if (this._current == this._register) { /* prolinacka */

		var win2 = this._register.getWindow();
		win1.getContainer().classList.add("left");
		this._login.open();
		win1.getContainer().classList.remove("left");
		win2.getContainer().classList.add("right");

	} else { /* fade in */

		win1.getContainer().classList.remove("left");
		document.body.classList.add("login-fade");
		this._login.open();
		document.body.classList.remove("login-fade");

	}

	this._current = this._login;
}

JAK.LoginForm.prototype.openRegister = function() {
	if (this._current == this._register) { return; }
	this.constructor.active = this;

	var win2 = this._register.getWindow();

	if (this._current == this._login) { /* prolinacka */

		var win1 = this._login.getWindow();
		win2.getContainer().classList.add("right");
		this._register.open();
		win1.getContainer().classList.add("left");
		win2.getContainer().classList.remove("right");

	} else { /* fade in */

		win2.getContainer().classList.remove("right");
		document.body.classList.add("login-fade");
		this._register.open();
		document.body.classList.remove("login-fade");

	}

	this._current = this._register;
}

JAK.LoginForm.prototype.openDone = function(user, pass) {
	if (this._current == this._done) { return; }
	this.constructor.active = this;

	this._done.open(user, pass);
	this._current = this._done;
}

JAK.LoginForm.prototype.buildRow = function() {
	var row = JAK.mel("div");

	for (var i=0;i<arguments.length;i++) {
		var content = arguments[i];
		(content.nodeType ? row.appendChild(content) : row.innerHTML = content);
	}

	return row;
}

JAK.LoginForm.prototype.handleEvent = function(e) {
	JAK.Events.cancelDef(e);
	this.open();
}
JAK.LoginForm.Window = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm.Window",
	VERSION: "1.0"
});

JAK.LoginForm.Window.overlay = JAK.mel("div", {id:"login-overlay"}, {position:"fixed", left:0, top:0});
JAK.LoginForm.Window.overflow = JAK.mel("div", {id:"login-overflow"}, {position:"fixed", left:0, top:0});
JAK.LoginForm.Window.current = null;

JAK.Events.addListener(JAK.LoginForm.Window.overflow, "mousedown", function(e) {
	var c = JAK.LoginForm.Window.current;
	if (c && c.getOptions().close) { 
		JAK.LoginForm.active.close();
	}
});

JAK.Events.addListener(window, "keydown", function(e) {
	var c = JAK.LoginForm.Window.current;
	if (e.keyCode == 27 && c && c.getOptions().close) { 
		JAK.LoginForm.active.close();
	}
});

JAK.LoginForm.Window.prototype.$constructor = function(content, options) {
	this._event = null;

	this._options = {
		close: true,
		className: ""
	}
	for (var p in options) { this._options[p] = options[p]; }

	this._dom = {
		container: JAK.mel("div", {className:"login-window"}, {position:"absolute"}),
		close: JAK.mel("div", {className:"login-close"})
	}
	if (this._options.className) { this._dom.container.classList.add(this._options.className); }
	if (this._options.close) { this._dom.container.appendChild(this._dom.close); }

	JAK.Events.addListener(this._dom.container, "mousedown", this);

	this._dom.container.appendChild(content);
}

JAK.LoginForm.Window.prototype.getContainer = function() {
	return this._dom.container;
}

JAK.LoginForm.Window.prototype.getOptions = function() {
	return this._options;
}

JAK.LoginForm.Window.prototype.open = function() {
	document.body.appendChild(this.constructor.overlay);
	document.body.appendChild(this.constructor.overflow);
	this.constructor.overflow.appendChild(this._dom.container);

	this.resize();
	if (!this._event) { this._event = JAK.Events.addListener(window, "resize", this, "resize"); }
	this.constructor.current = this;
}

JAK.LoginForm.Window.prototype.close = function() {
	if (!this._event) { return; }
	this._dom.container.parentNode.removeChild(this._dom.container);
	this.constructor.overlay.parentNode.removeChild(this.constructor.overlay);
	this.constructor.overflow.parentNode.removeChild(this.constructor.overflow);

	JAK.Events.removeListener(this._event);
	this._event = null;
	if (this.constructor.current == this) { this.constructor.current = null; }
}

JAK.LoginForm.Window.prototype.handleEvent = function(e) {
	JAK.Events.stopEvent(e);
	var target = JAK.Events.getTarget(e);
	if (target == this._dom.close) { JAK.LoginForm.active.close(); }
}

JAK.LoginForm.Window.prototype.resize = function() {
	var port = JAK.DOM.getDocSize();
	this.constructor.overlay.style.height = port.height + "px";
	this.constructor.overflow.style.height = port.height + "px";
	var w = this._dom.container.offsetWidth;
	var h = this._dom.container.offsetHeight;
	var l = Math.round(port.width/2-w/2);
	var t = Math.round(port.height/2.5-h/2);
	this._dom.container.style.left = Math.max(0, l) + "px";
	this._dom.container.style.top = Math.max(24, t) + "px";
}
/**
 * @class Chytry input s ok/error stavem
 */
JAK.LoginForm.Input = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm.Input",
	VERSION: "1.0",
	DEPEND: [
		{ sClass: JAK.Placeholder, ver: "2.0" }
	]
});

JAK.LoginForm.Input.prototype.$constructor = function(params, events) {
	this._dom = {
		container: JAK.mel("span", {className:"input"}),
		input: JAK.mel("input", params),
		icon: JAK.mel("div", {className:"icon"})
	}

	this._events = {
		change: null,
		reset: null,
		blur: null
	}
	for (var p in events) { this._events[p] = events[p]; }

	this._dom.container.appendChild(this._dom.input);
	this._dom.container.appendChild(this._dom.icon);
	this._placeholder = null;
	this._state = "";

	JAK.Events.addListener(this._dom.input, "input propertychange blur", this);
	JAK.Events.addListener(this._dom.icon, "click", this);
}

JAK.LoginForm.Input.prototype.setPlaceholder = function(placeholder) {
	if (this._dom.input.type == "text") {
		this._placeholder = new JAK.Placeholder(this._dom.input, placeholder);
	} else if ("placeholder" in this._dom.input) {
		this._dom.input.placeholder = placeholder;
	}
}

JAK.LoginForm.Input.prototype.getContainer = function() {
	return this._dom.container;
}

JAK.LoginForm.Input.prototype.getValue = function() {
	return (this._placeholder ? this._placeholder.getValue() : this._dom.input.value);
}

JAK.LoginForm.Input.prototype.setValue = function(value) {
	this._placeholder ? this._placeholder.setValue(value) : this._dom.input.value = value;
}

JAK.LoginForm.Input.prototype.focus = function() {
	this._dom.input.focus();
}

JAK.LoginForm.Input.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "propertychange":
			if (e.propertyName != "value") { break; }
		case "input":
			this._dispatch("change");
		break;

		case "click":
			if (this._dom.container.classList.contains("error")) {
				this.setValue("");
				this._dispatch("reset");
			}
		break;

		case "blur":
			this._dispatch("blur");
		break;
	}
}

JAK.LoginForm.Input.prototype._dispatch = function(type) {
	var listener = this._events[type];
	if (!listener) { return; }

	var event = {
		type: type,
		target: this
	};

	if (typeof(listener) == "function") {
		listener(event);
	} else {
		listener.handleEvent(event);
	}
}

JAK.LoginForm.Input.prototype.setState = function(state) {
	if (this._state) { this._dom.container.classList.remove(this._state); }
	this._state = state;
	if (state) { this._dom.container.classList.add(state); }
}

JAK.LoginForm.Input.prototype.getState = function() {
	return this._state;
}
//FIXME co delaji ctecky pro nevidome s placeholderem? neni nutny label?

/**
 * @class Prihlasovaci okenko - obsah s loginem
 */
JAK.LoginForm.Login = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm.Login",
	VERSION: "1.1",
	DEPEND: [
		{ sClass: JAK.Login, ver: "1.0" }
	]
});

/**
 * @param {JAK.LoginForm} form
 * @param {object} conf
 */
JAK.LoginForm.Login.prototype.$constructor = function(form, conf) {
	this._form = form;
	this._conf = conf;
	this._cookieOk = true;
	this._licenceData = null; /* data pro potvrzeni licence */

	if (this._conf.checkCookie) { setInterval(this._checkCookie.bind(this), 1000); }

	this._dom = {};
	this._autofill = { // automaticky predvyplnene hodnoty formulare (login+password)
		name: "",
		pass: ""
	};		

	this._login = new JAK.Login({serviceId: this._conf.serviceId, returnURL: this._conf.returnURL});

	this._buildSubmitIframe(); // iframe, do ktereho se odesle loginForm
	this._buildForm();
	this._softHide(); // skryje form a pripravi ho pro zobrazeni

	this._win = new JAK.LoginForm.Window(this._dom.container);

	JAK.Events.onDomReady(this, "_onDomReady");

	this._login.check().then(
		this._okCheck.bind(this),
		this._errorCheck.bind(this)
	);
}

JAK.LoginForm.Login.prototype.open = function() {
	this._hideError();
	this._dom.pass.setValue(this._autofill.pass);

	this._append();
	this._win.open();
	this._form.makeEvent("login-open");

	if (window.im && this._conf.zoneId) {
		var ad = {
			zoneId: this._conf.zoneId,
			section: "/login",
			callback: this._showAd.bind(this)
		}
		im.getAds([ad], true);
	}

	this._dom.user.focus();
}

JAK.LoginForm.Login.prototype.getWindow = function() {
	return this._win;
}

JAK.LoginForm.Login.prototype.getLogin = function() {
	return this._login;
}

JAK.LoginForm.Login.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "submit":
			this._hideError();

			if (this._licenceData) {
				var checked = this._dom.form.getElementsByTagName("input")[0].checked;
				this._login.confirmLicence(this._licenceData, checked).then(
					this._okLogin.bind(this),
					this._errorLogin.bind(this)
				);
				this._licenceData = null;
				return;
			}

			var name = this._dom.user.getValue();
			if (!name) {
				JAK.Events.cancelDef(e); /* nevyplneno, zabranime odeslani, neb to nechceme ukladat (ani to nemame kam odeslat) */
				return;
			}

			document.body.insertBefore(this._dom.iframe, document.body.firstChild);
			this.tryLogin(name, this._dom.pass.getValue(), this._dom.remember.checked);
		break;

		case "reset":
			this._dom.user.setState("");
			this._dom.pass.setState("");
		break;

		case "change":
			this._dom.user.setState("");
			this._dom.pass.setState("");
		break;

		case "click":
			JAK.Events.cancelDef(e);
			this._form.openRegister();
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

JAK.LoginForm.Login.prototype._append = function() {
	JAK.DOM.clear(this._dom.form);

	if (this._cookieOk) {
		JAK.DOM.append(
			[this._dom.form,
				this._dom.textRow, this._dom.userRow,
				this._dom.passRow, this._dom.rememberRow,
				this._dom.infoRow, this._dom.helpRow,
				this._dom.line
			]
		);
	} else {
		JAK.DOM.append(
			[this._dom.form, 
				this._dom.textRow, this._dom.cookieRow,
				this._dom.infoRow, this._dom.helpRow,
				this._dom.line
			]
		);
	}

	JAK.DOM.append([this._dom.container, this._dom.ad, this._dom.form]);
}

JAK.LoginForm.Login.prototype._checkCookie = function() {
	var cookieOk = true;
	if (("cookieEnabled" in navigator) && !navigator.cookieEnabled) { cookieOk = false; }

	if (cookieOk != this._cookieOk) {
		this._cookieOk = cookieOk;
		this._append();
	}
}

JAK.LoginForm.Login.prototype._showAd = function(data) {
	if (typeof(data) == "string") { /* im2.js - je to string */
		var html = data;
		if (html.indexOf("/impress?spotId") > -1) {
			this._dom.ad.classList.add("adFull");
		} else {
			this._dom.ad.classList.remove("adFull");
		}
	} else { /* im3.js - je to struktura */
		this._dom.ad.classList[data.impress ? "add" : "remove"]("adFull");
		var html = data.spots.map(function(spot) { return spot.content; }).join("");
	}
	this._dom.ad.innerHTML = html;
	this._win.resize();
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

	this._dom.iframe = iframe;
}

JAK.LoginForm.Login.prototype._buildForm = function() {
	this._dom.container = JAK.mel("div");

	var name = this._dom.iframe.name;
	this._dom.form = JAK.mel("form", {id:"loginForm", className:"loginForm", target:name, action:this._conf.submitIframeUrl, method:"post"});

	/* atribut name nutny kvuli zapamatovani v safari */
	this._dom.user = new JAK.LoginForm.Input({type:"text", name:"username"}, {change:this, reset:this});
	this._dom.pass = new JAK.LoginForm.Input({type:"password", name:"password"}, {change:this, reset:this});

	this._dom.textRow = this._form.buildRow();
	this._dom.textRow.classList.add("text");

	this._dom.userRow = this._form.buildRow(this._dom.user.getContainer());
	this._dom.passRow = this._form.buildRow(this._dom.pass.getContainer(), JAK.mel("input", {type:"submit", value:"Přihlásit se"}));

	this._dom.remember = JAK.mel("input", {type:"checkbox", checked:true});
	var label = JAK.mel("label", {innerHTML: "Pamatovat si mě na tomto počítači (<a href='http://napoveda.seznam.cz/cz/login/prihlaseni/' target='_blank'>?</a>)"});
	label.insertBefore(this._dom.remember, label.firstChild);
	this._dom.rememberRow = this._form.buildRow(label);

	this._dom.infoRow = this._form.buildRow("Nejste zaregistrováni na Seznam.cz? <a href='#'>Registrujte se!</a>");
	this._dom.infoRow.classList.add("info");
	this._dom.helpRow = this._form.buildRow("<a href='http://napoveda.seznam.cz/cz/zapomenute-heslo.html'>Zaslat zapomenuté heslo</a>");

	var registerLink = this._dom.infoRow.querySelector("a");
	JAK.Events.addListener(registerLink, "click", this);

	JAK.Events.addListener(this._dom.form, "submit", this);

	this._dom.ad = JAK.mel("div", {id:"loginAd"});
	this._dom.line = JAK.mel("div", {id:"line"});

	var url = "http://napoveda.seznam.cz/cz/povoleni-cookie-v-internetovych-prohlizecich.html";
	switch (JAK.Browser.client) {
		case "ie": 
			switch (parseInt(JAK.Browser.version)) {
				case 8: url = "http://napoveda.seznam.cz/cz/email/internet-explorer/povoleni-souboru-cookies-internet-explorer/#ie8"; break;
				case 9: url = "http://napoveda.seznam.cz/cz/email/internet-explorer/povoleni-souboru-cookies-internet-explorer/#ie9"; break;
				default: url = "http://napoveda.seznam.cz/cz/email/internet-explorer/povoleni-souboru-cookies-internet-explorer/#ie10"; break;
			}
		break;

		case "gecko": url = "http://napoveda.seznam.cz/cz/email/mozilla-firefox/povoleni-souboru-cookies/povoleni-souboru-cookies-firefox/"; break;
		case "chrome": url = "http://napoveda.seznam.cz/cz/email/google-chrome/smazani-docasnych-souboru-cookies-chrome/"; break;
		case "opera": url = "http://napoveda.seznam.cz/cz/email/opera/smazani-docasnych-souboru-cookies-opera/"; break;
		case "safari": url = "http://napoveda.seznam.cz/cz/email/apple-safari-mac-os/smazani-docasnych-souboru-cookies-safari/"; break;
	}
	this._dom.cookieRow = this._form.buildRow("Pro správné přihlášení je potřeba zapnout cookies. Nevíte si rady? Podívejte se do <a target='_blank' href='" + url + "'>nápovědy</a>.");
}

JAK.LoginForm.Login.prototype._buildLicence = function(cdata) {
	this._licenceData = cdata;

	this._dom.form.innerHTML = "";
	this._dom.form.className += " licence";

	this._dom.form.appendChild(this._form.buildRow("<strong>Zjednodušili jsme Smluvní podmínky</strong>"));
	this._dom.form.appendChild(this._form.buildRow("Aby pro vás byly Smluvní podmínky srozumitelnější, rozhodli jsme se je k 1. 2. 2015 zpřehlednit. Přestože se pro vás nic nemění, prosíme o jejich opětovné odsouhlasení nejpozději do 31. 1. 2015."));
	this._dom.form.appendChild(this._form.buildRow("Pro připomenutí tady jsou nejdůležitější body:"));
	var html = "<ul> \
				<li>S vaším e-mailovým účtem se můžete přihlásit i do našich ostatních služeb (Firmy.cz, Sklik.cz, Seznam peněženka, Mapy.cz, Lidé.cz aj.)</li> \
				<li>Některé naše služby před prvním přihlášením vyžadují souhlas se zpracováním osobních údajů</li> \
			</ul>";
	this._dom.form.appendChild(this._form.buildRow(html));
	this._dom.form.appendChild(this._form.buildRow("V plném znění si podmínky můžete přelouskat v naší <a href='http://napoveda.seznam.cz/cz/smluvni-podminky-pro-registraci-uzivatelu-1-1-2015.html' target='_blank'>Nápovědě</a>."));

	var row = this._form.buildRow("<label><input type='checkbox' />Souhlasím s novými podmínkami</label>")
	row.className = "agree";
	this._dom.form.appendChild(row);
	this._dom.form.appendChild(this._form.buildRow("<input type='submit' value='Pokračovat' />"));
	this._dom.form.appendChild(this._dom.line);
}

JAK.LoginForm.Login.prototype._onDomReady = function() {
	setTimeout(this._onFormsReady.bind(this), 100);
}

/**
 * Touto dobou uz by mel byt formular predvyplneny automaticky ulozenym jmenem/heslem
 */
JAK.LoginForm.Login.prototype._onFormsReady = function() {
	this._autofill.user = this._dom.user.getValue();
	this._autofill.pass = this._dom.pass.getValue();

	this._dom.user.setPlaceholder("Libovolný e-mail");
	this._dom.pass.setPlaceholder("Heslo");
	this._dom.user.setValue(this._autofill.user);
	this._dom.pass.setValue(this._autofill.pass);
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
	this._dom.textRow.innerHTML = "";
	this._dom.textRow.classList.add("error");

	var strong = JAK.mel("strong");
	strong.appendChild(JAK.ctext(text));
	this._dom.textRow.appendChild(strong);

	if (href) {
		var link = JAK.mel("a", {href:href, target:"_blank", innerHTML:"?"});
		this._dom.textRow.appendChild(JAK.ctext(" ("));
		this._dom.textRow.appendChild(link);
		this._dom.textRow.appendChild(JAK.ctext(")"));
	}


	this._dom.user.focus();
}

JAK.LoginForm.Login.prototype._hideError = function() {
	this._dom.textRow.classList.remove("error");
	this._dom.textRow.innerHTML = this._conf.text;
	this._dom.user.setState("");
	this._dom.pass.setState("");
}

JAK.LoginForm.Login.prototype._weakPassword = function(crypted) {
	var ul = JAK.mel("ul", {}, {marginBottom:"60px"}); /* aby nebyla kolize s psim zobackem */
	var li1 = JAK.mel("li");
	var li2 = JAK.mel("li");

	var changeURL = this._login.change(crypted);
	var a1 = JAK.mel("a", {href:changeURL, innerHTML:"Změnit heslo"});
	var a2 = JAK.mel("a", {href:"#", innerHTML:"Pokračovat se současným heslem"});

	JAK.DOM.clear(this._dom.form);
	JAK.DOM.append(
		[li1, a1], [li2, a2],
		[ul, li1, li2],
		[this._dom.form, this._dom.textRow, ul]
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
			if (this._conf.autoClose) { this._form.close(); }
			this._form.makeEvent("login-done", {auto:false});
		break;

		case 201:
			var name = this._dom.user.getValue();
			location.href = this._login.openId(name);
		break;

		case 403:
		case 406:
			this._showError("Neexistující uživatel nebo chybné heslo!", "http://napoveda.seznam.cz/cz/login/jak-na-zapomenute-heslo/");
			this._dom.user.setState("error");
			this._dom.pass.setState("error");

			if (this._dom.user.getValue().toLowerCase() == "pan tau") {
				this._dom.ad.classList.add("adFull");
				this._dom.ad.classList.add("panTau");
				this._dom.ad.innerHTML = this.constructor.VERSION;
				this._win.resize();
			}
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

		case 430: /* je nutne odsouhlasit podminky */
			this._buildLicence(data.cdata);
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
	if (!this._conf.autoLogin) { return; } /* nechceme autologin */

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
