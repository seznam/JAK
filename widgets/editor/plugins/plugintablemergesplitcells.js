/**
 * ---------------
 * spolecny predek pro mergovani a splitovani bunek v tabulkce 
 * ---------------
 **/
SZN.EditorControl.TableCustomCells = SZN.ClassMaker.makeClass({
	NAME: "TableCustomCells",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.OneStateButton,
	IMPLEMENT: SZN.EditorControl.Window,
	CLASS: "class"
});



SZN.EditorControl.TableCustomCells.prototype.refresh = function() {
	var table = this._findActualElm('table');
	if (table  != this.enabled) { 
		if (table) { this.enable(); } else { this.disable(); }
	}
}

/**
 * vrati node, ktery je v rodicovske hiearchii nad vybranym nodem a je typu "name" 
 */ 
SZN.EditorControl.TableCustomCells.prototype._findActualElm = function(name) {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == name) { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}


/**
 * vrati rozvinutou tabulku, kde vsechny bunky co jsou mergle jsou doplneny na mergnutych 
 * pozicich elementem B
 * @param {Array} rows
 * @return {Array}   
 */ 
SZN.EditorControl.TableCustomCells.prototype.getExtendedTable = function (rows) {
	var t = [];
	for (var i = 0; i < rows.length; i++) {
		var cels = rows[i].getElementsByTagName('td');
		t[i] =[];
		for (var j = 0; j < cels.length; j++) {
			if (cels[j].parentNode == rows[i]) { //pridam si jen bunku ktera je v dane radce a ne nejakou bunku co je v tabulce, ktera je v me bunce :)
				t[i].push(cels[j]);
			}
		}
	}
	//console.log(t);
	
	//rozvinuty tvar
	var length = t.length;
	for (var i = 0; i < length; i++) {
		var rlength = t[i].length;
		for (var j = 0; j < rlength; j++) {
			var colSpan = t[i][j].colSpan || 0;
			var rowSpan = t[i][j].rowSpan || 0;
			//console.log(colSpan+' '+rowSpan);
			if (colSpan > 1 || rowSpan > 1) {
				for (var ii = 0; ii < rowSpan; ii++) {                 
					var firstPart = t[i+ii].splice(0,j);
				
					for (var jj = 0; jj < colSpan; jj++) {              
						var el = SZN.cEl('b');
						if (ii == 0 && jj == 0) {//leva horni bunka nese vzdy obsah
							el = t[i+ii].splice(0,1)[0];
						}
						firstPart.push(el);
					}					
					t[i+ii] = firstPart.concat(t[i+ii]);

				}
			}
		}
	}
	return t;
}

/**
 * zjisti zda v uzivatelskem vyberu je predany node
 */ 
SZN.EditorControl.TableCustomCells.prototype.isNodeSelected = function(rng, node) {
	if (SZN.Browser.client == 'ie') {
		var r2 = this.owner.createRangeFromNode(node);
		if (rng.inRange(r2)){
			return true;
		}
	} else {
		var s = this.owner.instance._getSelection();
		if (s.containsNode(node, true)){
		 	return true;
		}
	}
	return false;
}

/**
 * vraci zda je predana bunka (td) jiz mergnuta nebo ne
 * @param {HTMLElement} cell
 * @return {boolean}  
 */ 
SZN.EditorControl.TableCustomCells.prototype.isCellMerged = function(cell) {
	return cell.colSpan > 1 || cell.rowSpan > 1;
}

/**
 * vrati vsechny radky tabulky. u radku zjistuje zda je jeho rodic tabulka, 
 * nebo pokud je rodicem body, tak jestli rodic rodice je aktualni tabulka.
 * Tak se nestane ze vybereme jen radky ve spravne tabulce a ne v tabulce ktera je
 * vlozena do nejake bunky   
 */ 
SZN.EditorControl.TableCustomCells.prototype.getAllTableRows = function(table) {
	var r = table.getElementsByTagName('tr');
	var rows = [];
	
	for (var i = 0; i < r.length; i++) {
		if ( (r[i].parentNode && r[i].parentNode == table) || (r[i].parentNode && r[i].parentNode.parentNode && r[i].parentNode.parentNode == table) ) {
			rows.push(r[i]);
		} 
	}
	
	return rows;
}



/**
 * ----------------
 * table cels merge 
 * ----------------
 **/
