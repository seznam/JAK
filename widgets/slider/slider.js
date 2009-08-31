/**
 * @class Slider
 * @group jak-widgets
 * @signal change
 **/
SZN.Slider = SZN.ClassMaker.makeClass({
	NAME: "SZN.Slider",
	VERSION: "1.0",
	CLASS: "class",
	IMPLEMENT: SZN.SigInterface
});
/**
 * @param {id} rootElm Korenovy element do ktereho se vygeneruje samotny slider
 * @param {object} options litaralovy object options ktery nese nasledujici promenne
 * @param {int} [options.width=100] width sirka slideru
 * @param {int} [options.height=15] height vyska slideru
 * @param {int} [options.min=1] min minimalni hodnota na stupnici slideru
 * @param {int} [options.max=100] max maximalni hodnota na stupnici slideru
 * @param {int} [options.riderW=10] riderW sirka jezdce slideru
 * @param {int} [options.riderH=22] riderH vyska jezdce slideru
 * @param {float} [options.step=0] step delka kroku 0=1px
 * @param {string} [options.mode="horizontal"] mode zobrazeni slideru - muze obsahovat hodnoty 'vertical' pro vertikalni zobrazeni nebo 'horizontal' pro horizontalni zobrazeni slideru
 * @param {string} [options.input=""] input id inputu pro zobrazovani aktualni hodnoty slideru - pokud je prazdny tak se nevytvori - pokud nejni vytvoren a je zadane ID vytvori se a vlozi do rootElm
 * @param {string} [options.separator="."] separator oddelovac desetinych cisel
 * @param {int} [options.decimal=0] decimal pocet desetinych mist hodnot ktere se budou zobrazovat
 * @param {string} [options.mainSliderId=false] mainSliderId nazev unikatniho ID vytvoreneho elementu pro hlavni prvek slideru
 * @param {string} [options.arrowsMoverId=false] arrowsMoverId nazev unikatniho ID vytvoreneho odkazu na ktery jsou naveseny udalosti pro obsluhovani slideru klavesami
 * @param {string} [options.riderSliderId=false] riderSliderId nazev unikatniho ID vytvoreneho jezdce slideru
 * @param {string} [options.plusId=false] plusId nazev unikatniho ID vytvoreneho tlacitka plus
 * @param {string} [options.minusId=false] minusId nazev unikatniho ID vytboreneho tlacitka minus
 **/
SZN.Slider.prototype.$constructor = function(rootElm, options){
	this.options = {
	    width     		: 100,
	    height    		: 15,
	    min       		: 1,
	    max       		: 100,
	    riderW    		: 10,
	    riderH          : 22,
	    step            : 0,
	    mode            : 'horizontal',
	    input           : null,
	    separator       : '.',
	    decimal         : 0,
		mainSliderId    : false,
		arrowsMoverId   : false,
		riderSliderId   : false,
		plusId          : false,
		minusId         : false,
		mainSliderClassName		: 'mainSlider',
		arrowsMoverClassName	: 'arrowsMover',
		riderSliderClassName	: 'riderSlider',
		plusClassName 			: 'plus',
		minusClassName			: 'minus'
		
		
	};
	for(p in options){
	    this.options[p] = options[p];
	}
	this.rootElm = SZN.gEl(rootElm);
	this.riderAxis = this.options.mode == 'vertical' ? 'bottom' : 'left';
	this.actualValue = this.options.min;
	this.actualPos = 0;
	this.eventsFolder = [];
	this.decimal = this.options.decimal;
	/*this.min = this._enFormat(this.options.min)*Math.pow(10,this.decimal);
	this.max = this._enFormat(this.options.max)*Math.pow(10,this.decimal);*/
	this.min = this.options.min;
	this.max = this.options.max;
	this._createSlider();
}
/**
 * Premisteni jezdce na zadanou pozici
 * @param {int} px Pocet pixelu od kraje slideru pro pozici jezdce slideru
 **/
