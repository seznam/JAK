/**
 * @overview Prace HTTPXMLRequestem pro komunikaci klient - server
 * @version 1.0
 * @author koko, jelc 
 */   

/**
* @class trida provadejici komunikaci klient - server prostrednictvim  HTTPXMLRequest
* defaultne posilame dotaz metodou GET, asynchrone a odpoved ocekavama v JSON formatu
* @param {string} url url na ktere budeme posilat dotazy
* @param {object} callBackObj objekt v jehoz oboru platnosti zpracovavame odpoved
* @param {string} callBackFunc metoda, ktera bude odpoved zpracovavat
*/
SZN.HTTPRequest = function(url,callBackObj,callBackFunc){
	/** @field {object} aktualni nastaveni pro request*/
	this.data = new Object();
	/** @field {string} url na ktere se ptame */
	this.url = url ? url : '';
	/** @field {object} objekt v jehoz oboru platnosti zpracujeme odpoved */
	this.callBackObj = callBackObj;
	/** @field {function} metoda, ktera odpoved zpracuje */
	this.callBackFunc = callBackFunc;
	this.HTTPRequest();
};

/* staticke vlastnosti */
SZN.HTTPRequest.Name = 'HTTPRequest';
SZN.HTTPRequest.version = '1.0';
SZN.ClassMaker.makeClass(SZN.HTTPRequest);
/** 
@static 
@class
*/
SZN.HTTPRequest.Setting = function(url,method,postData,headers,mode,format){
	/** @field {string}  url serveru, ktereho se ptame */
	this.url = url ? url : '';
	/** @field {string} metoda dotazu [post,get = default]*/
	this.method = method ? method : '';
	/** @field {string} mod dotazu [sync,async = default]*/
	this.mode = mode ? mode : '';
	/** @field {string} format odpoved [xml,json = default]*/
	this.format = format ? format : '';
	/** @field {array} nastaveni hlavicek, pole objektu s vlatnostmi <em>type</em> a <em>content</em> */
	this.headers = headers ? headers : '';
	/** @field {string} data pro dotaz posilanu metodou post*/
	this.postData = postData ? postData : '';
};


/**
 * @field {object} <strong>konstanta</strong> vyctove pole metod, ktere se mouhou pouzivat a definice defaultni metody
 */
SZN.HTTPRequest.prototype.METHOD = {
	post : 'post',
	get : 'get',
	def : 'get'
};
/**
 * @field {object} <strong>konstanta</strong> vyctove pole formatu odpovedi, ktere se mouhou pouzivat a definice defaultniho formatu
 * 
 */
SZN.HTTPRequest.prototype.FORMAT = {
	json : 'json',
	xml :  'xml',
	def : 'json'
};
/**
 * @field {object} <strong>konstanta</strong> vyctove pole modu dotazu, ktere se mouhou pouzivat a definice defaultniho modu
 */
SZN.HTTPRequest.prototype.MODE = {
	async : true,
	sync :  false,
	def : true
};

/**
 * @field {array} <strong>konstanta</strong> vychozi nastaveni http hlavicky dotazu
 */
SZN.HTTPRequest.prototype.HEADER = [{typ:'Content-Type', content:'application/x-www-form-urlencoded' }];

/**
 * @method implicitni konstruktor, nastavuje vlastnosti tridy na vychozi hodnoty
 */   
SZN.HTTPRequest.prototype.HTTPRequest = function(){
	this.setFormat();
	this.setMode();
	this.setMethod();
	this.setPostData();
	this.setHeaders();
};

/**
 * @method destruktor 
 *
 */  
SZN.HTTPRequest.prototype.$HTTPRequest = function(){
	for(var i in this){
		this[i] = null;
	}
};
/**
 * @method inicializace <strong>nepouziva se</strong>
 *
 */  
SZN.HTTPRequest.prototype.init = function(){};

/**
 * @method nastavuje metodu komunikace klient - server dle argumentu, pokud argument
 * neni definovan v objektu METHOD pouzije se vychozi 
 * @param {string} method metoda komunikace klient server [get,post]
 */  
SZN.HTTPRequest.prototype.setMethod = function(method){
	this.data.method = this._setMethod(method);
};
/**
 * @method nastavuje mod komunikace klient - server dle argumentu, pokud argument
 * neni definovan v objektu MODE pouzije se vychozi 
 * @param {string} mode mod komunikace klient server [sync,async]
 */  
