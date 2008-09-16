/***/
SZN.FlashUploader = SZN.ClassMaker.makeClass({
	NAME: "FlashUploader",
	VERSION: "1.0",
	CLASS: "class"
});
/* pocet instanci */
SZN.FlashUploader.count = 0;
/* zasobnik instanci */
SZN.FlashUploader.appFolder = {};
/* je flash inicializovany ? */
SZN.FlashUploader.inited = false;
/* fronta cekajici na inicializaci */
SZN.FlashUploader.waitingApps = new Array();
/* globalni flashovy objekt */
SZN.FlashUploader.flashObj = null;

SZN.FlashUploader.flVersion = {
	minRevision : 60,
	minMajor : 9
};

/* inicializace cekajici fronty */
/***/
SZN.FlashUploader.init = function(){
	this.inited = true;
	while(this.waitingApps.length){
		this.waitingApps[0].mySelf.init(this.waitingApps[0].flash,this.waitingApps[0].handler,this.waitingApps[0].target,this.waitingApps[0].set);
		this.waitingApps.shift();
	}
}

/* Detekujeme podporu (Flash Player 9 a vyssi )*/

SZN.FlashUploader.isSupported = function(){
	if(SZN.Browser.client == 'ie'){
		try {
			var tested = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.9");
			var ver = tested.GetVariable("$version").split(' ')[1].split(',')[0];
			this.flVersion.major = ver;
			if(parseFloat(ver) >= this.flVersion.minMajor){
				return true;
			} else {
				return false;
			}
		} catch(e){
			return false;
		}
	} else {
		var tested = navigator.plugins["Shockwave Flash"];
		if(tested){
			try{
				var major = parseFloat(tested.description.split(' ')[2]);
				var revStr = tested.description.split(/[\s]{1,}/)[3];
				this.flVersion.major = parseInt(major);
				if(isNaN(revStr)){
					var rev = parseInt(revStr.substr(1));
				} else {
					var rev = parseInt(revStr);
				}
				this.flVersion.revision = rev;
				if(major >= this.flVersion.minMajor){
					if((major == this.flVersion.minMajor) && (rev < this.flVersion.minRevision)){
						return false;
					}
					return true;
				} else {
					return false;
				}
			} catch(e){
				return false;
			}
		} else {
			return false;
		}
	}
	return false;
}




SZN.FlashUploader.insertFlash = function(flashPath,node,className,id){
	var ok = this.isSupported();
	if(ok){
		var tmp = SZN.cEl('div')
		var rnd = '?' + Math.random();
		tmp.innerHTML = '<object type="application/x-shockwave-flash" height="1" width="1" data="' + flashPath + rnd + '" >' +
		'<param name="movie" value="' + flashPath + rnd + '" />' +
		'<param name="quality" value="high" />' + 		
		'</object>';
		var nd = tmp.getElementsByTagName('object')[0];

		if(className){
			nd.className = className;
		}
		
		if(id){
			nd.id = id;
		}
		
		this.flashObj = nd;
		
		if(node){
			node.appendChild(nd)
		} else {
			var node = document.getElementsByTagName('body')[0]
			node.insertBefore(nd,node.firstChild);
		}

		return this.flashObj;
	} else {
		return ok;
	}
}

/* pridani instance do zasobniku */
/***/
SZN.FlashUploader.addApp = function(app){
	this.appFolder[app.id] = app;
	this.count++;
}

/* odebrani instance ze zasobniku */
/***/
SZN.FlashUploader.removeApp = function(app){
	if(app.$destructor){
		app.$destructor();
	}
	var id = app.id;
	this.appFolder[id] = null;
	delete(this.appFolder[id]);
	this.count--;
}

/* vraci instanci dle jejiho id */
/***/
SZN.FlashUploader.getAppById = function(id){
	if(this.appFolder[id]){
		return this.appFolder[id];
	} else {
		return null;
	}
}

