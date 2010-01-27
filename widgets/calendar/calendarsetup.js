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
 * @overview kalendar
 * @version 2.0
 * @author zara
*/   

/**
 * CalendarSetup, pro pokrocilou praci s kalendarem - hlavne prace s vice policky. 
 * 
 * Pokud je potreba jine rozlozeni casu do dalsich policek, nebo celkove jine rozlozeni, 
 * je nutne upravit metodu manage a v ni slozeni data z techto inputu do data, ktere 
 * bude zobrazeno v kalendari (dateString).
 * @group jak-widgets
 * @static
 * @example
 * Pro inicializaci 1,2,3 polickove konstelace lze pouzit:
 * JAK.Calendar.Setup.setup(false, "[vybrat datum]", {pickTime: true, defaultFormat:["j.n.Y", "H:i"]}, ["calendar_value","calendar_time_value"]);
 * JAK.Calendar.Setup.setup(false, "[vybrat datum]", {pickTime: true, defaultFormat:["j.n.Y", "H","i"]}, ["cdate","chour","cmin"]);
 * JAK.Calendar.Setup.setup(false, "[vybrat datum]", {pickTime: false, defaultFormat:["j.n.Y"]}, ["fulldate"]);
 */
JAK.Calendar.Setup = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Calendar.Setup",
	VERSION: "1.0"
});

JAK.Calendar.Setup.manage = function(calendar, clickElm, targetElm) { /* setup calendar for two elements */
		var callback = function() {
			for (var i = 0; i < targetElm.length; i++) {
				JAK.gEl(targetElm[i]).value = arguments[i] ? arguments[i] : ''; 
			}
		}
		var click = function(e,elm) { 
			var pos = JAK.DOM.getBoxPosition(clickElm);
			var x = pos.left;
			var y = pos.top + clickElm.offsetHeight + 1;
			var dateString = '';
			if (targetElm.length == 2) {
				dateString += JAK.gEl(targetElm[0]).value+' '+JAK.gEl(targetElm[1]).value;
			} else if (targetElm.length == 3) {
				dateString += JAK.gEl(targetElm[0]).value+' '+JAK.gEl(targetElm[1]).value+':'+JAK.gEl(targetElm[2]).value;
			} else {
				dateString += JAK.gEl(targetElm[0]).value;
			}
			
			
			calendar.pick(x,y,dateString,callback); 
		}
		calendar.ec.push(JAK.Events.addListener(clickElm,"click",window,click,false,true));
	}
	
	
	/**
	 * vytvareni odkazoveho buttonku
	 */				 				
	JAK.Calendar.Setup.createButton = function(inputs, label, imageUrl) {
		if (!inputs instanceof Array) {
			inputs = [inputs];
		}
	
		click = JAK.Calendar._createButton(imageUrl, label);
		var lastInput = JAK.gEl(inputs[inputs.length-1]); 
		lastInput.parentNode.insertBefore(click,lastInput.nextSibling);
		
		return click;
	}
	
	JAK.Calendar.Setup.setup = function(imageUrl, label, optObj, inputs) {
		var cal = new JAK.Calendar(optObj);
		var click = JAK.Calendar.Setup.createButton(inputs, label, imageUrl);
		JAK.Calendar.Setup.manage(cal, click, inputs);
	}
			
			
				