SZN.HTTPRequest.prototype.setMode = function(mode){
	this.data.mode = this._setMode(mode);
};
/**
 * @method nastavuje format odpovedi serveru dle argumentu, pokud argument
 * neni definovan v objektu FORMAT pouzije se vychozi 
 * @param {string} format format odpovedi serveru [xml,json]
 */  
SZN.HTTPRequest.prototype.setFormat = function(format){
	this.data.format = this._setFormat(format);
};
/**
 * @method nastavuje HTTP hlavicky dotazu
 * @param {array} headers pole objektu s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavicky</li>
 * <li>content - hodnota hlavicky</li>
 * </ul>    
 */  
SZN.HTTPRequest.prototype.setHeaders = function(headers){
	this.data.headers = this._setHeaders(headers);
};
/**
 * @method nastavuje data, ktera se maji posilat metodou POST
 * @param {string} data data, ktera se budou posilat POSTem
 */  
SZN.HTTPRequest.prototype.setPostData = function(data){
	this.data.postData = data ? data : '';
};

/**
 * @method vlastni vyvolani XMLHTTPRequestu, predane parametry se pouziji pro konkretni dotaz
 * pokud nektery neni definovan pouzije se vychozi, nebo nastaveny 
 * @param {string} url url na ktere budeme posilat dotazy (musi byt zadan, ale muze byt prazdny)
 * @param {object} callBackObj objekt v jehoz oboru platnosti zpracovavame odpoved (musi byt zadan, ale muze byt prazdny)
 * @param {string} callBackFunc metoda, ktera bude odpoved zpracovavat (musi byt zadan, ale muze byt prazdny)
 * @param {object} requestData [<em>volitelne</em>] instance objektu Setting s dalsimi daty
 * @returns {object} 1) v pripade asynchroniho requestu objekt reprezentujici request<br>
 * 2) v pripade synchroniho requestu vraci odpoved serveru  jako objekt s vlastnostmi <em>status</em> a <em>data</em>
 */      
SZN.HTTPRequest.prototype.send = function(url,obj,method,requestData){
	var mySelf = this;
	var param = !!requestData ? requestData : {};
	var data = this._setFromData(url,obj,method,param);
	debug(data.mode)
	// vytvorim request
	var XHR = this._getRequest();
	// otevru request
    try {
		XHR.open(data.method, data.url, data.mode);
	} catch(e){
		return 0;
	}
	
	// nastavim hlavicky
	for(var i = 0; i < data.headers.length; i++){
		XHR.setRequestHeader(data.headers[i].typ,data.headers[i].content);
	}
	// zpracovani asynchroniho requestu
	if(data.mode){
		function stateChangeFunction(){
	        if( XHR.readyState == 4 ) {
	            if( XHR.status == 200 ) {
					if(data.format == 'xml'){
						var out = XHR.responseXML;
					} else {
						try {
							eval('var out = ('+XHR.responseText+')');
						} catch(e){
							var out = {requestError : true };
						}
					}
					data.callBackObj[data.callBackFunc](out);
					XHR = null;
	            }
	        }		
		}
		XHR.onreadystatechange = stateChangeFunction;
	}
	// odeslani requestu dle nastavenoeho modu post/get
	if(data.method == this.METHOD['post']){ 
	    if(typeof data.postData != 'undefined') {
			XHR.send(data.postData);
		} else {
			return 0;
		}
	} else {
		XHR.send(null);
	}
	// zpracovani synchroniho requestu
	if(!data.mode){
		if(data.format == 'xml'){
			var out = XHR.responseXML;
		} else {
			var out = XHR.responseText
		}
		return { status : XHR.status, data : out };
	} else {
		return XHR;
	}
};

/**
 * @method umoznuje zrusit asynchroni dotaz pokud jiz neni zpracovavan
 * @param {object} XHR objekt requestu vraceny metodou send
 */   
SZN.HTTPRequest.prototype.abort = function(XHR){
	if (typeof XHR == 'object') {
		XHR.abort();
	} else {
		return 0;
	}
};

/**
 * @private
 * @method vraci metodu jakou bude probihat komunikace klient - server pokud je znama,
 * jinak vraci vychozi, definovanou v objektu METHOD
 * @param {string} method pozadovana metoda   
 *
 */  