SZN.Slider.prototype.setOffset = function(px){
    var edgeLeft = this.options.mode == 'vertical' ? (this.main.offsetTop+this.options.height) : this.main.offsetLeft;
	var edgeRight = this.options.mode == 'vertical' ? (this.options.height-this.options.riderH) : (this.options.width-this.options.riderW);
	var pos = px;
	/*- krajni meze pro aktualni pozici -*/
	if (pos < 0){ pos = 0; }
	else if ( pos > edgeRight ){ pos = edgeRight; }
	/*- krajni meze pro jezdce -*/
	if(pos <= 0){
	    this.rider.style[this.riderAxis] = '0px';
	} else if(pos > 0 && pos < edgeRight){
	    this.rider.style[this.riderAxis] = pos+'px';
	} else if (pos >= edgeRight){
	    this.rider.style[this.riderAxis] = edgeRight+'px';
	}
	this.actualPos = pos;
	return pos;
}
/**
 * Vraci pocet pixelu od leveho ci spodniho kraje slideru
 **/
SZN.Slider.prototype.getOffset = function(){
	return this.actualPos;
}
/**
 * Metoda prevadejici pozici jezdce v px na hodnotu osy na ktere se prave jezdec slideru nachazi
 * vraci pri celociselnem rozmezi hodnost INT nebo float pri hodnotach s desetinym cislem
 * @param {int} px pocet pixelu predany metode pro vypocet hodnoty dle poctu pixelu
 * @return {float}
 **/
SZN.Slider.prototype.pxToValue = function(px){
	var position = arguments.length > 0 ? px : this.actualPos;
	var halfRider = this.options.mode == 'vertical' ? this.options.riderH : this.options.riderW;
    var axisSize = this.options.mode == 'vertical' ? this.options.height : this.options.width;
    var v1 = (axisSize-halfRider)/(this.max-this.min);
    var v2 = (this._round(position/v1, this.decimal))+this.min;
    return v2;
}
/**
 * Metoda prevadejici hodnotu osy na pozici jezdce v px
 * @param {int} value hodnota pro prepocitani na px
 * @return {int}
 **/
SZN.Slider.prototype.valueToPx = function(value){
	var halfRider = this.options.mode == 'vertical' ? this.options.riderH : this.options.riderW;
    var axisSize = this.options.mode == 'vertical' ? this.options.height : this.options.width;
    var v1 = (axisSize-halfRider)/(this.max-this.min);
    var v2 = v1*(value-this.min);
    return v2;
}
/**
 * Metoda nastavujici aktualni hodnotu a vytvarejici udalost change
 * @param {int} value nasetovani urcite hodnoty slideru
 **/
SZN.Slider.prototype.setValue = function(value){
	if(this.input){
	    this._isSliderNum(value);
	    value = this._round(value, this.decimal);
	    if(this.options.separator != '.' && this.decimal > 0){
	        var v1 = value.toString();
			var v2 = v1.replace(/\./,this.options.separator);
	        value = v2;
		}
	    this.input.value = value;
	}
	this.actualValue = this._enFormat(value);
	this.makeEvent('change');
}
/**
 * Metoda pro interface SZN pro posilani aktualni hodnoty pri vlasnich udalostech
 **/
SZN.Slider.prototype.getValue = function(){
	if(this.input){
	    return this.input.value;
	} else {
		return this.actualValue;
	}
}
/**
 * Zaokrouhlovani metoda na zadany pocet desetinych mist
 **/
SZN.Slider.prototype._round = function(value,decimal){
	var v1 = value*Math.pow(10,decimal);
	var v2 = (Math.round(v1))/Math.pow(10,decimal);
	return v2;
}
/**
 * Vygenerovani kostry slideru
 **/