SZN.EditorControl.TableMergeCells = SZN.ClassMaker.makeClass({
	NAME: "TableMergeCells",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TableCustomCells,
	IMPLEMENT: SZN.EditorControl.Window,
	CLASS: "class"
});

SZN.EditorControl.TableMergeCells.prototype.$constructor = function(owner, options) {
	this.callSuper('$constructor', arguments.callee)(owner, options);
	
	
	//promenne pro vlastni merge - zjistene z vybranych budek
	this.tableArray = []; //2-rozmerne pole definujici tabulku, je to pole objektu s vlastnostmi selected/merged/cell/cols/rows
	this.selectedCels = []; // pole obsahujici vybrane bunky
	this.sRow = []; //pro kazdy radek si spocteme pocet vybranych budek
	this.sCol = []; //pro kazdy sloupec si spocteme pocet vybranych budek
}



/**
 * metoda je volana po kliku na tlacitko merge.
 */ 
SZN.EditorControl.TableMergeCells.prototype._clickAction = function() {
	//debug('merge node');
	
	//vycisteni hodnot
	this.tableArray = [];
	this.selectedCels = [];
	this.sRow = [];
	this.sCol = [];

	var table = this._findActualElm('table');
	var rng = this.owner.instance._getRange();

	//predpripava pole reprezentujici tabulku - pridani radku	
	var rows = this.getAllTableRows(table);
	var t = this.getExtendedTable(rows);
	//console.log('rozvinuta tabulka');
	//console.log(t);


	//projiti pripravene tabulky a pripraveni si poli pro oznaceni si poctu vybranych bunek	
	for (var i = 0; i < t.length; i++) {
		this.tableArray[i] = [];
		this.sRow[i] = 0;
		if (i == 0) {
			for (var j=0; j < t[i].length; j++) {
				this.sCol[j] = 0;
			}
		}
	}
	
	//naplneni pole daty z tabulky, projiti znovu vsech prvku a oznaceni tech co jsou mergle a tech co jsou vybrane
	for (var i = 0; i < t.length; i++) {
		var cels = t[i];
		for (var j = 0; j < cels.length; j++) {
			
			if (cels[j].tagName.toLowerCase() == 'b') {continue;} //bcka si osetri primarni bunka
			
			var selected = this.isNodeSelected(rng, cels[j]);
			
			var colSpan = cels[j].colSpan || 1;
			var rowSpan = cels[j].rowSpan || 1;
			
			//osetreni Bcek tedy merglych bunek
			for (var ii = 0; ii < rowSpan; ii++) {                  
				for (var jj = 0; jj < colSpan; jj++) {             
					this.tableArray[i+ii][j+jj] = {selected: selected, merged: (colSpan > 1 || rowSpan > 1), cell: t[i+ii][j+jj]};
					if (selected) {
						this.selectedCels.push({cell: t[i+ii][j+jj], col: j+jj, row: i+ii});
						this.sRow[i+ii]++;
						this.sCol[j+jj]++;
					}
				}					
			}

		}
	}
	//console.log('vysledna tabulka objektu');
	//console.log(this.tableArray);
	//console.log('vybrane radky a sloupce');
	//console.log(this.sRow);
	//console.log(this.sCol);
	
	
	//jen jedna vybrana bunka, zobrazujeme okno
	if (this.selectedCels.length == 1) {
		this._popupWindow();
	
	//je vybrano vice budek, slucovani udelame dle nich
	} else {
	
		//console.log(this.selectedCels);
		
		this._checkSelectedCells();
	}
}	

/**
 * vrati nejvetsi hodnotu prvku v poli
 * @param {Array} x
 * @return {mixed}  
 */ 
SZN.EditorControl.TableMergeCells.prototype.getMaxItem = function(x) {
	var j=0;
	for(i=0;i<x.length;i++) {
		if(x[i]>x[j]) {
			j=i;
		}
	}
	return x[j];
}


