/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class prace s radky tabulky
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.TableCol = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableCol",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.OneStateButton
});

JAK.EditorControl.TableCol.prototype._findActualElm = function(name) {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == name) { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

JAK.EditorControl.TableCol.prototype.refresh = function() {
	var td = this._findActualElm('td');
	if (td  != this.enabled) { 
		if (td) { this.enable(); } else { this.disable(); }
	}
}

JAK.EditorControl.TableCol.prototype._actualColIndex = function() {
	var actualColIndex = 0;
	var td = this._findActualElm('td'); 
	if (td) {
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
/**
 * @class
 * @augments JAK.EditorControl.TableCol
 */
JAK.EditorControl.TableColBefore = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableColBefore",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TableCol
});

JAK.EditorControl.TableColBefore.prototype._clickAction = function() {
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
/**
 * @class
 * @augments JAK.EditorControl.TableCol
 */
JAK.EditorControl.TableColAfter = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableColAfter",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TableCol
});

JAK.EditorControl.TableColAfter.prototype._clickAction = function() {
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
/**
 * @class
 * @augments JAK.EditorControl.TableCol
 */
JAK.EditorControl.TableColDelete = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableColDelete",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TableCol
});

JAK.EditorControl.TableColDelete.prototype._clickAction = function() {
	var table = this._findActualElm('table');
		
	if (table !== null) {
		var index = this._actualColIndex();
		
		var rows = table.getElementsByTagName('tr');
		for (var i = 0; i < rows.length; i++) {
			rows[i].deleteCell(index);
		}
	}
}


JAK.EditorControls["tablecolbefore"] = {object:JAK.EditorControl.TableColBefore, image:"plugins/tablecolbefore.gif"};
JAK.EditorControls["tablecolafter"] = {object:JAK.EditorControl.TableColAfter, image:"plugins/tablecolafter.gif"};
JAK.EditorControls["tablecoldelete"] = {object:JAK.EditorControl.TableColDelete, image:"plugins/tablecoldelete.gif"};