SZN.Slider.prototype._createSlider = function(){
	this.main = SZN.cEl('div',this.options.mainSliderId,this.options.mainSliderClassName+' '+this.options.mode,{
	    width : this.options.width+'px',
	    height : this.options.height+'px',
	    position:'relative'
	});
	this.arrowsMover = SZN.cEl('a',this.options.arrowsMoverId,this.options.arrowsMoverClassName,{
		display : 'block',
		width : this.options.width+'px',
		height : this.options.height+'px',
		position : 'absolute',
		top : '0px',
		left : '0px',
		cursor : 'default'
	});
	this.arrowsMover.href = '#';
	this.rider = SZN.cEl('div',this.options.riderSliderId,this.options.riderSliderClassName,{
		position :'absolute',
		width : this.options.riderW+'px',
		height : this.options.riderH+'px'
	});
	this.rider.style[this.riderAxis] = '0px';
	this.rider.style.cursor = this.options.mode == 'vertical' ? 'n-resize' : 'w-resize';
	this.plus = SZN.cEl('div',this.options.plusId, this.options.plusClassName);
	this.minus = SZN.cEl('div',this.options.minusId,this.options.minusClassName);
	if(this.options.input != null){
     	var input = SZN.gEl(this.options.input);
	    if(SZN.gEl(this.options.input) != null){
	        this.input = input;
		} else {
		    input = SZN.cEl('input',this.options.input,this.options.input);
		    input.name = this.options.input;
		    input.type = 'text';
			this.input = input;
			this.rootElm.appendChild(this.input);
		}
		this.setValue(this.min);
	} else { this.input = null; }
	this.main.appendChild(this.arrowsMover);
	this.main.appendChild(this.rider);
	this.main.appendChild(this.plus);
	this.main.appendChild(this.minus);
	this.rootElm.appendChild(this.main);
	this._link();
}
/**
 * Chyceni mysi jezdce
 **/
SZN.Slider.prototype._catchRider = function(e,elm){
    SZN.Events.cancelDef(e);
	this.riderMoveAction = SZN.Events.addListener(document,'mousemove',this,'_riderMove',false);
	this.unCatchAction = SZN.Events.addListener(document,'mouseup',this,'_unCatchRider',false);
}
/**
 * Pohyb jezdce po ose
 * @param {object} e udalost pohybu jezdce
 * @param {object} element na ktery je udalost navazana
 **/
SZN.Slider.prototype._riderMove = function(e,elm){
	SZN.Events.cancelDef(e);
	if(this.options.step > 0){
	    var px = this._checkOffset(e);
	    var value = this.pxToValue(px);
	    var v1 = value-this.options.min;
	    var v2 = Math.round( v1/this.options.step )*this.options.step;
	    var v3 = v2+this.options.min;
	    this._valueToPx(v3, 'key');
	} else {
	    this._eventSetOffset(e);
	}
}
/**
 * Obsluzna metoda setOffsetu pro predavani px eventu pro nastaveni jezdce na ose slideru
 * @param {object} e udalost event
 **/
SZN.Slider.prototype._eventSetOffset = function(e){
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop;
    var position = this.options.mode == 'vertical' ? (e.clientY+scrolltop) : e.clientX;
	var edgeLeft = this.options.mode == 'vertical' ? (this.main.offsetTop+this.options.height) : this.main.offsetLeft;
	var edgeRight = this.options.mode == 'vertical' ? (this.options.height-this.options.riderH) : (this.options.width-this.options.riderW);
	var halfRider = this.options.mode == 'vertical' ? this.options.riderH/2 : this.options.riderW/2;
	var pos =  this.options.mode == 'vertical' ? ((position-edgeLeft)+halfRider)*-1 : (position-edgeLeft)-halfRider;
	this.setOffset(pos);
	this._pxToValue(this.actualPos);
}
/**
 * Metoda vracejici aktualni pozici jezdce pri skokovem posunu
 * @param {object} e event udalosti pro pohyb jezdce
 **/
