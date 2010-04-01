/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview sortovani tabulky
 * @version 2.0
 * @author zara
*/   

/**
 * @class Sortovaci tabulka
 * @group jak-widgets
 */
JAK.Table = JAK.ClassMaker.makeClass({
	NAME: "JAK.Table",
	VERSION: "2.0"
});

/**
 * @param {node} table html prvek &lt;table&gt;, ktery vylepsime
 * @param {object} options asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>classAsc</em> - CSS trida pro zahlavi serazene vzestupne</li>
 *		<li><em>classDesc</em> - CSS trida pro zahlavi serazene sestupne</li>
 *		<li><em>defaultSort</em> -zpusob, jakym je tabulka ve vychozim stavu serazena (asc/desc)</li>
 *		<li><em>defaultColumn</em> - index sloupce, dle ktereho je tabulka ve vychozim stavu serazena</li>
 *   </ul>
 */
JAK.Table.prototype.$constructor = function(table, options) {
	this.cells = [];
	this.states = [];
	
	this.options = {
		classAsc:"asc",
		classDesc:"desc",
		defaultSort:false,
		defaultColumn:-1
	}
	for (var p in options) { this.options[p] = options[p]; }
	
	this.ec = [];
	this.table = table;
	
	var toprow = table.getElementsByTagName("tr")[0];
	
	var idx = 0;
	for (var i=0;i<toprow.childNodes.length;i++) {
		var child = toprow.childNodes[i];
		if (child.nodeType != 1) { continue; }
		this._addEvents(child);
		if (this.options.defaultSort && this.options.defaultColumn == idx) {
			this._toggleClass(child, this.options.defaultSort);
			this.states.push(this.options.defaultSort);
		} else {
			this.states.push(false);
		}
		idx++;
	}
}

JAK.Table.prototype.$destructor = function() {
	this.ec.forEach(function(e) { JAK.Events.removeListener(e); });
	this.ec = [];
}

/**
 * @method
 * @private
 * navesi event na zahlavi + da mu kurzor
 * @param {node} cell bunka zahlavi
 */
JAK.Table.prototype._addEvents = function(cell) {
	this.cells.push(cell);
	this.ec.push(JAK.Events.addListener(cell, "click", this, "_click", false, true));
	cell.style.cursor = "pointer";
}

/**
 * @method
 * @private
 * zpracovani kliknuti na zahlavi
 */
JAK.Table.prototype._click = function(e, elm) {
	var index = this.cells.indexOf(elm);
	if (index == -1) { return; } /* wtf. */
	
	/* reset other columns */
	for (var i=0;i<this.states.length;i++) {
		if (i != index) { this.states[i] = false; }
	}
	
	/* find new state */
	var current = this.states[index];
	if (current) {
		this.states[index] = (this.states[index] == "asc" ? "desc" : "asc");
	} else {
		this.states[index] = "asc";
	}
	
	/* sync css */
	for (var i=0;i<this.states.length;i++) {
		this._toggleClass(this.cells[i], this.states[i]);
	}
	
	/* perform sorting */
	this._sort(index, this.states[index]);
}

/**
 * @method
 * @private
 * aktualizace CSS tridy pro dane zahlavi
 * @param {node} elm prvek, kteremu CSS tridu nastavime
 * @param {string} type asc/desc/false
 */
JAK.Table.prototype._toggleClass = function(elm, type) {
	JAK.DOM.removeClass(elm, this.options.classAsc);
	JAK.DOM.removeClass(elm, this.options.classDesc);
	if (!type) { return; }
	var cn = (type == "asc" ? this.options.classAsc : this.options.classDesc);
	JAK.DOM.addClass(elm, cn);
}

/**
 * @method
 * @private
 * seradit tabulku
 * @param {int} index index sloupce dle ktereho se bude radit
 * @param {string} type asc/desc
 */
JAK.Table.prototype._sort = function(index, type) {
	var map = [];
	var ths = [];
	
	var rows = this.table.getElementsByTagName("tr");
	var counter = 0;
	var numeric = true;

	for (var i=1;i<rows.length;i++) {
		var r = rows[i];
		if (r.parentNode.tagName.toLowerCase() == "tfoot") { continue; } /* ignore table foot */
		
		counter++;
		var th = r.getElementsByTagName("th"); /* if repeated heading, mark its index */
		if (th.length) { 
			ths.push([r, counter]); 
			continue;
		}
		
		/* get value, decide alphabetic/numeric */
		var td = r.getElementsByTagName("td")[index];
		var value = this._getValue(td);
		map.push([r, value]);
		if (parseFloat(value) != value) { numeric = false; }
	}
	
	var multi = (type == "asc" ? 1 : -1);
	
	/* core cort */
	map.sort(function(a,b){
		var v1 = a[1];
		var v2 = b[1];
		if (v1==v2) { return 0; }
		if (numeric) {
			return multi * (parseFloat(v1) - parseFloat(v2));
		} else {
			return multi * (v1 < v2 ? -1 : 1);
		}
	});
	
	/* find proper container */
	var container = this.table.getElementsByTagName("tbody");
	if (container.length) {
		container = container[0];
	} else {
		container = this.table;
	}
	
	/* rebuild all rows */
	var idx = 1;
	var thPtr = (ths.length ? 0 : -1);
	for (var i=0;i<map.length;i++) {
		if (thPtr != -1 && ths[thPtr][1] == idx) { /* if time to insert heading row */
			container.appendChild(ths[thPtr][0]);
			thPtr++;
			idx++;
			if (thPtr == ths.length) { thPtr = -1; }
		}
		container.appendChild(map[i][0]);
		idx++;
	}
	
}

/**
 * @method
 * @private
 * vybere z bunky jeji normalizovany obsah
 * @param {node} cell bunka tabulky
 */
JAK.Table.prototype._getValue = function(cell) {
	var value = cell.innerText || cell.textContent;
	var r = value.match(/^\s*(.*\S)\s*$/);
	value = (r ? r[1] : "");
	value = value.toLowerCase();
	
	var charOrig    = "áčďéěíňóřšťúůýž";
	var charReplace = "acdeeinorstuuyz";
	
	var arr = value.split("");
	for (var i=0;i<arr.length;i++) {
		var ch = arr[i];
		var idx = charOrig.indexOf(ch);
		if (idx != -1) { arr[i] = charReplace.charAt(idx); }
	}
	value = arr.join("");
	
	return value;
}
