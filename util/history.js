/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT License, its complete text is available in licence.txt file
*/

/**
 * @class AJAX HISTORY
 * @version 2.0
 * @author CHOSE, standardizovalo Wendigo, prevedeno na nove knihovny Jelc, SZN->JAK zara
 * @group jak-utils
 */ 
JAK.History = JAK.ClassMaker.makeClass({
	NAME : 'JAK.History', 
	VERSION : '2.0'
});

JAK.History.prototype.$destructor = function() {
	window.clearTimeout(this.checkInterval);
};
	
// incializacni metoda, ktera v parametru ocekava callback funkci pro zpracovani zmen parametru URL za #...
JAK.History.prototype.$constructor = function(obj, fce) {
	// linkneme si callback funkci pri zmene hash
	this.obj = obj;
	this.listener = fce;

	// prohlizec musi umet call, jinak ukoncime skript konec
	if (!this.listener.call) {
		this.capable = false;
		return;
	} else {
		this.capable = true;
	}
	
	// aktualni hash zjistime
	this.lastHash = this.getHashFromUrl();
	// pro IE musime vytvorit IFRAME, pomoci ktereho bude tlacitko zpet spravne fungovat
	if (JAK.History.isIE()) {
		//debug('Hist init:'+this.lastHash);
		this.updating = true;
		if (document.readyState == "loading") {
			//debug('loading');
			document.write('<iframe id="history-frame" src="/historyScreen'+/*?:'+this.lastHash+*/'" style="display:none;"></iframe>');
			this.IEframe = document.getElementById('history-frame');
		
		} else {
			//debug('not loading');
			var x = document.getElementsByTagName('body');
			if (x) {
				var iframe = document.createElement('iframe');
				iframe.setAttribute('src','/historyScreen');//?:'+this.lastHash);
				iframe.style.display = 'none';
				if (x[0]) {
					x[0].appendChild(iframe);
					this.IEframe = iframe;
				}
			}
			
		}
		this.ieFrameSet(this.lastHash);
	}
		
	// budeme pravidelne volat metodu, ktera porad kontroluje zmenu url
	this._checkHash = this._checkHash.bind(this);
	this.checkInterval = window.setInterval(this._checkHash,200);

	// a pri initu zavola funkci pro update stranky (ikdyz je hash prazdny)
	this.listener.call(this.obj, this.lastHash);
};
	
JAK.History.prototype.add = function(params) {
	//debug('JAK.History.add ('+params+')');
	//debug('ok = ' + this.capable)
	if (this.capable) {
		this.updating = true;
		this.lastHash = params;
		//debug('JAK.History.add really!');

		if (JAK.History.isIE()) {

			this.ieFrameSet(params);

		}
		// IE neni, menime rovnou URL
		window.location.hash = params;
	}

};

JAK.History.getHashFromUrl = function() {
	//debug(window.location.hash)
	//return encodeURI(decodeURI(window.location.hash.substring(1,window.location.hash.length)));
	try {
		return decodeURI(window.location.hash.substring(1,window.location.hash.length));
	} catch(e){
		return window.location.hash.substring(1,window.location.hash.length);
	}

};


JAK.History.prototype.getHashFromUrl = function() {	
	return JAK.History.getHashFromUrl();
};


JAK.History.prototype._checkHash = function() {
	//debug('CHECK HASH')
	// IE patch
	if (this.IEframe)
		var hash = this.ieFrameCheck();
	else
		var hash = this.getHashFromUrl();
	//if (this.IEframe)
	//	this.ieFrameSet(hash);

	if (this.updating) {
		if (hash == decodeURI(this.lastHash)) {
			this.updating = false;
			//debug('unblocked');
		} else {
			//debug('blocked');
		}
		return;
	}
	this.callListener(hash);
};


JAK.History.prototype.getIeFrameHash = function() {
	var hash = this.IEframe.contentWindow.location.hash;
	//debug(this.IEFrame.contentWindow);
	return hash.substring(1,hash.length);
}

