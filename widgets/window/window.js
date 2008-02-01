/**
 * @overview window
 * @version 1.0
 * @author zara
*/   

SZN.Window = SZN.ClassMaker.makeClass({
	NAME: "Window",
	VERSION: "1.0",
	CLASS: "class"
});
/**
 * @class Okenko se stinem, neboli prosta tabulka s deviti prvky
 * @name SZN.Window
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>imagePath</em> - cesta k obrazkum</li>
 *		<li><em>imageFormat</em> - pripona obrazku (png/gif/jpg)</li>
 *		<li><em>sizes</em> - pole ctyr velikosti okraju, dle hodinovych rucicek</li>
 *   <ul>
 * @constructor
 */
SZN.Window.prototype.$constructor = function(optObj) {
	this.options = {
		imagePath:"/img/shadow-",
		imageFormat:"png",
		sizes:[6,6,6,6]
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }

	/**
	 * @field content vnitrni bunka, do ktere se da pridavat dalsi obsah
	 */
	this.content = false;
	/**
	 * @field vnejsi prvek
	 */
	this.container = false;
	this._buildDom();
}

/**
 * @method  Tvorba DOM stromu.
 */
SZN.Window.prototype._buildDom = function() {
	var imageNames = [
		["lt","t","rt"],
		["l","","r"],
		["lb","b","rb"]
	]
	this.container = SZN.cEl("div",false,"window-container",{position:"relative",zIndex:10});
	var table = SZN.cEl("table",false,false,{borderCollapse:"collapse",position:"relative"});
	var tbody = SZN.cEl("tbody");
	SZN.Dom.append([table,tbody],[this.container,table]);
	
	for (var i=0;i<3;i++) {
		var tr = SZN.cEl("tr");
		tbody.appendChild(tr);
		for (var j=0;j<3;j++) {
			var td = SZN.cEl("td");
			td.style.padding = "0px";
			td.style.margin = "0px";
			if (i == 1 && j == 1) { this.content = td; }
			var im = imageNames[i][j];
			
			if (im) { /* image */
				var path = this.options.imagePath + im + "." + this.options.imageFormat;
				if (SZN.Browser.klient == "ie" && this.options.imageFormat.match(/png/i)) {
					td.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+path+"',sizingMethod='scale')";
				} else {
					td.style.backgroundImage = "url("+path+")";
				} /* not ie */
			}
			
			/* dimensions */
			if (i == 0) { td.style.height = this.options.sizes[0]+"px"; }
			if (i == 2) { td.style.height = this.options.sizes[2]+"px"; }
			if (j == 0) { td.style.width = this.options.sizes[3]+"px"; }
			if (j == 2) { td.style.width = this.options.sizes[1]+"px"; }
			if (j == 1 && i != 1) { td.style.width = "auto"; }
			if (i == 1 && j == 1) { td.className = "window-content"; }
			
			tr.appendChild(td);
		} /* for all columns */
	} /* for all rows */
}

/**
 * @method Explicitni desktruktor. Smaze vsechny vlastnosti.
 */
SZN.Window.prototype.$destructor = function() {
	for (var p in this) { this[p] = null; }
}

/**
 * Ukazani okna
 */
SZN.Window.prototype.show = function() {
	this.container.style.display = "";
}

/**
 * Schovani okna
 */
SZN.Window.prototype.hide = function() {
	this.container.style.display = "none";
}

