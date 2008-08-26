/* table delete */
SZN.EditorControl.TableDelete = SZN.ClassMaker.makeClass({
	NAME: "TableDelete",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.OneStateButton,
	CLASS: "class"
});



SZN.EditorControl.TableDelete.prototype._clickAction = function() {
	var i = 0;
	var table = this._findTable();
	
	if (table !== null) {
		table.parentNode.removeChild(table);
	}	
}

SZN.EditorControl.TableDelete.prototype._findTable = function() {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "table") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

SZN.EditorControl.TableDelete.prototype.refresh = function() {
	var table = this._findTable();
	if (table  != this.enabled) { 
		if (table) { this.enable(); } else { this.disable(); }
	}
}

SZN.EditorControls["tabledelete"] = {object:SZN.EditorControl.TableDelete, image:"tabledelete.gif"};