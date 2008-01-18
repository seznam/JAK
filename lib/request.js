/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview Práce s HTTPxmlRequestem pro komunikaci klient - server
 * @version 1.0
 * @author koko, jelc 
 */   

/**
 * @class třída provádějící komunikaci klient - server prostřednictvím  HTTPxmlRequest
 * defaultně posíláme dotaz metodou GET, asynchroně a odpověď očekáváme v JSON formatu
 * @name SZN.HTTPRequest
 * @param {string} url url, na které budeme posílat dotazy
 * @param {object} callBackObj objekt, v jehož oboru platnosti zpracováváme odpověď
 * @param {string} callBackFunc metoda, která bude odpověď zpracovávat
 */
SZN.HTTPRequest = SZN.ClassMaker.makeClass({
	NAME: "HTTPRequest",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.HTTPRequest.prototype.$constructor = function(url,callBackObj,callBackFunc){
	/** @field {object} aktuální nastavení pro request*/
	this.data = new Object();
	/** @field {string} url na které se ptáme */
	this.url = url ? url : '';
	/** @field {object} objekt v jehož oboru platnosti zpracujeme odpověď */
	this.callBackObj = callBackObj;
	/** @field {function} metoda, která odpověď zpracuje */
	this.callBackFunc = callBackFunc;

	this.setFormat();
	this.setMode();
	this.setMethod();
	this.setPostData();
	this.setHeaders();
};

/** 
@static 
@constructor
@class třída vytváří "objekt" nastavení pro instanci SZN.Request
@param {string} [url] url serveru, kterého se ptáme
@param {string} [method] metoda dotazu [post,get = default]
@param {string} [postData] data pro dotaz posílaný metodou post
@param {array} [headers] nastavení hlaviček, pole objektů s vlatnostmi <em>type</em> a <em>content</em>
@param {string} [mode]  mod dotazu [sync,async = default]
@param {string} [format] formát odpovědi [xml,json = default]
*/
SZN.HTTPRequest.Setting = function(url,method,postData,headers,mode,format){
	/** @field {string}  url serveru, kterého se ptáme */
	this.url = url ? url : '';
	/** @field {string} metoda dotazu [post,get = default]*/
	this.method = method ? method : '';
	/** @field {string} mod dotazu [sync,async = default]*/
	this.mode = mode ? mode : '';
	/** @field {string} formát odpovědi [xml,json = default]*/
	this.format = format ? format : '';
	/** @field {array} nastavení hlaviček, pole objektů s vlatnostmi <em>type</em> a <em>content</em> */
	this.headers = headers ? headers : '';
	/** @field {string} data pro dotaz posílaný metodou post*/
	this.postData = postData ? postData : '';
};


/**
 * @field {object} <strong>konstanta</strong> výčtové pole metod, které se mouhou používat a definice defaultní metody
 */
SZN.HTTPRequest.prototype.METHOD = {
	post : 'post',
	get : 'get',
	def : 'get'
};
/**
 * @field {object} <strong>konstanta</strong> výčtové pole formatů odpovědí, které se mouhou používat a definice defaultního formatu
 * 
 */
SZN.HTTPRequest.prototype.FORMAT = {
	json : 'json',
	xml : 'xml',
	txt : 'txt',
	def : 'json'
};
/**
 * @field {object} <strong>konstanta</strong> výčtové pole modu dotazu, které se mouhou používat a definice defaultního modu
 */
SZN.HTTPRequest.prototype.MODE = {
	async : true,
	sync :  false,
	def : true
};

/**
 * @field {array} <strong>konstanta</strong> výchozí nastaveni http hlavičky dotazu
 */
SZN.HTTPRequest.prototype.HEADER = [{typ:'Content-Type', content:'application/x-www-form-urlencoded' }];

/**
 * destruktor
 * @method  
 *
 */  
SZN.HTTPRequest.prototype.destructor = function(){
	for(var i in this){
		this[i] = null;
	}
};
/**
 * inicializace <strong>nepoužívá se</strong>
 * @method 
 *
 */  
SZN.HTTPRequest.prototype.init = function(){};

/**
 * nastavuje metodu komunikace klient - server dle argumentu, pokud argument
 * není definován v objektu METHOD použije se výchozí
 * @method  
 * @param {string} method metoda komunikace klient server [get,post]
 */  
SZN.HTTPRequest.prototype.setMethod = function(method){
	this.data.method = this._getMethod(method);
};
/**
 * nastavuje mod komunikace klient - server dle argumentu, pokud argument
 * není definován v objektu MODE použije se výchozí
 * @method  
 * @param {string} mode mod komunikace klient server [sync,async]
 */  
SZN.HTTPRequest.prototype.setMode = function(mode){
	this.data.mode = this._getMode(mode);
};
/**
 * nastavuje format odpovědi serveru dle argumentu, pokud argument
 * není definován v objektu FORMAT použije se výchozí
 * @method  
 * @param {string} format format odpovědi serveru [xml,json,txt]
 */  
SZN.HTTPRequest.prototype.setFormat = function(format){
	this.data.format = this._getFormat(format);
};
/**
 * nastavuje HTTP hlavičky dotazu
 * @method 
 * @param {array} headers pole objektu s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavičky</li>
 * <li>content - hodnota hlavičky</li>
 * </ul>    
 */  
SZN.HTTPRequest.prototype.setHeaders = function(headers){
	this.data.headers = this._setHeaders(headers);
};
/**
 * nastavuje data, která se mají posílat metodou POST
 * @method 
 * @param {string} data data, která se budou posílat POSTem
 */  
SZN.HTTPRequest.prototype.setPostData = function(data){
	this.data.postData = data ? data : '';
};

/**
 *  vlastní vyvolání HTTPxmlRequestu, předané parametry se použijí pro konkretní dotaz
 * pokud některý není definován použije se výchozí, nebo nastavený
 * @method  
 * @param {string} url url, na které budeme posílat dotazy (musí být zadán, ale může být prazdný)
 * @param {object} callBackObj objekt v jehož oboru platnosti zpracováváme odpověď (musí být zadán, ale může být prazdný)
 * @param {string} callBackFunc metoda, ktera bude odpoved zpracovavat (musí být zadán, ale může být prazdný)
 * @param {object} requestData [<em>volitelne</em>] instance objektu Setting s dalšími daty
 * @returns {object} 1) v případě asynchroního requestu objekt reprezentující request<br>
 * 2) v případě synchroního requestu vrací odpověď serveru  jako objekt s vlastnostmi <em>status</em> a <em>data</em>
 */      
SZN.HTTPRequest.prototype.send = function(url,obj,method,requestData){
	var mySelf = this;
	var param = requestData ? requestData : {};
	var data = this._setFromData(url,obj,method,param);
	//debug(data.mode)
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
					} else if(data.format == 'txt'){
						var out = XHR.responseText;
					} else {
						try {
							eval('var out = ('+XHR.responseText+')');
						} catch(e){
							var out = {requestError : true };
						}
					}
					data.callBackObj[data.callBackFunc](out);
					XHR = null;
	            } else {
					var out = {requestError : XHR.status };
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
 * umožňuje zrušit asynchroní dotaz pokud již není zpracováván
 * @method 
 * @param {object} XHR objekt requestu vracený metodou send
 */   
SZN.HTTPRequest.prototype.abort = function(XHR){
	if (typeof XHR == 'object') {
		XHR.abort();
	} else {
		return 0;
	}
};

/**
 * vrací metodu jakou bude probíhat komunikace klient - server pokud je známá,
 * jinak vrací výchozí, definovanou v objektu METHOD
 * @private
 * @method  
 * @param {string} method požadovaná metoda   
 * @returns {string}
 */  
SZN.HTTPRequest.prototype._getMethod = function(method){
	return (typeof this.METHOD[method] != 'undefined') ? this.METHOD[method] : this.METHOD['def'];
};
/**
 * vrací mod v jakém bude probíhat komunikace klient - server pokud je známá,
 * jinak vrací vychozí, definovanou v objektu MODE
 * @private
 * @method 
 * @param {string} mode požadovaný mod
 * @returns {string}
 */ 
SZN.HTTPRequest.prototype._getMode = function(mode){
	return (typeof this.MODE[mode] != 'undefined') ? this.MODE[mode] : this.MODE['def'];
};
/**
 * vrací formát jakou bude probíhat komunikace klient - server pokud je znám,
 * jinak vrací vychozí, definovaný v objektu FORMAT
 * @private
 * @method  
 * @param {string} format požadovaný formát
 * @returns {string}
 */ 
SZN.HTTPRequest.prototype._getFormat = function(format){
	return (typeof this.FORMAT[format] != 'undefined') ? this.FORMAT[format] : this.FORMAT['def'];
};
/**
 * připravuje nastavení HTTP hlaviček pro zasílany dotaz, pokud nenajde v
 * argumentu hlavičku 'Content-type', použije definovanou v HEADER
 * @private
 * @method   
 * @param {array} headers pole objektů s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavičky</li>
 * <li>content - hodnota hlavičky</li>
 * </ul> 
 * @returns {array} pole požadovaných hlaviček, které mají být nastaveny 
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
 * provadí nastavení vlastností pro daný dotaz, aktuálně volanou metodu
 * <em>send</em> aniž by přepisoval nastavené (nutné kvůli asynchronímu volání)
 * @private
 * @method   
 * @param {string} url url, na které budeme posílat dotazy (musí být zadán, ale může být prazdný)
 * @param {object} obj objekt, v jehož oboru platnosti zpracováváme odpověď (musí být zadán, ale může být prazdný)
 * @param {string} func metoda, která bude odpověď zpracovávat (musí být zadán, ale může být prazdný)
 * @param {object} setting [<em>volitelné</em>] instance objektu Setting s dalšími daty
 * @returns {object} data, která se použijí v metodě <em>send</em>
 */   
SZN.HTTPRequest.prototype._setFromData = function(url,obj,func,setting){
	var data = new Object();
	for(var i in this.data){
		switch (i){
			case 'method':
				if(setting[i]){
					data[i] = this._getMethod(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'format':
				if(setting[i]){
					data[i] = this._getFormat(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'mode':
				if(setting[i]){
					data[i] = this._getMode(setting[i])
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
					data[i] = setting[i];
				} else {
					data[i] = this.data[i];
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
 * crossplatformí vytváření HTTPxmlRequestu
 * @private
 * @method  
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
