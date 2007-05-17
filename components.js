/**
 * @overview rozhrani urcene pro vytvareni hierarchie objektu na zaklade "komponent"
 * "registraci" volani metod objektu z jinych objektu pod jinymi jmeny a volani
 * destruktoru. Rozhrani  
 * @version 1.0
 * @author jelc, wendigo
 */ 
    
/**
 * @class trida pro dedeni rozhrani "Components", neni urcena k vytvareni
 * vlastnich instanci 
 */
SZN.Components = function(){}

SZN.Components.Name = 'Components';
SZN.Components.version = '1.0';

SZN.Components.prototype.CLASS = 'class';


/**
 * @method zjistuje zda ma dana trida definovane komponenty
 * @returns {boolean} <em>true</em> pokud ma komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.hasComponents = function(){
	if(this.components instanceof Array){
		return true;
	} else { 
		return false;
	}
};

/**
 * @method prida vsechny komponenty uvedene v poli <em>componets</em> dane tridy
 * @returns {boolean} <em>true</em> pokud ma komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.addAllComponents = function(){
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length;i++){
		this._addComponent(this.components[i]);
	}
	return true;
};


/**
 * @method prida novou komponentu za behu programu
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na tridu, ktera je komponentou</li>
 * <li>name <em>{string}</em> nazev podk kterym se ma komponenta vytvotit jako vlastnost objektu</li>
 * </ul>   
 */   
SZN.Components.prototype.addNewComponent = function(component){
	if(!this.hasComponents()){
		this.components = new Array();
	}
	this.components.push(component);
	this._addComponent(component);
};

/* pridava jednotlive komponenty z pole */
/**
 * @private
 * @method pridava jednotlive komponenty, pokud komponenta nema definouvanou vlastnost "name", vytvori ji z nazvu konstruktoru 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na tridu, ktera je komponentou</li>
 * <li>name <em>{string}</em> nazev pod kterym se ma komponenta vytvotit jako vlastnost objektu</li>
 * </ul>   
 *
 */    
SZN.Components.prototype._addComponent = function(component){
	if(typeof component.part != 'undefined'){
		if(typeof component.name == 'undefined'){
			component.name = component.part.Name.substring(0,1).toLowerCase();
			component.name += component.part.Name.substring(1);
		} 
		if(typeof component.setting != 'undefined'){
			this[component.name] = new component.part(this,component.name,component.setting);
		} else {
			this[component.name] = new component.part(this,component.name);
		}
	}
};

/* obsahuje registraci 'public' komponent v instanci tridy definovane
*  argumentem owner
*/
/**
 * @method vytvari volani vlastnich metod z objektu, ktery je definovan argumentem owner
 * tak ze cte vlastnost <em>'access'</em> svych metod, vlastost acces je string jehoz
 * prvni casti je specifikator pristupu (poviny) s hodnotou 'public' a za nim nesleduje mezerou
 * oddeleny nazev pod jakym se ma volani vytvorit, neni-li uveden pouzije se nazev vytvoreny
 * ze jmena objektu a metody    
 * @param {object} owner reference na objekt ve kterem se volani vytvori
 * @throws {error} 'registredComponent: component "' + components_name + '" already exist!'
 * pokud <em>owner</em> jiz takto definovanou vlastnost ma 
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
/**
 * @method slouzi k nalezeni hlavniho objektu ktery vytvari danou cast programu
 * a ma definovanou vlastnost TOP_LEVEL 
 * @returns {object} refetrence na hlavni objekt
 * @throws {error}  'can\'t find TOP LEVEL Class' pokud neni nalezen hlavni objekt
 */     
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

/**
 * @method slouzi k postupnemu volani destruktoru vsech komponent
 */
SZN.Components.prototype.callChildDestructor = function(){
	this.inDestruction = true;
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length; i++){
		var cName = this.components[i].name;
		if(this[cName] == null) {
			continue;
		}
		if((typeof this[cName].CLASS != 'undefined') && (typeof this[cName].inDestruction != 'boolean')){
			var name = '$' + this[cName].constructor.Name;
			if((typeof this[cName][name] != 'undefined')
			&&(typeof this[cName][name] == 'function')){
				this[cName][name]();
			}
			this[cName] = null;
		} 
	}	
};
