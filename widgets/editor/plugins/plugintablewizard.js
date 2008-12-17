/* ask, then insert/edit link */
/**
 * @class
 * @augments SZN.EditorControl.TwoStateButton
 * @augments SZN.EditorControl.Window
 */
SZN.EditorControl.TableWizard = SZN.ClassMaker.makeClass({
	NAME: "TableWizard",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TwoStateButton,
	IMPLEMENT: SZN.EditorControl.Window,
	CLASS: "class"
});

SZN.EditorControl.TableWizard.prototype._clickAction = function() {


	var html = "<html><head><title>"+this.options.text[0]+"</title></head><body style='background-color: #EFEFEF;'>";
	html += '<strong style="color: #2B6FB6;">'+this.options.text[0]+'</strong>';
	html += '<div id="container" style="width: 520px; font-size: 12px; font-family: Verdana,Arial,Helvetica,sans-serif; float:left;">';
		html += '<span>'+this.options.text[1]+'</span><br />';
		html += '<textarea id="inputData" style="width: 520px; height: 250px;"></textarea>';
		html += '<input id="saveButton" type="button" value="'+this.options.text[2]+'" />';
	html += '</div>';
	html += "</body></html>";
	
	var opts = {
		width:550,
		height:350
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
	
	SZN.Events.addListener(this.win.document.getElementById('saveButton'), 'click', this, '_feedback');
	SZN.Events.addListener(this.win.document.getElementById('inputData'), 'keydown', this, '_keydown');
	
}

SZN.EditorControl.TableWizard.prototype._feedback = function() {
	this.win.close();
	
	var txt = this.win.document.getElementById('inputData').value;
	
	if (txt.length <= 0) { return; }
	
	var table = '<table border="0"><tbody>';
	var rows = txt.split('\n');
	for (var i = 0; i  < rows.length; i++) {
		table +='<tr>';
		var cels = rows[i].split('\t');
		for (var j = 0; j < cels.length; j++) {
			table += '<td>'+cels[j]+'</td>';
		}
		table += '</tr>';
	}
	table += '</tbody></table>';
	
	this.owner.insertHTML(table);
}

SZN.EditorControl.TableWizard.prototype._keydown = function(e, elm) {
	if (e.keyCode == 9) {
		SZN.Events.cancelDef(e);
		var txt = this.win.document.getElementById('inputData');
		txt.value += '\t';
	}	
}

SZN.EditorControls["tablewizard"] = {object:SZN.EditorControl.TableWizard, image:"tablewizard.gif"};