/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Logovací jedináček
 * @group jak-utils
 */
JAK.Logger = JAK.ClassMaker.makeSingleton({
	NAME: "JAK.Logger",
	VERSION: "1.0"
});

/** @constant */
JAK.Logger.ERROR =	1; 
/** @constant */
JAK.Logger.WARN =	2;
/** @constant */
JAK.Logger.INFO =	3;

/** @constant */
JAK.Logger.CONSOLE =	1 << 0;
/** @constant */
JAK.Logger.ALERT =		1 << 1;
/** @constant */
JAK.Logger.URL =		1 << 2;

JAK.Logger.prototype.$constructor = function() {
	this._mode = JAK.Logger.CONSOLE;
	this._level = JAK.Logger.INFO;
	this._url = null;
	
	this._levelNames = {};
	this._levelNames[JAK.Logger.ERROR] = "Error";
	this._levelNames[JAK.Logger.WARN] = "Warning";
	this._levelNames[JAK.Logger.INFO] = "Info";
}

/**
 * Změna logovací úrovně, tj. filtr zpráv, které se mají logovat
 * @param {int} level
 */
JAK.Logger.prototype.setLevel = function(level) {
	this._level = level;
	return this;
}

/**
 * Nastavení výstupu
 * @param {int} mode Bitová maska režimů (JAK.Logger.XYZ)
 */
JAK.Logger.prototype.setMode = function(mode) {
	this._mode = mode;
	return this;
}

JAK.Logger.prototype.setURL = function(url) {
	this._url = url;
}

/**
 * @param {string} message Zpráva k zalogování
 * @param {object} sender Odesílací objekt
 * @param {int} [type=JAK.Logger.INFO] Typ zprávy (konstanta JAK.Logger.XYZ)
 */
JAK.Logger.prototype.log = function(message, sender, type) {
	var t = type || JAK.Logger.INFO;
	if (t > this._level) { return; } /* zahodit */
	
	var method = arguments.callee.caller;
	if (JAK.ILogger && method == JAK.ILogger.prototype.log) { method = method.caller; }
	
	var methodName = null;
	if (sender) {
		for (var p in sender) { 
			if (sender[p] == method) {
				methodName = p;
				break;
			}
		}
	}

	var from = "";
	from += (sender ? sender.constructor.NAME : "[unknown class]");
	from += "::";
	from += methodName || "[unknown method]";
	
	var msg = message || "[no message]";
	
	if (this._mode & JAK.Logger.CONSOLE) { this._logConsole(msg, from, t); }
	if (this._mode & JAK.Logger.ALERT) { this._logAlert(msg, from, t); }
	if (this._mode & JAK.Logger.URL) { this._logURL(msg, from, t); }
}

JAK.Logger.prototype._logConsole = function(message, sender, type) {
	if (!window.console) { return; }
	var str = new Date().toString() + " " + sender + " " + message;
	switch (type) {
		case JAK.Logger.ERROR: console.error(str); break;
		case JAK.Logger.WARN: console.warn(str); break;
		case JAK.Logger.INFO: console.info(str); break;
		default: console.log(str); break;
	}
}

JAK.Logger.prototype._logAlert = function(message, sender, type) {
	var str = this._levelNames[type] + " " + new Date().toString() + " " + sender + " " + message;
	alert(str);
}

JAK.Logger.prototype._logURL = function(message, sender, type) {
	if (!this._url) { return; }
	var level = this._levelNames[type];
	
	var replace = {
		message: message,
		sender: sender,
		level: level
	}
	var url = this._url.replace(/{([a-z]+)}/ig, function(match, what) {
		if (what in replace) { return encodeURIComponent(replace[what]); }
		return "";
	});
	
	var img = JAK.mel("img", {src:url});
}
