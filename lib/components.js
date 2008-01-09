/**
 * @overview rozhraní určené pro vytváření hierarchie objektů na základě "komponent",
 * Pokud mít naše aplikace podobnou strukturu jako ukázkový graf (jednotlivé větve jsou instance tříd),
 * napomáhá automatizaci při jejím vytváření a rušení, včetně rušení jen jednotlivých větví, případně při
 * dynamickém doplňování.  
 *   
 *  <pre>
 *   	MAIN
 *   	 |____ child_1
 *   	 |_____child_2
 *   	 			|__child_2.1
 *   	 			|__child_2.2    
 * </pre>  
 * destruktoru. Rozhrani  
 * @version 1.0
 * @author jelc, wendigo
 */ 
    
/**
 * @class trida pro dědění rozhraní "Components", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností  
 * 
 */
SZN.Components = function(){}

SZN.Components.Name = 'Components';
SZN.Components.version = '1.0';

SZN.Components.prototype.CLASS = 'class';


/**
 * @method zjišťuje zda má daná třída definované komponenty
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.hasComponents = function(){
	if((this.components instanceof Array) && this.components.length){
		return true;
	} else { 
		return false;
	}
};

/**
 * @method přidá všechny komponenty uvedené v poli <em>componets</em> dané třídy
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
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
 * @method přidá novou komponentu za běhu programu
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název pod kterým se má komponenta vytvořit jako vlastnost objektu</li>
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
 * @method přidává jednotlivé komponenty, pokud komponenta nemá definouvanou vlastnost "name", vytvoří ji z názvu konstruktoru 
 * pokud má již třída vlostnost shodného jména, bude tato vlastnost přepsána 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název, pod kterým se ma komponenta vytvořit jako vlastnost objektu</li>
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
 * @method vytváří volání vlastních metod z objektu, ktery je definován argumentem owner
 * tak že čte vlastnost <em>'access'</em> svých metod, vlastost acces je string jehož
 * první částí je specifikátor přístupu (poviný) s hodnotou 'public' a za ním následuje mezerou
 * oddělený název pod jakým se má volání vytvořit, není-li uveden použije se název vytvořený
 * ze jména objektu a metody    
 * @param {object} owner reference na objekt, ve kterém se volání vytvoří
 * @throws {error} 'registredComponent: component "' + components_name + '" already exist!'
 * pokud <em>owner</em> již takto definovanou vlastnost má 
 */    
SZN.Components.prototype.registredMethod = function(owner){
	var field = [this,this.sConstructor];
	/* registrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(obj[j] === null) continue;
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
 * @method slouží k nalezení hlavniho objektu, který vytváří danou část programu
 * a má definovanou vlastnost TOP_LEVEL 
 * @returns {object} refetrence na hlavni objekt
 * @throws {error}  'can\'t find TOP LEVEL Class' pokud není nalezen hlavní objekt
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
 * @method slouží k postupnému volání destruktorů všech komponent, daného objektu
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
			var name = 'destructor';
			if((typeof this[cName][name] != 'undefined')
			&&(typeof this[cName][name] == 'function')){
				this[cName][name]();
			}
			this[cName] = null;
		} 
	}	
};
