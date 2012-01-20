
// Zpozdeni volani nasledujicich metod o zadany cas (ms)
JAX.RegisterDecor("delay", JAX.METHOD_BOTH, function(time){
	this._lock();
	this.__delay = new JAX.Delay(this._unlock.bind(this),time);
	return this;
})

// Animace vybrane vlastnosti
JAX.RegisterDecor("animate", JAX.METHOD_BOTH, function( len, what, start, end, method, endcallback ){
	this._lock();
	var elm = this;
	var _endcallback = function(){
		if(!!endcallback){endcallback(what)};
		elm._animateEnd(what);
	}
	
	var interpolator = new JAK.CSSInterpolator(elm,len,{
		"interpolation":method||"LINEAR",
		"endCallback": _endcallback
	});
	
	if( start === null ){
		start = this.getStyle(what);
	}
	
	if(what.toLowerCase().indexOf("color") != -1){
		interpolator.addColorProperty(what,start,end);
	} else {
		var start = JAX._getCSSSuffix(start);
		var end = JAX._getCSSSuffix(end);
		if( start.suffix=="" && JAX._animatePXUnits.indexOf( what ) != -1 ){
			start.suffix = "px";
		}
		interpolator.addProperty( what, start.value, end.value, start.suffix );
	}
	interpolator.start();
	this.__animations[what] = interpolator;
	return this;
})

// Privatni metoda volana pri ukonceni animace
JAX.RegisterDecor("_animateEnd", JAX.METHOD_SINGLE, function(what){
	if( what in this.__animations ){
		delete this.__animations[what];
	}
	this._unlock();
})

// Zastavi vsechny probihajici animace a odemkne objekt
JAX.RegisterDecor("animateStop", JAX.METHOD_BOTH, function(what){
	if( !!what ){
		if( what in this.__animations ){
			this.__animations[what].stop();
			delete this.__animations[what];
		}
	} else {
		for(var key in this.__animations ){
			this.__animations[key].stop();
		};
		this.__animations = {};
	}
	this._unlock();
	return this;
})

// Privatni; zjistuje zda je objekt zamknut
JAX.RegisterDecor("_lockCheck", JAX.METHOD_SINGLE, function(func,args){
	if(this.__locked){
		var a = [];
		for( var i = 0; i < args.length; i ++){a.push( args[i] );};
		this.__queue.push([func,a]);
		return true;
	}
	return false;
})

// Zamkne volani nasledujicich metod (jen u nekterych)
JAX.RegisterDecor("_lock", JAX.METHOD_BOTH, function(){
	this.__locked++;
})

// Odemkne a zavola metody z fronty
JAX.RegisterDecor("_unlock", JAX.METHOD_BOTH, function(){
	if(this.__locked == 0) return false;
	this.__locked--;
	if( this.__locked == 0){
		var a;
		while( this.__queue.length != 0 ){
			a = this.__queue.pop();
			this[a[0]].apply(this,a[1]);
		}
	}
})

// Zavola zadanou fci kde argumentem je element
JAX.RegisterDecor("callFunction", JAX.METHOD_BOTH, function(func){
	if(this._lockCheck("callFunction",arguments)) return this;
	return func(this);
})

// Prohleda potomky elementu pomoci CSS query
JAX.RegisterDecor("$", JAX.METHOD_BOTH, function(query,single){
	var elm = this;
	return JAX.$(query,elm,single||false);
})

// Vlozi noveho potomka dle zadanych parametru (argumenty jako u JAX.make)
JAX.RegisterDecor("addElement", JAX.METHOD_BOTH, function(def,attrs){
	if(this._lockCheck("addElement",arguments)) return this;
	var elm = JAX.make(def,attrs||{});
	this.appendChild(elm);
	return this;
})

// Prejde na nasledujici prvek dle zadane query
JAX.RegisterDecor("nextNode", JAX.METHOD_SINGLE, function(query){
	return JAX.$$( JAX._nodeWalk( this, query, 1 ) );
})

