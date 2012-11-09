(function(){  

describe("Browser", function(){
    var browser, version;

	/**
	 * pomocne metody
	 */		 		
	
	function browserDetect() {
		if (document.all && !window.opera) {
			browser =  'ie';
		} else if (navigator.userAgent.match(/chrome/i)) {
			browser = "chrome";
		} else if (window.opera) {
			browser = 'opera';
		//} else if (navigator.userAgent.indexOf('Safari') != -1 || navigator.userAgent.indexOf('iPhone') != -1) {
		} else if (navigator.vendor != 'KDE' && document.childNodes && !document.all && !navigator.taintEnabled && !navigator.accentColorName) {
			browser = 'safari';
		} else if ((navigator.vendor == 'KDE') || (document.childNodes) && (!document.all) && (!navigator.taintEnabled))  {
			browser = 'konqueror';
		} else if (document.addEventListener) {
			browser = 'gecko';
		}
	}
	
	
	function _ieVersion() {
		if(!!window.Worker) {
			return '10';
		}
		try {
			window.getSelection();
			return '9';
		} catch(e) {
			var elm = document.createElement('div');
			elm.innerHTML = '<!' + '--[if IE 8]>x<![endif]-->';
			if (elm.innerHTML == "x") {
				return '8';
			} else if(typeof window.external.AddSearchProvider == 'unknown') {
				return '7';
			} else if(document.implementation.hasFeature != null) {
				return '6';
			} else if (document.implementation.hasFeature == null && document.namespaces != null){
				return '5.5';
			} else if (document.namespaces == null && document.getElementById ) {
				return '5';
			} else {
				return '4';
			}
		}
	}
	
	
	function versionDetect() {
		var ie  = false /*@cc_on || true @*/;
		if (ie) { 
			version = _ieVersion();
		} 
	    
	    
	    if (browser == 'opera') {
	    	version = window.opera.version();
		}
		
		if (browser == 'gecko') {
			version = (Array.every) ? '1.5' : version; //FF1.5+
			version = (window.Iterator) ? '2' : version; //FF2+
			version = (window.postMessage) ? '3' : version; //FF3+
			version = (window.JSON) ? '3.5' : version; //FF3.5+
			version = (document.readyState !== undefined) ? '3.6' : version; //FF3.6+
			version = (window.URL !== undefined) ? '4' : version; //FF4+
			version = ("MozAnimation" in document.createElement("div").style) ? '5' : version; //FF5++
			version = (window.MozWebSocket ? '6' : version); //FF6++
			version = (window.performance ? '7' : version); //FF7++
		}
		
		if (browser == 'konqueror') {
			var num = navigator.userAgent.indexOf('KHTML') + 6;
			var part = navigator.userAgent.substring(num);
			var end = part.indexOf(' ');
			version = part.substring(0,end - 2);
		}
		
		if (browser == "chrome") {
			var r = navigator.userAgent.match(/chrome\/([0-9]+)/i);
			version = r[1];
		}
		
		if (browser == 'safari') {
			if ("optimum" in JAK.mel("meter")) {
				version = 6;
			} else if (window.matchMedia) {
				version = 5.1;
			} else if (navigator.geolocation) {
				version = 5;
			} else if (document.getCSSCanvasContext) {
				version = 4;
			} else {
				version = 3;
			}
		}
	}
	
	/**
	 * pri spusteni testu
	 */		 		
	beforeEach(function () {
	   browser = 'oth';
	   version = '0';
	   browserDetect();
	   versionDetect();
	});
		
        
	it("should return right browser version and type. It tries to obtain this information in different way than JAK", function(){	
		/**
		 * testove metody, testujeme schopnost ziskat browser a jeho verzi, ve vetsine pripadu se snazime zjistit to jinak nez pouziva nase knihovna
		 */		 				
		expect(browser).toEqual(JAK.Browser.client);
        expect(version*1).toEqual(JAK.Browser.version*1);

    });	
});	

})();
