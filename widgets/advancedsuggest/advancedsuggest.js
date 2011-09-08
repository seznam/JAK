/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @author zara 
 */

/**
 * @class Pokrokovy suggest s vysledky v tabulce a separatnim hledacim polem 
 * @group jak-widgets
 */
JAK.AdvancedSuggest = JAK.ClassMaker.makeClass({
	NAME: "JAK.AdvancedSuggest",
	VERSION: "1.0"
});

/**
 * @param {node} input Inputbox na ktery jsme naveseni
 * @param {object} [options]
 * @param {string} [options.keyword="id"] Klicove slovo
 * @param {string} [options.url=""] Zakladni cast URL dotazu
 * @param {int} [options.limit=false] Omezeni na poctu radek
 * @param {string[]} [options.labels=[]] Pole nadpisu sloupcu
 * @param {string} [options.image=false] URL obrazku ktery se vyrobi za inputem
 * @param {string} [options.throbber=false] URL throbberu
 */
JAK.AdvancedSuggest.prototype.$constructor = function(input, options) {
	this.ec = [];
	this.options = {
		sec_input: false,
		keyword: "id",
		url: "",
		limit: false,
		labels: [],
		image: false,
		throbber: false,
		nextopt: "",
		position: "absolute",
		kind: "user"
	}

	for (var p in options) { this.options[p] = options[p]; }
	
	this.timeout = false;
	this.dom = {
		input: input,
		search: null,
		container: null,
		result: null,
		throbber: null,
		image: null
	};

	this.rqType = "search";

	//vyska radku v px
	this.rowHeight = 20;
	//aktualne zobrazovana page
	this.page = 0;
	//zda se donacita dalsi stranka
	this.loading = false;
	
	this._build();
	this._request = this._request.bind(this);
}

/**
 * vytvoreni DOM struktury
 */ 
JAK.AdvancedSuggest.prototype._build = function() {
	if (JAK.Browser.client == "ie" && JAK.Browser.version == 6) {
		var c = JAK.mel("div", {className:"advanced-suggest "+this.options.kind}, {position:"absolute", display:"none"});
	} else {
		var c = JAK.mel("div", {className:"advanced-suggest "+this.options.kind}, {position:this.options.position, visibility:"hidden"});
	}
	
	var d = JAK.cel("div", "heading");
	var s = JAK.cel("input");
	s.type = "text";
	var lab = JAK.cel("label");
	lab.innerHTML = "Zadejte hledaný text:";
	var cl = JAK.cel("div", "clear");
	d.appendChild(s);
	d.appendChild(lab);

	if (this.options.throbber) {
		var t = JAK.mel("img", null, {display:"none"});
		t.src = this.options.throbber;
		d.appendChild(t);
		d.appendChild(cl);
		this.dom.throbber = t;
	}
	c.appendChild(d);
	
	
	var r = JAK.mel("div", null, {clear: 'both'});
	c.appendChild(r);
	
	JAK.DOM.addClass(this.dom.input, "advanced-suggest-input");
	document.body.insertBefore(c, document.body.firstChild);
	
	if (this.options.image) {
		var i = JAK.cel("img", "advanced-suggest-image");
		i.src = this.options.image;
		JAK.Events.addListener(i, "click", this, "show");
		this.dom.input.parentNode.insertBefore(i, this.dom.input.nextSibling);

		this.dom.image = i;
	}

	this.dom.container = c;
	this.dom.search = s;
	this.dom.result = r;
	
	JAK.Events.addListener(this.dom.input, "click", this, "show");
	JAK.Events.addListener(this.dom.input, "keypress", this, "_inputKeypress");
	JAK.Events.addListener(this.dom.search, "keypress", this, "_searchKeypress");
	JAK.Events.addListener(this.dom.container, "mousedown", JAK.Events.stopEvent);
	JAK.Events.addListener(document, "mousedown", this, "hide");
	JAK.Events.addListener(this.dom.result, 'DOMMouseScroll', this, "_mouseScroll")
	JAK.Events.addListener(this.dom.result, 'mousewheel', this, "_mouseScroll");
	JAK.Events.addListener(this.dom.result, 'scroll', this, "_scroll");
}

/**
 * po kliku do inputu otevru okno se suggestem
 */ 
JAK.AdvancedSuggest.prototype.show = function(e, elm) {
	if (!this.dom.input.disabled) {
		this._position();
		if (JAK.Browser.client == "ie" && JAK.Browser.version == 6) {
			this.dom.container.style.display = "block";
		} else {
			this.dom.container.style.visibility = "visible";
		}
		
		if (elm == this.dom.image) { /* kliknuto na obrazek */
			this.dom.search.focus();
			this._request();
		}
		
		if (this.dom.input.value) {
			this.rqType = "input";
			this._request();
		}
	}
}

