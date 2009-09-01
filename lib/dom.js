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
 * @overview Statická třída posytující některé praktické metody na úpravy a práci s DOM stromem, např. vytváření a získávání elementů.
 * @version 3.6
 * @author zara, koko, jelc
 */

/**
 * Statický konstruktor, nemá smysl vytvářet jeho instance.
 * @namespace
 * @group jak
 */
SZN.Dom = SZN.ClassMaker.makeClass({
	NAME: "Dom",
	VERSION: "3.6",
	CLASS: "static"
});

/**
 * Vytvoří DOM node, je možné rovnou zadat id, CSS třídu a styly
 * @param {String} tagName jméno tagu (lowercase)
 * @param {String} id id uzlu
 * @param {String} className název CSS trid(y)
 * @param {Object} styleObj asociativní pole CSS vlastností a jejich hodnot
 * @param {Object} doc dokument, v jehož kontextu se node vyrobí (default: document)
 */
SZN.cEl = function(tagName,id,className,styleObj,doc) {
	var d = doc || document;
	var node = d.createElement(tagName);
	if (arguments.length == 1) { return node; }
	if (id) { node.id = id; }
	if (className) { node.className = className; }
	if (styleObj) { SZN.Dom.setStyle(node, styleObj); }
	return node;
}
	
/**
 * Alias pro document.createTextNode
 * @param {String} str řetězec s textem
 * @param {Object} doc dokument, v jehož kontextu se node vyrobí (default: document)
 */
SZN.cTxt = function(str, doc) {
	var d = doc || document;
	return d.createTextNode(str);
}
	
/**
 * zjednodušený přístup k metodě DOM document.getElementById
 * @static
 * @method 
 * @param {string} ids id HTML elementu, který chceme získat,
 * NEBO přímo element
 * @returns {object} HTML element s id = ids, pokud existuje, NEBO element specifikovaný jako parametr
 */
 SZN.gEl = function(ids){
	if (typeof(ids) == "string") {
		return document.getElementById(ids);
	} else { return ids; }
}

/**
 * Propoji zadané DOM uzly
 * @param {Array} pole1...poleN libovolný počet polí; pro každé pole se vezme jeho první prvek a ostatní 
 *   se mu navěsí jako potomci
 */
SZN.Dom.append = function() { /* takes variable amount of arrays */
	for (var i=0;i<arguments.length;i++) {
		var arr = arguments[i];
		var head = arr[0];
		for (var j=1;j<arr.length;j++) {
			head.appendChild(arr[j]);
		}
	}
}
	
/**
 * Otestuje, má-li zadany DOM uzel danou CSS třídu
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 * @return {bool} true|false
 */
SZN.Dom.hasClass = function(element,className) {
	var arr = element.className.split(" ");
	for (var i=0;i<arr.length;i++) { 
		if (arr[i] == className) { return true; } 
	}
	return false;
}

/**
 * Přidá DOM uzlu CSS třídu. Pokud ji již má, pak neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
SZN.Dom.addClass = function(element,className) {
	if (SZN.Dom.hasClass(element,className)) { return; }
	element.className += " "+className;
}

/**
 * Odebere DOM uzlu CSS třídu. Pokud ji nemá, neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
SZN.Dom.removeClass = function(element,className) {
	var names = element.className.split(" ");
	var newClassArr = [];
	for (var i=0;i<names.length;i++) {
		if (names[i] != className) { newClassArr.push(names[i]); }
	}
	element.className = newClassArr.join(" ");
}

/**
 * Vymaže (removeChild) všechny potomky daného DOM uzlu
 * @param {Object} element DOM uzel
 */
SZN.Dom.clear = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
}

/**
 * vrací velikost dokumentu, lze použít ve standardním i quirk módu 
 * @method  
 * @returns {object} s vlastnostmi:
 * <ul><li><em>width</em> - šířka dokumentu</li><li><em>height</em> - výška dokumentu</li></ul> 
 */    
