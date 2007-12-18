/**
 * @overview dom-related funkce
 * @version 3.0
 * @author zara, koko, jelc
 */

/**
 * @static
 * @name SZN.Dom
 * @class staticka trida posytujici nektere prakticke metody na upravy DOM stromu
 */
SZN.Dom = SZN.ClassMaker.makeClass({
	NAME: "Dom",
	VERSION: "3.1",
	CLASS: "static"
});

/**
 * Vytvori DOM node, je mozne rovnou zadat id, CSS tridu a styly
 * @param {String} tagName jmeno tagu (lowercase)
 * @param {String} id id uzlu
 * @param {String} className nazev CSS trid(y)
 * @param {Object} styleObj asociativni pole CSS vlastnosti a jejich hodnot
 */
SZN.cEl = function(tagName,id,className,styleObj) {
	var node = document.createElement(tagName);
	if (arguments.length == 1) { return node; }
	if (id) { node.id = id; }
	if (className) { node.className = className; }
	if (styleObj) for (p in styleObj) {
		node.style[p] = styleObj[p];
	}
	return node;
}
	
/**
 * Alias pro document.createTextNode
 * @param {String} str retezec s textem
 */
SZN.cTxt = function(str) {
	return document.createTextNode(str);
}
	
/**
 * @static
 * @method zjednoduseny pristup k metode DOM document.getElementById
 * @param {string} ids id HTML elementu, ktery chceme ziskat,
 * NEBO primo element
 * @returns {object} HTML element s id = ids, pokud existuje, NEBO element specifikovany jako parametr
 */
 SZN.gEl = function(ids){
	if (typeof(ids) == "string") {
		return document.getElementById(ids);
	} else { return ids; }
}

/**
 * Propoji zadane DOM uzly
 * @param {Array} pole1...poleN libovolny pocet poli; pro kazde pole se vezme jeho prvni prvek a ostatni 
 *   se mu navesi jako potomci
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
 * Otestuje, ma-li zadany DOM uzel danou CSS tridu
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
 * @return true|false
 */
SZN.Dom.isClass = function(element,className) {
	var arr = element.className.split(" ");
	for (var i=0;i<arr.length;i++) { 
		if (arr[i] == className) { return true; } 
	}
	return false;
}

/**
 * Prida DOM uzlu CSS tridu. Pokud ji jiz ma, pak neudela nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
 */
SZN.Dom.addClass = function(element,className) {
	if (SZN.Dom.isClass(element,className)) { return; }
	element.className += " "+className;
}

/**
 * Odebere DOM uzlu CSS tridu. Pokud ji nema, neudela nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
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
 * Vymaze (removeChild) vsechny potomky daneho DOM uzlu
 * @param {Object} element DOM uzel
 */
SZN.Dom.clear = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
}

/**
 * @method vraci velikost dokumentu, pro spravnou funkcionalitu je treba aby
 * browser rendroval HTML ve standardnim modu 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>width</em> - sirka dokumentu</li><li><em>height</em> - vyska dokumentu</li></ul> 
 */    
SZN.Dom.getDocSize = function(){
	var x = 0;
	var y = 0;		
	
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
	
	return {width:x,height:y};
};

/**
 * @method vraci polohu "obj" ve strance nebo uvnitr objektu ktery predam jako druhy 
 * argument
 * @param {object} obj HTML elmenet, jehoz pozici chci zjistit
 * @param {object} <strong>volitelny</strong> HTML element, vuci kteremu chci zjistit pozici <em>obj</em>, element musi byt jeho rodic
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
 */
SZN.Dom.getBoxPosition = function(obj, ref){
	var top = 0;
	var left = 0;
	var refBox = ref || document.body;
	while (obj && obj != refBox) {
		top += obj.offsetTop;
		left += obj.offsetLeft;
		obj = obj.offsetParent;
	}
	return {top:top,left:left};
}

/**
 * @method vraci polohu "obj" v okne nebo uvnitr objektu ktery predam jako druhy 
 * argument, zahrnuje i potencialni odskrolovani kdekoliv nad objektem
 * @param {object} obj HTML elmenet, jehoz pozici chci zjistit
 * @param {object} <strong>volitelny</strong> HTML element, vuci kteremu chci zjistit pozici <em>obj</em>, element musi byt jeho rodic
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
 */
SZN.Dom.getFullBoxPosition = function(obj, parent) {
	var pos = SZN.Dom.getBoxPosition(obj, parent);
	var scroll = SZN.Dom.getBoxScroll(obj, parent);
	return {left:pos.left-scroll.x,top:pos.top-scroll.y};
}