/**
 * schovani suggestu na klik mimo 
 */ 
JAK.AdvancedSuggest.prototype.hide = function() {
	if (JAK.Browser.client == "ie" && JAK.Browser.version == 6) {
		this.dom.container.style.display = "none";
	} else {
		this.dom.container.style.visibility = "hidden";
	}
	this.ec.forEach(JAK.Events.removeListener, JAK.Events);
	JAK.DOM.clear(this.dom.result);
	this.ec = [];
}

/**
 * napozicovani pod input
 */ 
JAK.AdvancedSuggest.prototype._position = function() {
	var pos = JAK.DOM.getBoxPosition(this.dom.input);
	var scroll = JAK.DOM.getScrollPos();
	if (this.options.position == "fixed") {
		pos.top -= scroll.y;
		pos.left -= scroll.x;
	}
	pos.top += this.dom.input.offsetHeight;
	var width = parseInt(JAK.DOM.getStyle(this.dom.container, 'width'));
	if ( width + pos.left < window.innerWidth ) {
		this.dom.container.style.left = pos.left + "px";
	} else {  /*pokud se nevejde naseptavac na obrazovku umistim ho vlevo od inputu*/
		this.dom.container.style.left = (pos.left - width + this.dom.input.offsetWidth) + "px";
		this.dom.search.style.cssFloat = 'right';
	}
	this.dom.container.style.top = pos.top + "px";
}

/**
 * metoda volana pro dotaz na data
 */ 
JAK.AdvancedSuggest.prototype._request = function() {
	this.page = 0;
	this.loading = false;
	url = this._getUrl();
	if (this.dom.throbber) { this.dom.throbber.style.display = ""; }

	var rq = new JAK.Request(JAK.Request.XML);
	rq.setCallback(this, "_response");
	rq.send(url);
}

JAK.AdvancedSuggest.prototype._getUrl = function(page) {
	if (this.rqType == "input" && this.dom.input.value) {
		this.dom.search.value = this.options.keyword + ":" + this.dom.input.value;
	}
	
	var s = encodeURIComponent(this.dom.search.value);
	var url = this.options.url + "?query="+s;
	if (this.options.limit) { url += "&limit="+this.options.limit; }
	if (page) { url += "&page="+page; }
	if (this.options.nextopt) { url += "&"+this.options.nextopt; }
		
	return url; 
}

/**
 * volano z this._response, vytvari jeden radek tabulky
 */ 
JAK.AdvancedSuggest.prototype._link = function(id, sec_id) {
	var link = JAK.mel("tr", null, {cursor:"pointer"});
	var self = this;
	this.ec.push(JAK.Events.addListener(link, "click", function(e) {
		JAK.Events.cancelDef(e);
		self.dom.input.value = id;
		//console.log(self.options.sec_input);
		if (self.options.sec_input) {
			JAK.gel(self.options.sec_input).value = sec_id;
		}
		self.hide();
	}));
	return link;
}

/**
 * zobrazeni dat z odpovedi
 */ 
JAK.AdvancedSuggest.prototype._response = function(xmlDoc) {
	this.timeout = false;
	if (this.dom.throbber) { this.dom.throbber.style.display = "none"; }
	JAK.DOM.clear(this.dom.result);
	var rows = xmlDoc.getElementsByTagName("row");
	
	if (!rows.length) {
		this.dom.result.innerHTML = "(žádné výsledky)";
		this.dom.result.style.height = "20px";
		return;
	}
	var div = JAK.cel('div', 'table');
	var t = JAK.cel("table");
	var h = JAK.cel("thead");
	var b = JAK.cel("tbody");
	this.dom.tbody = b;
	var r = JAK.cel("tr");
	JAK.DOM.append([div,t],[t,h,b],[h,r]);
	
	/*
	* tvorba zahlavi
	*/
	for (var i=0;i<this.options.labels.length;i++) {
		var td = JAK.cel("th");
		td.className = "td"+i;
		td.innerHTML = this.options.labels[i];
		r.appendChild(td);
	}
	
	/*tvorba obsahu*/
	for (var i=0;i<rows.length;i++) {
		var row = rows[i];
		this._createTableRow(row);
	}
	
	this.dom.result.appendChild(div);
	this.rowHeight = parseInt(JAK.DOM.getStyle(r,'height'));
		
	this.dom.result.style.height = div.offsetHeight +'px';
	this.dom.result.style.overflow = 'auto';   
	
	
	var divSpacer = JAK.cel('div');
	divSpacer.style.height = 0;
	this.dom.spacer = divSpacer;
	
		
	var rows = this._getRows(xmlDoc);
	this._setSpacerHeight(rows);
	div.appendChild(this.dom.spacer);
}

