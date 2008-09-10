/**
 * ---------------
 * kontrola pravopisu
 * ---------------
 **/
SZN.EditorControl.SpellCheck = SZN.ClassMaker.makeClass({
	NAME: "SpellCheck",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.Interactive,
	CLASS: "class"
});

SZN.EditorControl.SpellCheck.prototype.$constructor  = function(owner, options) {
	this.callSuper('$constructor', arguments.callee)(owner, options);

	this.id = SZN.idGenerator();
	this.httpRequestId = 0;
	this.languageSelectIsVisible = false; //zda je otevreno okno s vyberem jazyka
	this.selectedLanguage = null; //jaky jazyk je vybran pro validaci (cs,en)
	this.continueToValidate = false; //pokud chce uzivatel validovat ale neni vybran jazyk, tak je zde true a pri vyberu jazyka pokracuji ve validaci
	this.badWordDic = {}; //je to asociativni pole kde klicem je nenalezene slovo a hodnotou je pole jednotlivych span elementu oznacujicich spatna slova

	this.owner.addStyle('span.spellcheckbadword {background-image:url(/images/editor/wline.gif); background-repeat:repeat-x; background-position: bottom;}');

	//naveseni na ziskani obsahu editoru
	this.owner.registerGetContentHook(this, 'editorGetContentHook');
}


SZN.EditorControl.SpellCheck.prototype.$destructor = function() {
	this.callSuper('$destructor', arguments.callee)();

	this.selectedLanguage = null;

	for (var k in this.badWordDic) {
		var a = this.badWordDic[k];
		for (var i = 0; i < a.length; i++) {
			a[i].$destructor();
		}
	}
}


SZN.EditorControl.SpellCheck.prototype.refresh  = function() {
	this.callSuper('refresh', arguments.callee)();

	//schovat okno s vyberem jazyka
	if (this.languageSelectIsVisible) {
		this._closeLanguageSelect();
	}

	//je li otevreno okno s nahradou slova, schovam
	for (var k in this.badWordDic) {
		var a = this.badWordDic[k];
		for (var i = 0; i < a.length; i++) {
			a[i].close();
		}
	}
}


/**
 * vytvoreni obalu obrazku a pridani sipky
 */
SZN.EditorControl.SpellCheck.prototype._build = function() {
	this.callSuper('_build', arguments.callee)();

	var span = SZN.cEl('span');
	this.dom.button =  this.dom.container;
	span.appendChild(this.dom.button);

	var arrow = SZN.cEl('img', false, 'arrow');
	arrow.src = this.owner.options.imagePath + this.options.opt.arrowImage;
	arrow.style.cursor = 'pointer';

	this.dom.arrow = arrow;
	span.appendChild(arrow);
	
	this.dom.container = span;
}

/**
 * prepsani metody pro pridani mouseoveru
 * @param {elm} obalujici prvek obou buttonku, nepotrebujeme
 */
SZN.EditorControl.SpellCheck.prototype._addMouseEvents = function(elm) {
	this.ec.push(SZN.Events.addListener(this.dom.button,"mouseover",this,"_mouseover",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.button,"mouseout",this,"_mouseout",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.button,"click",this,"_buttonClick",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.arrow,"mouseover",this,"_mouseover",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.arrow,"mouseout",this,"_mouseout",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.arrow,"click",this,"_arrowClick",false,true));
}

SZN.EditorControl.SpellCheck.prototype._arrowClick = function(e, elm) {
	if (!this.languageSelectIsVisible ) { document.b = this;
		this.languageSelectIsVisible = true;
		this._createLanguageSelect();
	} else {
		this._closeLanguageSelect();
	}
}