SZN.Dom.getDocSize = function(){
	var x = 0;
	var y = 0;		
	if (document.compatMode != 'BackCompat') {
		
		if(document.documentElement.clientWidth && SZN.Browser.klient != 'opera'){
			x = document.documentElement.clientWidth;
			y = document.documentElement.clientHeight;
		} else if(SZN.Browser.klient == 'opera') {
			if(parseFloat(SZN.Browser.version) < 9.5){
				x = document.body.clientWidth;
				y = document.body.clientHeight;
			} else {
				x = document.documentElement.clientWidth;
				y = document.documentElement.clientHeight;
			}
		} 
		
		if ((SZN.Browser.klient == 'safari') || (SZN.Browser.klient == 'konqueror')){
			y = window.innerHeight; 
		}
		} else {
			x = document.body.clientWidth;
			y = document.body.clientHeight;
		}
	
	return {width:x,height:y};
};

/**
 * vrací polohu "obj" ve stránce nebo uvnitř objektu který předám jako druhý 
 * argument
 * @method 
 * @param {object} obj HTML element, jehož pozici chci zjistit
 * @param {object} [ref] <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
SZN.Dom.getBoxPosition = function(obj, ref){
	var top = 0;
	var left = 0;
	var refBox = ref || obj.ownerDocument.body;
	
	if (obj.getBoundingClientRect && !ref) { /* pro IE a absolutni zjisteni se da pouzit tenhle trik od eltona: */
		var de = document.documentElement;
		var box = obj.getBoundingClientRect();
		var scroll = SZN.Dom.getBoxScroll(obj);
		return {left:box.left+scroll.x-de.clientLeft, top:box.top+scroll.y-de.clientTop};
	}

	while (obj && obj != refBox) {
		top += obj.offsetTop;
		left += obj.offsetLeft;

		/*pro FF2, safari a chrome, pokud narazime na fixed element, musime se u nej zastavit a pripocitat odscrolovani, ostatni prohlizece to delaji sami*/
		if ((SZN.Browser.client == 'gecko' && SZN.Browser.version < 3) || SZN.Browser.client == 'safari') {
			if (SZN.Dom.getStyle(obj, 'position') == 'fixed') {
				var scroll = SZN.Dom.getScrollPos();
				top += scroll.y;
				left += scroll.x;
				break;
			}
		}

		obj = obj.offsetParent;
	}
	return {top:top,left:left};
}

/*
	Par noticek k výpočtům odscrollovaní:
	- rodič body je html (documentElement), rodič html je document
	- v strict mode má scroll okna nastavené html
	- v quirks mode má scroll okna nastavené body
	- opera dává vždy do obou dvou
	- safari dává vždy jen do body
*/

/**
 * vrací polohu "obj" v okně nebo uvnitř objektu který předáme jako druhý 
 * argument, zahrnuje i potencialni odskrolovani kdekoliv nad objektem 
 *	Par noticek k výpočtům odscrollovaní:<ul>
 *	<li>rodič body je html (documentElement), rodič html je document</li>
 *	<li>v strict mode má scroll okna nastavené html</li>
 *	<li>v quirks mode má scroll okna nastavené body</li>
 *	<li>opera dává vždy do obou dvou</li>
 *	<li>safari dává vždy jen do body </li></ul>
 * @method 
 * @param {object} obj HTML elmenet, jehož pozici chci zjistit
 * @param {object} parent <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalní pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
 SZN.Dom.getFullBoxPosition = function(obj, parent, fixed) {
	var pos = SZN.Dom.getBoxPosition(obj, parent, fixed);
	var scroll = SZN.Dom.getBoxScroll(obj, parent, fixed);
	pos.left -= scroll.x;
	pos.top -= scroll.y;
	return {left:pos.left,top:pos.top};
}

/**
 * vrací dvojici čísel, o kolik je "obj" odscrollovaný vůči oknu nebo vůči zadanému rodičovskému objektu
 * @method 
 * @param {object} obj HTML elmenet, jehož odskrolovaní chci zjistit
 * @param {object} ref <strong>volitelný</strong> HTML element, vůči kterému chci zjistit odskrolování <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální scroll prvku</li><li><em>top</em>(px) - vertikální scroll prvku</li></ul> 
 */