/**
 * nastavy vysku DIVu, ktery roztahuje naseptavac aby slo kam scrolovat
 */ 
JAK.AdvancedSuggest.prototype._setSpacerHeight = function(rows) {
	this.dom.spacer.style.height = rows * this.rowHeight+'px';
}

JAK.AdvancedSuggest.prototype._getRows = function(xmlDoc) {
	var root = xmlDoc.getElementsByTagName("results")[0];
	var rows = root.getAttribute('itemsCount') - root.getAttribute('to') > this.options.limit ? this.options.limit :  root.getAttribute('itemsCount') - root.getAttribute('to');
	return rows;
}

/**
 * vytvori radek tabulky s obsahem naseptavani
 * @param {DOMElement} row  
 */ 
JAK.AdvancedSuggest.prototype._createTableRow = function(row){
	var cols = row.getElementsByTagName("col");
	var pk = row.getAttribute("pk");
	var sk = row.getAttribute("sk");

	var r = this._link(pk, sk);
	this.dom.tbody.appendChild(r);

	for (var j=0;j<this.options.labels.length;j++) {
		var td = JAK.cel("td");
		r.appendChild(td);
		td.innerHTML = cols[j].firstChild.nodeValue;
	}
}


JAK.AdvancedSuggest.prototype._searchKeypress = function(e, elm) {
	this.rqType = "search";
	if (this.timeout) {
		clearTimeout(this.timeout);
	}
	this.timeout = setTimeout(this._request, 500);
}

JAK.AdvancedSuggest.prototype._inputKeypress = function(e, elm) {
	this.rqType = "input";
	if (this.timeout) {
		clearTimeout(this.timeout);
	}
	this.timeout = setTimeout(this._request, 500);
}

/**
 * při pohybu kolečkem nad vysledky naseptavace
 * @param e
 * @param elm
 * @private
 */
JAK.AdvancedSuggest.prototype._mouseScroll = function(e, elm) {

	var delta = e.wheelDelta || e.detail;

	if (JAK.Browser.client == "gecko") {
		delta = -delta;
	}
	if (delta > 0) {
		//console.log('prev');
	} else {
		//console.log('next');
		this._loadMore();
	}
}

/**
 * udalost scroll v divu
 * @param e
 * @param elm
 * @private 
 */ 
JAK.AdvancedSuggest.prototype._scroll = function(e, elm) {
	this._loadMore();
}

/**
 * spolecna metoda ktera yariyuje vlastni donacteni dat
 */ 
JAK.AdvancedSuggest.prototype._loadMore = function() {
	//console.log(this.dom.result.scrollTop +'+'+ this.dom.result.offsetHeight+' > '+this.dom.tbody.parentNode.offsetHeight+' = '+(this.dom.result.scrollTop + this.dom.result.offsetHeight > this.dom.tbody.parentNode.offsetHeight))
	if (!this.loading && this.dom.result.scrollTop + this.dom.result.offsetHeight > this.dom.tbody.parentNode.offsetHeight) {
		//console.log('load');
		
		this.loading = true;
		if (this.dom.throbber) { this.dom.throbber.style.display = ""; }
		var rq = new JAK.Request(JAK.Request.XML);
		rq.setCallback(this, '_nextPageResponse');
		rq.send(this._getUrl(++this.page));
	}
}

/**
 * zpracovani odpovedi z donacteni dat
 * @param xmlDoc 
 */ 
JAK.AdvancedSuggest.prototype._nextPageResponse = function(xmlDoc) {
	//console.log(xmlDoc);
	
	if (this.dom.throbber) { this.dom.throbber.style.display = "none"; }
	
	var rows = xmlDoc.getElementsByTagName("row");
	/*tvorba obsahu*/
	for (var i=0;i<rows.length;i++) {
		var row = rows[i];
		this._createTableRow(row);
	}
	
	var result = xmlDoc.getElementsByTagName("results")[0];
	//console.log('loaded page '+this.page+' of '+result.getAttribute('pageCount'));
	if ( result && this.page < result.getAttribute('pageCount') - 1 ) {
		this.loading = false;
		//zvetseni divu
		var rows = this._getRows(xmlDoc);
		this._setSpacerHeight(rows);
	} else {
		//nulova vyska divu
		this._setSpacerHeight(0);
	}
}