SZN.EditorControl.SpellCheck.prototype._createLanguageSelect = function() {
	if (this.dom.languageSelect == null) {
		SZN.Dom.addClass(this.dom.arrow, 'pressed');

		var pos = SZN.Dom.getBoxPosition(this.dom.arrow);   //jen oproti rodici, protoze rodic je relativne stylovan

	   var div = SZN.cEl('div', false, 'editor-spellcheck-languages');
		div.style.position = 'absolute';
		div.style.left = pos.left+'px';
		div.style.top = pos.top+this.dom.arrow.offsetHeight+'px';
		div.style.zIndex = 1;

		div.innerHTML = '<div class="header-languages">'+this.options.text[1]+'</div>';
		for (var i = 0; i < this.options.opt.languages.length; i++) {
			var lang = SZN.cEl('div', false, 'item-languages');
			lang.id = this.options.opt.languages[i].code;
			lang.innerHTML = this.options.opt.languages[i].name;
			lang.style.cursor = 'pointer';
			if (this.selectedLanguage == this.options.opt.languages[i].code){
				SZN.Dom.addClass(lang, 'selected-language');
			}
			div.appendChild(lang);

			this.ec.push(SZN.Events.addListener(lang,"mouseover",this,"_langmouseover",false,true));
			this.ec.push(SZN.Events.addListener(lang,"mouseout",this,"_langmouseout",false,true));
			this.ec.push(SZN.Events.addListener(lang,"click",this,"_langClick",false,true));
		}

		this.dom.languageSelect = div;
		var body = document.getElementsByTagName('body')[0];
		body.appendChild(this.dom.languageSelect);

	} else {
		var langDiv = document.getElementById(this.selectedLanguage);
		if (langDiv) {
			var selL =  SZN.Dom.getElementsByClass('selected-language');
			if (selL[0]) {
				SZN.Dom.removeClass(selL[0], 'selected-language' );
			}
			SZN.Dom.addClass(langDiv, 'selected-language');
		}
	}
	this.dom.languageSelect.style.display = 'block';
}

SZN.EditorControl.SpellCheck.prototype._langmouseover = function(e, elm) {
	SZN.Dom.addClass(elm,"mouseover-languages");
}

SZN.EditorControl.SpellCheck.prototype._langmouseout = function(e, elm) {
	SZN.Dom.removeClass(elm,"mouseover-languages");
}

SZN.EditorControl.SpellCheck.prototype._langClick = function(e, elm) {
	this.selectedLanguage = elm.id;
	this._closeLanguageSelect();

	//take mohl byt dialog vyberu jazyka otevren z ikony validace, pak ve validaci pokracuji
	if (this.continueToValidate) {
		this.continueToValidate = false;
		this.validateSource();
	}
}

/**
 * schova vyber jazyka
 */
SZN.EditorControl.SpellCheck.prototype._closeLanguageSelect = function() {
	SZN.Dom.removeClass(this.dom.arrow, 'pressed');
	this.dom.languageSelect.style.display = 'none';
	this.languageSelectIsVisible = false;
}


//--------------BUTTON---------------

/**
 * kliknuti na butonek spellchecku
 * @param e
 * @param elm
 */
SZN.EditorControl.SpellCheck.prototype._buttonClick = function(e, elm) {
	if (SZN.Dom.hasClass(elm, 'pressed')) {
		SZN.Dom.removeClass(elm, 'pressed');
		//odrovnat spellcheck
		this.removeAllBadWords(true);
	} else {
		if (!this.selectedLanguage) {
			this.continueToValidate = true;
			this._createLanguageSelect();
		} else {
			this.validateSource();
		}
	}
}

SZN.EditorControl.SpellCheck.prototype.validateSource = function() {
	SZN.Dom.addClass(this.dom.button, 'pressed');

	var text = this.owner.getContent();
	text = text.replace(/<br[ ]*\/?>/g," ");
	text = text.replace(/<[^>]+>/g,"");

	var rq = new SZN.HTTPRequest();
	rq.setMethod("post");
	rq.setFormat("xml");
	rq.setMode("async");
	//rq.setPostData('id='+this.id+'|'+(this.httpRequestId++)+'&cmd=spell&lang='+this.selectedLanguage+'&check='+encodeURIComponent(text));
	rq.setPostData('id='+this.id+'_spellcheck&cmd=spell&lang='+this.selectedLanguage+'&check='+encodeURIComponent(text));
	rq.send(this.options.opt.spellCheckUrl, this, 'parseSpellCheck');
}

