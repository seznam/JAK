/* staticka trida sestavujici dedicnost 
	1) rozsiruje prototypovy objekt dane tridy
	2) testuje zda jsou spravne zavislosti

*/
SZN.ClassMaker = {
	version :1.0,
	Name : 'ClassMaker',
	CLASS : 'class',
	
	/**
		Vytvarim tridu jedina
	
	*/
	makeClass: function(classConstructor){
		this._obj = classConstructor;
		
		if(!this._testDepend()){
			/* neni splnena zavislost */
			throw new Error("Dependency error in class " + this._obj.Name);
		}
		
		if((classConstructor) && (classConstructor.extend)){
			var extend = this._getExtends(classConstructor.extend);
			this._setInheritance(extend);
		}
		
		classConstructor.prototype.CLASS = 'class';
		classConstructor.prototype.sConstructor = classConstructor;
		classConstructor.destroy = this._destroy;
	},
	
	_destroy : function(obj){
		for(var i in obj){
			obj[i] = null;
		};
	},
	
	/*
		ziskavam rodice pro dedeni
	*/
	_getExtends : function(extend){
		if(typeof extend != 'string'){
			return [extend];
		} else {
			var tmp = extend.split(/[ ]+/);
			var out = new Array();
			for(var i = 0; i < extend.length; i++){
				try {
					eval('var ext = ' + tmp[i]);
				} catch(e){
					/* rodic neexistuje */
					throw new Error("Inheritance error " + e)
				}
				out[i] = ext;
			}
			return out;
		}
	},
	/*
		volam vlastni ziskani dedenych vlastnosti z predku
		a nastavuji prazdny 'destruktor'
	*/
	_setInheritance : function(extend){
		for(var i = 0; i < extend.length; i++){
			this._makeInheritance(extend[i]);
		}
		var name = '$' + this._obj.Name;
		this._obj.prototype[name] = new Function();		
	},
	
	/*
		kopiruji dedene prototypove vlastnosti
	*/
	_makeInheritance : function(data){
		for(i in data.prototype){
			this._obj.prototype[i] = data.prototype[i];
		}
	},
	/*
		testuji zavislosti Major verze
	*/
	_testDepend : function(){
		var field = (typeof this._obj.depend != 'undefined') ? this._obj.depend : [];
		var out = true;
		for(var i = 0; i < field.length; i++) {
			if((typeof field[i].sClass == 'undefined')
			|| (typeof field[i].sClass.version == 'undefined')){
				return false;				
			}
			var depMajor = field[i].sClass.version.split('.')[0];
			var claMajor = field[i].ver.split('.')[0];
			if(depMajor == claMajor){
				out = true;
			} else {
				out = false;
			}
		}
		return out;
	}
};