SZN.Dom.getBoxScroll = function(obj, ref, fixed) {
	var x = 0;
	var y = 0;
	var cur = obj.parentNode;
	var limit = ref || obj.ownerDocument.documentElement;
	var fix = false;
	while (1) {
		/* opera debil obcas nastavi scrollTop = offsetTop, aniz by bylo odscrollovano */
		if (SZN.Browser.client == "opera" && SZN.Dom.getStyle(cur,"display") != "block") { 
			cur = cur.parentNode;
			continue; 
		}
		
		/* a taky stara opera pocita scrollTop jak pro <body>, tak pro <html> - takze <body> preskocime */
		if (SZN.Browser.client == "opera" && cur == document.body) { 
			cur = cur.parentNode;
			continue; 
		}
		
		if (fixed && SZN.Dom.getStyle(cur, "position") == "fixed") { fix = true; }
		
		if (!fix) {
			x += cur.scrollLeft;
			y += cur.scrollTop;
		}
		
		if (cur == limit) { break; }
		cur = cur.parentNode;
		if (!cur) { break; }
	}
	return {x:x,y:y};
}

/**
 * vrací aktuální odskrolování stránky
 * @method  
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontální odskrolování</li><li><em>y</em>(px) - vertikální odskrolování</li></ul> 
 *
 */
SZN.Dom.getScrollPos = function(){
	if (document.documentElement.scrollTop || document.documentElement.scrollLeft) {
		var ox = document.documentElement.scrollLeft;
		var oy = document.documentElement.scrollTop;
	} else if (document.body.scrollTop || document.body.scrollLeft) { 
		var ox = document.body.scrollLeft;
		var oy = document.body.scrollTop;
	} else {
		var ox = 0;
		var oy = 0;
	}
	return {x:ox,y:oy};
}

/**
 * vraci současnou hodnotu nějaké css vlastnosti
 * @method 
 * @param {object} elm HTML elmenet, jehož vlasnost nás zajímá
 * @param {string} property řetězec s názvem vlastnosti ("border","backgroundColor",...)
 */
SZN.Dom.getStyle = function(elm, property) {
	if (document.defaultView && document.defaultView.getComputedStyle) {
		var cs = elm.ownerDocument.defaultView.getComputedStyle(elm,'');
		if (!cs) { return false; }
		return cs[property];
	} else {
		return elm.currentStyle[property];
	}
}

/**
 * nastavuje objektu konkretni styly, ktere jsou zadany v objektu pojmenovanych vlastnosti (nazev_CSS : hodnota)
 * @method 
 * @param {object} elm HTML element, jehož vlastnosti měním
 * @param {object} style objekt nastavovaných vlastností, např.: {color: 'red', backgroundColor: 'white'}
 */
SZN.Dom.setStyle = function(elm, style) {
	for (var name in style) {
		elm.style[name] = style[name];
	}
}

/**
 * Přidá do dokumentu zadaný CSS řetězec
 * @param {string} css Kus CSS deklarací
 * @returns {node} vyrobený prvek
 */
SZN.Dom.writeStyle = function(css) {
	var node = SZN.cEl("style");
	node.type = "text/css";
	if (node.styleSheet) { /* ie */
		node.styleSheet.cssText = css;
	} else { /* non-ie */
		node.appendChild(SZN.cTxt(css));
	}
	var head = document.getElementsByTagName("head");
	if (head.length) {
		head = head[0];
	} else {
		head = SZN.cEl("head");
		document.documentElement.appendChild(head, document.body);
	}
	head.appendChild(node);
	return node;
}

