/**
 * @overview Komponenta nabízející asynchronní upload souborů 
 * @version 2.1
 * @author ethan
 */
 
/**
 * @class Uploader
 * @group jak-widgets
 * @signal upload-start
 * @signal upload-end
 * @signal upload-progress
 */
JAK.Uploader = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader",
	VERSION: "2.0",
	IMPLEMENT: JAK.ISignals
});

/**
 * konstanta značící, že upload byl dokončen v pořádku
 * @constant
 */
JAK.Uploader.FINISHED	= 4;
/**
 * konstanta značící, že upload byl dokončen, ale skončil chybou
 * @constant
 */
JAK.Uploader.FAILED		= 5;
/**
 * konstanta značící, že upload byl ukončen programem před dokončením
 * @constant
 */
JAK.Uploader.ABORTED	= 6;

// umime XHR2 upload?
// u stavajicich podporovanych prohlizecu plati, ze kdo umi draggable i files, umi i XHR2, az na jistou prechodnou verzi FF
JAK.Uploader.supportsAjax =	(("draggable" in JAK.mel('div')) &&
							('files' in JAK.mel('input',{ type: 'file' })) &&
							!(JAK.Browser.client == 'gecko' && JAK.Browser.version < 4));

/**
 * konstruktor třídy starající se o správu uploadů nad daným prvkem
 * @param {object} conf
 * @param {bool} conf.multiple=false Povolit výběr více souborů najednou, pokud to prohlížeč podporuje
 * @param {string} [conf.url=""] URL, na kterou se budou odesílat soubory
 * @param {string || HTMLElement} [conf.button] ID nebo reference na element, který má sloužit jako tlačítko pro výběr souborů
 * @param {string} conf.inputName="upload" hodnota atributu name pro input, který se odešle pomocí iframe
 * @param {string} conf.dragClass="drag-over" hodnota atributu name pro input, který se odešle pomocí iframe
 */
JAK.Uploader.prototype.$constructor = function(conf) {
	// konfiguracni objekt s defaultnimi hodnotami
	this._conf = {
		multiple: false,
		url: '',
		button: '',
		inputName: 'upload',
		dragClass: 'drag-over'
	};
	for (var p in conf) { this._conf[p] = conf[p]; }
	this._conf.multiple = JAK.Uploader.supportsAjax && this._conf.multiple;
		
	// sem se budou ukladat nase DOM reference
	this._dom = {};
	
	// objekt pro podrzeni uploadu
	this._uploads = {};
	
	// funkce pro posilani signalu
	this._callbacks = {
		start: this.makeEvent.bind(this, 'upload-start'),
		progress: this.makeEvent.bind(this, 'upload-progress'),
		end: function(data) { // tahle je jina, musi jeste znicit stary upload
			if (this._uploads[data.id]) {
				this._uploads[data.id].$destructor();
				delete this._uploads[data.id];
			}
			this.makeEvent('upload-end', data);
		}.bind(this)
	};
	
	// posluchac udalosti kliku na tlacitko
	this._eClick = null;
	// posluchac udalosti zmeny hodnoty inputu se souborem
	this._eChange = null;
	// posluchace udalosti D&D
	this._eDrag = [];
	
	// vytvor input
	this._buildInput();
	
	// nastav tlacitko, aby reagovalo (pokud existuje)
	this.setButton(this._conf.button);
}

JAK.Uploader.prototype.$destructor = function() {
	// odveseni posluchacu udalosti
	if (this._eClick) { JAK.Events.removeListener(this._eClick); }
	if (this._eChange) { JAK.Events.removeListener(this._eChange); }
	JAK.Events.removeListeners(this._eDrag);
	
	for (var i = 0, len = this._uploads.length; i < len; i++) {
		this._uploads[i].$destructor();
	}
}

/**
 * metoda, pomocí které lze změnit prvek, který slouží jako tlačítko pro výběr souborů
 * @param {HTMLElement || string} elm - element, na který se věší click událost, nebo se obaluje labelem
 */
JAK.Uploader.prototype.setButton = function(elm) {
	if (this._eClick) { JAK.Events.removeListener(this._eClick); }
	JAK.Events.removeListeners(this._eDrag);
	
	// pokud bylo tlacitko jen retezec, chceme element
	this._conf.button = JAK.gel(elm);
	
	if (!this._conf.button) { return; }

	// vsichni podporovani co umi XHR2, se taky poperou s click()
	if (JAK.Uploader.supportsAjax) {
		this._eClick = JAK.Events.addListener(this._conf.button, 'click', this, '_click');
		// XHR2 taky obvykle zvladaji i D&D a kdyby ne, tak posluchace nikomu neublizi
		this._eDrag.push(JAK.Events.addListener(this._conf.button, 'dragenter dragover', this, '_dragOver'));
		this._eDrag.push(JAK.Events.addListener(this._conf.button, 'dragleave', this, '_dragLeave'));
		this._eDrag.push(JAK.Events.addListener(this._conf.button, 'drop', this, '_drop'));
	} else {
		// bordel pro hooodne stare kamarady, kteri click() neumi, nebo ne ve spojeni s submit()
		this.syncPosition();
	}
}

/**
 * přidá tlačítku (tedy drop zóně) CCS třídu určnou konfigurací (default: drag-over)
 * @private
 */
JAK.Uploader.prototype._dragOver = function(e) {
	JAK.Events.cancelDef(e);
	JAK.DOM.addClass(this._conf.button, this._conf.dragClass);
};

