SZN.Html = function(){

}

SZN.Html.Name = 'Html';
SZN.Html.version = '1.0';
SZN.ClassMaker.makeClass(SZN.Html);

/* vracim rozmery documentu */
SZN.Html.prototype.getDocSize = function(){
	var x	= document.documentElement.clientWidth && (SZN.browser.klient != 'op') ? document.documentElement.clientWidth : document.body.clientWidth;
	var y	= document.documentElement.clientHeight && (SZN.browser.klient != 'op') ? document.documentElement.clientHeight : document.body.clientHeight;		
	if ((SZN.browser.klient == 'saf') || (SZN.browser.klient == 'kon')){
		y = window.innerHeight; 
	}
	return {width:x,height:y};
};

/*
* vracim polohu "obj" ve strance nebo uvnitr objektu ktery predam jako druhy 
* argument
* varci objekt s vlastnostmi top a left
* argumenty:
* obj [htmlElement] - element jehoz pozici chci zjistit
* volitelne druhy argument stejneho typu vuci kteremu chci pozici zjistit
*/
SZN.Html.prototype.getBoxPosition = function(obj){
	if(arguments[1]){
		return this._getInBoxPosition(obj,arguments[1])
	} else {
		return this._getBoxPosition(obj)
	}
};

/* vraci pozici uvnitr objektu refBox */
SZN.Html.prototype._getInBoxPosition = function(obj,refBox){
	var top = 0;
	var left = 0;
	do {
		top += obj.offsetTop;
		left += obj.offsetLeft;
		obj = obj.offsetParent;
	} while	(obj.offsetParent != refBox);
	return {top:top,left:left};
};

/* vraci pozici ve strance */
SZN.Html.prototype._getBoxPosition = function(obj){
	var top = 0;
	var left = 0;
	while (obj.offsetParent){
		top += obj.offsetTop;
		left += obj.offsetLeft;
		obj = obj.offsetParent;	
	} 	
	return {top:top,left:left};
};

/* vraci odscrollovani stranky */
SZN.Html.prototype.getScrollPos = function(){
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

/* schovava problematicke elementy pouziva se hlavne  pro IE
   pokud prvek predany jako 'obj' nebo s id 'obj' prekryva problematicke elementy nadefinovane
   v 'elements' nastavi se temto visibility hodnotu 'action' zmenit hodnotu lze opetovnym volanim
   s jinou hodnotou action
   
   argumenty:
   	obj [string | htmlElement]	- 	id objektu, nebo objekt pro ktery budeme skryvat
   									problematicke prvky
   elements [array]			 	- 	pole obsahujici nazvy problematickych elementu
   action [string]				-	akce kterou chceme provest 'hide' pro skryti
   									'show' nebo cokoli jineho nez hide pro zobrazeni
   priklad:
   	SZN.elementsHider('test',[select],'hide') skryje vsechny SELECTY ktere by
   	zasahovaly do elementu s id 'test'
   	SZN.elementsHider('test',[select],'show')
   	alternativne:
   	SZN.elementsHider(SZN.gEl('test'),[select],'hide')
   	SZN.elementsHider(SZN.gEl('test'),[select],'show')

 */
SZN.Html.prototype.elementsHider = function (obj, elements, action) {
	if (action == 'hide') {
		if(typeof obj == 'string'){
			var obj = SZN.gEl(obj);
		} else {
			var obj = obj;
		}
		var box = SZN.getBoxPosition(obj);
		
		box.width =  obj.offsetWidth + box.left;
		box.height = obj.offsetHeight +box.top;	
	
		for (var e = 0; e < elements.length; ++e) {
			var elm = document.getElementsByTagName(elements[e]);
			
			for (var f = 0; f < elm.length; ++f) {
				var node = SZN.getBoxPosition(elm[f]);
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

/* 
	VYCHOZI INICIALIZACE:
	SZN.html = new SZN.Html();

*/      
