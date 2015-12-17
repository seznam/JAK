/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Detekce klientského prostředí v závislosti na vlastnostech JavaScriptu
 * (pokud je to možné, jinak dle vlastnosti navigator.userAgent).
 * @version 3.0
 * @author jelc, zara
 */   

/**
 * Statická třída obsahující vlastnosti <em>platform</em>, <em>client</em>,  
 * <em>version</em> a <em>agent</em>, které určují uživatelovo prostředí
 * @namespace
 * @group jak
 */
JAK.Browser = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Browser",
	VERSION: "3.0"
});

/** @field {string} platform system uzivatele */
JAK.Browser.platform = '';
/** @field {string} client prohlizec uzivatele */
JAK.Browser.client = '';
/** @field {string} version verze prohlizece */
JAK.Browser.version = 0;
/** @field {string} agent hodnota systemove promenne "navigator.userAgent" */
JAK.Browser.agent = '';
/** @field {object} mouse objekt s vlastnostmi left, right, middle které lze použít k identifikaci stisknutého tlačítka myši */
JAK.Browser.mouse = {};
/** @field {boolean} rezim zpetne kompatibility prohlizece (IE 8 - 10) */
this.ieCompatibilityView = false;

/**
 * Zjistuje system uzivatele
 * @private
 * @returns {string} ktery popisuje pouzivany system:
 * <ul>
 * <li>nix - Linux, BSD apod.</li>
 * <li>mac - Apple</li>
 * <li>win - Windows pro PC</li>
 * <li>wph - Windows Phone</li>
 * <li>oth - vsechno ostatni</li>  
 * </ul>    
 *
 */   
