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
 * @overview Detekce klientského prostředí v závislosti na vlastnostech JavaScriptu
 * (pokud je to možné, jinak dle vlastnosti navigator.userAgent).
 * @version 2.3
 * @author jelc, zara
 */   


/**
 * Statická třída obsahující vlastnosti <em>platform</em>, <em>client</em>,  
 * <em>version</em> a <em>agent</em>, které určují uživatelovo prostředí
 * @namespace
 * @group jak
 */
SZN.Browser = SZN.ClassMaker.makeClass({
	NAME: "Browser",
	VERSION: "2.3",
	CLASS: "static"
});

/** @field {string} platform system uzivatele */
SZN.Browser.platform = '';
/** @field {string} client prohlizec uzivatele */
SZN.Browser.client = '';
/** @ignore */
SZN.Browser.klient = '';
/** @field {string} version verze prohlizece */
SZN.Browser.version = 0;
/** @field {string} agent hodnota systemove promene "navigator.userAgent" */
SZN.Browser.agent = '';
/** @field {object} mouse objekt s vlastnostmi left, right, middle které lze použít k identifikaci stisknutého tlačítka myši */
SZN.Browser.mouse = {};

/**
 * zjistuje system uzivatele
 * @private
 * @method 
 * @returns {string} ktery popisuje pouzivany system:
 * <ul>
 * <li>nix - Linux, BSD apod.</li>
 * <li>mac - Apple</li>
 * <li>win - Windows pro PC</li>
 * <li>oth - vsechno ostatni</li>  
 * </ul>    
 *
 */   
SZN.Browser._getPlatform = function(){
	if((this._agent.indexOf('X11') != -1) 
	|| (this._agent.indexOf('Linux') != -1)){
		return 'nix';
	} else if(this._agent.indexOf('Mac') != -1){
		return 'mac';
	} else if(this._agent.indexOf('Win') != -1){
		return 'win';
	} else {
		return 'oth';
	}
};

/**
 * zjistuje typ prohlizece
 * @private
 * @method 
 * @returns {string} ktery popisuje pouzivany prohlizec
 * <ul>
 * <li>opera - Opera</li>
 * <li>ie - Internet Explorer</li>
 * <li>gecko - Mozilla like</li>
 * <li>konqueror - Konqueror</li>  
 * <li>safari - Safari</li>  
 * <li>oth - vsechno ostatni/neznamy</li>  
 * </ul>  
 */   
SZN.Browser._getKlient = function(){
	if(window.opera){
		return 'opera';
	} else if(document.attachEvent 
	&& (typeof navigator.systemLanguage != 'undefined')){
		return 'ie';
	} else if (document.getAnonymousElementByAttribute){
		return 'gecko';
	} else if(this._agent.indexOf('KHTML')){
		if(this._vendor == 'KDE'){
			return 'konqueror';
		} else {
			return 'safari';
		}
	} else {
		return 'oth';
	}
};

/**
 * Nastavuje identifikaci leveho a praveho tlacitka mysi
 * @private 
 * @method 
 * @returns {object} jako asociativni pole s vlastnostmi
 * <em>left</em> a <em>right</em>, ktere obsahuji ciselny identifikator
 * stisknuteho tlacitka mysi jak ho klient vraci ve vlastnosti udalosti
 * <em>e.button</em>
 */
SZN.Browser._getMouse = function(){
	var left;
	var right;
	var middle;
	if ((SZN.Browser.client == 'ie') || (SZN.Browser.client == 'konqueror')){
		left = 1;
		middle = 4;
		right = 2;
	} else if((SZN.Browser.client == 'opera') && (SZN.Browser.version > 7) && (SZN.Browser.version < 9)) {
		left = 1;
		middle = 4;
		right = 2;
	} else if (SZN.Browser.client == 'safari'){
		if (parseInt(SZN.Browser.version) > 2) {
			left = 0;
			middle = 0;
			right = 2;
		} else {
			left = 1;
			middle = 1;
			right = 2;
		}
	} else {
		left = 0;
		middle = 1;
		right = 2;
	}
	
	return {left:left,right:right, middle:middle};	
}

/**
 * zjistuje verzi daneho prohlizece, detekovaneho metodou "_getKlient"
 * @private
 * @method 
 * @returns {string} navratova hodnota metod jejich nazev je slozeny z retezcu
 * '_get_' + vlastnost <em>klient</em>  + '_ver'
 * @example  <pre>
 * pro Internet Exlporer je volana metoda <em>this._get_ie_ver()</em>
 *</pre>    
 */   
SZN.Browser._getVersion = function(){
	var out = 0;
	var fncName = '_get_' + this.client + '_ver';
	
	if(typeof this[fncName] == 'function'){
		return this[fncName]();
	} else {
		return 0;
	}
};

/**
 * detekce verze Internet Exploreru
 * @private
 * @method 
 * @returns {string} verze prohlizece od 5.0 do 7 (IE 8 bude detekovano jako 7)
 */   
SZN.Browser._get_ie_ver = function(){
	if(typeof Function.prototype.call != 'undefined'){
		if (window.XDomainRequest) {
			return '8';
		} else if(window.XMLHttpRequest){
			return '7';
		} else if (typeof document.doctype == 'object'){
			return '6';
		} else {
			return '5.5';
		}
	} else {
		return '5.0';
	}
};

/**
 * detekce verze Opery
 * od 6 do aktualni verze. od verze 7.6+ je podporovana vlastnost
 * window.opera.version() vracejici aktualni verzi, napr. 9.63  
 * @see http://www.howtocreate.co.uk/operaStuff/operaObject.html 
 * @private
 * @method 
 * @returns {string} verze prohlizece 
 */  
SZN.Browser._get_opera_ver = function(){
	if(window.opera.version){
		return window.opera.version();
	} else{ 
		if(document.createComment){
			return '7';
		} else {
			return '6';
		}
	}
};

/**
 * detekce verze Gecko prohlizecu
 * @private
 * @method 
 * @returns {string} verze prohlizece od 1.5 do 3 (> 3 bude detekovano jako 3)
 */ 
SZN.Browser._get_gecko_ver = function(){
	if (document.getElementsByClassName) {
		return '3';
	} else if(window.external){
		return '2';
	} else {
		return '1.5';
	}
};

/**
 * detekce verze Konqueroru
 * @private
 * @method 
 * @returns {string} verze prohlizece na zaklade hodnot uvedenych v navigator.userAgent
 * detekuji se prvni dve cisla (3.4,3.5,3.6 atd...) 
 */ 
SZN.Browser._get_konqueror_ver = function(){
	var num = this._agent.indexOf('KHTML') + 6;
	var part =  this._agent.substring(num);
	var end = part.indexOf(' ')
	var x = part.substring(0,end - 2);
	return x;
	
};

/**
 * detekce verze Safari
 * @private
 * @method 
 * @returns {string} verze verze se nedetekuje vraci 1
 */ 
SZN.Browser._get_safari_ver = function(){
	if (this._agent.match(/chrome/i)) { return 3; } /* google chrome */
	var ver = this._agent.match(/version\/([0-9]+)/i);
	return (ver ? ver[1] : "1");
};

/**
 * implicitní konkstruktor, je volán při načtení skriptu 
 * @method 
 */   
SZN.Browser.getBrowser = function(){
	this._agent = this.agent = navigator.userAgent;
	this._platform = navigator.platform;
	this._vendor = navigator.vendor;
	this.platform = this._getPlatform();
	this.client = this._getKlient();
	this.klient = this.client;
	this.version = this._getVersion();
	this.mouse = this._getMouse();
};
SZN.Browser.getBrowser();
