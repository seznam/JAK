"use strict";
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Základní nástroje pro práci s "dekorátory".
 * Úvozovky okolo názvu jsou na místě, neb nejde o realizaci návrhového vzoru,
 * ale o naše vlastní, monkeypatch-based řešení.
 * @version 2.0
 * @author zara
 */   

/**
 * @class Abstraktní dekorátor, jedináček
 * @group jak
 */
JAK.AbstractDecorator = JAK.ClassMaker.makeSingleton({
	NAME: "JAK.AbstractDecorator",
	VERSION: "2.0"
});

/**
 * Dekorační metoda
 * @param {object} instance To, co chceme poupravit
 * @returns {object} Vrací to, co obdrží
 */
JAK.AbstractDecorator.prototype.decorate = function(instance) {
	instance.$super = this._$super;
	if (!instance.__decorators) { instance.__decorators = []; }
	instance.__decorators.push(this.constructor);
	return instance;
}

/**
 * Metoda volání "předka", magie pro otrlé.
 * Volá stejně pojmenovanou metodu objektu před odekorováním. 
 * Pokud je voláno z neodekorované metody, chová se jako $super z ClassMakeru.
 */
JAK.AbstractDecorator.prototype._$super = function() {
	var stack = JAK.ClassMaker.stack;

	var currentName = stack.names[stack.names.length-1];
	var currentMethod = stack.methods[stack.methods.length-1];
	var currentOwner = currentMethod.owner;

	var decorators = this.__decorators || [];
	var index = decorators.indexOf(currentOwner);
	var currentDecorator = (index == -1 ? null : decorators[index]);

	if (!currentDecorator) {
		/** 
		 * Metoda, ze ktere je volan $super, neni definovana v zadnem dekoratoru.
		 * Chteme tedy volat normalne metodu predka - kod je vybrakovan z ClassMakeru (_$super).
		 */
		if (!currentOwner) { throw new Error("Cannot find current method owner"); }
		var parent = currentOwner.EXTEND;
		
		if (!parent) { throw new Error("No super-class available"); }
		if (!parent.prototype[currentName]) { throw new Error("Super-class doesn't have method '"+currentName+"'"); }

		var func = parent.prototype[currentName];
		return func.apply(this, arguments);
		
	} else {
		/* pokusime se najit predchozi dekorator s takto pojmenovanou metodou */
		var i = index-1;
		while (i >= 0) {
			var d = decorators[i];
			if (d.prototype[currentName]) { /* predchudce; zavolame */
				return d.prototype[currentName].apply(this, arguments);
			}
			i--;
		}
		
		/* predchudcem teto metody je primo prototypova metoda instance */
		var obj = this.constructor.prototype;
		if (!(currentName in obj)) { throw new Error("Function '"+currentName+"' has no undecorated parent"); }
		return obj[currentName].apply(this, arguments);
	}
}

/**
 * @class Automatický dekorátor - předá instanci veškeré své metody
 * @augments JAK.AbstractDecorator
 */
JAK.AutoDecorator = JAK.ClassMaker.makeSingleton({
	NAME: "JAK.AutoDecorator",
	VERSION: "1.0",
	EXTEND: JAK.AbstractDecorator
});

/**
 * @see JAK.AbstractDecorator#decorate
 */
JAK.AutoDecorator.prototype.decorate = function(instance) {
	this.$super(instance);
	var exclude = ["constructor", "$super", "_$super", "decorate"];
	
	for (var p in this) {
		if (exclude.indexOf(p) != -1) { continue; }
		instance[p] = this[p];
	}
}
