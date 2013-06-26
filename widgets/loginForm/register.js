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

	this._ec = [];
	this._dom = {};
	this._placeholder = null;

	this._register = new JAK.Register({serviceId: this._conf.serviceId});
	this._buildForm();
}

JAK.LoginForm.Register.prototype.getForm = function() {
	return this._dom.form;
}

JAK.LoginForm.Register.prototype._buildForm = function() {
	this._dom.form = JAK.mel("form", {id:"registerForm", className:"loginForm"});

	this._dom.user = JAK.mel("input", {type:"text"});
	this._dom.pass = JAK.mel("input", {type:"password"});
	this._dom.pass2 = JAK.mel("input", {type:"password"});

	var textRow = this._form.buildRow("<strong>Registrujte se</strong> a získáte obsah všech služeb Seznam.cz přímo na míru vašim potřebám.");
	var userRow = this._form.buildRow(this._dom.user);
	var passRow = this._form.buildRow(this._dom.pass, this._dom.pass2);

	var infoRow = this._form.buildRow("Registrací souhlasíte s <a href='#' target='_blank'>podmínkami služby</a>.");

	var submit = JAK.mel("input", {type:"submit", value:"Pokračovat"});

	var infoRow2 = this._form.buildRow("<a href='#' target='_blank'>Nemám e-mail a chci ho vytvořit</a>");
	infoRow2.classList.add("info");

	this._ec.push(JAK.Events.addListener(this._dom.form, "submit", this, "_submit"));	

	JAK.DOM.append(
		[this._dom.form,
			textRow, userRow, passRow,
			infoRow, submit, infoRow2
		]
	);

	this._placeholder = new JAK.Placeholder(this._dom.user, "Libovolný e-mail");
	if ("placeholder" in this._dom.pass) { 
		this._dom.pass.placeholder = "Heslo"; 
		this._dom.pass2.placeholder = "Zopakujte heslo"; 
	}

}

JAK.LoginForm.Register.prototype._submit = function(e, elm) {
	JAK.Events.cancelDef(e);
}
