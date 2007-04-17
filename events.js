SZN.Events = function(){
	this.Events();
};


SZN.Events.Name = 'Events';
SZN.Events.version = '1.0';
SZN.ClassMaker.makeClass(SZN.Events);

SZN.Events.prototype.eventFolder = new Object();


SZN.Events.prototype.Events = function(){

};
/* tusim instanci */
SZN.Events.prototype.$Events = function(){
	this._removeAllListeners();
	this.sConstructor.destroy(this);
};

/* vracim udalost */
SZN.Events.prototype.getEvent = function(e){
	return e || window.event;
};

/* vracim "cil" udalosti*/
SZN.Events.prototype.getTarget = function(e){
	return this.getEvent(e).target || this.getEvent(e).srcElement; 
};

/* zavesuji udalost verejne */
SZN.Events.prototype.addListener = function(elm,eType,obj,func,capture,cached){
	var capture = arguments[4] ? arguments[4] : false;
	var cached = arguments[5] ? arguments[5] : false;
	var method = null;
	var toFold = null;
	if(typeof obj == 'function'){
		toFold = this._addListener(elm,eType,obj,capture);
	} else if(typeof obj == 'object'){
		var cached = true;
		if(typeof func == 'string'){
			if(typeof obj[func] == 'function'){
				method = this._getMethod(obj,func,elm);
				toFold = this._addListener(elm,eType,method,capture);			
			} else {
				throw new Error('Events.addListener: arguments[3] must be method of arguments[2]');
			}
		} else if(typeof func == 'function'){
			method = this._getMethod(obj,func,elm);
			toFold = this._addListener(elm,eType,method,capture);		
		}
	} else {
		throw new Error('Events.addListener: arguments[2] must be object or function');
	}
	if(cached){
		//debug(toFold)
		return this._storeToFolder(toFold);
	} else {
		return 0;
	}
};

/* vlastni skutecne zaveseni */
SZN.Events.prototype._addListener = function(elm,eType,func,capture){
	if (document.addEventListener) {
		if (window.opera && (elm == window)){
			elm = document;
		}
		elm.addEventListener(eType,func,capture);
	} else if (document.attachEvent) {
		elm.attachEvent('on'+eType,func);
	}
	return [elm,eType,func,capture];
};

/* vracim zavesovanou metodu */
SZN.Events.prototype._getMethod = function(obj,func,elm){
	if(typeof func == 'string'){
		if(typeof obj[func].canTransform == 'undefined'){
			return function(e){return obj[func].apply(obj,[e,elm])};
		} else {
			return obj[func];
		}
	} else {
		if(typeof func.canTransform == 'undefined'){
				return function(e){return func.apply(obj,[e,elm])};
		} else {
			return func;
		}	
	}
};

/* ukladam data zaveseni do osociatiniho pole */
SZN.Events.prototype._storeToFolder = function(data){
	var id = SZN.idGenerator();
	this.eventFolder[id] = new Object();
	this.eventFolder[id].trg = data[0];
	this.eventFolder[id].typ = data[1];
	this.eventFolder[id].action = data[2];
	this.eventFolder[id].bool = data[3];
	return id;	
};

/* odebiram udalost */
SZN.Events.prototype.removeListener = function(elm,eType,obj,func,capture,cached){
	var capture = arguments[4] ? arguments[4] : false;
	var cached = arguments[5] ? arguments[5] : false;
	cached = (arguments.length == 1) ? arguments[0] : cached;
	if(typeof cached == 'string'){
		return this._removeById(cached);
	}
	
	if(typeof obj == 'function'){
		return this._removeListener(elm,eType,obj,capture);
	}
	
	throw new Error('Events.removeListener: wrong arguments');
};

/* vlastni skutecne odveseni udalosti */
SZN.Events.prototype._removeListener = function(elm,eType,func,capture){
	if (document.removeEventListener) {
		if (window.opera && (elm == window)){
			elm = document;
		}
		elm.removeEventListener(eType,func,capture);
	} else if (document.detachEvent) {
		elm.detachEvent('on'+eType,ffunc);
	}
	return 0;
};

/* odvesuji udalost dle jejiho id */
SZN.Events.prototype._removeById = function(cached){
	try{
		var obj = this.eventFolder[cached];
		this._removeListener(obj.trg,obj.typ,obj.action,obj.bool);
		this.eventFolder[cached] = null;
		delete(this.eventFolder[cached]);
	} catch(e){
		debug(e)
		return 1;
	}
	return 0;
};

/* odvesuji vsechny udalosti */
SZN.Events.prototype._removeAllListeners = function(){
	for(var i in this.eventFolder){
		this._removeById(i);
	}
};

/* zastavuji prostupovani udalosti  */
SZN.Events.prototype.stopEvent = function(e){
	var e = this.getEvent(e);
	if (e.stopPropagation){
		e.stopPropagation();
	} else { 
		e.cancelBubble= true;
	}
};

/* rusim vycjozi zpracovani udalosti prohlizecem */
SZN.Events.prototype.cancelDef = function(e){
	var e = this.getEvent(e);
	if(e.preventDefault) {
		e.preventDefault();
	} else {
		e.returnValue = false;
	}
};

/* vytvareni metod pro pouziti pri spousteni v intervalu nebo se zpozdenim */
SZN.Events.prototype.addTimeFunction = function(owner,handleFuncName,exeFunc){
	owner[handleFncName] = function(){return exeFnc.apply(owner,[])};
};


/* 
	VYCHOZI INICIALIZACE:
	SZN.events = new SZN.Events();

*/  


