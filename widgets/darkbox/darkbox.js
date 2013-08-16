/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview zatmívač stránky
 * @version 1.0
 * @author ethan
*/   

/**
 * @class Darkbox
 * @group jak-widgets
 */
JAK.Darkbox = JAK.ClassMaker.makeClass({
	NAME: "JAK.Darkbox",
	VERSION: "1.0"
});

JAK.Darkbox.container = JAK.mel("div", { id: "darkbox-container-all" });

/**
 * @param {object} [conf] asociativní pole parametrů
 * @param {string} [conf.className="darkbox"] prefix CSS třídy, která se bude používat
 */
JAK.Darkbox.prototype.$constructor = function(conf) {
	this._conf = {
		className: "darkbox"
	}
	for (var p in conf) { this._conf[p] = conf[p]; }
	
	this._dom = [];
	this._ec = [];
	this._visible = false;
	
	this._build();
}

JAK.Darkbox.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
}

JAK.Darkbox.prototype._build = function() {
	this._dom.dark = JAK.mel("div", { className: this._conf.className + "-dark" }, { display: "none" });
	JAK.Darkbox.container.appendChild(this._dom.dark);
	this._ec.push(JAK.Events.addListener(this._dom.dark, "click", this, "_clickDark"));
	
	this._dom.container = JAK.mel("div", { className: this._conf.className });	
	this._dom.wrapper = JAK.mel("div", { className: this._conf.className + "-wrapper hidden" });
	this._dom.wrapper.appendChild(this._dom.container);
	
	if (!JAK.Darkbox.container.parentNode) {
		var anchor = JAK.idGenerator();
		var skipLink = JAK.mel("a", { href: "#" + anchor, innerHTML: "Přeskočit všechny fotogalerie", className: "blind" });
		document.body.appendChild(skipLink);
		document.body.appendChild(JAK.Darkbox.container);
		document.body.appendChild(JAK.mel("a", { id: anchor }));
	}
	
	JAK.Darkbox.container.appendChild(this._dom.wrapper);
}

/**
 * Zobrazí darkbox a jeho obsah
 */
JAK.Darkbox.prototype.show = function() {
	this._visible = true;
	/* predchazi opakovanemu renderovani v IE, ktere se tam obcas rozbije
	 * a rozbite zustane uz naporad - proto ne display = "none"/""
	 */
	this._dom.wrapper.classList.remove("hidden");
	this._dom.dark.style.display = "";
}

/**
 * Skryje darkbox a jeho obsah
 */
JAK.Darkbox.prototype.hide = function() {
	this._visible = false;
	/* predchazi opakovanemu renderovani v IE, ktere se tam obcas rozbije
	 * a rozbite zustane uz naporad - proto ne display = "none"/""
	 */
	this._dom.wrapper.classList.add("hidden");
	this._dom.dark.style.display = "none";
}

/**
 * Nastavi obsah darkboxu
 * @param {HTMLElement} [content]width CSS vyska
 */
JAK.Darkbox.prototype.setContent = function(content) {
	this._dom.container.appendChild(content);
}

/**
 * Vrací true, pokud je darkbox aktivní/viditený, jinak vrací false
 */
JAK.Darkbox.prototype.isVisible = function() {
	return this._visible;
}

JAK.Darkbox.prototype._clickDark = function(e) {
	this.hide();
}
