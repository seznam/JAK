/**
 * @overview Třída starající se o upload jednoho souboru pomocí XHR2. Samostatně se nevolá, vzužívá ji třída JAK.Uploader. 
 * @version 1.0
 * @author ethan
 */
 
/**
 * @class Uploader.UploadXHR
 * @group jak-widgets
 * @augments JAK.Uploader.Upload
 * @signal upload-start
 * @signal upload-end
 * @signal upload-progress
 */

JAK.Uploader.UploadXHR = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader.UploadXHR",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals,
	EXTEND: JAK.Uploader.Upload
});

/**
 * konstruktor
 * @param {object} conf
 * @param {string} [conf.url="/"] URL, na kterou se odešle soubor
 * @param {string} [conf.id] náhodné UID, které identifikuje daný upload, defaultní hodnota se náhodně vygeneruje
 * @param {object} [conf.file] objekt typu File dle File API
 */
JAK.Uploader.UploadXHR.prototype.$constructor = function(conf) {
	this.$super(conf);
	
	if (this._conf.file) {
		this._name = this._conf.file.fileName || this._conf.file.name;
		this._size = this._conf.file.fileSize || this._conf.file.size;
		this._id = this._conf.id;
		
		this._xhr = new XMLHttpRequest();
		this._xhr.open(
			"POST",
			this._conf.url
		);
		this._xhr.setRequestHeader("Cache-Control", "no-cache");
		this._xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		this._xhr.setRequestHeader("X-File-Name", this._name);
        this._xhr.setRequestHeader("Content-Type", "application/octet-stream");
        
        this._ec.push(JAK.Events.addListener(this._xhr.upload, "progress", this._progress.bind(this)));
		this._ec.push(JAK.Events.addListener(this._xhr.upload, "error", this._error.bind(this)));
		this._ec.push(JAK.Events.addListener(this._xhr, "load", this._load.bind(this)));
		
		
		
		this.makeEvent('upload-start', {
			name: this._name,
			size: this._size,
			id: this._id
		});
		
		this._xhr.send(this._conf.file);
	}
}

/**
 * vysílá signál o postupu uploadu
 * @private
 */
JAK.Uploader.UploadXHR.prototype._progress = function(e) {
	this.makeEvent('upload-progress', {
		id: this._id,
		total: e.total,
		loaded: e.loaded
	});
}

/**
 * volá se v případě, že upload skončí úspěšně
 * @private
 */
JAK.Uploader.UploadXHR.prototype._load = function(e) {
	if (this._xhr.readyState == 4 && this._xhr.status == 200) {
		this.$super(e);
	} else {
		this._error(e);
	}
}

/**
 * reaguje na signál zrušení uploadu tím, že zastaví XHR požadavek a pošle signál ukončení uploadu
 * @private
 */
JAK.Uploader.UploadXHR.prototype._abort = function(data) {
	if (data.data.id && data.data.id == this._id) {
		this._xhr.abort();
		this._end(JAK.Uploader.ABORTED);
	}
}
