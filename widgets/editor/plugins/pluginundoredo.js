/* undo  */
SZN.EditorControl.Undo = SZN.ClassMaker.makeClass({
	NAME: "Undo",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.OneStateButton,
	CLASS: "class"
});

SZN.EditorControl.Undo.prototype._clickAction = function() {
	this.owner.commandExec('undo');	
}

SZN.EditorControl.Undo.prototype.refresh = function() {
	if(this.owner.instance.doc.queryCommandEnabled('undo')) {
		this.enable();
	} else {
		this.disable();
	}
}

/* redo  */
SZN.EditorControl.Redo = SZN.ClassMaker.makeClass({
	NAME: "Redo",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.OneStateButton,
	CLASS: "class"
});

SZN.EditorControl.Redo.prototype._clickAction = function() {
	this.owner.commandExec('redo');	
}

SZN.EditorControl.Redo.prototype.refresh = function() {
	if(this.owner.instance.doc.queryCommandEnabled('redo')) {
		this.enable();
	} else {
		this.disable();
	}
}


SZN.EditorControls["undo"] = {object:SZN.EditorControl.Undo, image:"undo.gif"};
SZN.EditorControls["redo"] = {object:SZN.EditorControl.Redo, image:"redo.gif"};