/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/* undo  */
/**
 * @class
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.Undo = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.Undo",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.OneStateButton
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
	NAME: "JAK.EditorControl.Redo",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.OneStateButton
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


JAK.EditorControls["undo"] = {object:JAK.EditorControl.Undo, image:"plugins/undo.gif"};
JAK.EditorControls["redo"] = {object:JAK.EditorControl.Redo, image:"plugins/redo.gif"};
