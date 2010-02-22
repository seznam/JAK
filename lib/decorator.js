/*
Licencováno pod MIT Licencí

© 2008 Seznam.cz, a.s.

Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.

Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené 
soubory (dále jen „software“) je oprávněn k nakládání se softwarem bez 
jakýchkoli omezení, včetně bez omezení práva software užívat, pořizovat si 
z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě 
(podlicence) či prodávat jeho kopie, za následujících podmínek:

- výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo 
podstatných součástech Softwaru.

- software je poskytován tak jak stojí a leží, tzn. autor neodpovídá 
za jeho vady, jakož i možné následky, ledaže věc nemá vlastnost, o níž autor 
prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.



Licenced under the MIT License

Copyright (c) 2008 Seznam.cz, a.s.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
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
	instance.__decorators.push(this);
	return instance;
}

/**
 * Metoda volání "předka", magie pro otrlé.
 * Volá stejně pojmenovanou metodu objektu před odekorováním. 
 * Pokud je voláno z neodekorované metody, chová se jako $super z ClassMakeru.
 */
JAK.AbstractDecorator.prototype._$super = function() {
	var caller = arguments.callee.caller;
	if (!caller) { throw new Error("Function.prototype.caller not supported"); }

	var decorators = this.__decorators || [];
	var obj = null; /* objekt, jehoz metodu chceme volat */
	var name = null; /* nazev metody */
	
	var i = decorators.length;
	while (i--) { /* projdu vsechny naaplikovane dekoratory */
		var d = decorators[i];
		/**
		 * Hledam dve veci:
		 *  - jak se jmenuje metoda, ze ktere je $super volan,
		 *  - kde je tato metoda deklarovana pred timto dekoratorem
		 */
		
		if (!obj && name && (name in d)) { obj = d; break; } /* mame predchozi objekt s metodou */
		
		for (var p in d) { /* hledame objekt s touto metodou a jeji nazev */
			if (!name && caller == d[p]) { name = p; break; }
		}
	}

	if (!name) {
		/** 
		 * Metoda, ze ktere je volan $super, neni definovana v zadnem dekoratoru.
		 * Chteme tedy volat normalne metodu predka - kod je vybrakovan z ClassMakeru (_$super).
		 */
		var owner = caller.owner || this.constructor; /* toto je trida, kde jsme "ted" */

		var callerName = false;
		for (var name in owner.prototype) {
			if (owner.prototype[name] == caller) { callerName = name; }
		}
		if (!callerName) { throw new Error("Cannot find supplied method in constructor"); }
		
		var parent = owner.EXTEND;
		if (!parent) { throw new Error("No super-class available"); }
		if (!parent.prototype[callerName]) { throw new Error("Super-class doesn't have method '"+callerName+"'"); }

		var func = parent.prototype[callerName];
		return func.apply(this, arguments);
		
	} else if (!obj) {
		/**
		 * Predchudcem teto metody je primo prototypova metoda instance
		 */
		obj = this.constructor.prototype;
		if (!(name in obj)) { throw new Error("Function '"+name+"' has no undecorated parent"); }
	}
	
	return obj[name].apply(this, arguments);
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
