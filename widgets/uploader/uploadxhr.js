/**
 * @overview Třída starající se o upload jednoho souboru pomocí XHR2. Samostatně se nevolá, vzužívá ji třída JAK.Uploader. 
 * @version 2.0
 * @author ethan
 */
 
/**
 * @class Uploader.UploadXHR
 * @group jak-widgets
 * @augments JAK.Uploader.Upload
 */
JAK.Uploader.UploadXHR = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader.UploadXHR",
	VERSION: "2.0",
	EXTEND: JAK.Uploader.Upload
});

/**
 * @param {object} conf
 * @param {object} conf.file objekt typu File dle File API
 * @param {string} conf.url="" URL, na kterou se odešle soubor
 * @param {string} [conf.id] náhodné UID, které identifikuje daný upload, defaultní hodnota se náhodně vygeneruje
 */
JAK.Uploader.UploadXHR.prototype.$constructor = function(conf) {
	this.$super(conf);
	
	if (!this._conf.file || !this._conf.url) { return; }

	this._name = this._conf.file.fileName || this._conf.file.name;
	this._size = this._conf.file.fileSize || this._conf.file.size;
	
	this._xhr = new XMLHttpRequest();
	this._xhr.open(
		"POST",
		this._conf.url,
		true
	);
	
	// pridame hlavicky
	this._xhr.setRequestHeader("Cache-Control", "no-cache");
	this._xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	
	// posluchace udalosti, ktere bude XHR posilat
	this._ec.push(JAK.Events.addListener(this._xhr.upload, "progress", this , '_progress'));
	this._ec.push(JAK.Events.addListener(this._xhr.upload, "error", this , '_error'));
	this._ec.push(JAK.Events.addListener(this._xhr, "load", this , '_load'));
	
	// posleme signal, ze upload zacal
	if (typeof this._conf.callbackStart == 'function') {
		this._conf.callbackStart({
			name: this._name,
			size: this._size,
			id: this._conf.id,
			file: this._conf.file
		});
	}
	
	var formObject = new FormData();
	formObject.append(this._conf.inputName, this._conf.file, this._name);
	formObject.append('hash', this._conf.id);
	
	// posleme data
	this._xhr.send(formObject);
}

/**
 * při postupu uploadu zavolá příslušný callback
 * @private
 */
JAK.Uploader.UploadXHR.prototype._progress = function(e) {
	if (typeof this._conf.callbackProgress == 'function') {
		this._conf.callbackProgress({
			id: this._conf.id,
			total: e.total,
			loaded: e.loaded
		});
	}
}

/**
 * rozhoduje, zda upload skončil úspěšně
 * @private
 */
JAK.Uploader.UploadXHR.prototype._load = function(e) {
	if (this._xhr.readyState == 4 && this._xhr.status == 200) {
		this._end(JAK.Uploader.FINISHED, this._xhr.responseText);
	} else {
		this._error(e);
	}
}

/**
 * zruší požadavek XHR2
 * @private
 */
JAK.Uploader.Upload.prototype._cancelRequest = function(e) {
	this._xhr.abort();
}