SZN.EditorControl.TableMergeCells.prototype._checkSelectedCells = function() {
	//pro zjisteni jak jsou bunky v tabulce vybrany je nutne zjistit pocty vybranych bunek v radku a sloupcu a vzit nejvetsi
	//jsou vybrany bunky v jedne radce
	if (this.getMaxItem(this.sRow) == this.selectedCels.length) {
		//console.log('ok');
		this.mergeCells();
	//jsou vybrany bunky v jednom sloupci
	} else if (this.getMaxItem(this.sCol) == this.selectedCels.length) {
		//console.log('ok');
		this.mergeCells();
	} else {
		var valid = true;
		//nutno jeste proverit souvislou obdelnikovou oblast, nutno projit sRow a sCol a zjitit zda X nasledujich radku/sloupcu ma stejny pocet bunek, 
		//pokud ano je to adept na souvislou obdelnikovou oblast
		
		//console.log('cols');
		valid = valid && this._checkSelectedItemsInLine(this.sCol);
		//console.log('rows');
		valid = valid && this._checkSelectedItemsInLine(this.sRow);
		
		//nutna kontrola oznacene uhlopricky - chyba
		//jelikoz jsou body usporadane po radcich, uhlopricku zjistime tak ze je projdeme a urcime si smer, pokud vsechny bunky sdili mezi sebou smer, je to spatne, jsou na lib. diagonale
		valid = valid && this._checkDiagonalInTable(this.selectedCels);
		valid = valid && this._checkSpareArray(this.selectedCels);
		
		if (valid) {
			//console.log('ok');
			this.mergeCells();
		}
	}
}

/**
 * pro pole udavajici pocty oznacenych budek v radku ci sloupci zjistuji zda jsou 
 * radky ci sloupce s oznacenymi bunkami vedle sebe a maji stejny pocet oznacenych
 * prvku
 * @param {Array} line   
 * @return {boolean} 
 */ 
SZN.EditorControl.TableMergeCells.prototype._checkSelectedItemsInLine = function(line) {
	var c = 0; //pocet ve slopci
	var closed = false;
	for (var i = 0; i < line.length; i++) {
		if (c > 0 && line[i] < c) {//pokud je v predchozim sloupci neco oznaceno a v aktualnim je mene, nebo 0 oznacenych, pak uzaviram hranici 
			closed = true;
		}
		
		if (line[i] > 0 && !closed) { //pokud je v aktualnim sloupci oznaceno a neni uzavreno:
			if (c == 0) { //kdyz v predchozich nic nebylo poznamenam si pocet
				c = line[i];
			} else if (c !== line[i]) {//pokud je v aktualnim rozdilny pocet nez v predchozich je to chyba
				//console.log('e1');
				return false;
			}
		} 
		if (line[i] > 0 && closed){
			//console.log('e2');
			return false;
		}
	}
	return true;
}

/**
 * posledni kontrola oznacene oblasti. oblast je bud obdelnikova nebo diagonalni (nemusi byt na hlavni diagonale)
 * z vybranych bodu si vytvorim pole, pokud vsechny prvky pole jsou obsazene je oblast souvisla, 
 * pokud je nejaky prvek nezadan, pak oblast neni souvisla 
 * - z principu ocekava pole o min. dvou prvcich, coz zajistuje podminka ve ktere je tato funkce volana 
 *  
 * @param {Array} selectedCels
 * @return {boolean}    
 */ 
SZN.EditorControl.TableMergeCells.prototype._checkSpareArray = function(selectedCels) {
	//console.log('check diagonal');
	var startPoint = {col: selectedCels[0].col, row: selectedCels[0].row};
	
	var table = [];
	for (var i = 0; i <= selectedCels[selectedCels.length-1].row - startPoint.row; i++) {
		table[i] = [];
	}
	
	for (var i = 0; i < selectedCels.length; i++) {
		table[selectedCels[i].row-startPoint.row][selectedCels[i].col-startPoint.col] = 1;
	}
	//console.log('table');
	//console.log(table);
	
	for (var i = 0; i < table.length; i++) {
		for (var j = 0; j < table[i].length; j++) {
			if (table[i][j] != 1) {
				//console.log('oznacena plocha neni souvisla');
				return false;
			}
		}
	}
	
	//console.log('v tabulce neni zadna dira');
	return true;
}

/**
 * posledni kontrola oznacene oblasti. oblast je bud obdelnikova nebo diagonalni (nemusi byt na hlavni diagonale)
 * pokud je diagonalni, pak smerovy vektor mezi nasledujicimi bunkami je vzdy stejny - spatne
 * pokud je porusen, pak je oblast obdelnikova
 * - z principu ocekava pole o min. dvou prvcich, coz zajistuje podminka ve ktere je tato funkce volana 
 *  
 * @param {Array} selectedCels
 * @return {boolean}    
 */ 
