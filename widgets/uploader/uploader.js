/**
 * @overview Komponenta nabízející asynchronní upload souborů 
 * @version 1.0
 * @author ethan
 */
 
/**
 * @class Uploader
 * @group jak-widgets
 */
JAK.Uploader = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader",
	VERSION: "1.0"
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

JAK.Uploader.supportsAjax =	(("draggable" in JAK.mel('div')) &&
							('files' in JAK.mel('input',{type:'file'})) &&
							!(JAK.Browser.client == 'gecko' && JAK.Browser.version < 4));

/**
 * konstruktor třídy starající se o správu uploadů nad daným prvkem
 * @param {object} conf
 * @param {bool} [conf.multiple=false] Povolit výběr více souborů najednou, pokud to prohlížeč podporuje
 * @param {string} [conf.url="/"] URL, na kterou se budou odesílat soubory pomocí XHR2 (a iframe, pokud není definováno iframeUrl)
 * @param {string} [conf.iframeUrl] URL, na kterou se budou odesílat soubory metodou iframe
 * @param {string || HTMLElement} [conf.button] ID nebo reference na element, který má sloužit jako tlačítko pro výběr souborů
 * @param {string} [conf.inputName="upload"] hodnota atributu name pro input, který se odešle pomocí iframe
 */
JAK.Uploader.prototype.$constructor = function(conf) {
	this._conf = {
		multiple: false,
		url: '/',
		button: '',
		inputName: 'upload'
	};
	for (var p in conf) { this._conf[p] = conf[p]; }
	
	// ruzne detekce - ukradeno z emailu
	this._multiple = JAK.Uploader.supportsAjax && this._conf.multiple && ('multiple' in JAK.mel('input',{type:'file'}));	/* umim mutiple input ? */
	
	this._dom = {};
	this._ec = [];
	this._ne = {
		change: null,
		click: null
	};
	this._dec = [];
	
	this._build();
	this.setButton(this._conf.button);
	
	this._ec.push(JAK.Events.addListener(window, "unload", this, "$destructor"));
}

/**
 * destruktor
 */
JAK.Uploader.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	JAK.Events.removeListeners(this._dec);
	if (this._ne.change) { JAK.Events.removeListener(this._ne.change); }
	if (this._ne.click) { JAK.Events.removeListener(this._ne.click); }
}

/**
 * metoda, pomocí které lze změnit prvek, který slouží jako tlačítko pro výběr souborů
 * @param {HTMLElement || string} elm - element, na který se věší click událost, nebo se obaluje labelem
 */
JAK.Uploader.prototype.setButton = function(elm) {
	if (this._ne.click) { JAK.Events.removeListener(this._ne.click); }
	JAK.Events.removeListeners(this._dec);

	this._dom.button = JAK.gel(elm);
	
	if (this._dom.button) {
		// XHR2 reseni
		if (JAK.Uploader.supportsAjax) {
			this._ne.click = JAK.Events.addListener(this._dom.button, 'click', function(e, elm) {
				this._dom.input.click();
			}.bind(this));
			this._dec.push(JAK.Events.addListener(this._dom.button, 'dragenter', this, '_dragMove'));
			this._dec.push(JAK.Events.addListener(this._dom.button, 'dragover', this, '_dragMove'));
			this._dec.push(JAK.Events.addListener(this._dom.button, 'dragleave', this, '_dragLeave'));
			this._dec.push(JAK.Events.addListener(this._dom.button, 'drop', this, '_drop'));
		} else {
			this._positionForm();
		}
		this._buildInput();
	}
}

/*
 * přidá tlačítku (tedy drop zóně) CCS třídu drag
 * @private
 */
JAK.Uploader.prototype._dragMove = function(e) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
	JAK.DOM.addClass(this._dom.button, 'drag');
};

/*
 * odebere tlačítku (tedy drop zóně) CSS třídu drag
 * @private
 */
JAK.Uploader.prototype._dragLeave = function(e) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
	JAK.DOM.removeClass(this._dom.button, 'drag');
};