/* vola metodu s parametry dane instance */
/***/
SZN.FlashUploader.callBack = function(appId,methodName,param){
	var app = this.getAppById(appId);
	if(!app){
		return;
	}
	var args = [];
	for(var i = 2; i < arguments.length;i++){
		args.push(arguments[i]);
	}
	return app[methodName].apply(app,args);
}
/***/
SZN.FlashUploader.prototype.$constructor = function(visualInterface){
	this.actionFolder = {};
	
	if(!(visualInterface instanceof SZN.FlashUploader.VisualInterface)) {
		throw new Error('FlashUploader::constructor: argument must be instance of SZN.FlashUploader.VisualInterface')
	}
	
	this.visualInterface = visualInterface;
	this.visualInterface.setOwner(this);
	
	
	this.flashObj = null;
	this.handlerNode = null;
	this.data = [];
	this.id = SZN.idGenerator();
	this.sConstructor.addApp(this);
	this.table = null;
	this.tableIcon = [];
	this.bindedRemove = SZN.bind(this,this.removeData)
	this.callBinded = false;
	this.sumLoaded = 0;
	this.totalLength = 0;
	this.errorFolder = {};
	this.errorFolder.empty = true;
	
	this.callBackFolder = {}
};

SZN.FlashUploader.prototype.$destructor = function(){
	for(var i in this.actionFolder){
		if(this.actionFolder[i]){
			SZN.Events.removeListener(this.actionFolder[i]);
		}
		this.actionFolder[i] = null;
		delete(this.actionFolder[i]);
	}
}
/* inicializace */
/***/
SZN.FlashUploader.prototype.init = function(flashId,handlerId,targetId,setting){
	
	if(!this.sConstructor.inited){
		var data = {
			mySelf:this,
			flash:flashId,
			handler:handlerId,
			target:targetId,
			set : setting		}
		this.sConstructor.waitingApps.push(data);
		return;
	}
	
	if(typeof flashId == 'string'){
		this.flashObj = SZN.gEl(flashId);
	} else {
		this.flashObj = this.sConstructor.flashObj;
	}
	
	this.handlerNode = SZN.gEl(handlerId);
	//this.actionFolder.flOpen = SZN.Events.addListener(this.handlerNode,'click',this,'openFiles',false,true);
	this.callFlash('setJsAppId',this.id);
	this.setting = setting.get();

	this.setting.id = this.id;
	var x = this.callFlash('bindJSClass',this.setting);

	var m = this.visualInterface.init(handlerId);
};

SZN.FlashUploader.prototype.getSettingData = function(){
	return this.setting;
}


/* pridani promene, ktera se bude posilat s obrazkem */
/***/
SZN.FlashUploader.prototype.addFormData = function(dataName,dataValue){
	if(typeof arguments[0] == 'object'){
		var out = {}
		out[dataName.name] = dataName.value
		this.callFlash('setFormData',out);
	} else {
		this.callFlash('setFormData',{dataName:dataValue});
	}
}
/* odebrani promene ktera se posila s obrazkem */
/***/
SZN.FlashUploader.prototype.removeFormData = function(dataName){
	this.callFlash('removeFormData',dataName)
}
/* odebrani vsech promenych ktere se posilaji s obrazkem */
/***/
SZN.FlashUploader.prototype.clearFormData = function(){
	this.callFlash('clearFormData')
}
/* vyvolani dialogoveho okna pro vyber souboru */
/***/
SZN.FlashUploader.prototype.openFiles = function(e,elm){
	if(e){
		SZN.Events.cancelDef(e);
	}
	this.callFlash('openDialog');
}
/* volani metod flashe */
/***/
SZN.FlashUploader.prototype.callFlash = function(flashMethod,param){
	if(this.flashObj.getJsAppId() != this.id){
		this.flashObj.setJsAppId(this.id);
	}
	
	if(typeof param != 'undefined'){
		return this.flashObj[flashMethod](param);
	} else {
		return this.flashObj[flashMethod]();
	}
};
/* volani zobrazeni grafickeho rozhrani s frontou cekajici na nahrani */
/***/
SZN.FlashUploader.prototype.setData = function(data){
	this.visualInterface.showData(data);
}


/* zavolani nahrani zvolenych souboru */
/***/
SZN.FlashUploader.prototype.myUpload = function(e,elm){
	this.totalLength = this.callFlash('getFullUploadSize');
	this.callFlash('myUpload');
}

