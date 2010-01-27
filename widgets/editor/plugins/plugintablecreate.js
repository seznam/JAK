/* table create */
/**
 * @class
 * @augments JAK.EditorControl.TwoStateButton
 * @augments JAK.EditorControl.Window
 */
JAK.EditorControl.TableCreate = JAK.ClassMaker.makeClass({
	NAME: "TableCreate",
	VERSION: "1.0",
	EXTEND: JAK.EditorControl.TwoStateButton,
	IMPLEMENT: JAK.EditorControl.Window,
	CLASS: "class"
});

JAK.EditorControl.TableCreate.prototype.$constructor = function(owner, options) {
	this.callSuper('$constructor', arguments.callee)(owner, options);
	
	//nastylovani tabulek - maji vzdy nejaky ramecek aby byly videt
	this.owner.addStyle('table {width: 100%;} table td {border: 1px dashed gray; }');
}

JAK.EditorControl.TableCreate.prototype._clickAction = function() {


	var html = "<html><head><title>"+this.options.text[0]+"</title></head><body style='background-color: #EFEFEF;'>";
	html += '<strong style="color: #2B6FB6;">'+this.options.text[0]+'</strong>';
	html += '<div id="container" style="width: 520px; font-size: 12px; font-family: Verdana,Arial,Helvetica,sans-serif; float:left;">';
		html += '<span style="width: 100px; display: block; float:left;">'+this.options.text[2]+'</span><input type="text" id="cols" value="2" style="width: 50px" /><br/ >';
		html += '<span style="width: 100px; display: block; float:left;">'+this.options.text[3]+'</span><input type="text" id="rows" value="2" style="width: 50px" /><br/ >';
		html += '<input id="saveButton" type="button" value="'+this.options.text[1]+'" />';
	html += '</div>';
	html += "</body></html>";
	
	var opts = {
		width:250,
		height:150
	}
	if (screen) {
		var l = Math.round((screen.width - opts.width)/2);
		var t = Math.round((screen.height - opts.height)/2);
		opts.left = l;
		opts.top = t;
	}
	
	
	this.win = this.openWindow("",opts);
	this.win.document.write(html);
	this.win.document.close();
	
	JAK.Events.addListener(this.win.document.getElementById('saveButton'), 'click', this, '_feedback');
	
}

JAK.EditorControl.TableCreate.prototype._feedback = function() {
	this.win.close();
	
	var rows = parseInt(this.win.document.getElementById('rows').value);
	var cels = parseInt(this.win.document.getElementById('cols').value);
	if (rows <=0 || cels <=0) {return;}

	var table = '<table border="0">';
	
	for (var i = 0; i  < rows; i++) {
		table +='<tr>';
		for (var j = 0; j < cels; j++) {
			table += '<td>&nbsp;</td>';
		}
		table += '</tr>';
	}
	table += '</table>';
	
	this.owner.insertHTML(table);
}


JAK.EditorControls["tablecreate"] = {object:JAK.EditorControl.TableCreate, image:"tablecreate.gif"};
