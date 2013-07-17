/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class table delete
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.TableDelete = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TableDelete",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.OneStateButton
});



JAK.EditorControl.TableDelete.prototype._clickAction = function() {
	var i = 0;
	var table = this._findTable();
	
	if (table !== null) {
		table.parentNode.removeChild(table);
	}	
}

JAK.EditorControl.TableDelete.prototype._findTable = function() {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "table") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

JAK.EditorControl.TableDelete.prototype.refresh = function() {
	var table = this._findTable();
	if (table  != this.enabled) { 
		if (table) { this.enable(); } else { this.disable(); }
	}
}

JAK.EditorControls["tabledelete"] = {object:JAK.EditorControl.TableDelete, image:"plugins/tabledelete.gif"};