/* odebrani obrazku z fronty nebo vsech po skonceni nahrani */
/***/
SZN.FlashUploader.prototype.removeData = function(){
	if(arguments[0]){
		this.visualInterface.removeData(true)
		this.uploadEnd();
		return;
	}
	this.visualInterface.removeData();
}

/* odebrani obrazku z fronty na nahrani */
/***/
SZN.FlashUploader.prototype.removeItem = function(index){
	this.callFlash('removeItem',index);
};

SZN.FlashUploader.prototype.clear = function(){
	this.visualInterface.showData([]);
	this.callFlash('clear');
}

SZN.FlashUploader.prototype.getItem = function(index){
	var xx = this.callFlash("getItem",index)
	return xx
}

/* postup nahrani pro dany obrazek */
/***/
SZN.FlashUploader.prototype.showProgress = function(obj){
	this.totalProgress(obj.loaded);
	this.visualInterface.showProgress(obj);
}

/* konec nahrani jednoho obrazku */
/***/
SZN.FlashUploader.prototype.oneUploadEnd = function(obj){
	try {
		var itemData = this.visualInterface.oneUploadEnd(obj);
		if(itemData){
			this.callBack('one',itemData);
			return false;
		}
		return true;
	} catch(e){
		//debug('OUE::' + e)
		return true;
	}
}
/* konec nahrani cele fronty */
/***/
SZN.FlashUploader.prototype.uploadEnd = function(data){
	this.sumLoaded = 0;
	this.totalLength = 0;
	
	this.visualInterface.uploadComplete(data);
}

SZN.FlashUploader.prototype.continueAction = function(){
	try{
		this.callBack('continue');
		this.visualInterface.hideDefaultBox();
	} catch(e){
		throw new Error('SZN.FlashUploader::continueAction - continueError');
	}
}

SZN.FlashUploader.prototype.callBack = function(type,data){
	if(this.callBackFolder[type]){
		this.callBackFolder[type].obj[this.callBackFolder[type].method](data);
	}
}

SZN.FlashUploader.prototype.addCallBack = function(type,obj,method){
	this.callBackFolder[type] = {
		obj : obj,
		method : method
	}
}


/* postup nahrani vsech obrazku */
/***/
SZN.FlashUploader.prototype.totalProgress = function(num){
	this.sumLoaded += num;
	var proc = Math.round((this.sumLoaded/this.totalLength) * 100);
	this.visualInterface.showTotalProgress(proc);
}

SZN.FlashUploader.prototype.myContinue = function(msg){
	this.continueAction()
}

SZN.FlashUploader.prototype.updateItem = function(obj){
	this.callFlash('updateItem',obj)
}

/*############################################################################*/
/*############################################################################*/

/**
	nastaveni uploaderu
*/
SZN.FlashUploader.UploadSetting = SZN.ClassMaker.makeClass({
	NAME:'UploadSetting',
	VERSION:"1.0",
	CLASS:'class'
});
/***/
SZN.FlashUploader.UploadSetting.prototype.$constructor = function(url,multiple,minSize,maxSize,maxFilesCount){
	this.murl = url;
	this.dt = {};
	this.mfilter = new Array();
	this.minSize = minSize ? minSize : 0;
	this.maxSize = maxSize ? maxSize : 0;
	this.maxFilesCount = maxFilesCount ? maxFilesCount : 0;
	this.multiple = multiple;
	this.headers = new Array();
};
/***/
SZN.FlashUploader.UploadSetting.prototype.addFileFilter = function(description){
	var fld = new Array();
	for(var i = 1; i < arguments.length;i++){
		fld.push('*.' + arguments[i]);
	}
	
	if(!fld.length){
		fld.push('*.*');
	}
	
	var desc = description + ': (' + fld.join(', ') + ')';
	var types = fld.join(';')
	
	var out = {
		desc : desc,
		types : types
	}
	
	this.mfilter.push(out);
};

SZN.FlashUploader.UploadSetting.prototype.addHeader = function(headerName,headerValue){
	var out = {
		hName : headerName,
		hValue : headerValue
	}
	this.headers.push(out);
}