SZN.Slider.prototype._checkOffset = function(e){
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop;
	var position = this.options.mode == 'vertical' ? e.clientY+scrolltop : e.clientX;
	var edgeLeft = this.options.mode == 'vertical' ? (this.main.offsetTop+this.options.height) : this.main.offsetLeft;
	var edgeRight = this.options.mode == 'vertical' ? (this.options.height-this.options.riderH) : (this.options.width-this.options.riderW);
	var halfRider = this.options.mode == 'vertical' ? this.options.riderH/2 : this.options.riderW/2;
	var pos =  this.options.mode == 'vertical' ? ((position-edgeLeft)+halfRider)*-1 : (position-edgeLeft)-halfRider;
	if (pos < 0){ pos = 0; }
	else if ( pos > edgeRight ){ pos = edgeRight; }
	return pos;
}
/**
 * Privatni metoda pro prevedeni px na hodnotu, ktera je pote nasetovana
 * @param {int} px predana hodnota v px pro prepocitani na aktualni hodnotu
 **/
SZN.Slider.prototype._pxToValue = function(px){
	var value = this.pxToValue(px);
	this.setValue(value);
}
/**
 * Privatni metoda pro volani prevodu hodnoty na px sirky osy slideru a nasledne nastaveni jezdce na tuto vzdalenost
 * @param {int} value predana hodnota pro prepocitani na px
 * @param {string} type semafor pro volani metody setValue kdyz nepiseme hodnotu primo do inputu
 **/
SZN.Slider.prototype._valueToPx = function(value,type){
	var px = this.valueToPx(value);
	this.setOffset(px);
    /*- podminka pro setovani hodnoty pri posouvani pomoci klaves -*/
    if(arguments[1] == 'key'){
        this.setValue(value);
	}
}
/**
 * Pusteni jezdce a odhlaseni navesenych udalosti
 **/
SZN.Slider.prototype._unCatchRider = function(e,elm){
	SZN.Events.removeListener(this.riderMoveAction);
	SZN.Events.removeListener(this.unCatchAction);
}
/**
 * Prevod cz formatu cisla do en formatu
 * @param {float} num predane cislo na prevod
 **/
SZN.Slider.prototype._enFormat = function(num){
    if(this.decimal > 0){
		var n1 = num.toString();
		var n2 = n1.replace(this.options.separator,'.');
		return parseFloat(n2);
	} else {
	    return parseInt(num);
	}
}
/**
 * Prevod en formatu cisla do cz formatu
 * @param {float} num predane cislo na prevod
 **/
SZN.Slider.prototype._czFormat = function(num){
	var n1 = num.toString();
	var n2 = n1.replace(/\./,',');
 	return n2;
}
/**
 * Psani do inputu
 * @param {object} e udalost event pro psani do inputu
 * @param {object} elm element inputu
 **/
SZN.Slider.prototype._typingInput = function(e,elm){
	var val = this.input.value;
	if(this._isSliderNum(val)){
		if(this.options.separator != '.' && this.decimal > 0){
			var v2 = this._enFormat(val);
		} else {
		    var v2 = val;
		}
		if(v2 >= this.min && v2 <= this.max){
		    this._valueToPx(v2);
		}
	}
}
/**
 * Metoda pro kontrolu spravnych hodnot pro input
 * @param {float} value hodnota pro kontrolu zda je spravne cislo slideru
 **/
SZN.Slider.prototype._isSliderNum = function(value){
 	if(this.options.separator != '.' && this.decimal > 0){
	    var val1 = value.toString();
	    var value1 = val1.replace(this.options.separator,'.');
		value = parseFloat(value1);
	}
	if(isNaN(value)){
	    if(this.input){ this.input.style.background = 'red'; }
	    return false;
	} else {
	    if(this.input){
		    if(value > this.options.max || value < this.options.min){
		        this.input.style.background = 'red';
			} else {
			    this.input.style.background = '#FFF';
			}
		}
	    return true;
	}
}
/**
 * Kliknuti na osu a presunuti jezdce
 * @param {object} e event udalost pro kliknuti na osu slideru
 * @param {object} elm element osy na kterem je navesena udalost na presunuti slideru
 **/
