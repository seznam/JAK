/* table delete */
/**
 * @class
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.TableDelete = JAK.ClassMaker.makeClass({
	NAME: "TableDelete",
	VERSION: "1.0",
	EXTEND: JAK.EditorControl.OneStateButton,
	CLASS: "class"
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

JAK.EditorControls["tabledelete"] = {object:JAK.EditorControl.TableDelete, image:"tabledelete.gif"};