/**
 * @method vraci dvojici cisel, o kolik je "obj" odscrollovany vuci oknu nebo vuci zadanemu rodicovskemu objektu
 * @param {object} obj HTML elmenet, jehoz odskrolovani chci zjistit
 * @param {object} <strong>volitelny</strong> HTML element, vuci kteremu chci zjistit odskrolovani <em>obj</em>, element musi byt jeho rodic
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni scroll prvku</li><li><em>top</em>(px) - vertikalni scroll prvku</li></ul> 
 */
SZN.Dom.getBoxScroll = function(obj, ref){
	var x = 0;
	var y = 0;
	while (obj && obj != document && obj != ref) {
		/* opera debil obcas nastavi scrollTop = offsetTop, aniz by bylo odscrollovano */
		if (SZN.Browser.klient == "opera" && SZN.Dom.getStyle(obj,"display") != "block") { 
			obj = obj.parentNode;
			continue; 
		}
		/* a taky opera pocita scrollTop jak pro <body>, tak pro <html> */
		if (SZN.Browser.klient == "opera" && obj == document.documentElement) { break; }
		y += obj.scrollTop;
		x += obj.scrollLeft;
		obj = obj.parentNode;
	}	
	return {x:x,y:y};
}

/**
 * @method vraci aktualni odskrolovani stranky 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontalni odskrolovani</li><li><em>y</em>(px) - vertikalni odskrolovani</li></ul> 
 *
 */
SZN.Dom.getScrollPos = function(){
	if (document.documentElement.scrollTop || document.documentElement.scrollLeft) {
		var ox = document.documentElement.scrollLeft;
		var oy = document.documentElement.scrollTop;
	} else if (document.body.scrollTop) { 
		var ox = document.body.scrollLeft;
		var oy = document.body.scrollTop;
	} else {
		var ox = 0;
		var oy = 0;
	}
	return {x:ox,y:oy};
}

/**
 * @method vraci soucasnou hodnotu nejake css vlastnosti
 * @param {object} elm HTML elmenet, jehoz vlasnost nas zajima
 * @param {string} property retezec s nazvem vlastnosti ("border","backgroundColor",...)
 */
SZN.Dom.getStyle = function(elm, property) {
	if (document.defaultView && document.defaultView.getComputedStyle) {
		var cs = document.defaultView.getComputedStyle(elm,'');
		if (!cs) { return false; }
		return cs[property];
	} else {
		return elm.currentStyle[property];
	}
}

/**
 * @method skryva elementy ktere se mohou objevit v nejvyssi vrstve a prekryt obsah,
 * resp. nelze je prekryt dalsim obsahem (typicky &lt;SELECT&gt; v internet exploreru) 
 * @param {object | string} HTML element nebo jeho ID pod kterym chceme skryvat problematicke prvky
 * @param {array} pole obsahujici nazvy problematickych elementu
 * @param {string} kce kterou chceme provest 'hide' pro skryti 'show' nebo cokoli jineho nez hide pro zobrazeni
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
	if (action == 'hide') {
		if(typeof obj == 'string'){
			var obj = SZN.gEl(obj);
		} else {
			var obj = obj;
		}
		
		var box = this.getBoxPosition(obj);
		
		box.width =  obj.offsetWidth + box.left;
		box.height = obj.offsetHeight +box.top;	
	
		for (var e = 0; e < elems.length; ++e) {
			var elm = document.getElementsByTagName(elems[e]);
			
			for (var f = 0; f < elm.length; ++f) {
				var node = this.getBoxPosition(elm[f]);
				node.width = elm[f].offsetWidth + node.left;
				node.height = elm[f].offsetHeight + node.top;
				
				if (!((box.left> node.width) || (box.width < node.left) 
				|| (box.top > node.height) || (box.height < node.top))) {
					elm[f].style.visibility = 'hidden';
					elm[f].myPropertyHide = true;
				}
			}
		}
	} else {
		for (var e = 0; e < elems.length; ++e) {
			var elm = document.getElementsByTagName(elems[e]);
			
			for (var f = 0; f < elm.length; ++f) {
				if (typeof elm[f].myPropertyHide != 'undefined') {
					elm[f].style.visibility = 'visible';
				}
			}
		}
	}
}

/**
 * @method vrati kolekci elementu ktere maji nadefinovanou tridu <em>searchClass</em>
 * @param {string} searchClass vyhledavana trida
 * @param {object} node element dokumentu ve kterem se ma hledat, je-li null prohledava
 * se cely dokument 
 * @param {string} tag nazev tagu na ktery se ma hledani omezit, je-li null prohledavaji se vsechny elementy
 * @returns {array} pole ktere obsahuje vsechny nalezene elementy, ktere maji definovanou tridu <em>searchClass</em>
 */      
SZN.Dom.getElementsByClass = function (searchClass,node,tag) {
	var classElements = new Array();
	if ( node == null ) {
		node = document;
	}
	if ( tag == null ) {
		tag = '*';
	}
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
