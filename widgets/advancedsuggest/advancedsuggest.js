/**
 * @author zara 
 */

/**
 * Pokrokovy suggest s vysledky v tabulce a separatnim hledacim polem 
 */
JAK.AdvancedSuggest = JAK.ClassMaker.makeClass({
	NAME: "JAK.AdvancedSuggest",
	VERSION: "1.0",
	CLASS: "class"
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
		keyword: "id",
		url: "",
		limit: false,
		labels: [],
		image: false,
		throbber: false,
		nextopt: ""
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
	
	this._build();
	this._request = this._request.bind(this);
}

JAK.AdvancedSuggest.prototype._build = function() {
	var c = JAK.cEl("div", false, "advanced-suggest "+this.options.keyword, {position:"absolute", visibility:"hidden"});
	var s = JAK.cEl("input");
	s.type = "text";
	c.appendChild(s);

	if (this.options.throbber) {
		var t = JAK.cEl("img", false, false, {display:"none"});
		t.src = this.options.throbber;
		c.appendChild(t);
		this.dom.throbber = t;
	}

	var r = JAK.cEl("div");
	c.appendChild(r);
	
	JAK.Dom.addClass(this.dom.input, "advanced-suggest-input");
	document.body.insertBefore(c, document.body.firstChild);
	
	if (this.options.image) {
		var i = JAK.cEl("img", false, "advanced-suggest-image");
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
}

JAK.AdvancedSuggest.prototype.show = function(e, elm) {
	this._position();
	this.dom.container.style.visibility = "visible";
	
	if (elm == this.dom.image) { /* kliknuto na obrazek */
		this.dom.search.focus();
	}
	
	if (this.dom.input.value) {
		this.rqType = "input";
		this._request();
	}
}

JAK.AdvancedSuggest.prototype.hide = function() {
	this.dom.container.style.visibility = "hidden";
	this.ec.forEach(JAK.Events.removeListener, JAK.Events);
	JAK.Dom.clear(this.dom.result);
	this.ec = [];
}

JAK.AdvancedSuggest.prototype._position = function() {
	var pos = JAK.Dom.getBoxPosition(this.dom.input);
	var scroll = JAK.Dom.getScrollPos();
	pos.top += this.dom.input.offsetHeight;
	this.dom.container.style.left = pos.left + "px";
	this.dom.container.style.top = pos.top + "px";
}

JAK.AdvancedSuggest.prototype._request = function(value) {
	if (this.rqType == "input" && this.dom.input.value) {
		this.dom.search.value = this.options.keyword + ":" + this.dom.input.value;
	}
	
	var s = encodeURIComponent(this.dom.search.value);
	var url = this.options.url + "?query="+s;
	if (this.options.limit) { url += "&limit="+this.options.limit; }
	if (this.options.nextopt) { url += "&"+this.options.nextopt; }
	if (this.dom.throbber) { this.dom.throbber.style.display = ""; }
	
	var rq = new JAK.Request(JAK.Request.XML);
	rq.setCallback(this, "_response");
	rq.send(url);
}

JAK.AdvancedSuggest.prototype._link = function(id) {
	var link = JAK.cEl("tr", false, false, {cursor:"pointer"});
	var self = this;
	this.ec.push(JAK.Events.addListener(link, "click", function(e) {
		JAK.Events.cancelDef(e);
		self.dom.input.value = id;
		self.hide();
	}));
	return link;
}

JAK.AdvancedSuggest.prototype._response = function(xmlDoc) {
	this.timeout = false;
	if (this.dom.throbber) { this.dom.throbber.style.display = "none"; }
	JAK.Dom.clear(this.dom.result);
	var rows = xmlDoc.getElementsByTagName("row");
	
	if (!rows.length) {
		this.dom.result.innerHTML = "(žádné výsledky)";
		return;
	}
	
	var t = JAK.cEl("table");
	var h = JAK.cEl("thead");
	var b = JAK.cEl("tbody");
	var r = JAK.cEl("tr");
	JAK.Dom.append([t,h,b],[h,r]);
	
	/*
	var td = JAK.cEl("td");
	r.appendChild(td);
	*/
	for (var i=0;i<this.options.labels.length;i++) {
		var td = JAK.cEl("th");
		td.className = "td"+i;
		td.innerHTML = this.options.labels[i];
		r.appendChild(td);
	}
	
	for (var i=0;i<rows.length;i++) {
		var row = rows[i];
		var cols = row.getElementsByTagName("col");
		var pk = row.getAttribute("pk");

		//var r = JAK.cEl("tr");
		var r = this._link(pk);
		b.appendChild(r);
		/*
		var td = JAK.cEl("td");
		var a = this._link(pk, pk);
		td.appendChild(a);
		r.appendChild(td);
		*/
		for (var j=0;j<this.options.labels.length;j++) {
			var td = JAK.cEl("td");
			r.appendChild(td);
			td.innerHTML = cols[j].firstChild.nodeValue;
		}
	}
	
	this.dom.result.appendChild(t);
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

