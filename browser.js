SZN.Browser = function(){
	this.Browser();
}

SZN.Browser.Name = 'Browser';
SZN.Browser.version = '1.0';

SZN.Browser.prototype.CLASS = 'class';
SZN.Browser.prototype.platform = '';
SZN.Browser.prototype.klient = '';
SZN.Browser.prototype.version = 0;
SZN.Browser.prototype.agent = '';

SZN.Browser.prototype.Browser = function(){
	this._agent = navigator.userAgent;
	this._platform = navigator.platform;
	this._vendor = navigator.vendor;
	this.platform = this._getPlatform();
	this.klient = this._getKlient();
	this.version = this._getVersion();
};

SZN.Browser.prototype._getPlatform = function(){
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

SZN.Browser.prototype._getKlient = function(){
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

SZN.Browser.prototype._getVersion = function(){
	var out = 0;
	var fncName = '_get_' + this.klient + '_ver';
	
	if(typeof this[fncName] == 'function'){
		return this[fncName]();
	} else {
		return 0;
	}
};

SZN.Browser.prototype._get_ie_ver = function(){
	if(typeof Function.prototype.call != 'undefined'){
		if(window.XMLHttpRequest){
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

SZN.Browser.prototype._get_opera_ver = function(){
	if(document.designMode && document.execCommand){
		return '9';
	} else if((document.selection) && (document.createRange)){
		return '8';
	} else if(document.createComment){
		return '7';
	} else {
		return '6';
	}
};

SZN.Browser.prototype._get_gecko_ver = function(){
	if(window.external){
		return '2';
	} else {
		return '1.5';
	}
};

SZN.Browser.prototype._get_konqueror_ver = function(){
	var num = this._agent.indexOf('KHTML') + 6;
	var part =  this._agent.substring(num);
	var end = part.indexOf(' ')
	var x = part.substring(0,end - 2);
	return x;
	
};

SZN.Browser.prototype._get_safari_ver = function(){
	return '1';
};

/* 
	VYCHOZI INICIALIZACE:
	SZN.browser = new SZN.Browser();

*/  
