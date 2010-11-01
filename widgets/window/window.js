/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview window
 * @version 2.1
 * @author zara
*/   

/**
 * @class Okenko se stinem, neboli prosta tabulka s deviti prvky
 * @group jak-widgets
 */
JAK.Window = JAK.ClassMaker.makeClass({
	NAME: "Window",
	VERSION: "2.1"
});

/**
 * @param {object} [optObj] Konfiguracni objekt
 * @param {string} [optObj.imagePath="/img/shadow-"] Cesta k obrazkum
 * @param {string} [optObj.imageFormat="png"] Pripona obrazku (png/gif/jpg)
 * @param {int[]} [optObj.sizes=[6,6,6,6]] Pole ctyr velikosti okraju, dle hodinovych rucicek
 */
JAK.Window.prototype.$constructor = function(optObj) {
	this._options = {
		imagePath:"/img/shadow-",
		imageFormat:"png",
		sizes:[6,6,6,6]
	}
	for (var p in optObj) { this._options[p] = optObj[p]; }

	/**
	 * @field content vnitrni bunka, do ktere se da pridavat dalsi obsah
	 */
	this.content = JAK.mel("div", {className:"window-content"}, {position:"relative"});;
	/**
	 * @field vnejsi prvek
	 */
	this.container = false;
	
	this._nodes = [];
	
	this._imageNames = [
		["lt","t","rt"],
		["l","","r"],
		["lb","b","rb"]
	];

	this._build();
}

/**
 * Tvorba DOM stromu - tabulky
 */
JAK.Window.prototype._build = function() {
	this.container = JAK.mel("div", {className:"window-container"}, {position:"relative",zIndex:10});
	var table = JAK.mel("table", null, {borderCollapse:"collapse",position:"relative"});
	var tbody = JAK.mel("tbody");
	JAK.DOM.append([table,tbody],[this.container,table]);
	
	for (var i=0;i<3;i++) {
		this._nodes.push([]);
		var tr = JAK.cel("tr");
		tbody.appendChild(tr);
		for (var j=0;j<3;j++) {
			var td = JAK.cel("td");
			this._nodes[i].push(td);
			td.style.padding = "0px";
			td.style.margin = "0px";
			var div = (i == 1 && j == 1 ? this.content : JAK.mel("div", null, {overflow:"hidden"}));
			td.appendChild(div);
			
			this.setImage(i, j);
			
			/* dimensions */
			if (i == 0) { div.style.height = this._options.sizes[0]+"px"; }
			if (i == 2) { div.style.height = this._options.sizes[2]+"px"; }
			if (j == 0) { div.style.width = this._options.sizes[3]+"px"; }
			if (j == 2) { div.style.width = this._options.sizes[1]+"px"; }
			if (j == 1 && i != 1) { td.style.width = "auto"; }
			
			tr.appendChild(td);
		} /* for all columns */
	} /* for all rows */
}

/**
 * @method Explicitni desktruktor. Smaze vsechny vlastnosti.
 */
JAK.Window.prototype.$destructor = function() {
	for (var p in this) { this[p] = null; }
}

/**
 * Ukazani okna
 */
JAK.Window.prototype.show = function() {
	this.container.style.display = "";
}

/**
 * Schovani okna
 */
JAK.Window.prototype.hide = function() {
	this.container.style.display = "none";
}

JAK.Window.prototype.setImage = function(row, col, image) {
	var img = this._imageNames[row][col] + (image || "");
	if (!img) { return; }
	
	var td = this._nodes[row][col];

	var path = this._options.imagePath + img + "." + this._options.imageFormat;
	if (JAK.Browser.client == "ie" && JAK.Browser.version < 7 && this._options.imageFormat.match(/png/i)) {
		td.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+path+"',sizingMethod='scale')";
	} else {
		td.style.backgroundImage = "url("+path+")";
	}
}