SZN.EditorControl.SpellCheck.prototype.parseSpellCheck = function(xml, status) {
	if (status == 200 && xml !== null) {
		if (xml.documentElement.firstChild) { //pokud jsou nejaka divna slova
			var result = xml.documentElement.firstChild.nodeValue;
			result = decodeURIComponent(result);
			var resArray = this._prepareBadWordArray(result);

			for (var i = 0; i < resArray.length; i++) {
				this.badWordDic[resArray[i]] = [];
				this.underlineBadWord(resArray[i]);
			}

			//na vsechny spany navesit udalost a poznamenad si je
			this.manageBadWords();
		}

	//nastala chyba
	} else {
		SZN.Dom.removeClass(this.dom.button, 'pressed');
	}
}

/**
 * retezec prevede na pole, ktere ma kazdou cast pouze jednou "a b a c" => [a,b,c]
 * @param result
 */
SZN.EditorControl.SpellCheck.prototype._prepareBadWordArray = function(result) {
	var oArray = result.split('+');
	var obj = {};
	var resArray = [];

	oArray.forEach(function(item){obj[item] = 1;});
	for (var k in obj) {
		resArray.push(k);
	}

	return resArray;
}


SZN.EditorControl.SpellCheck.prototype.underlineBadWord = function(word) {
	var txt = this.owner.getContent();
	var regExp = new RegExp('\\b'+word+'\\b','g');
	txt = txt.replace(regExp, '<span class="spellcheckbadword">'+word+'</span>');
	this.owner.setContent(txt);
}

SZN.EditorControl.SpellCheck.prototype.manageBadWords = function() {
	var e = this.owner.getContainer();
	var spans = SZN.Dom.getElementsByClass("spellcheckbadword",e);
	for (var i = 0; i < spans.length; i++) {
		if (!(this.badWordDic[spans[i].innerHTML] instanceof Array)) {
			this.badWordDic[spans[i].innerHTML] = [];
		}
		var w = new SZN.EditorControl.SpellCheck.Word(this, spans[i]);
		this.badWordDic[spans[i].innerHTML].push(w);

	}
}

/**
 * navesena udalost na ziskani obsahu editoru
 * nutno vymazat vsechny navesene Word objekty a zrusit spany
 */
SZN.EditorControl.SpellCheck.prototype.editorGetContentHook = function() {
	this.removeAllBadWords(true);
}


/**
 * odebere objekt slova ze seznamu slov
 * @param word
 */
SZN.EditorControl.SpellCheck.prototype.removeBadWord = function(word) {
	for (var k in this.badWordDic) {
		var a = this.badWordDic[k];
		for (var i = 0; i < a.length; i++) {
			if (a[i] == word) {
				a.splice(i,1);
			}
		}
	}
}


/**
 * odebere vsechny objekty daneho slova ze seznamu slov
 * @param word
 */
SZN.EditorControl.SpellCheck.prototype.removeAllBadWords = function(strWord) {
	for (var k in this.badWordDic) {
		if (strWord == true || k == strWord) {
			var a = this.badWordDic[k];
			for (var i = 0; i < a.length; i++) {
				try {
					this.owner.selectNode(a[i].elm);
					//a[i].ignoreWord();
					var selSpan = this.owner.getSelectedNode();
					var txt = SZN.cTxt(a[i].word);
					selSpan.parentNode.replaceChild(txt, selSpan);
				} catch (e) {
					//muze se stat, ze uzivatel editoval dokument a uz tam ty elementy nejsou, pak to huci na chybe
				}
				a[i].$destructor();
			}
			this.badWordDic[k] = [];
		}
	}
}











