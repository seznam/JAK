/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview kalendar
 * @version 2.0
 * @author zara
*/   

/**
 * CalendarSetup, pro pokrocilou praci s kalendarem - hlavne prace s vice policky. 
 * 
 * Pokud je potreba jine rozlozeni casu do dalsich policek, nebo celkove jine rozlozeni, 
 * je nutne upravit metodu manage a v ni slozeni data z techto inputu do data, ktere 
 * bude zobrazeno v kalendari (dateString).
 * @group jak-widgets
 * @static
 * @example
 * Pro inicializaci 1,2,3 polickove konstelace lze pouzit:
 * JAK.Calendar.Setup.setup(false, "[vybrat datum]", {pickTime: true, defaultFormat:["j.n.Y", "H:i"]}, ["calendar_value","calendar_time_value"]);
 * JAK.Calendar.Setup.setup(false, "[vybrat datum]", {pickTime: true, defaultFormat:["j.n.Y", "H","i"]}, ["cdate","chour","cmin"]);
 * JAK.Calendar.Setup.setup(false, "[vybrat datum]", {pickTime: false, defaultFormat:["j.n.Y"]}, ["fulldate"]);
 */
JAK.Calendar.Setup = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Calendar.Setup",
	VERSION: "1.0"
});

JAK.Calendar.Setup.manage = function(calendar, clickElm, targetElm) { /* setup calendar for two elements */
		var callback = function() {
			for (var i = 0; i < targetElm.length; i++) {
				JAK.gel(targetElm[i]).value = arguments[i] ? arguments[i] : ''; 
			}
		}
		var click = function(e,elm) { 
			var pos = JAK.DOM.getBoxPosition(clickElm);
			var x = pos.left;
			var y = pos.top + clickElm.offsetHeight + 1;
			var dateString = '';
			if (targetElm.length == 2) {
				dateString += JAK.gel(targetElm[0]).value+' '+JAK.gel(targetElm[1]).value;
			} else if (targetElm.length == 3) {
				dateString += JAK.gel(targetElm[0]).value+' '+JAK.gel(targetElm[1]).value+':'+JAK.gel(targetElm[2]).value;
			} else {
				dateString += JAK.gel(targetElm[0]).value;
			}
			
			
			calendar.pick(x,y,dateString,callback); 
		}
		calendar.ec.push(JAK.Events.addListener(clickElm,"click",window,click,false,true));
	}
	
	
	/**
	 * vytvareni odkazoveho buttonku
	 */				 				
	JAK.Calendar.Setup.createButton = function(inputs, label, imageUrl) {
		if (!inputs instanceof Array) {
			inputs = [inputs];
		}
	
		click = JAK.Calendar._createButton(imageUrl, label);
		var lastInput = JAK.gel(inputs[inputs.length-1]); 
		lastInput.parentNode.insertBefore(click,lastInput.nextSibling);
		
		return click;
	}
	
	JAK.Calendar.Setup.setup = function(imageUrl, label, optObj, inputs) {
		var cal = new JAK.Calendar(optObj);
		var click = JAK.Calendar.Setup.createButton(inputs, label, imageUrl);
		JAK.Calendar.Setup.manage(cal, click, inputs);
	}
			
			
				