JAK.Browser._getPlatform = function(){
	if(this._agent.indexOf('Windows Phone') != -1){
		return 'wph';
	} else if((this._agent.indexOf('iPhone') != -1)
	|| (this._agent.indexOf('iPod') != -1)
	|| (this._agent.indexOf('iPad') != -1)){
		return 'ios';
	} else if(this._agent.indexOf('Android') != -1){
		return 'and';
	} else if((this._agent.indexOf('X11') != -1)
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
 * Zjistuje typ prohlizece
 * @private
 * @returns {string} ktery popisuje pouzivany prohlizec
 * <ul>
 * <li>opera - Opera</li>
 * <li>ie - Internet Explorer</li>
 * <li>gecko - Mozilla like</li>
 * <li>konqueror - Konqueror</li>  
 * <li>safari - Safari</li>  
 * <li>chrome - Google Chrome</li>  
 * <li>oth - vsechno ostatni/neznamy</li>  
 * </ul>  
 */   
JAK.Browser._getClient = function(){
	if (window.opera) {
		return "opera";
	} else if (this._agent.indexOf("Edge") != -1) {
		return "edge";
	} else if (window.chrome) {
		return "chrome";
	} else if (("all" in document) && ("systemLanguage" in navigator)) {
		return "ie";
	} else if (document.getAnonymousElementByAttribute || "mozPaintCount" in window) {
		return "gecko";
	} else if (this._agent.indexOf("KHTML") != -1) {
		if (this._vendor == "KDE") {
			return "konqueror";
		} else if (this._vendor.indexOf("Apple") != -1) { 
			return "safari";
		} else {
			return "oth";
		}
	} else {
		return "oth";
	}
};

/**
 * Nastavuje identifikaci leveho a praveho tlacitka mysi
 * @private 
 * @returns {object} jako asociativni pole s vlastnostmi
 * <em>left</em> a <em>right</em>, ktere obsahuji ciselny identifikator
 * stisknuteho tlacitka mysi jak ho klient vraci ve vlastnosti udalosti
 * <em>e.button</em>
 */
JAK.Browser._getMouse = function() {
	if (JAK.Browser.client == 'ie' && parseFloat(JAK.Browser.version) < 9) {
		return {left:1, middle:4, right:2};
	} else {
		return {left:0, middle:1, right:2};
	}
}

/**
 * Zjistuje verzi daneho prohlizece, detekovaneho metodou "_getClient"
 * @private
 * @returns {string} navratova hodnota metod jejich nazev je slozeny z retezcu
 * '_get_' + vlastnost <em>client</em>  + '_ver'
 * @example  <pre>
 * pro Internet Exlporer je volana metoda <em>this._get_ie_ver()</em>
 *</pre>    
 */   
JAK.Browser._getVersion = function(){
	var out = 0;
	var fncName = '_get_' + this.client + '_ver';
	
	if (typeof this[fncName] == 'function') {
		return this[fncName]();
	} else {
		return "0";
	}
};

/**
 * Detekce verze Internet Exploreru
 * @private
 * @returns {string} verze prohlizece od 5.0 do 11 (IE 8 bude detekovano jako 7)
 */   
JAK.Browser._get_ie_ver = function(){
	if (!Function.prototype.call) { return "5.0"; }

	if (!(window.ActiveXObject) && "ActiveXObject" in window) {
		return "11";
	} else if ("draggable" in document.createElement("div")) {
		return "10";
	} else if (document.addEventListener) {
		return "9";
	} else if (Object.prototype.toString.call(window.JSON) === "[object JSON]") {
		return "8";
	} else if(window.XMLHttpRequest) {
		return "7";
	} else if (typeof document.doctype == "object") {
		return "6";
	} else {
		return "5.5";
	}
};

/**
 * Detekce verze Opery
 * Od 6 do aktualni verze. od verze 7.6+ je podporovana vlastnost
 * window.opera.version() vracejici aktualni verzi, napr. 9.63  
 * @see http://www.howtocreate.co.uk/operaStuff/operaObject.html 
 * @private
 * @returns {string} verze prohlizece 
 */  
JAK.Browser._get_opera_ver = function(){
	if (window.opera.version) {
		return window.opera.version();
	} else { 
		if (document.createComment) {
			return "7";
		} else {
			return "6";
		}
	}
};

/**
 * Detekce verze Gecko prohlizecu
 * @private
 * @returns {string} verze prohlizece od 1.5 do 7 (> 7 bude detekovano jako 7)
 */ 
JAK.Browser._get_gecko_ver = function() {
	if ("textOverflow" in document.createElement("div").style) { 
		return "7";
	} else if (window.EventSource) { 
		return "6";
	} else if ("onloadend" in new XMLHttpRequest()) { 
		return "5";
	} else if (history.pushState) { 
		return "4";
	} else if (document.getBoxObjectFor === undefined) { 
		return "3.6";
	} else if (navigator.geolocation) {
		return "3.5";
	} else if (document.getElementsByClassName) {
		return "3";
	} else if (window.external){
		return "2";
	} else {
		return "1.5";
	}
};

/**
 * Detekce verze Konqueroru
 * @private
 * @returns {string} verze prohlizece na zaklade hodnot uvedenych v navigator.userAgent
 * detekuji se prvni dve cisla (3.4,3.5,3.6 atd...) 
 */ 
JAK.Browser._get_konqueror_ver = function(){
	var num = this._agent.indexOf('KHTML') + 6;
	var part =  this._agent.substring(num);
	var end = part.indexOf(' ')
	var x = part.substring(0,end - 2);
	return x;
	
};

/**
 * Detekce verze Safari
 * @private
 * @returns {string} verze
 */ 
JAK.Browser._get_safari_ver = function(){
	var ver = this._agent.match(/version\/([0-9]+)/i);
	return (ver ? ver[1] : "3");
};

/**
 * Detekce verze Google Chrome
 * @private
 * @returns {string} verze
 */ 
JAK.Browser._get_chrome_ver = function(){
	var ver = this._agent.match(/Chrome\/([0-9]+)/i);
	return (ver ? ver[1] : null);
};

/**
 * Je tento prohlížeč moc starý na používání JAKu?
 */
JAK.Browser.isOld = function() {
	if (this.client == "ie" && parseFloat(this.version) <= 7) { return true; }
	if (this.client == "opera" && parseFloat(this.version) < 9.5) { return true; }
	if (this.client == "gecko" && parseFloat(this.version) < 2) { return true; }
	/* *
	 * if (this.client == "safari" && parseFloat(this.version) < 2) { return true; } 
	 * Zahozeno, aby se predeslo konfliktum s webkit-based browsery
	 */ 
	if (this.client == "konqueror" && parseFloat(this.version) < 3.5) { return true; }
	if (!document.documentElement) { return true; }
	if (!document.documentElement.addEventListener && !document.documentElement.attachEvent) { return true; }
	var f = function() {};
	if (!f.call || !f.apply) { return true; }
	return false;
}

/**
 * Test zda je prohlizec v rezimu zpetne kompatibility (IE 8 - 10)
 */
JAK.Browser._testIeCompatibilityView = function(client, agent) {
	if(client != "ie") { return false; }
	var test = agent.match(/Trident\/([4-9])/);
	if(!test) { return false; }
	return (agent.indexOf("MSIE 7.0") > -1);
}

/**
 * Implicitní konkstruktor, je volán při načtení skriptu 
 */   
JAK.Browser.getBrowser = function(){
	this._agent = this.agent = navigator.userAgent;
	this._platform = navigator.platform;
	this._vendor = navigator.vendor;
	this.platform = this._getPlatform();
	this.client = this._getClient();
	this.version = this._getVersion();
	this.mouse = this._getMouse();
	this.ieCompatibilityView = this._testIeCompatibilityView(this.client,this._agent);	
};
JAK.Browser.getBrowser();