// Prejde na predchozi prvek dle zadane query
JAX.RegisterDecor("prevNode", JAX.METHOD_SINGLE, function(query){
	return JAX.$$( JAX._nodeWalk( this, query, -1 ) );
})

// Prida elementu zadanou tridu
JAX.RegisterDecor("addClass", JAX.METHOD_BOTH, function(cls){
	if(this._lockCheck("addClass",arguments)) return this;
	JAK.DOM.addClass(this,cls);
	return this;
})

// Odebere elementu zadanou tridu
JAX.RegisterDecor("removeClass", JAX.METHOD_BOTH, function(cls){
	if(this._lockCheck("removeClass",arguments)) return this;
	JAK.DOM.removeClass(this,cls);
	return this;
})

// Zjistuje zda ma dany element tridu
JAX.RegisterDecor("hasClass", JAX.METHOD_SINGLE, function(cls){
	return ( (" "+this.className.toLowerCase()+" ").indexOf( " "+cls.toLowerCase()+" " ) != -1 );
})

// Navesi na element posluchace udalosti
JAX.RegisterDecor("event", JAX.METHOD_BOTH, function(type,method,obj){
	if(this._lockCheck("event",arguments)) return this;
	if( obj && typeof(method) == "string" ){method = obj[method].bind(obj);};
	if( method && typeof(obj) == "string" ){method = method[obj].bind(method);};
	if(typeof(this.__event_def[type]) == "undefined"){this.__event_def[type] = [];};
	
	var args = [];
	for( var i = 3; i < arguments.length; i ++ ){
		args.push(arguments[i]);
	}
	
	this.__event_def[type].push([ method, args ]);
	
	var listener = JAK.Events.addListener(this,type,this,"_eventCallback");
	this.storeValue("elm.event_"+type,listener);
	return listener;
})

// Privatni metoda
JAX.RegisterDecor("_eventCallback", JAX.METHOD_SINGLE, function(e,elm){
	var df = null;
	var baseArguments = null;
	if(typeof(this.__event_def[e.type]) != "undefined"){
		for(var i = 0; i < this.__event_def[e.type].length; i ++){
			df = this.__event_def[e.type][i];
			baseArguments = [e,elm];
			for( var a = 0; a < df[1].length; a ++ ){
				baseArguments.push(df[1][a]);
			}
			df[0].apply(window,baseArguments);
		}
	}
})

// Odstrani zadany typ posluchace
JAX.RegisterDecor("removeEvent", JAX.METHOD_BOTH, function(type){
	if(this._lockCheck("removeEvent",arguments)) return this;
	var evt = this.restoreValue("elm.event_"+type,false);
	if(evt){
		JAK.Events.removeListener(evt);
	}
	return this;
})

// Upravi element dle asoc. pole stejneho formatu jako u JAK.make/JAX.modify
JAX.RegisterDecor("modify", JAX.METHOD_BOTH, function(attrs){
	if(this._lockCheck("modify",arguments)) return this;
	if(typeof(attrs) == "function"){
		attrs(this);
	} else {
		JAX.modify(this,attrs||{});
	}
	return this;
})

// Appenduje zadane element/y; Vice elementu lze vlozit pomoci pole
JAX.RegisterDecor("append", JAX.METHOD_SINGLE, function(elms,anim){
	if(this._lockCheck("append",arguments)) return this;
	var anim = anim || 0;
	if(! ( elms instanceof Array )) var elms = [ elms ];
	for( var i = 0; i < elms.length; i ++ ) {
		this.appendChild(elms[i]);
		if(anim){
			JAX.DecorateElement(elms[i]);
			elms[i].opacity(0);
			elms[i].opacity(1,anim);
		}
	}
	return this;
});

// Odstrani element z jeho rodice
JAX.RegisterDecor("remove", JAX.METHOD_BOTH, function(anim){
	if(this._lockCheck("remove",arguments)) return this;
	var anim = anim||0;
	if(anim){
		this.opacity(0,anim,"SQRT",this._remove.bind(this));
	} else {
		this._remove();
	}
	return this;
});