/**
 * odebere tlačítku (tedy drop zóně) CSS třídu určnou konfigurací (default: drag-over)
 * @private
 */
JAK.Uploader.prototype._dragLeave = function(e) {
	JAK.DOM.removeClass(this._conf.button, this._conf.dragClass);
};

/**
 * zpracovává soubory dropnuté na tlačítko
 * @private
 */
JAK.Uploader.prototype._drop = function(e) {
	JAK.Events.cancelDef(e);
	JAK.DOM.removeClass(this._conf.button, this._conf.dragClass);
	if (e.dataTransfer && e.dataTransfer.files) {
		for (var i = 0; i < e.dataTransfer.files.length; i++) {
			this._uploadXHR(e.dataTransfer.files[i]);
		}
	}
};

/**
 * sestaví input, případně formulář, který se použije pro upload souboru
 * @private
 */
JAK.Uploader.prototype._buildInput = function() {
	// odstraneni stareho inputu souboru
	if (this._eChange) { JAK.Events.removeListener(this._eChange); }
	if (this._dom.input) { 
		this._dom.input.parentNode.removeChild(this._dom.input);
		this._dom.input = null;
	}
	
	// novy input
	this._dom.input = JAK.mel('input', { type: 'file', name: this._conf.inputName, multiple:this._conf.multiple});
	this._eChange = JAK.Events.addListener(this._dom.input, 'change', this, '_change');
	
	if (JAK.Uploader.supportsAjax) {
		// umime XHR2, muzeme mit jen input
		document.body.appendChild(this._dom.input);
		JAK.DOM.setStyle(this._dom.input, { position: 'absolute', top: '-100px' });
	} else {
		// formular pro ty mene stastne - i s napozicovanim nad tlacitko, protoze kde zavolame click(), tam IE < 10 nepovoli submit()
		// takze uzivatel musi fakt kliknout na ten input a to dokonce na jeho tlacitkovou cast
		if (!this._dom.form) {
			this._dom.form = JAK.mel('form', {
				action: this._conf.url,
				method: 'post',
				enctype: 'multipart/form-data',
				encoding: 'multipart/form-data' /* pro IE7 jinak pojmenovano, i kdyz ho uz nepodporujeme */
			}, {
				position: 'absolute',
				margin: '0px',
				padding: '0px',
				overflow: 'hidden',
				opacity: 0,	filter: 'alpha(opacity=0)'
			});
		}
		JAK.DOM.setStyle(this._dom.input, {
			fontSize: '1200px', /* 2407 je maximum, ktere jeste IE zvladne nezkazit */
			position: 'absolute',
			top: '0px',
			right: '0px',
			opacity: 0,	filter: 'alpha(opacity=0)'
		});
		this._dom.form.appendChild(this._dom.input);
		document.body.appendChild(this._dom.form);
	}
}

/**
 * posluchač události kliknutí na tlačítku, který otevře dialog pro výběr souboru
 * @private
 */
JAK.Uploader.prototype._click = function(e) {
	JAK.Events.cancelDef(e);
	this._dom.input.click();
}

/**
 * ovladač události, který spustí ve chvíli, kdy se změní hodnota inputu
 * @private
 */
JAK.Uploader.prototype._change = function(e) {
	if (!this._dom.input.value) { return; }

	if (JAK.Uploader.supportsAjax) {
		for (var i = 0; i < this._dom.input.files.length; i++) {
			this._uploadXHR(this._dom.input.files[i]);
		}
	} else {
		var id = JAK.idGenerator();
		this._uploads[id] = new JAK.Uploader.UploadIFrame({
			id: id,
			name: this._dom.input.value,
			input: this._dom.input,
			url: this._conf.url,
			callbackStart: this._callbacks.start,
			callbackProgress: this._callbacks.progress,
			callbackEnd: this._callbacks.end
		});
	}
	
	// prepsani stareho inputu novym, aby stara hodnota nezamezila znovuodeslani stejneho souboru
	this._buildInput();
	this.syncPosition();
}

/**
 * zruší upload určený parametrem id, pokud existuje a patří tomuto Uploaderu
 */
JAK.Uploader.prototype.abort = function(id) {
	if (this._uploads[id]) {
		this._uploads[id].abort();
	}
}

/**
 * metoda, která v případě iframe uploadu synchronizuje pozici neviditelného inputu přes tlačítko - nutné volat při každé změně DOM či layoutu, která by posunula input mimo tlačítko
 */
JAK.Uploader.prototype.syncPosition = function() {
	if (JAK.Uploader.supportsAjax || !this._conf.button) { return; }

	var pos = JAK.DOM.getBoxPosition(this._conf.button, document.body);
	
	JAK.DOM.setStyle(this._dom.form, {
		left: pos.left + 'px',
		top: pos.top + 'px',
		width: this._conf.button.offsetWidth+ 'px',
		height: this._conf.button.offsetHeight + 'px'
	});
}

JAK.Uploader.prototype._uploadXHR = function(file) {
	var id = JAK.idGenerator();
	this._uploads[id] = new JAK.Uploader.UploadXHR({
		id: id,
		file: file,
		url: this._conf.url,
		inputName: this._conf.inputName,
		callbackStart: this._callbacks.start,
		callbackProgress: this._callbacks.progress,
		callbackEnd: this._callbacks.end
	});
}
