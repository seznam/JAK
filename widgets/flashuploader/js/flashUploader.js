/***/
JAK.FlashUploader = JAK.ClassMaker.makeClass({
	NAME: "FlashUploader",
	VERSION: "1.0",
	CLASS: "class"
});
/* pocet instanci */
JAK.FlashUploader.count = 0;
/* zasobnik instanci */
JAK.FlashUploader.appFolder = {};
/* je flash inicializovany ? */
JAK.FlashUploader.inited = false;
/* fronta cekajici na inicializaci */
JAK.FlashUploader.waitingApps = new Array();
/* globalni flashovy objekt */
JAK.FlashUploader.flashObj = null;

JAK.FlashUploader.flVersion = {
	minRevision : 60,
	minMajor : 9
};

/* inicializace cekajici fronty */
/***/
JAK.FlashUploader.init = function(){
	this.inited = true;
	while(this.waitingApps.length){
		this.waitingApps[0].mySelf.init(this.waitingApps[0].flash,this.waitingApps[0].handler,this.waitingApps[0].target,this.waitingApps[0].set);
		this.waitingApps.shift();
	}
}

/* Detekujeme podporu (Flash Player 9 a vyssi )*/

JAK.FlashUploader.isSupported = function(){
	if(JAK.Browser.client == 'ie'){
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




JAK.FlashUploader.insertFlash = function(flashPath,node,className,id){
	var ok = this.isSupported();
	if(ok){
		var tmp = JAK.cEl('div')
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
JAK.FlashUploader.addApp = function(app){
	this.appFolder[app.id] = app;
	this.count++;
}

/* odebrani instance ze zasobniku */
/***/
JAK.FlashUploader.removeApp = function(app){
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
JAK.FlashUploader.getAppById = function(id){
	if(this.appFolder[id]){
		return this.appFolder[id];
	} else {
		return null;
	}
}

/* vola metodu s parametry dane instance */
/***/
JAK.FlashUploader.callBack = function(appId,methodName,param){
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
JAK.FlashUploader.prototype.$constructor = function(visualInterface){
	this.actionFolder = {};
	
	if(!(visualInterface instanceof JAK.FlashUploader.VisualInterface)) {
		throw new Error('FlashUploader::constructor: argument must be instance of JAK.FlashUploader.VisualInterface')
	}
	
	this.visualInterface = visualInterface;
	this.visualInterface.setOwner(this);
	
	
	this.flashObj = null;
	this.handlerNode = null;
	this.data = [];
	this.id = JAK.idGenerator();
	this.constructor.addApp(this);
	this.table = null;
	this.tableIcon = [];
	this.bindedRemove = this.removeData.bind(this);
	this.callBinded = false;
	this.sumLoaded = 0;
	this.totalLength = 0;
	this.errorFolder = {};
	this.errorFolder.empty = true;
	
	this.callBackFolder = {}
};

JAK.FlashUploader.prototype.$destructor = function(){
	for(var i in this.actionFolder){
		if(this.actionFolder[i]){
			JAK.Events.removeListener(this.actionFolder[i]);
		}
		this.actionFolder[i] = null;
		delete(this.actionFolder[i]);
	}
}
/* inicializace */
/***/
JAK.FlashUploader.prototype.init = function(flashId,handlerId,targetId,setting){
	
	if(!this.constructor.inited){
		var data = {
			mySelf:this,
			flash:flashId,
			handler:handlerId,
			target:targetId,
			set : setting		}
		this.constructor.waitingApps.push(data);
		return;
	}
	
	if(typeof flashId == 'string'){
		this.flashObj = JAK.gEl(flashId);
	} else {
		this.flashObj = this.constructor.flashObj;
	}
	
	this.handlerNode = JAK.gEl(handlerId);
	//this.actionFolder.flOpen = JAK.Events.addListener(this.handlerNode,'click',this,'openFiles',false,true);
	this.callFlash('setJsAppId',this.id);
	this.setting = setting.get();

	this.setting.id = this.id;
	var x = this.callFlash('bindJSClass',this.setting);

	var m = this.visualInterface.init(handlerId);
};

JAK.FlashUploader.prototype.getSettingData = function(){
	return this.setting;
}


/* pridani promene, ktera se bude posilat s obrazkem */
/***/
JAK.FlashUploader.prototype.addFormData = function(dataName,dataValue){
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
JAK.FlashUploader.prototype.removeFormData = function(dataName){
	this.callFlash('removeFormData',dataName)
}
/* odebrani vsech promenych ktere se posilaji s obrazkem */
/***/
JAK.FlashUploader.prototype.clearFormData = function(){
	this.callFlash('clearFormData')
}
/* vyvolani dialogoveho okna pro vyber souboru */
/***/
JAK.FlashUploader.prototype.openFiles = function(e,elm){
	if(e){
		JAK.Events.cancelDef(e);
	}
	this.callFlash('openDialog');
}
/* volani metod flashe */
/***/
JAK.FlashUploader.prototype.callFlash = function(flashMethod,param){
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
JAK.FlashUploader.prototype.setData = function(data){
	this.visualInterface.showData(data);
}


/* zavolani nahrani zvolenych souboru */
/***/
JAK.FlashUploader.prototype.myUpload = function(e,elm){
	this.totalLength = this.callFlash('getFullUploadSize');
	this.callFlash('myUpload');
}

/* odebrani obrazku z fronty nebo vsech po skonceni nahrani */
/***/
JAK.FlashUploader.prototype.removeData = function(){
	if(arguments[0]){
		this.visualInterface.removeData(true)
		this.uploadEnd();
		return;
	}
	this.visualInterface.removeData();
}

/* odebrani obrazku z fronty na nahrani */
/***/
JAK.FlashUploader.prototype.removeItem = function(index){
	this.callFlash('removeItem',index);
};

JAK.FlashUploader.prototype.clear = function(){
	this.visualInterface.showData([]);
	this.callFlash('clear');
}

JAK.FlashUploader.prototype.getItem = function(index){
	var xx = this.callFlash("getItem",index)
	return xx
}

/* postup nahrani pro dany obrazek */
/***/
JAK.FlashUploader.prototype.showProgress = function(obj){
	this.totalProgress(obj.loaded);
	this.visualInterface.showProgress(obj);
}

/* konec nahrani jednoho obrazku */
/***/
JAK.FlashUploader.prototype.oneUploadEnd = function(obj){
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
JAK.FlashUploader.prototype.uploadEnd = function(data){
	this.sumLoaded = 0;
	this.totalLength = 0;
	
	this.visualInterface.uploadComplete(data);
}

JAK.FlashUploader.prototype.continueAction = function(){
	try{
		this.callBack('continue');
		this.visualInterface.hideDefaultBox();
	} catch(e){
		throw new Error('JAK.FlashUploader::continueAction - continueError');
	}
}

JAK.FlashUploader.prototype.callBack = function(type,data){
	if(this.callBackFolder[type]){
		this.callBackFolder[type].obj[this.callBackFolder[type].method](data);
	}
}

JAK.FlashUploader.prototype.addCallBack = function(type,obj,method){
	this.callBackFolder[type] = {
		obj : obj,
		method : method
	}
}


/* postup nahrani vsech obrazku */
/***/
JAK.FlashUploader.prototype.totalProgress = function(num){
	this.sumLoaded += num;
	var proc = Math.round((this.sumLoaded/this.totalLength) * 100);
	this.visualInterface.showTotalProgress(proc);
}

JAK.FlashUploader.prototype.myContinue = function(msg){
	this.continueAction()
}

JAK.FlashUploader.prototype.updateItem = function(obj){
	this.callFlash('updateItem',obj)
}

/*############################################################################*/
/*############################################################################*/

/**
	nastaveni uploaderu
*/
JAK.FlashUploader.UploadSetting = JAK.ClassMaker.makeClass({
	NAME:'UploadSetting',
	VERSION:"1.0",
	CLASS:'class'
});
/***/
JAK.FlashUploader.UploadSetting.prototype.$constructor = function(url,multiple,minSize,maxSize,maxFilesCount){
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
JAK.FlashUploader.UploadSetting.prototype.addFileFilter = function(description){
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

JAK.FlashUploader.UploadSetting.prototype.addHeader = function(headerName,headerValue){
	var out = {
		hName : headerName,
		hValue : headerValue
	}
	this.headers.push(out);
}

/***/
JAK.FlashUploader.UploadSetting.prototype.addFormData = function(dataName,dataValue){
	this.dt[dataName] = dataValue;
}
/***/
JAK.FlashUploader.UploadSetting.prototype.get = function(){
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
JAK.FlashUploader.VisualInterface = JAK.ClassMaker.makeClass({
	NAME:'VisualInterface',
	VERSION:'1.0',
	CLASS:'class'
});
/* konstruktor (musi byt volan i z potomku) */
JAK.FlashUploader.VisualInterface.prototype.$constructor = function(targetId){
	this.owner = null;
	this.targetId = targetId;
};
/* destruktor */
JAK.FlashUploader.VisualInterface.prototype.$destructor = function(){
	// Abstract Only
}
/**/
JAK.FlashUploader.VisualInterface.prototype.init = function(){
	// Abstract Only
}
/**	
	spoji instanci tridy s instanci FlashUploaderu pro ktery bude pracovat 
	@param {object} owner instance JAK.FlashUploader pro ktery bude trida 
	pracovat
*/
JAK.FlashUploader.VisualInterface.prototype.setOwner = function(owner){
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
JAK.FlashUploader.VisualInterface.prototype.showData = function(data,errorData){
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
JAK.FlashUploader.VisualInterface.prototype.removeData = function(){
	// Abstract Only
}

/**
	Zobrazi rozhrani
*/
JAK.FlashUploader.VisualInterface.prototype.show = function(){
	// Abstract Only
}
/**
	Skryje rozhrani
*/
JAK.FlashUploader.VisualInterface.prototype.hide = function(){
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
JAK.FlashUploader.VisualInterface.prototype.showProgress = function(obj){
	// Abstract Only
}
/**
	Je opakovane volana pri nahravani souboru a jako argument dostava cislo,
	ktere popisuje, kolik procent z celkove velikosti vsech souboru jiz
	bylo nahrano.
	@param {Number} num stav nahrani vsech souboru
*/
JAK.FlashUploader.VisualInterface.prototype.showTotalProgress = function(num){
	// Abstract Only
}
/**
* Je volana po skonceni nahravani jednoho obrazku, bez ohledu na to zda doslo k 
* k chybe, o stavu informuje ve svem argumentu
*
*
*/
JAK.FlashUploader.VisualInterface.prototype.oneUploadEnd = function(obj){
	// Abstract Only
}

JAK.FlashUploader.VisualInterface.prototype.uploadComplete = function(obj){
	// Abstract Only
}

JAK.FlashUploader.VisualInterface.prototype.continueAction = function(obj){
	// Abstract Only
}