JAK.History.prototype.ieFrameCheck = function() {
	var hash = this.getIeFrameHash();
	if (this.lastHash != hash && !this.updatingIE) {
		window.location.hash = hash;
		//debug(this.lastHash+'|'+hash);
		return decodeURI(hash);
	}
	if (this.lastHash == hash && this.updatingIE) {
		this.updatingIE = false;
	}
	return decodeURI(this.lastHash);
};


JAK.History.prototype.ieFrameSet = function(hash) {
	if (/*!this.updatingIE &&*/ decodeURI(this.getIeFrameHash()) != hash) {
		this.updatingIE = true;
		this.IEframe.setAttribute('src','/historyScreen/?:' + hash + '#' + hash);
	}
};

JAK.History.prototype.callListener = function(hash) {
	if (hash != decodeURI(this.lastHash)) {
		//debug('callList');
		//debug(this.lastHash+' / '+hash);
		this.lastHash = hash;
		this.listener.call(this.obj, hash);
	}
};


// metoda na detekci, zda se jedna o IE
JAK.History.isIE = function() {//return false;
	var userAgent = navigator.userAgent.toLowerCase();
	if (userAgent.indexOf('msie')!=-1 && !window.opera) {
		return true;
	} else {
		return false;
	}
};


// metoda na detekci, zda se jedna o IE
JAK.History.ieHashFix = function() {
	if (!JAK.History.isIE())
		return;
	var hash = window.location.hash;
	if (hash.length > 2 && hash.substring(hash.length-2)=='@@') {
		//document.execCommand('Stop');
		window.location.replace( window.location.href.substring(0,window.location.href.length-2) );
	}
}


/**
 * @class
 * @group jak-utils
 * @signal state-load
 */
JAK.State = JAK.ClassMaker.makeClass({
	NAME: "JAK.State",
	VERSION: "3.0",
	IMPLEMENT:JAK.ISignals
});

JAK.State.prototype.$constructor = function() {
	this.state = {
		string:"",
		obj:{}
	};
	this._check = this._check.bind(this);
	this.init = this.init.bind(this);
	this.addListener("state-save", "_save");
}

JAK.State.prototype.init = function() {
	this.history = new JAK.History(this, this._load);
	window.h = this.history;
	this.addListener("state-store", "_store");
//	setInterval(this._check, 200);
}

/**
 * pokud doslo ke zmene, zapise nekam stav
 */
JAK.State.prototype._store = function(e) {
	var old = this.state.string;
	this._serialize();
	if (this.state.string != old) { this.history.add(this.state.string); }
}

/**
 * periodicky overuje zmenu hashe
 */ 
JAK.State.prototype._check = function() {
	var h = this._readHash();
	if (h != decodeURIComponent(this.state.string)) { this._load(h); }
}

/**
 * prevede stav na string
 */
JAK.State.prototype._serialize = function() {
	var arr = [];
	for (var name in this.state.obj) {
		var val = this.state.obj[name];
		arr.push(encodeURIComponent(name)+"="+encodeURIComponent(val));
	}
	this.state.string = arr.join("&");
}

/**
 * prevede string na hash stavu
 */
JAK.State.prototype._unserialize = function(str) {
	var arr = this.state.string.split("&");
	for (var i=0;i<arr.length;i++) {
		var item = arr[i];
		if (!item) { continue; }
		var r = item.match(/([^=]+)=(.*)/);
		if (!r) { continue; }
		this.state.obj[r[1]] = r[2];
	}
}

/**
 * ulozi zaznam stavu
 */
JAK.State.prototype._save = function(e) {
	var data = e.data;
	for (var name in data) {
		this.state.obj[name] = data[name];
	}
}

/**
 * nacte historii
 */
JAK.State.prototype._load = function(str) {
	this.state.string = str;
	this._unserialize();
	this.makeEvent("state-load", this.state.obj);
};

(function(){
	var s = new JAK.State();
	JAK.State.init = s.init;
})();
