/******************************************************************************/
/* trida urcena k dedeni vlastnosti pro praci s komponentami */
SZN.Components = function(){}

SZN.Components.Name = 'Components';
SZN.Components.version = '1.0';

SZN.Components.prototype.CLASS = 'class';


/* zjistuji zda ma trida komponenty */
SZN.Components.prototype.hasComponents = function(){
	if(this.components instanceof Array){
		return true;
	} else { 
		return false;
	}
};

/* pridava vsechny komponenty definovane v poli 'components' */
SZN.Components.prototype.addAllComponents = function(){
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length;i++){
		this._addComponent(this.components[i]);
	}
};

/* pridavam novou komponentu za behu */
SZN.Components.prototype.addNewComponent = function(component){
	if(!this.hasComponents()){
		this.components = new Array();
	}
	this.components.push(component);
	this._addComponent(component);
};

/* pridava jednotlive komponenty z pole */
SZN.Components.prototype._addComponent = function(component){
	if(typeof component.part != 'undefined'){
		var name =  component.part.Name
		if(typeof component.name != 'undefined'){
			var compName = component.name;
		} else {
			var nameFirstChar = name.substring(0,1).toLowerCase();
			var nameNext = name.substring(1);
			var compName = nameFirstChar + nameNext;		
		}
		if(typeof component.setting != 'undefined'){
			this[compName] = new component.part(this,compName,component.setting);
		} else {
			this[compName] = new component.part(this,compName);
		}
	}
};

/* obsahuje registraci 'public' komponent v instanci tridy definovane
*  argumentem owner
*/
SZN.Components.prototype.registredMethod = function(owner){
	var field = [this,this.sConstructor];
	/* registrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(typeof obj[j] == 'undefined') continue;
			if((typeof obj[j].access != 'undefined') && (obj[j].access.indexOf('public') == 0)){
				var nameFirstChar = j.substring(0,1).toUpperCase();
				var nameNext = j.substring(1);
				var mods = obj[j].access.replace(/[ ]{2,}/gi,' ').split(' ');			
				
				if(mods.length > 1){
					var name = mods[1];
				} else {
					var namePrefix = (obj == this.sConstructor) ? obj.Name : this._name;
					var name = namePrefix + nameFirstChar + nameNext;
				}
				
				if(typeof owner[name] == 'undefined'){
					owner[name] = (obj == this.sConstructor) ? this.sConstructor[j] : SZN.bind(this,this[j]);
				} else {
					throw new Error('registredComponent: component "' + name + '" already exist!')
				}
			}
		}
	}
};

/* vracim hlavni tridu */
SZN.Components.prototype.getMain = function(){
	var obj = this;
	while(typeof obj.TOP_LEVEL == 'undefined'){
		if(typeof obj._owner == 'undefined'){
			throw new Error('can\'t find TOP LEVEL Class');
		} else {
			obj = obj._owner;
		}
	}
	return obj;
};

/* postupne volani "destruktoru" komponent ve vlastnictvi tridy */
SZN.Components.prototype.callChildDestructor = function(){
	this.inDestruction = true;
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length; i++){
		var name = this.components[i].name;
		var fncName = '$' + this[name].sConstructor;
		if(typeof this[fncName] == 'function'){
			this[fncName]();
		}
		this[name] = null;
	}
};
