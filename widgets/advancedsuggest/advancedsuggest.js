/**
 * @author zara 
 */

/**
 * Pokrokovy suggest s vysledky v tabulce a separatnim hledacim polem 
 */
SZN.AdvancedSuggest = SZN.ClassMaker.makeClass({
	NAME: "SZN.AdvancedSuggest",
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
SZN.AdvancedSuggest.prototype.$constructor = function(input, options) {
	this.ec = [];
	this.options = {
		keyword: "id",
		url: "",
		limit: false,
		labels: [],
		image: false,
		throbber: false
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
	
	this.rq = new SZN.HTTPRequest();
	this.rq.setFormat("xml");
	
	this._build();
	this._fakeRequest = SZN.bind(this, this._fakeRequest);
}

SZN.AdvancedSuggest.prototype._build = function() {
	var c = SZN.cEl("div", false, "advanced-suggest", {position:"absolute", visibility:"hidden"});
	var s = SZN.cEl("input");
	s.type = "text";
	c.appendChild(s);

	if (this.options.throbber) {
		var t = SZN.cEl("img", false, false, {display:"none"});
		t.src = this.options.throbber;
		c.appendChild(t);
		this.dom.throbber = t;
	}

	var r = SZN.cEl("div");
	c.appendChild(r);
	
	SZN.Dom.addClass(this.dom.input, "advanced-suggest-input");
	document.body.insertBefore(c, document.body.firstChild);
	
	if (this.options.image) {
		var i = SZN.cEl("img", false, "advanced-suggest-image");
		i.src = this.options.image;
		SZN.Events.addListener(i, "click", this, "show");
		this.dom.input.parentNode.insertBefore(i, this.dom.input.nextSibling);
		this.dom.image = i;
	}

	this.dom.container = c;
	this.dom.search = s;
	this.dom.result = r;
	
	SZN.Events.addListener(this.dom.input, "click", this, "show");
	SZN.Events.addListener(this.dom.search, "keypress", this, "_keypress");
	SZN.Events.addListener(this.dom.container, "mousedown", SZN.Events.stopEvent);
	SZN.Events.addListener(document, "mousedown", this, "hide");
}

SZN.AdvancedSuggest.prototype.show = function(e, elm) {
	this._position();
	this.dom.container.style.visibility = "visible";
	
	var str = (this.dom.input.value ? this.options.keyword + ":" + this.dom.input.value : "");
	
	if (elm == this.dom.image) { 
		this.dom.search.focus();
	} else if (str) {
		this.dom.search.value = str;
	}
	
	if (str) { this._request(str); }
}

SZN.AdvancedSuggest.prototype.hide = function() {
	this.dom.container.style.visibility = "hidden";
	this.ec.forEach(SZN.Events.removeListener, SZN.Events);
	SZN.Dom.clear(this.dom.result);
	this.ec = [];
}

SZN.AdvancedSuggest.prototype._position = function() {
	var pos = SZN.Dom.getBoxPosition(this.dom.input);
	var scroll = SZN.Dom.getScrollPos();
	pos.left -= scroll.x;
	pos.top -= scroll.y;
	pos.top += this.dom.input.offsetHeight;
	this.dom.container.style.left = pos.left + "px";
	this.dom.container.style.top = pos.top + "px";
}

SZN.AdvancedSuggest.prototype._request = function(value) {
	var s = encodeURIComponent(value || this.dom.search.value);
	var url = this.options.url + "?query="+s;
	if (this.options.limit) { url += "&limit="+this.options.limit; }
	if (this.dom.throbber) { this.dom.throbber.style.display = ""; }
	this.rq.send(url, this, "_response");
}

SZN.AdvancedSuggest.prototype._link = function(id) {
	var link = SZN.cEl("tr", false, false, {cursor:"pointer"});
	var self = this;
	this.ec.push(SZN.Events.addListener(link, "click", function(e) {
		SZN.Events.cancelDef(e);
		self.dom.input.value = id;
		self.hide();
	}));
	return link;
}

SZN.AdvancedSuggest.prototype._response = function(xmlDoc) {
	this.timeout = false;
	if (this.dom.throbber) { this.dom.throbber.style.display = "none"; }
	SZN.Dom.clear(this.dom.result);
	var rows = xmlDoc.getElementsByTagName("row");
	
	if (!rows.length) {
		this.dom.result.innerHTML = "(žádné výsledky)";
		return;
	}
	
	var t = SZN.cEl("table");
	var h = SZN.cEl("thead");
	var b = SZN.cEl("tbody");
	var r = SZN.cEl("tr");
	SZN.Dom.append([t,h,b],[h,r]);
	
	/*
	var td = SZN.cEl("td");
	r.appendChild(td);
	*/
	for (var i=0;i<this.options.labels.length;i++) {
		var td = SZN.cEl("td");
		td.innerHTML = this.options.labels[i];
		r.appendChild(td);
	}
	
	for (var i=0;i<rows.length;i++) {
		var row = rows[i];
		var cols = row.getElementsByTagName("col");
		var pk = row.getAttribute("pk");

		//var r = SZN.cEl("tr");
		var r = this._link(pk);
		b.appendChild(r);
		/*
		var td = SZN.cEl("td");
		var a = this._link(pk, pk);
		td.appendChild(a);
		r.appendChild(td);
		*/
		for (var j=0;j<this.options.labels.length;j++) {
			var td = SZN.cEl("td");
			r.appendChild(td);
			td.innerHTML = cols[j].firstChild.nodeValue;
		}
	}
	
	this.dom.result.appendChild(t);
}

SZN.AdvancedSuggest.prototype._keypress = function(e, elm) {
	if (this.timeout) {
		clearTimeout(this.timeout);
	}
	this.timeout = setTimeout(this._fakeRequest, 500);
}

SZN.AdvancedSuggest.prototype._fakeRequest = function() {
	this._request();
}
