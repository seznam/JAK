/* prace s radky tabulky */
SZN.EditorControl.TableCol = SZN.ClassMaker.makeClass({
	NAME: "TableCol",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.OneStateButton,
	CLASS: "class"
});

SZN.EditorControl.TableCol.prototype._findActualElm = function(name) {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == name) { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

SZN.EditorControl.TableCol.prototype.refresh = function() {
	var td = this._findActualElm('td');
	if (td  != this.enabled) { 
		if (td) { this.enable(); } else { this.disable(); }
	}
}

SZN.EditorControl.TableCol.prototype._actualColIndex = function() {
	var actualColIndex = 0;
	var td = this._findActualElm('td');
	if (td !== null) {
		var row = td.parentNode;
		var cels = row.getElementsByTagName('td');
		for(var i = 0; i < cels.length; i++) {
			if (cels[i] == td) {
				actualColIndex = i;
				break;
			}
		} 
	}
	return actualColIndex;
}


/*pridani radku pred*/
SZN.EditorControl.TableColBefore = SZN.ClassMaker.makeClass({
	NAME: "TableColBefore",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TableCol,
	CLASS: "class"
});

SZN.EditorControl.TableColBefore.prototype._clickAction = function() {
	var table = this._findActualElm('table');
		
	if (table !== null) {
		var index = this._actualColIndex();
		
		var rows = table.getElementsByTagName('tr');
		for (var i = 0; i < rows.length; i++) {
			var td = rows[i].insertCell(index);
			td.innerHTML = '&nbsp;';
		}
	}
}


/*pridani radku za*/
SZN.EditorControl.TableColAfter = SZN.ClassMaker.makeClass({
	NAME: "TableColAfter",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TableCol,
	CLASS: "class"
});

SZN.EditorControl.TableColAfter.prototype._clickAction = function() {
	var table = this._findActualElm('table');
		
	if (table !== null) {
		var index = this._actualColIndex();
		
		var rows = table.getElementsByTagName('tr');
		for (var i = 0; i < rows.length; i++) {
			var td = rows[i].insertCell(index+1);
			td.innerHTML = '&nbsp;';
		}
	}
}

/*smazani radku*/
SZN.EditorControl.TableColDelete = SZN.ClassMaker.makeClass({
	NAME: "TableColDelete",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TableCol,
	CLASS: "class"
});

SZN.EditorControl.TableColDelete.prototype._clickAction = function() {
	var table = this._findActualElm('table');
		
	if (table !== null) {
		var index = this._actualColIndex();
		
		var rows = table.getElementsByTagName('tr');
		for (var i = 0; i < rows.length; i++) {
			rows[i].deleteCell(index);
		}
	}
}


SZN.EditorControls["tablecolbefore"] = {object:SZN.EditorControl.TableColBefore, image:"tablecolbefore.gif"};
SZN.EditorControls["tablecolafter"] = {object:SZN.EditorControl.TableColAfter, image:"tablecolafter.gif"};
SZN.EditorControls["tablecoldelete"] = {object:SZN.EditorControl.TableColDelete, image:"tablecoldelete.gif"};