SZN.EditorControl.TableMergeCells.prototype._checkDiagonalInTable = function(selectedCels) {
	var direction = {};
	for (var i = 1; i < selectedCels.length; i++) {
		if (i == 1) {
			direction.x = selectedCels[1].col - selectedCels[0].col;
			direction.y = selectedCels[1].row - selectedCels[0].row; 
		} else if (i > 1) {
			var d = {};
			d.x = selectedCels[i].col - selectedCels[i-1].col;
			d.y = selectedCels[i].row - selectedCels[i-1].row;
			if (d.x !== direction.x || d.y !== direction.y) { //pokud je porusen smer, pak je oblast obdelnikova a je to ok
				//console.log('porusuje to diagonalu');
				return true;
			}
		}
		if (i == selectedCels.length-1) {
			//console.log('je to diagonala');
			return false;
		}
	}
}


/**
 * provadi merge bunek v poli selectedCells
 */ 
SZN.EditorControl.TableMergeCells.prototype.mergeCells = function() {
	// odstraneni vybranych TD bunek ze stromu a preneseni jejich obsahu do hlavni bunky
	var mainCell = this.selectedCels[0];
	for (var i = 1 ; i < this.selectedCels.length; i++) {
		mainCell.cell.innerHTML += this.selectedCels[i].cell.innerHTML;
		if (this.selectedCels[i].cell.tagName.toLowerCase() == 'td') {
			this.selectedCels[i].cell.parentNode.removeChild(this.selectedCels[i].cell);
		}
	}
	
	//jelikoz posledni bunka je ta nejvic vpravo dole mohu na ni sahnout a udelat odecet od prvni a ziskat ColSpan a RowSpan
	var lastCell = this.selectedCels[this.selectedCels.length-1]; //console.log(lastCell);
	var c = lastCell.col - mainCell.col + 1;
	var r = lastCell.row - mainCell.row + 1;
	//console.log('c '+c+' r '+r);
	
	//pokud je bunka mergla pres vice celych radku, nebo sloupcu (3x3 tabulka a bunka 0,0 je s colSpan 3 a rowSpan 2, pak bude mit po uprave jen colSpan 3 a rowSpan 1)
	if (this.sCol.length == c) {
		r = 1;
	}
	if (this.sRow.length == r) {
		c = 1;
	}
	//console.log('c '+c+' r '+r);
	
	//nastaveni colSpan a rowSpan mergle bunce
	mainCell.cell.colSpan = c;
	mainCell.cell.rowSpan = r;

}

/**
 * vyskoceni okna s vyberem mergovaci oblasti
 */ 
SZN.EditorControl.TableMergeCells.prototype._popupWindow = function() {
	var html = "<html><head><title>"+this.options.text[0]+"</title></head><body style='background-color: #EFEFEF;'>";
	html += '<strong style="color: #2B6FB6;">'+this.options.text[0]+'</strong>';
	html += '<div id="container" style="width: 520px; font-size: 12px; font-family: Verdana,Arial,Helvetica,sans-serif; float:left;">';
		html += '<span style="width: 100px; display: block; float:left;">'+this.options.text[2]+'</span><input type="text" id="cols" value="1" style="width: 50px" /><br/ >';
		html += '<span style="width: 100px; display: block; float:left;">'+this.options.text[3]+'</span><input type="text" id="rows" value="1" style="width: 50px" /><br/ >';
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
	
	SZN.Events.addListener(this.win.document.getElementById('saveButton'), 'click', this, '_feedback');
}	

/**
 * navrat z okma
 */ 
SZN.EditorControl.TableMergeCells.prototype._feedback = function() {
	this.win.close();
	
	var rows = parseInt(this.win.document.getElementById('rows').value);
	var cols = parseInt(this.win.document.getElementById('cols').value);
	if (rows <=0 || cols <=0) {return;}

	//projiti pripravene tabulky a pripraveni si poli pro oznaceni si poctu vybranych bunek	
	for (var i = 0; i < this.tableArray.length; i++) {
		this.sRow[i] = 0;
		if (i == 0) {
			for (var j=0; j < this.tableArray[i].length; j++) {
				this.sCol[j] = 0;
			}
		}
	}

	try {
		//v rozvinute tabulce si zjistim aktualne vybranou bunku
		for (var i = 0; i < this.tableArray.length; i++) {
			for (var j = 0; j < this.tableArray[i].length; j++) {
				//nalezena vybrana bunka
				if (this.tableArray[i][j].selected) {
					this.selectedCels = [];
					//osetreni Bcek tedy merglych bunek
					for (var ii = 0; ii < rows; ii++) {                  
						for (var jj = 0; jj < cols; jj++) {             
							this.selectedCels.push({cell: this.tableArray[i+ii][j+jj].cell, col: j+jj, row: i+ii});
							this.sRow[i+ii]++;
							this.sCol[j+jj]++;
							
						}					
					}
					break;	
				}
			}
		}
		//console.log('vybrane bunky formularem');
		//console.log(this.selectedCels);
		this._checkSelectedCells();
	} catch(e) {
		alert('Zadané rozměry jsou mimo rozsah tabulky.');
	}
}