/*
 * zpracovává soubory dropnuté na button
 * @private
 */
JAK.Uploader.prototype._drop = function(e) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
	JAK.DOM.removeClass(this._dom.button, 'drag');
	if (e.dataTransfer && e.dataTransfer.files) {
		for (var i = 0; i < e.dataTransfer.files.length; i++) {
			new JAK.Uploader.UploadXHR({
				file: e.dataTransfer.files[i],
				url: this._conf.url
			});
		}
	}
};

/*
 * ovladač události, který spustí ve chvíli, kdy se změní hodnota inputu
 * @private
 */
JAK.Uploader.prototype._change = function(e) {
	if (this._dom.input.value) {
		if (JAK.Uploader.supportsAjax) {
			for (var i = 0; i < this._dom.input.files.length; i++) {
				new JAK.Uploader.UploadXHR({
					file: this._dom.input.files[i],
					url: this._conf.url
				});
			}
		} else {
			new JAK.Uploader.UploadIFrame({
				name: this._dom.input.value,
				input: this._dom.input,
				url: this._conf.iframeUrl || this._conf.url
			});
		}
	}
	
	// prepsani stareho inputu novym, aby stara hodnota nezamezila znovuodeslani stejneho souboru
	this._buildInput();
}

/**
 * vytvoření potřebného HTML, které bude obalovat input a zajišťovat klikatelnost u iframe řešení
 * @private
 */
JAK.Uploader.prototype._build = function() {
	// vytvorime kontainer na input
	this._dom.form = JAK.mel('form', {
		action: this._conf.url, 
		method: "post",
		target: this._conf.id,
		enctype: "multipart/form-data",
		encoding: "multipart/form-data" /* tahle duplicitni vlastnost musi byt pro IE7 */
	}, {
		position: 'absolute',
		overflow: 'hidden',
		opacity: 0.01,
		WebkitOpacity: 0.01,
		MozOpacity: 0.01,
		filter: 'alpha(opacity=0.1)'
	});
	
	document.body.appendChild(this._dom.form);
	
	if (JAK.Uploader.supportsAjax) {
		JAK.DOM.setStyle(this._dom.form, {
			top: '-1px',
			height: '1px'
		});
	} else {
		this._ec.push(JAK.Events.addListener(window, "resize", this, "_positionForm"));
	}
}

/**
 * vytvoření uploadovacího inputu
 * @private
 */
JAK.Uploader.prototype._buildInput = function() {
	// odveseni udalosti
	if (this._ne.change) { JAK.Events.removeListener(this._ne.change); }
	
	// odmazani pripadneho inputu
	this._dom.form.innerHTML = '';
	
	// novy input
	var iid = JAK.idGenerator();
	this._dom.input = JAK.mel('input', {
		type: 'file',
		name: this._conf.inputName,
		id: iid
	});
	
	if (this._multiple) { this._dom.input.multiple = 'multiple'; }
	this._dom.form.appendChild(this._dom.input);
	
	if (!JAK.Uploader.supportsAjax) {
		JAK.DOM.setStyle(this._dom.input, {
			position: 'absolute',
			right: 0,
			top: 0,
			fontSize: '400px',
			opacity: 0.01,
			WebkitOpacity: 0.01,
			MozOpacity: 0.01,
			filter: 'alpha(opacity=0.1)'
		});
	}
	
	this._ne.change = JAK.Events.addListener(this._dom.input, 'change', this._change.bind(this));
}

/**
 * posouvání inputu přes tlačítko
 * @private
 */
JAK.Uploader.prototype._positionForm = function(e) {
	if (this._dom.button) {
		var pos = JAK.DOM.getBoxPosition(this._dom.button);
		
		JAK.DOM.setStyle(this._dom.form, {
			left: pos.left + 'px',
			top: pos.top + 'px',
			width: this._dom.button.offsetWidth+ 'px',
			height: this._dom.button.offsetHeight + 'px'
		});
		
		JAK.DOM.setStyle(this._dom.input, {
			fontSize: Math.min(400, this._dom.button.offsetHeight) + 'px'
		});
	}
}
