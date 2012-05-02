/**
 * @overview Nástroj, který slouží k doplnění placeholderů, včetně jejich funkcionality 
 * do prohlížečů, které atribut placeholder nepodporují.
 * @version 1.1
 * @author jelc, zara
 */
 
/**
 * @class Místodržící
 * @group jak-utils
 */
JAK.Placeholder = JAK.ClassMaker.makeClass({
	NAME: "JAK.Placeholder",
	VERSION: "1.1"
});

/**
 * @param {node || string} element Element (nebo jeho ID) který chceme doplnit o placeholder
 * @param {string} text Text placeholderu
 */
JAK.Placeholder.prototype.$constructor = function(node, text) {
	this._node = JAK.gel(node);
	this._text = text;
	this._present = false; /* je placeholder aktivni? */
	this._className = "placeholder";
	this._ec = [];
	this._autocomplete = this._node.getAttribute("autocomplete");

	if ("placeholder" in this._node) { /* umi nativni HTML5 placeholder, pouzijeme ho */
		this._node.placeholder = this._text;
	} else {
		this._ec.push(JAK.Events.addListener(this._node, "focus", this, "_focus"));
		this._ec.push(JAK.Events.addListener(this._node, "blur", this, "_blur"));
		if (this._node.form) { this._ec.push(JAK.Events.addListener(this._node.form, "submit", this, "_submit")); }
		if (!this._node.value) { this._activate(); }
	}

};

JAK.Placeholder.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
};

JAK.Placeholder.prototype.getValue = function() {
	return (this._present ? "" : this._node.value);
}

JAK.Placeholder.prototype.setValue = function(value) {
	if ("placeholder" in this._node) { /* umi nativni, neresime */
		this._node.value = value;
		return; 
	}
	
	if (value) {
		if (this._present) { this._deactivate(); } /* byl tam placeholder, ale ted je tam neprazdna hodnota*/
		this._node.value = value;
	} else {
		if (this._present) { return; } /* nic tu nebylo a nic tu nebude - neresime */
		this._activate(); /* byla tam hodnota a ted tam neni */
	}
	
}

/**
 * Zachycení fokusu na Elementu 
 * @param {object} e událost
 * @param {object} elm HTMLElement na kterém je posluchač události zavěšen
 */
JAK.Placeholder.prototype._focus = function(e,elm) {
	/* pokud jsme aktivni, nahradit na prazdno */
	if (this._present) { this._deactivate(); }
};

/**
 * Zachycení bluru na Elementu 
 * @param {object} e událost
 * @param {object} elm HTMLElement na kterém je posluchač události zavěšen
 */
JAK.Placeholder.prototype._blur = function(e,elm) {
	if (!this._node.value) { this._activate(); }
};

/**
 * Vlastní odebrání placeholderu. Volat jen pokud this._present == true.
 */
JAK.Placeholder.prototype._deactivate = function() {
	this._present = false;
	this._node.value = "";
	JAK.DOM.removeClass(this._node, this._className);
	this._setAutocomplete(this._autocomplete);
	this._setSpellcheck(true);
}

/**
 * Vlastní přidání placeholderu. Volat jen pokud:
 *   1. this._present == false,
 *   2. prvek nepodporuje HTML5 placeholder,
 *   3. hodnota inputu je prazdna
 */
JAK.Placeholder.prototype._activate = function() {
	this._present = true;
	JAK.DOM.addClass(this._node, this._className);
	this._node.value = this._text;
	this._setAutocomplete("off");
	this._setSpellcheck(false);
};

/**
 * Nastavení atribut autocomplete nebo jeho odebrání
 * @param {string} param Nová hodnota attributu, nebo null, pokud má být odebrán
 */
JAK.Placeholder.prototype._setAutocomplete = function(param) {
	if (param) {
		this._node.setAttribute("autocomplete", param);
	} else {
		this._node.removeAttribute("autocomplete");
	}
};

/**
 * Nastavení atributu spellcheck Elementu 
 * @param {bool} value Nová hodnota atributu spellcheck
 */
JAK.Placeholder.prototype._setSpellcheck = function(value) {
	if ("spellcheck" in this._node) { this._node.spellcheck = value; }
};

/**
 * Odeslání formuláře
 * @param {object} e událost
 * @param {object} elm HTMLElement na kterém je posluchač události zavěšen
 */
JAK.Placeholder.prototype._submit = function(e,elm) {
	if (this._present) { this._deactivate(); }
}
