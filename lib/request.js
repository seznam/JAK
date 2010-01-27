/*
Licencováno pod MIT Licencí

© 2008 Seznam.cz, a.s.

Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.

Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené 
soubory (dále jen „software“) je oprávněn k nakládání se softwarem bez 
jakýchkoli omezení, včetně bez omezení práva software užívat, pořizovat si 
z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě 
(podlicence) či prodávat jeho kopie, za následujících podmínek:

- výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo 
podstatných součástech Softwaru.

- software je poskytován tak jak stojí a leží, tzn. autor neodpovídá 
za jeho vady, jakož i možné následky, ledaže věc nemá vlastnost, o níž autor 
prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.



Licenced under the MIT License

Copyright (c) 2008 Seznam.cz, a.s.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * @overview Třída pro práci s HTTPXmlRequestem pro komunikaci klient - server.
 * @version 1.0
 * @author koko, jelc 
 */   

/**
 * @class třída provádějící komunikaci klient - server prostřednictvím  HTTPxmlRequest
 * defaultně posíláme dotaz metodou GET, asynchroně a odpověď očekáváme v TXT formátu
 * @group jak
 */
JAK.HTTPRequest = JAK.ClassMaker.makeClass({
	NAME: "HTTPRequest",
	VERSION: "1.1",
	CLASS: "class"
});

/**
 * @method
 * @param {string} url url, na které budeme posílat dotazy
 * @param {object} callBackObj objekt, v jehož oboru platnosti zpracováváme odpověď
 * @param {string} callBackFunc metoda, která bude odpověď zpracovávat 
 */ 