SZN.HTTPRequest.prototype._setMethod = function(method){
	return (typeof this.METHOD[method] != 'undefined') ? this.METHOD[method] : this.METHOD['def'];
};
/**
 * @private
 * @method vraci mod v jakem bude probihat komunikace klient - server pokud je znama,
 * jinak vraci vychozi, definovanou v objektu MODE
 * @param {string} mode pozadovany mod
 *
 */ 
SZN.HTTPRequest.prototype._setMode = function(mode){
	return (typeof this.MODE[mode] != 'undefined') ? this.MODE[mode] : this.MODE['def'];
};
/**
 * @private
 * @method vraci format jakou bude probihat komunikace klient - server pokud je znama,
 * jinak vraci vychozi, definovanou v objektu FORMAT
 * @param {string} format pozadovany format
 *
 */ 
SZN.HTTPRequest.prototype._setFormat = function(format){
	return (typeof this.FORMAT[format] != 'undefined') ? this.FORMAT[format] : this.FORMAT['def'];
};
/**
 * @private
 * @method pripravuje nastaveni HTTP hlavicek pro zasilany dotaz, pokud nenajde v
 * argumentu hlavicku 'Content-type', pouzije definovanou v HEADER 
 * @param {array} headers pole objektu s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavicky</li>
 * <li>content - hodnota hlavicky</li>
 * </ul> 
 * @returns {array} pole pozadovanych hlavicek, ktere maji byt nastaveny 
 */   
SZN.HTTPRequest.prototype._setHeaders = function(headers){
	var headers = (headers instanceof Array) ? headers : new Array();
	var out = new Array();
	var setContent = false;
	for(var i = 0; i < headers.length; i++){
		if(headers[i].typ == 'Content-Type'){
			setContent = true;
		}
		out[i] = {
			typ : headers[i].typ,
			content : headers[i].content		
		}
	}
	if(!setContent){
		out.push({typ : this.HEADER[0].typ,content : this.HEADER[0].content});
	}
	return out;
}
/**
 * @private
 * @method provadi nastaveni vlastnosti pro dany dotaz, aktualne volanou metodu
 * <em>send</em> aniz by prepisoval nastavene (nutne kvuli asynchronimu volani)  
 * @param {string} url url na ktere budeme posilat dotazy (musi byt zadan, ale muze byt prazdny)
 * @param {object} obj objekt v jehoz oboru platnosti zpracovavame odpoved (musi byt zadan, ale muze byt prazdny)
 * @param {string} func metoda, ktera bude odpoved zpracovavat (musi byt zadan, ale muze byt prazdny)
 * @param {object} setting [<em>volitelne</em>] instance objektu Setting s dalsimi daty
 * @returns {object} data ktera se pouziji v metode <em>send</em>
 */   
SZN.HTTPRequest.prototype._setFromData = function(url,obj,func,setting){
	var data = new Object();
	for(var i in this.data){
		switch (i){
			case 'method':
				if(setting[i]){
					data[i] = this._setMethod(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'format':
				if(setting[i]){
					data[i] = this._setFormat(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'mode':
				if(setting[i]){
					data[i] = this._setMode(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'headers':
				if(setting[i]){
					data.headers = this._setHeaders(setting[i]);
				} else {
					data.headers = this._setHeaders(this.data[i]);
				}
				break;
			default:
				if(setting[i]){
					data[i] = setting[i]
				} else {
					data[i] = this.data[i]
				}				
				break;
		}
	}
	data.url = url ? url : this.url;
	data.callBackObj = obj ? obj : this.callBackObj;
	data.callBackFunc = func ? func : this.callBackFunc;
	return data;
};
/**
 * @private
 * @method crossplatformi vytvareni XMLHttpRequestu 
 * @returns XMLHttpRequest
 *
 */   
SZN.HTTPRequest.prototype._getRequest = function(){
    if(typeof(XMLHttpRequest) != 'undefined') {
		return new XMLHttpRequest();
	}
	else {
		try {
			/*- IE */
			return new ActiveXObject("Msxml2.XMLHTTP"); /*- "Microsoft.XMLHTTP*/
		}
		catch (e) {
			try { 
				return new ActiveXObject("Microsoft.XMLHTTP"); 
			}
			catch (e) {
				return 0;
			}
		}
	}
};