/**
 * skrývá elementy které se mohou objevit v nejvyšší vrstvě a překrýt obsah,
 * resp. nelze je překrýt dalším obsahem (typicky &lt;SELECT&gt; v internet exploreru)
 * @method
 * @param {object | string} HTML element nebo jeho ID pod kterým chceme skrývat problematické prvky
 * @param {array} elements pole obsahující názvy problematických elementů
 * @param {string} action akce kterou chceme provést 'hide' pro skrytí 'show' nebo cokoli jiného než hide pro zobrazení
 * @examples 
 *  <pre>
 * SZN.Dom.elementsHider(SZN.gEl('test'),['select'],'hide')
 * SZN.Dom.elementsHider(SZN.gEl('test'),['select'],'show')
 *</pre>   									
 *
 */     
SZN.Dom.elementsHider = function (obj, elements, action) {
	var elems = elements;
	if (!elems) { elems = ["select","object","embed","iframe"]; }
	
	/* nejprve zobrazit vsechny jiz skryte */
	var hidden = arguments.callee.hidden;
	if (hidden) {
		hidden.forEach(function(node){
			node.style.visibility = "visible";
		});
		arguments.callee.hidden = [];
	}
	
	function testParent(node) {
		var ok = false;
		var cur = node;
		while (cur.parentNode && cur != document) {
			if (cur == obj) { ok = true; }
			cur = cur.parentNode;
		}
		return ok;
	}
	
	if (action == "hide") { /* budeme schovavat */
		if (typeof obj == 'string') { obj = SZN.gEl(obj); }
		var hidden = [];
		var box = this.getBoxPosition(obj);
		
		box.width =  obj.offsetWidth + box.left;
		box.height = obj.offsetHeight +box.top;	
		for (var e = 0; e < elems.length; ++e) { /* pro kazdy typ uzlu */
			var elm = document.getElementsByTagName(elems[e]);
			for (var f = 0; f < elm.length; ++f) { /* vsechny uzly daneho typu */
				var node = this.getBoxPosition(elm[f]);
				if (testParent(elm[f])) { continue; } /* pokud jsou v kontejneru, pod kterym schovavame, tak fakof */
				node.width = elm[f].offsetWidth + node.left;
				node.height = elm[f].offsetHeight + node.top;
				
				if (!((box.left> node.width) || (box.width < node.left) || (box.top > node.height) || (box.height < node.top))) {
					elm[f].style.visibility = 'hidden';
					hidden.push(elm[f]);
				}
			}
		}
		arguments.callee.hidden = hidden;
	}
}

/**
 * vrati kolekci elementů které mají nadefinovanou třídu <em>searchClass</em>
 * @method 
 * @param {string} searchClass vyhledávaná třída
 * @param {object} node element dokumentu, ve kterém se má hledat, je-li null prohledává
 * se celý dokument 
 * @param {string} tag název tagu na který se má hledání omezit, je-li null prohledávají se všechny elementy
 * @returns {array} pole které obsahuje všechny nalezené elementy, které mají definovanou třídu <em>searchClass</em>
 */      
SZN.Dom.getElementsByClass = function (searchClass,node,tag) {
	if (document.getElementsByClassName && !tag) { /* kde lze, uplatnime nativni metodu */
		var elm = node || document;
		return SZN.Dom.arrayFromCollection(elm.getElementsByClassName(searchClass));
	}

	if (document.querySelectorAll && !tag) { /* kde lze, uplatnime nativni metodu */
		var elm = node || document;
		return SZN.Dom.arrayFromCollection(elm.querySelectorAll("."+searchClass));
	}

	var classElements = [];
	var node = node || document;
	var tag = tag || "*";

	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	
	var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
	for (var i = 0, j = 0; i < elsLen; i++) {
		if (pattern.test(els[i].className)) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}

/**
 * prevede html kolekci, kterou vraci napr. documentGetElementsByTagName na pole, ktere lze
 * lepe prochazet a neni "zive" z ktere se pri prochazeni muzou ztracet prvky zasahem jineho skriptu
 * @param {HTMLCollection} col
 * @return {array}   
 */ 
SZN.Dom.arrayFromCollection = function(col) {
	var result = [];
	try {
		result = Array.prototype.slice.call(col);
	} catch(e) {
		for (var i=0;i<col.length;i++) { result.push(col[i]); }
	} finally {
		return result;
	}
}
