
// toto pole bude plneno metodami jimiz se odekoruje element
JAX.ElementDecorator = {};
JAX.ElementDecorator.__decorated = true;
JAX.ElementDecorator.__locked = 0;
JAX.ElementDecoratorArrays = ["__queue","__animations","__event_def"];

JAX.$ = function(query,context,single){
	var single = !!single;
	var elms = JAX.query(query,context||false);
	if(single){
		JAX.DecorateElement( elms[0] );
		return elms[0];
	} else {
		return new JAX.HTMLCollection(elms);
	}
}

JAX.$$ = function(elm_id){
	var elm = JAK.gel(elm_id);
	if(elm === null) return null;
	JAX.DecorateElement(elm);
	return elm;
}

JAX.DecorateElement = function( elm, recursive ){
	var recursive = !!recursive;
	if(!elm) return false;
	if(elm.__decorated) return false;
	for(var method in JAX.ElementDecorator){
		elm[method] = JAX.ElementDecorator[method];
	}
	for(var i = 0; i < JAX.ElementDecoratorArrays.length; i ++){
		elm[JAX.ElementDecoratorArrays[i]] = [];
	}
	if( recursive ){
		var elms = JAK.DOM.arrayFromCollection(elm.childNodes);
		for(var i = 0; i < elms.length; i ++ ){
			JAX.DecorateElement( elms[i], recursive );
		}
	}
	return true;
};

JAX.HTMLCollection = JAK.ClassMaker.makeClass({
	NAME: "JAX.HTMLCollection",
	VERSION: "1.0"
});


JAX.HTMLCollection.prototype.$constructor = function(elms){
	var elms = JAK.DOM.arrayFromCollection(elms);
	if( !JAX.DECORATE_ONDEMAND ){
		for( var i = 0; i < elms.length; i ++ ){
			JAX.DecorateElement( elms[i] );
		}
	}
	
	this._htmlCollection = true;
	this.elements = elms;
	this.debug = "";
	this.length = elms.length;
	if( JAX.DEBUG ){this._genDebug();}
}

JAX.HTMLCollection.prototype._genDebug = function(){
	var elms = this.elements;
	var txt = "";
	var txt_array = [];
	for(var i = 0; i < elms.length; i ++ ){
		txt = "";
		txt += elms[i].tagName;
		if(elms[i].id) txt += "#"+elms[i].id;
		if(elms[i].className) txt += "."+elms[i].className;
		txt_array.push( txt );
	}
	this.debug = txt_array.join(", ");
}

JAX.HTMLCollection.prototype.push = function(){
	for( var i = 0; i < arguments.length; i ++ ){
		this.elements.push(arguments[i]);
	}
	this.length = this.elements.length;
	if( JAX.DEBUG ){this._genDebug();}
}

JAX.HTMLCollection.prototype.slice = function( start, end ){
	if(!!end){
		var result = this.elements.slice(start,end);
	} else {
		var result = this.elements.slice(start);
	}
	return new JAX.HTMLCollection(result);
}

JAX.HTMLCollection.prototype.splice = function( start, count ){
	if(!!count){
		var result = this.elements.splice(start,count);
	} else {
		var result = this.elements.splice(start);
	}
	this.length = this.elements.length;
	if( JAX.DEBUG ){this._genDebug();}
	return new JAX.HTMLCollection(result);
}

JAX.HTMLCollection.prototype.pop = function( ){
	var result = this.elements.pop();
	this.length = this.elements.length;
	if( JAX.DEBUG ){this._genDebug();}
	return result;
}

JAX.HTMLCollection.prototype.shift = function( ){
	var result = this.elements.shift();
	this.length = this.elements.length;
	if( JAX.DEBUG ){this._genDebug();}
	return result;
}

JAX.HTMLCollection.prototype.setAttr = function(attr,value){
	for( var i = 0; i < this.elements.length; i ++ ){
		this.elements[i][attr] = value;
	}
}

JAX.HTMLCollection.prototype.process = function(method,args){
	// metoda jez vola danou metodu pro jednotlive elementy v kolekci
	var element = null;
	for(var i = 0; i < this.elements.length; i ++ ){
		element = this.elements[i];
		JAX.DecorateElement( element );
		var meth = element[method];
		meth.apply(element,args);
	}
	return this;
}


JAX.RegisterDecor = function(method,applies_to,func){
	JAX.ElementDecorator[method] = func;
	if(applies_to == JAX.METHOD_BOTH){
		JAX.HTMLCollection.prototype[method] = function(){
			return this.process(method,arguments);
		}
	} else {
		return function(){
			throw new Error("JAX: Metodu '"+method+"' nelze použít nad kolekcí.");
		}
	}
}