JAK.HTTPRequest.prototype.$constructor = function(url,callBackObj,callBackFunc){
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
 * @class konstruktor vytváří "objekt" nastavení (settings) pro instanci JAK.Request
 * @group jak
 * @param {string} [url] url serveru, kterého se ptáme
 * @param {string} [method] metoda dotazu [post,get = default]
 * @param {string} [postData] data pro dotaz posílaný metodou post
 * @param {array} [headers] nastavení hlaviček, pole objektů s vlatnostmi <em>type</em> a <em>content</em>
 * @param {string} [mode]  mod dotazu [sync,async = default]
 * @param {string} [format] formát odpovědi [xml = default]
 */
JAK.HTTPRequest.Setting = function(url,method,postData,headers,mode,format){
	/** @field {string}  url serveru, kterého se ptáme */
	this.url = url ? url : '';
	/** @field {string} metoda dotazu [post,get = default]*/
	this.method = method ? method : '';
	/** @field {string} mod dotazu [sync,async = default]*/
	this.mode = mode ? mode : '';
	/** @field {string} formát odpovědi [xml = default]*/
	this.format = format ? format : '';
	/** @field {array} nastavení hlaviček, pole objektů s vlatnostmi <em>type</em> a <em>content</em> */
	this.headers = headers ? headers : '';
	/** @field {string} data pro dotaz posílaný metodou post*/
	this.postData = postData ? postData : '';
};


/**
 * @field {object} <strong>konstanta</strong> výčtové pole metod, které se mouhou používat a definice defaultní metody
 */
JAK.HTTPRequest.prototype.METHOD = {
	post : 'post',
	get : 'get',
	def : 'get'
};
/**
 * @field {object} <strong>konstanta</strong> výčtové pole formatů odpovědí, které se mouhou používat a definice defaultního formatu
 * 
 */
JAK.HTTPRequest.prototype.FORMAT = {
	xml : 'xml',
	txt : 'txt',
	def : 'txt'
};
/**
 * @field {object} <strong>konstanta</strong> výčtové pole modu dotazu, které se mouhou používat a definice defaultního modu
 */
JAK.HTTPRequest.prototype.MODE = {
	async : true,
	sync :  false,
	def : true
};

/**
 * @field {array} <strong>konstanta</strong> výchozí nastaveni http hlavičky dotazu
 */
JAK.HTTPRequest.prototype.HEADER = [{typ:'Content-Type', content:'application/x-www-form-urlencoded' }];

/**
 * destruktor
 * @method  
 *
 */  
JAK.HTTPRequest.prototype.destructor = function(){
	for(var i in this){
		this[i] = null;
	}
};
/**
 * inicializace <strong>nepoužívá se</strong>
 * @method 
 * @deprecated
 */  
JAK.HTTPRequest.prototype.init = function(){};

/**
 * nastavuje metodu komunikace klient - server dle argumentu, pokud argument
 * není definován v objektu METHOD použije se výchozí (get)
 * @method  
 * @param {string} method metoda komunikace klient server [get,post]
 */  
JAK.HTTPRequest.prototype.setMethod = function(method){
	this.data.method = this._getMethod(method);
};
/**
 * nastavuje möd komunikace klient - server dle argumentu, pokud argument
 * není definován v objektu MODE použije se výchozí
 * @method  
 * @param {string} mode mod komunikace klient server [sync,async]
 */  
JAK.HTTPRequest.prototype.setMode = function(mode){
	this.data.mode = this._getMode(mode);
};
/**
 * nastavuje format odpovědi serveru dle argumentu, pokud argument
 * není definován v objektu FORMAT použije se výchozí
 * @method  
 * @param {string} format format odpovědi serveru [xml,txt]
 */  
JAK.HTTPRequest.prototype.setFormat = function(format){
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
JAK.HTTPRequest.prototype.setHeaders = function(headers){
	this.data.headers = this._setHeaders(headers);
};
/**
 * nastavuje data, která se mají posílat metodou POST
 * @method 
 * @param {string} data data, která se budou posílat POSTem
 */  
JAK.HTTPRequest.prototype.setPostData = function(data){
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
 * @param {bool} [returnOnly] pokud používáme synchronní request určuje zda se volá callback funkce (parametr má
 * hodnou "false" nebo není zadán - výchozí stav ), nebo bude pouze vracet odpověď od serveru (parametr má hodnotu "true")
 * musí být zadán pokaždé, když použijeme metodu send a nechceme výchozí chování, na asynchroní volání nemá vliv 
 * @returns {object} <ol><li>v případě asynchroního requestu objekt reprezentující request</li>
 * <li>v případě synchroního requestu vrací odpověď serveru  jako objekt s vlastnostmi <em>status</em> a <em>data</em> je-li
 *  returnOnly zadáno jako true, jinak nevrací nic</li></ol>
 */      
JAK.HTTPRequest.prototype.send = function(url,obj,method,requestData,returnOnly){
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
				if(data.format == 'xml'){
					var out = XHR.responseXML;
				} else if(data.format == 'txt'){
					var out = XHR.responseText;
				}
				
				var status = 0;
				try { status = XHR.status; }
				catch(e) { }
				finally {
					data.callBackObj[data.callBackFunc](out,status);
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
		if(returnOnly){
			return { status : XHR.status, data : out };
		} else {
			data.callBackObj[data.callBackFunc](out,XHR.status);
		}
	} else {
		return XHR;
	}
};

/**
 * umožňuje zrušit asynchroní dotaz pokud již není zpracováván
 * @method 
 * @param {object} XHR objekt requestu vracený metodou send
 */   
JAK.HTTPRequest.prototype.abort = function(XHR){
	if (typeof XHR == 'object' && XHR.readyState != 4) {
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
JAK.HTTPRequest.prototype._getMethod = function(method){
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
JAK.HTTPRequest.prototype._getMode = function(mode){
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
JAK.HTTPRequest.prototype._getFormat = function(format){
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
JAK.HTTPRequest.prototype._setHeaders = function(headers){
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
JAK.HTTPRequest.prototype._setFromData = function(url,obj,func,setting){
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
JAK.HTTPRequest.prototype._getRequest = function(){
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
