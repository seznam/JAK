/**
 * @overview nastroje pro praci s html
 * @version 2.0
 * @author jelc, koko, zara
 */  

SZN.Html = {};
SZN.Html.Name = 'Html';
SZN.Html.version = 1.0;
SZN.ClassMaker.makeClass(SZN.Html);


/**
 * @method vraci velikost dokumentu, pro spravnou funkcionalitu je treba aby
 * browser rendroval HTML ve standardnim modu 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>width</em> - sirka dokumentu</li><li><em>height</em> - vyska dokumentu</li></ul> 
 */    
SZN.Html.getDocSize = function(){
	var x	= document.documentElement.clientWidth && (SZN.browser.klient != 'opera') ? document.documentElement.clientWidth : document.body.clientWidth;
	var y	= document.documentElement.clientHeight && (SZN.browser.klient != 'opera') ? document.documentElement.clientHeight : document.body.clientHeight;		
	if ((SZN.browser.klient == 'safari') || (SZN.browser.klient == 'konqueror')){
		y = window.innerHeight; 
	}
	return {width:x,height:y};
};

/**
* @method vracim polohu "obj" ve strance nebo uvnitr objektu ktery predam jako druhy 
* argument
* @param {object} obj HTML elmenet, jehoz pozici chci zjistit
* @param {object} <strong>volitelny</strong> HTML element, vuci kteremu chci zjistit pozici <em>obj</em>, element musi byt jeho rodic
* @returns {object} s vlastnostmi :
* <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
*/
SZN.Html.getBoxPosition = function(obj){
	if(arguments[1]){
		return this._getInBoxPosition(obj,arguments[1])
	} else {
		return this._getBoxPosition(obj)
	}
};

/**
 * @private
 * @method vypocitava pozici elementu obj vuci elementu refBox
 * @param {object} obj HTML elmenet, jehoz pozici chci zjistit
 * @param {object} refBox element vuci kteremu budeme polohu zjistovat musi byt rodic <em>obj</em>
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
*/    
SZN.Html._getInBoxPosition = function(obj,refBox){
	var top = 0;
	var left = 0;
	do {
		top += obj.offsetTop;
		left += obj.offsetLeft;
		obj = obj.offsetParent;
	} while	(obj.offsetParent != refBox);
	return {top:top,left:left};
};

/**
 * @private
 * @method vypocitava pozici elementu obj vuci elementu refBox
 * @param {object}  obj HTML elmenet, jehoz pozici chci zjistit
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
*/ 
SZN.Html._getBoxPosition = function(obj){
	var top = 0;
	var left = 0;
	while (obj.offsetParent){
		top += obj.offsetTop;
		left += obj.offsetLeft;
		obj = obj.offsetParent;	
	} 	
	return {top:top,left:left};
};

/*
 * @method vraci aktualni ooskrolovani stranky 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontalni odskrolovani</li><li><em>y</em>(px) - vertikalni odskrolovani</li></ul> 
 *
 */
SZN.Html.getScrollPos = function(){
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
};


/**
 * @method skryva elementy ktere se mohou objevit v nejvyssi vrstve a prekryt obsah,
 * resp. nelze je prekryt dalsim obsahem (typicky &lt;SELECT&gt; v internet exploreru) 
 * @param {object | string} HTML element nebo jeho ID pod kterym chceme skryvat problematicke prvky
 * @param {array} pole obsahujici nazvy problematickych elementu
 * @param {string} kce kterou chceme provest 'hide' pro skryti 'show' nebo cokoli jineho nez hide pro zobrazeni
 * @examples 
 *  <pre>
 * SZN.elementsHider(SZN.gEl('test'),[select],'hide')
 * SZN.elementsHider(SZN.gEl('test'),[select],'show')
 *</pre>   									
 *
 */     
 
SZN.Html.elementsHider = function (obj, elements, action) {
	if (action == 'hide') {
		if(typeof obj == 'string'){
			var obj = SZN.gEl(obj);
		} else {
			var obj = obj;
		}
		
		var box = this.getBoxPosition(obj);
		
		box.width =  obj.offsetWidth + box.left;
		box.height = obj.offsetHeight +box.top;	
	
		for (var e = 0; e < elements.length; ++e) {
			var elm = document.getElementsByTagName(elements[e]);
			
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
		for (var e = 0; e < elements.length; ++e) {
			var elm = document.getElementsByTagName(elements[e]);
			
			for (var f = 0; f < elm.length; ++f) {
				if (typeof elm[f].myPropertyHide != 'undefined') {
					elm[f].style.visibility = 'visible';
				}
			}
		}
	}
};

/**
 * @method vrati kolekci elementu ktere maji nadefinovanou tridu <em>searchClass</em>
 * @param {string} searchClass vyhledavana trida
 * @param {object} node element dokumentu ve kterem se ma hledat, je-li null prohledava
 * se cely dokument 
 * @param {string} tag nazev tagu na ktery se ma hledani omezit, je-li null prohledavaji se vsechny elementy
 * @returns {array} pole ktere obsahuje vsechny nalezene elementy, ktere maji definovanou tridu <em>searchClass</em>
 */      
SZN.Html.getElementsByClass = function (searchClass,node,tag) {
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
};