// Privatni metoda
JAX.RegisterDecor("_remove", JAX.METHOD_BOTH, function(){
	this.parentNode.removeChild(this);
});

// Privatni metoda
JAX.RegisterDecor("storeValue", JAX.METHOD_BOTH, function(uid,value){
	if(this._lockCheck("storeValue",arguments)) return this;
	if(!this["_store"]){ this._store = {}; }
	this._store[uid] = value;
	return this;
});

// Privatni metoda
JAX.RegisterDecor("restoreValue", JAX.METHOD_SINGLE, function(uid,default_value){
	if(this._lockCheck("restoreValue",arguments)) return this;
	if(!this["_store"]){ this._store = {}; }
	if(typeof(default_value) != "undefined"){
		if(typeof(this._store[uid]) == "undefined"){
			return default_value;
		}
	}
	return this._store[uid];
});

// Prepina stav zobrazeno/skryto
JAX.RegisterDecor("toggle", JAX.METHOD_BOTH, function(time){
	if(this._lockCheck("toggle",arguments)) return this;
	if(this.restoreValue("elm.show",true)){
		this.hide(time);
	} else {
		this.show(time);
	};
});

// Zobrazi element
JAX.RegisterDecor("show", JAX.METHOD_BOTH, function(time,target_opacity,inline){
	if(this._lockCheck("show",arguments)) return this;
	this.style.display = inline?"inline":"block";
	this.storeValue("elm.show",true);
	if(!!time){
		this.animateStop("opacity");
		this.animate(time,"opacity",this.getOpacity(0.0),target_opacity||1.0);
	}
});

// Skryje element
JAX.RegisterDecor("hide", JAX.METHOD_BOTH, function(time){
	if(this._lockCheck("hide",arguments)) return this;
	this.storeValue("elm.show",false);
	if(!!time){
		this.animateStop("opacity");
		this.animate(time,"opacity",this.getOpacity(1.0),0.0,false,this._hide.bind(this));
	} else {
		this._hide();
	}
});

// Privatni metoda
JAX.RegisterDecor("_hide", JAX.METHOD_BOTH, function(){
	this.style.display = "none";
});

// Animace pruhlednosti
JAX.RegisterDecor("opacity", JAX.METHOD_BOTH, function(value,time,method,endcallback){
	if(this._lockCheck("opacity",arguments)) return this;
	if(!time){
		this.setOpacity(value);
	} else {
		this.animateStop("opacity");
		this.animate(time,"opacity",null,value,method||false,endcallback||false);
	};
	return this;
});

// Nastavi opacity (se zamkem & pro kolekci)
JAX.RegisterDecor("setOpacity", JAX.METHOD_BOTH, function(value){
	if(this._lockCheck("setOpacity",arguments)) return this;
	this._setOpacity(value)
});

// Privatni metoda ( primo nastavuje opacity)
JAX.RegisterDecor("_setOpacity", JAX.METHOD_BOTH, function(value){
	if(JAK.Browser.client == "ie" && JAK.Browser.version < 9){
		this.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity="+parseInt(value*100)+")";
	} else {
		this.style.opacity = value;
	}
});

JAX.RegisterDecor("getStyle", JAX.METHOD_SINGLE, function(what){
	if( what == "opacity" ){
		return this.getOpacity();
	} else {
		return JAK.DOM.getStyle(this,what);
	}
});

// Vraci hodnotu opacity
JAX.RegisterDecor("getOpacity", JAX.METHOD_SINGLE, function(default_value){
	var default_value = (typeof(default_value)=="undefined")?1.0:default_value;
	if(JAK.Browser.client == "ie" && JAK.Browser.version < 9){
		var filter = JAK.DOM.getStyle(this,"filter");
		if(!filter) return default_value;
		var value = filter.replace(new RegExp("(\\\D*)(\\\d\\\d?\\\d?)(.*)","g"),"$2");
		return parseInt(value)/100;
	} else {
		var value = JAK.DOM.getStyle(this,"opacity");
		if(!value) return default_value;
		return value*1.0;
	}
});

