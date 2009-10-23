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
 * @version 1.0
 * @author zara
 */   

/**
 * @class Abstraktní dekorátor, jedináček
 */
SZN.AbstractDecorator = SZN.ClassMaker.makeClass({
	NAME: "SZN.AbstractDecorator",
	CLASS: "singleton",
	VERSION: "1.0"
});

/**
 * Dekorační metoda
 * @param {object} instance To, co chceme poupravit
 * @returns {object} Vrací to, co obdrží
 */
SZN.AbstractDecorator.prototype.decorate = function(instance) {
	return instance;
}

/**
 * @class Dekorační rozhraní; implementuje ho ten, kdo chce být dekorován
 */
SZN.Decorable = SZN.ClassMaker.makeClass({
	NAME: "SZN.Decorable",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * Odekorování této instance zadaným dekorátorem
 * @param {function} decorator Konstruktor dekorátoru
 * @returns {object} Vrací this
 */
SZN.Decorable.prototype.decorate = function(decorator) {
	var args = [this];
	for (var i=1;i<arguments.length;i++) { args.push(arguments[i]); }
	var dec = decorator.getInstance();
	return dec.decorate.apply(dec, args);
}