/***/
SZN.FlashUploader.UploadSetting.prototype.addFormData = function(dataName,dataValue){
	this.dt[dataName] = dataValue;
}
/***/
SZN.FlashUploader.UploadSetting.prototype.get = function(){
	return {
		murl:this.murl,
		dt:this.dt,
		mfilter:this.mfilter,
		multiple:this.multiple,
		minSize:this.minSize,
		maxSize:this.maxSize,
		maxFilesCount:this.maxFilesCount,
		headers:this.headers
	}
}

/*############################################################################*/
/*############################################################################*/

/* "abstraktni trida" popisujici vizualni rozhrani od uploaderu */
SZN.FlashUploader.VisualInterface = SZN.ClassMaker.makeClass({
	NAME:'VisualInterface',
	VERSION:'1.0',
	CLASS:'class'
});
/* konstruktor (musi byt volan i z potomku) */
SZN.FlashUploader.VisualInterface.prototype.$constructor = function(targetId){
	this.owner = null;
	this.targetId = targetId;
};
/* destruktor */
SZN.FlashUploader.VisualInterface.prototype.$destructor = function(){
	// Abstract Only
}
/**/
SZN.FlashUploader.VisualInterface.prototype.init = function(){
	// Abstract Only
}
/**	
	spoji instanci tridy s instanci FlashUploaderu pro ktery bude pracovat 
	@param {object} owner instance SZN.FlashUploader pro ktery bude trida 
	pracovat
*/
SZN.FlashUploader.VisualInterface.prototype.setOwner = function(owner){
	this.owner = owner;
}
/**
	je volana pokazde, kdyz jsou vybrana data pro nahrani, jako argument
	dostava pole objektu popisujici vsechna vybrana data (momentalne 
	nazev souboru, velikost) a pole cgybovych zprav odpovidajici datum pokud existuje
	@param {array} data pole udaju o vsech vybranych objektech k
	uploadu
	@param {array} errorData polo s chybami k nahravanym datum nebo null

*/
SZN.FlashUploader.VisualInterface.prototype.showData = function(data,errorData){
	// Abstract Only
};
/**
	je volana pokazde kdyz je treba odstranit data z vyberu, nebo vybrazdnit
	vizualizaci vyberu pred jeji aktualizaci, muze dostat jeden argument
	preveditelny na true, ktery znamena ze je vyprazdneni volano po uspesnem
	uploadu souboru
	@param {boolean/any} [flag]  libovolna hodnota, pokud ji lze prevest na true
	znamena ze je metoda volana po uspesnem nahrani vsech souboru
*/
SZN.FlashUploader.VisualInterface.prototype.removeData = function(){
	// Abstract Only
}

/**
	Zobrazi rozhrani
*/
SZN.FlashUploader.VisualInterface.prototype.show = function(){
	// Abstract Only
}
/**
	Skryje rozhrani
*/
SZN.FlashUploader.VisualInterface.prototype.hide = function(){
	// Abstract Only
}
/**
	Pri nahravani souboru je opakovane prubezne volana pro jeden kazdy
	soubor dokud nedojde k jeho nahrani a jako argument dostava objekt
	s vlastnostmi index (urcuje poradi obrazku v zobrazovanem vypisu) a num
	(urcuje kolik procent bylo nahrano)
	@param {object} obj s vlastnostmi ktere identifikuji soubor a popisuji stav 
	jeho nahrani
*/
SZN.FlashUploader.VisualInterface.prototype.showProgress = function(obj){
	// Abstract Only
}
/**
	Je opakovane volana pri nahravani souboru a jako argument dostava cislo,
	ktere popisuje, kolik procent z celkove velikosti vsech souboru jiz
	bylo nahrano.
	@param {Number} num stav nahrani vsech souboru
*/
SZN.FlashUploader.VisualInterface.prototype.showTotalProgress = function(num){
	// Abstract Only
}
/**
* Je volana po skonceni nahravani jednoho obrazku, bez ohledu na to zda doslo k 
* k chybe, o stavu informuje ve svem argumentu
*
*
*/
SZN.FlashUploader.VisualInterface.prototype.oneUploadEnd = function(obj){
	// Abstract Only
}

SZN.FlashUploader.VisualInterface.prototype.uploadComplete = function(obj){
	// Abstract Only
}

SZN.FlashUploader.VisualInterface.prototype.continueAction = function(obj){
	// Abstract Only
}
