/* prace s radky tabulky */
SZN.EditorControl.TableRow = SZN.ClassMaker.makeClass({
	NAME: "TableRow",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.OneStateButton,
	CLASS: "class"
});

SZN.EditorControl.TableRow.prototype._findActualRow = function() {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "tr") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

SZN.EditorControl.TableRow.prototype.refresh = function() {
	var tr = this._findActualRow();
	if (tr  != this.enabled) { 
		if (tr) { this.enable(); } else { this.disable(); }
	}
}

SZN.EditorControl.TableRow.prototype._duplicateRow = function(tr) {
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
		var td = SZN.cEl('td');
		newRow.appendChild(td);
	}
	
	return newRow;
}


/*pridani radku pred*/
SZN.EditorControl.TableRowBefore = SZN.ClassMaker.makeClass({
	NAME: "TableRowBefore",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TableRow,
	CLASS: "class"
});

SZN.EditorControl.TableRowBefore.prototype._clickAction = function() {
	var tr = this._findActualRow();
	
	if (tr !== null) {
		var newRow = this._duplicateRow(tr);
		tr.parentNode.insertBefore(newRow, tr);
	}
}


/*pridani radku za*/
SZN.EditorControl.TableRowAfter = SZN.ClassMaker.makeClass({
	NAME: "TableRowAfter",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TableRow,
	CLASS: "class"
});

SZN.EditorControl.TableRowAfter.prototype._clickAction = function() {
	var tr = this._findActualRow();
	
	if (tr !== null) {
		var newRow = this._duplicateRow(tr);
		tr.parentNode.insertBefore(newRow, tr.nextSibling);
	}
}

/*smazani radku*/
SZN.EditorControl.TableRowDelete = SZN.ClassMaker.makeClass({
	NAME: "TableRowDelete",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TableRow,
	CLASS: "class"
});

SZN.EditorControl.TableRowDelete.prototype._clickAction = function() {
	var tr = this._findActualRow();
	
	if (tr !== null) {
		tr.parentNode.deleteRow(tr);
	}
}


SZN.EditorControls["tablerowbefore"] = {object:SZN.EditorControl.TableRowBefore, image:"tablerowbefore.gif"};
SZN.EditorControls["tablerowafter"] = {object:SZN.EditorControl.TableRowAfter, image:"tablerowafter.gif"};
SZN.EditorControls["tablerowdelete"] = {object:SZN.EditorControl.TableRowDelete, image:"tablerowdelete.gif"};