//--------------WORD----------------
SZN.EditorControl.SpellCheck.Word = SZN.ClassMaker.makeClass({
	NAME: "Word",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.EditorControl.SpellCheck.Word.prototype.$constructor = function(owner, elm) {
	this.elm = elm; //span element obalujici slovo
	this.owner = owner; //SpellCheck plugin
	this.spellCheckUrl = this.owner.options.opt.spellCheckUrl;
	this.word = elm.innerHTML; //slovo co nahrazuji
	this.ec = []; //zasobnik udalosti
	this.dom = {}; //uchovava odkazy na menu

	this.ec.push(SZN.Events.addListener(elm, 'click', this, 'click', false, true));
	this.ec.push(SZN.Events.addListener(elm, 'contextmenu', this, 'click', false, true));
	this.ec.push(SZN.Events.addListener(document, 'click', this,'close', false, true));
	if (this.owner.owner.getInstance() instanceof SZN.Editor.Instance.Iframe) {
		var ifr = this.owner.owner.getInstance().ifr;
		this.ec.push(SZN.Events.addListener(ifr, 'click', this,'close', false, true));
	}
}

SZN.EditorControl.SpellCheck.Word.prototype.$destructor = function() {
	for (var i = 0; i < this.ec.length; i++) {
		SZN.Events.removeListener(this.ec[i]);
	}

	for (k in this.dom) {
		this.dom[k] = null;
	}
}


SZN.EditorControl.SpellCheck.Word.prototype.close = function(e, elm) {
	if (this.dom.elm && this.dom.elm.parentNode) {
		this.dom.elm.parentNode.removeChild(this.dom.elm);
	}
}

SZN.EditorControl.SpellCheck.Word.prototype.click = function(e, elm) {
	SZN.Events.cancelDef(e);
	SZN.Events.stopEvent(e);
	this.owner.owner.selectNode(this.elm);
	this.renderForm();
}

SZN.EditorControl.SpellCheck.Word.prototype.renderForm = function() {
	var div = SZN.cEl('div', false, 'editor-badWordMenu');
	var header = SZN.cEl('div', false, 'editor-badWordMenuHeader');
	header.innerHTML = this.owner.options.text[2];
	div.appendChild(header);
	var content = SZN.cEl('div');
	div.appendChild(content);


	this.dom.header = header;
	this.dom.content = content;
	this.dom.elm = div;

	//pripnout do stromu
	var pos = {top: 0, left: 0};
	var inst = this.owner.owner.getInstance();
	if (inst instanceof SZN.Editor.Instance.Iframe) {    //ty co maji iframe (FF)
		pos = SZN.Dom.getBoxPosition(this.elm, inst.ifr);
		var ipos = SZN.Dom.getBoxPosition(inst.ifr);
		pos.top += ipos.top;
		pos.left += ipos.left;
	} else { //ty s contenteditable DIVem
		pos = SZN.Dom.getBoxPosition(this.elm);
	}

	pos.top += this.elm.offsetHeight;

	div.style.position = 'absolute';
	div.style.top = pos.top+'px';
	div.style.left = pos.left+'px';
	document.getElementsByTagName('body')[0].appendChild(div);

	/*this.dom.container = div;
	this.dom.header = header;
	this.dom.content = content; */

	this.requestSuggest();
}

SZN.EditorControl.SpellCheck.Word.prototype.requestSuggest= function() {
	var rq = new SZN.HTTPRequest();
	rq.setMethod("post");
	rq.setFormat("xml");
	rq.setMode("async");
	rq.setPostData('id='+this.id+'_suggest&cmd=suggest&lang='+this.owner.selectedLanguage+'&check='+encodeURIComponent(this.word));
	rq.send(this.spellCheckUrl, this, 'parseSuggest');
}

SZN.EditorControl.SpellCheck.Word.prototype.parseSuggest= function(xml, status) {
	if (status == 200 && xml !== null) {
		      window.x = xml;
		if (xml.documentElement.childNodes.length > 0) {
			var result = xml.documentElement.firstChild.nodeValue;
			result = decodeURIComponent(result);
			var resArray = result.split('+');
			if (resArray.length > 0) {

				for (var i = 0; i < resArray.length; i++) {
					var div = SZN.cEl('div', false, 'editor-suggestWord');
					div.innerHTML = resArray[i];
					this.ec.push(SZN.Events.addListener(div, 'click', this, 'suggestWordClick', false, true));
					this.ec.push(SZN.Events.addListener(div, 'mouseover', this, 'suggestWordMouseOver', false, true));
					this.ec.push(SZN.Events.addListener(div, 'mouseout', this, 'suggestWordMouseOut', false, true));
					this.dom.content.appendChild(div);
				}

				this.dom.header.innerHTML = this.owner.options.text[5];

				//ignorovat slovo
				var div = SZN.cEl('div', false, 'editor-suggestWord');
				div.innerHTML = this.owner.options.text[6];
				this.ec.push(SZN.Events.addListener(div, 'click', this, 'ignoreWord', false, true));
				this.ec.push(SZN.Events.addListener(div, 'mouseover', this, 'suggestWordMouseOver', false, true));
				this.ec.push(SZN.Events.addListener(div, 'mouseout', this, 'suggestWordMouseOut', false, true));
				this.dom.content.appendChild(div);
				//ignorovat vse
				var div = SZN.cEl('div', false, 'editor-suggestWord');
				div.innerHTML = this.owner.options.text[7];
				this.ec.push(SZN.Events.addListener(div, 'click', this, 'ignoreAll', false, true));
				this.ec.push(SZN.Events.addListener(div, 'mouseover', this, 'suggestWordMouseOver', false, true));
				this.ec.push(SZN.Events.addListener(div, 'mouseout', this, 'suggestWordMouseOut', false, true));
				this.dom.content.appendChild(div);
				//todo ie nezobrazuje
				this.dom.elm.style.display = 'none';
				this.dom.elm.style.display = 'block';
			} else {
				this.dom.header.innerHTML = this.owner.options.text[4];
			}
		} else {
			this.dom.header.innerHTML = this.owner.options.text[4];
		}


	//nastala chyba
	} else {
		this.dom.content.innerHTML = this.owner.options.text[3];
	}
}

/**
 * prepsani slova v editoru vyberem
 * @param e
 * @param elm
 */
SZN.EditorControl.SpellCheck.Word.prototype.suggestWordClick = function(e, elm) {
	if (window.console) console.log(this.owner.owner.getSelectedNode());
	//var selSpan = this.owner.owner.getSelectedNode();
	var selSpan = this.elm;
	var txt = SZN.cTxt(elm.innerHTML);
	selSpan.parentNode.replaceChild(txt, selSpan);
   this.deleteWord();
}

SZN.EditorControl.SpellCheck.Word.prototype.ignoreWord = function(e, elm) {
	var selSpan = this.owner.owner.getSelectedNode();
	var txt = SZN.cTxt(this.word);
	selSpan.parentNode.replaceChild(txt, selSpan);

	this.deleteWord();
}

SZN.EditorControl.SpellCheck.Word.prototype.ignoreAll = function(e, elm) {
	this.close();
	this.owner.removeAllBadWords(this.word);
}

SZN.EditorControl.SpellCheck.Word.prototype.deleteWord = function() {
	this.close();
	//todo vymazani tohoto objektu z rodice
	this.owner.removeBadWord(this);
	this.$destructor();
}

SZN.EditorControl.SpellCheck.Word.prototype.suggestWordMouseOver = function(e, elm) {
	SZN.Dom.addClass(elm, 'editor-badWordMenu-mouseOver');
}

SZN.EditorControl.SpellCheck.Word.prototype.suggestWordMouseOut = function(e, elm) {
	SZN.Dom.removeClass(elm, 'editor-badWordMenu-mouseOver');
}


//---------NABINDOVANI-------
SZN.EditorControls["spellcheck"] = {object:SZN.EditorControl.SpellCheck, image:"spellcheck.gif"};