/**
 * ----------------
 * table cels merge 
 * ----------------  
 **/
SZN.EditorControl.TableSplitCells = SZN.ClassMaker.makeClass({
	NAME: "TableSplitCells",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TableCustomCells,
	IMPLEMENT: SZN.EditorControl.Window,
	CLASS: "class"
});

SZN.EditorControl.TableSplitCells.prototype.refresh = function() {
	var table = this._findActualElm('table');
	if (table  != this.enabled) { 
		this.disable(); 
		if (table) {
			if(this.isSelectedCellMerged()) { 
				this.enable();
			}
		}  
	}
}

/**
 * zjisti, zda prvni oznacena bunka v tabulce je mergla
 */ 
SZN.EditorControl.TableSplitCells.prototype.isSelectedCellMerged = function() {
	var td = this._findActualElm('td');
	return this.isCellMerged(td);
}

/**
 * metoda je volana po kliku na tlacitko split.
 */ 
SZN.EditorControl.TableSplitCells.prototype._clickAction = function() {
	//debug('split node');
	
	var table = this._findActualElm('table');
	//var rng = this.owner.instance._getRange();

	//predpripava pole reprezentujici tabulku - pridani radku	
	var rows = this.getAllTableRows(table);
	var t = this.getExtendedTable(rows);
	//console.log('rozvinuta tabulka');
	//console.log(t);

	//aktualne vybrana bunka
	var td = this._findActualElm('td');

	//bunka, ne Bcko, ktere je v danem radku realne
	var realCell = null;
	//naplneni pole daty z tabulky, projiti znovu vsech prvku a oznaceni tech co jsou mergle a tech co jsou vybrane
	for (var i = 0; i < t.length; i++) {
		var cels = t[i];
		for (var j = 0; j < cels.length; j++) {
			if (cels[j].tagName.toLowerCase() == 'b') {continue;} //bcka si osetri primarni bunka

			//narazim na vybranou bunku
			if (cels[j] == td) { //console.log(td);
				var colSpan = cels[j].colSpan || 1;
				var rowSpan = cels[j].rowSpan || 1;
				
				//podle rowspanu zacnu prochazet jednotlive radky, pres ktere je mergla bunka
				for (var ii = 0; ii < rowSpan; ii++) {
					//projdu dany radek a zjistim si spravnou bunku za kterou budu insertovat
					for (var jj = 0 ; jj < t[i+ii].length; jj++) {
						if (t[i+ii][jj].tagName.toLowerCase() == 'b') {continue;}
						realCell = t[i+ii][jj];
						if (jj >= j ) {break;}//pokud bunka je na pozici z leva vice vlevo nanejvyse stejne jako moje
					}
					
					//vzdy nutno vzit nasledujici bunku, nebot pridavam pred ni
					if (realCell) {
						realCell = realCell.nextSibling;
					}
					
					
					//console.log(realCell);
					//doplnim spravny pocet bunek do radku                  
					for (var kk = 0; kk < colSpan; kk++) {
						if (ii == 0 && kk == 0) {continue;} //prvni bunku prvniho radku mam vyplnenou originalem, tak ji preskakuji
						var cell = document.createElement('td');
						//cell.innerHTML = kk+' split';   
						rows[i+ii].insertBefore(cell, realCell);          
					}					
				}
								
				//splitujeme jednu prvni bunku
				cels[j].colSpan = 1;
				cels[j].rowSpan = 1;
				break;
			}
		}
	}
}

SZN.EditorControls["tablemergecells"] = {object:SZN.EditorControl.TableMergeCells, image:"tablemergecells.gif"};
SZN.EditorControls["tablesplitcells"] = {object:SZN.EditorControl.TableSplitCells, image:"tablesplitcells.gif"};