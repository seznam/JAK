/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/* prace s radky tabulky */
/**
 * @class
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.TableRow = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableRow",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.OneStateButton
});

JAK.EditorControl.TableRow.prototype._findActualRow = function() {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "tr") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

JAK.EditorControl.TableRow.prototype.refresh = function() {
	var tr = this._findActualRow();
	if (tr  != this.enabled) { 
		if (tr) { this.enable(); } else { this.disable(); }
	}
}

JAK.EditorControl.TableRow.prototype._duplicateRow = function(tr) {
	/*var newRow = tr.cloneNode(true); //se vsim vsudy
	var tds = newRow.getElementsByTagName('td');
	for (var i = 0; i < tds.length; i++) {
		tds[i].innerHTML = '&nbsp;';
	}*/
	
	//musim vytvorit radek, ktery ma stejny pocet bunek jako by tabulka nebyla mergla, tudiz to musim posozovat podle prvniho radku tabulky
	var firstRow = tr.parentNode.getElementsByTagName('tr')[0];
	var cellNum = 0;
	var cells = firstRow.getElementsByTagName('td');
	for (var i =0; i < cells.length; i++) {
		if (cells[i].parentNode == firstRow) {
			cellNum += cells[i].colSpan || 1;
		}
	} 

	var newRow = tr.cloneNode(false); //chci naklonovat element ale ne jeho deti
	for (var i = 0; i < cellNum; i++) {
		var td = JAK.cel('td');
		newRow.appendChild(td);
	}
	
	return newRow;
}

/**
 * pokud ve FF pridavame radek s prazdnymi bunkami tak dojde k render bugu a radek neni zobrazen, proto je musim docasne necim naplnit
 * @param newRow
 */
JAK.EditorControl.TableRow.prototype.repaintRow = function(newRow) {
   if (JAK.Browser.client != "ie") {
		var col = newRow.getElementsByTagName("td");
		for (var i = 0; i < col.length; i++) {
			col[i].appendChild(this.owner.instance.doc.createTextNode("."));
			col[i].innerHTML = "&nbsp;";
		}
   }
}


/*pridani radku pred*/
/**
 * @class
 * @augments JAK.EditorControl.TableRow
 */
JAK.EditorControl.TableRowBefore = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableRowBefore",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TableRow
});

JAK.EditorControl.TableRowBefore.prototype._clickAction = function() {
	var tr = this._findActualRow();
	
	if (tr !== null) {
		var newRow = this._duplicateRow(tr);
		tr.parentNode.insertBefore(newRow, tr);
	}

	this.repaintRow(newRow);
}


/*pridani radku za*/
/**
 * @class
 * @augments JAK.EditorControl.TableRow
 */
JAK.EditorControl.TableRowAfter = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableRowAfter",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TableRow
});

JAK.EditorControl.TableRowAfter.prototype._clickAction = function() {
	var tr = this._findActualRow();
	if (tr !== null) {
		var newRow = this._duplicateRow(tr);
		tr.parentNode.insertBefore(newRow, tr.nextSibling);
	}

	this.repaintRow(newRow);
}

/*smazani radku*/
/**
 * @class
 * @augments JAK.EditorControl.TableRow
 */
JAK.EditorControl.TableRowDelete = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableRowDelete",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TableRow
});

JAK.EditorControl.TableRowDelete.prototype._clickAction = function() {
	var tr = this._findActualRow();
	
	if (tr !== null) {
		tr.parentNode.removeChild(tr);
	}
}


JAK.EditorControls["tablerowbefore"] = {object:JAK.EditorControl.TableRowBefore, image:"plugins/tablerowbefore.gif"};
JAK.EditorControls["tablerowafter"] = {object:JAK.EditorControl.TableRowAfter, image:"plugins/tablerowafter.gif"};
JAK.EditorControls["tablerowdelete"] = {object:JAK.EditorControl.TableRowDelete, image:"plugins/tablerowdelete.gif"};