SZN.Slider.prototype._axisClick = function(e,elm){
	SZN.Events.cancelDef(e);
	if(this.options.step > 0){
	    var px = this._checkOffset(e);
	    var value = this.pxToValue(px);
	    var v1 = value-this.options.min;
	    var v2 = Math.round( v1/this.options.step )*this.options.step;
	    var v3 = v2+this.options.min;
	    this._valueToPx(v3, 'key');
	} else {
	    this._eventSetOffset(e);
	}
}
/**
 * Ovladani slideru pomoci klavesnice - reaguje na sipky, plus, minus, pageup, pagedown
 * @param {object} e event udalost pro zmacknuti sipky
 * @param {object} elm element na kterem je navesena udalost
 **/
SZN.Slider.prototype._arrowKey = function(e,elm){
	var edge = this.options.mode == 'vertical' ? this.options.height-this.options.riderH : this.options.width-this.options.riderW;
	switch(e.keyCode){
	    case 37 :
	        if(this.options.step > 0){
   				var value = (this.actualValue-(this.options.step/Math.pow(10,this.decimal)));
   			} else {
				var position = this.actualPos-1;
			}
			SZN.Events.cancelDef(e);
			break;
	    case 39 :
	        if(this.options.step > 0){
            	var value = (this.actualValue+(this.options.step/Math.pow(10,this.decimal)));
            } else {
                var position = this.actualPos+1;
			}
			SZN.Events.cancelDef(e);
			break;
	    case 38 :
	        if(this.options.step > 0){
				var value = (this.actualValue+(this.options.step/Math.pow(10,this.decimal)));
			} else {
			    var position = this.actualPos+1;
			}
			SZN.Events.cancelDef(e);
			break;
	    case 40 :
	        if(this.options.step > 0){
				var value = (this.actualValue-(this.options.step/Math.pow(10,this.decimal)));
			} else {
			    var position = this.actualPos-1;
			}
			SZN.Events.cancelDef(e);
			break;
	    case 107 :
	        if(this.options.step > 0){
				var value = (this.actualValue+(this.options.step/Math.pow(10,this.decimal)));
			} else {
				var position = this.actualPos+1;
			}
			SZN.Events.cancelDef(e);
			break;
	    case 109 :
	        if(this.options.step > 0){
				var value = (this.actualValue-(this.options.step/Math.pow(10,this.decimal)));
			} else {
			    var position = this.actualPos-1;
			}
			SZN.Events.cancelDef(e);
			break;
	    case 33 :
	        if(this.options.step > 0){
				var value = this.max;
			} else {
			    var position = edge;
			}
			SZN.Events.cancelDef(e);
			break;
	    case 34 :
	        if(this.options.step > 0){
				var value = this.min;
			} else {
			    var position = 0;
			}
			SZN.Events.cancelDef(e);
			break;
		default :
		    var value = this.actualValue;
		    break;
	}
	if(this.options.step > 0){
		if(value < this.min){ value = this.min; }
		if(value > this.max){ value = this.max; }
		this._valueToPx(value, 'key');
	} else {
	    if(position > edge){ position = edge; }
	    if(position < 0){ position = 0; }
	    this.actualPos = position;
	    this.setOffset(position);
	    this._pxToValue(this.actualPos);
	}
}
/**
 * Metoda pro sjednoceni navratovych hodnot kolecka mysi
 * @param {object} e event udalost predavana metode pri scrolovani koleckem mysi
 **/
SZN.Slider.prototype._mouseWheelDelta = function(e){
    if(e.wheelDelta){
        if(window.opera){
            delta = (e.wheelDelta/120);
        } else {
        	delta = e.wheelDelta/120;
        }
    } else if(e.detail) {
    	delta = -(e.detail/3);
    }
    return delta;
}
/**
 * Ovladani slideru pomoci kolecka mysi
 * @param {object} e udalost scrolovani koleckem mysi
 * @param {object} elm element na kterem je navesena udalost wheelscroll
 **/
