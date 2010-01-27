/* undo  */
/**
 * @class
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.Undo = JAK.ClassMaker.makeClass({
	NAME: "Undo",
	VERSION: "1.0",
	EXTEND: JAK.EditorControl.OneStateButton,
	CLASS: "class"
});

JAK.EditorControl.Undo.prototype._clickAction = function() {
	this.owner.commandExec('undo');	
}

JAK.EditorControl.Undo.prototype.refresh = function() {
	if(this.owner.instance.doc.queryCommandEnabled('undo')) {
		this.enable();
	} else {
		this.disable();
	}
}

/* redo  */
/**
 * @class
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.Redo = JAK.ClassMaker.makeClass({
	NAME: "Redo",
	VERSION: "1.0",
	EXTEND: JAK.EditorControl.OneStateButton,
	CLASS: "class"
});

JAK.EditorControl.Redo.prototype._clickAction = function() {
	this.owner.commandExec('redo');	
}

JAK.EditorControl.Redo.prototype.refresh = function() {
	if(this.owner.instance.doc.queryCommandEnabled('redo')) {
		this.enable();
	} else {
		this.disable();
	}
}


JAK.EditorControls["undo"] = {object:JAK.EditorControl.Undo, image:"undo.gif"};
JAK.EditorControls["redo"] = {object:JAK.EditorControl.Redo, image:"redo.gif"};