SZN.Slider.prototype._wheelAction = function(e,elm){
	SZN.Events.cancelDef(e);
	var delta = this._mouseWheelDelta(e);
	pm = delta + 0;
	if(this.options.step > 0){
	    if(pm > 0){
			var value = this.actualValue+this.options.step;
		} else if (pm < 0){
		    var value = this.actualValue-this.options.step;
		}
		if(value < this.min){ value = this.min; }
		if(value > this.max){ value = this.max; }
		this._valueToPx(value, 'key');
	} else {
	    var position = this.actualPos+delta;
	    debug(position);
		var  edge = this.options.mode == 'vertical' ? this.options.height-this.options.riderH : this.options.width-this.options.riderW;
		if(position > edge){ position = edge; }
		if(position < 0){ position = 0; }
		this.actualPos = position;
		this.setOffset(position);
		this._pxToValue(this.actualPos);
	}
}
/**
 * Ovladani slideru pomoci klikani na plus
 * @param {object} e udalost pro klikani na element
 * @param {object} elm element s navesenou udalosti click
 **/
SZN.Slider.prototype._plus = function(e,elm){
	SZN.Events.cancelDef(e);
	if(this.options.step > 0){
		var value = this.actualValue+(this.options.step/Math.pow(10,this.decimal));
		if(value < this.min){ value = this.min; }
		if(value > this.max){ value = this.max; }
	    this._valueToPx(value, 'key');
    } else {
        var position = this.actualPos+1;
        var edge = this.options.mode == 'vertical' ? this.options.height-this.options.riderH : this.options.width-this.options.riderW;
        if(position > edge){ position = edge; }
        if(position < 0){ position = 0; }
        this.actualPos = position;
        this.setOffset(position);
        this._pxToValue(this.actualPos);
	}
}
/**
 * Ovladani slideru pomoci klikani na minus
 * @param {object} e event pro kliknuti na element minus
 * @param {object} elm element s navesenou udalosti click
 **/
SZN.Slider.prototype._minus = function(e,elm){
	SZN.Events.cancelDef(e);
	if(this.options.step > 0){
	    var value = this.actualValue-(this.options.step/Math.pow(10,this.decimal));
		if(value < this.min){ value = this.min; }
		if(value > this.max){ value = this.max; }
	    this._valueToPx(value, 'key');
    } else {
        var position = this.actualPos-1;
        var edge = this.options.mode == 'vertical' ? this.options.height-this.options.riderH : this.options.width-this.options.riderW;
        if(position > edge){ position = edge; }
		if(position < 0){ position = 0; }
		this.actualPos = position;
		this.setOffset(position);
		this._pxToValue(this.actualPos);
	}
}
/**
 * Naveseni udalosti na jednotlive prvky slideru
 **/
SZN.Slider.prototype._link = function(){
    if((SZN.Browser.client != 'ie') && (SZN.Browser.client != 'opera') && (SZN.Browser.client != 'safari')){
    	this.rollAction = SZN.Events.addListener(this.main,'DOMMouseScroll', this, "_wheelAction", false,true);
    } else {
        this.rollAction = SZN.Events.addListener(this.main,'mousewheel', this, "_wheelAction", false,true);
    }
	if(this.input != null){
		var keyUpAction = SZN.Events.addListener(this.input,'keyup',this,'_typingInput',false);
	}
	var catchAction = SZN.Events.addListener(this.rider,'mousedown',this,'_catchRider',false);
	var axisClick = SZN.Events.addListener(this.arrowsMover,'click',this,'_axisClick',false);
	var axisArrow = SZN.Events.addListener(this.arrowsMover,'keydown',this,'_arrowKey',false);
	var plusAction = SZN.Events.addListener(this.plus,'click',this,'_plus',false);
	var minusAction = SZN.Events.addListener(this.minus,'click',this,'_minus',false);
}