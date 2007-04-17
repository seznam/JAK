/* 	vytvoreni funkce ktera vola funkci ve svem argumentu "fnc" jako metodu 
	objektu z argumentu "obj", vraci takto modifikovanou funkci 
*/
SZN.bind = function(obj,fnc){
	var myObj = obj;
	var myFnc = fnc;
	var myArgs =[];
	/* 
		pridam si nepovinne argumenty do pole, s temito argumenty bude  
		volana zadana funkce
	*/
	for(var i = 0; i < arguments.length;i++){
		if(i > 1){
			myArgs[myArgs.length] = arguments[i];
		}
	}
	/* 	
		zde vytvorim funkci bude vracet predanou funkci jako metodu predaneho 
		objektu
	*/
	var newFnc = function(){
		var args = arguments;
		var mySelf = arguments.callee;
		var ar = [];
		/* vytvorim si pole argumentu se kterymi bude funkce zavolana */
		if (args.length > 0){
			for(var i = 0; i < args.length;i++){
				ar[i] = args[i];
			}
		}
		/* nastavim argumenty se kterymi se predana funkce zavola */
		ar = ar.concat(newFnc.myArgs);
		/* nastavim this v zavesene funkci */
		var self = mySelf.myObj;
		/* zavolam zavesovanou funkci */
		return mySelf.myFnc.apply(self,ar);
	};
	/* pridam dalsi argumenty se kterymi se zavola zavesena funkce */
	newFnc.myArgs = myArgs;
	/* nastavim si objekt jako jehoz metodu budu zavesenou funkci volat (bude this)*/
	newFnc.myObj = myObj;
	/* nastavim funkci metodu, kterou ve skutecnosti chci volat */
	newFnc.myFnc = myFnc;
	/* nechci zavesovanou funkci opetovne modifikovat pri dalsim zaveseni */
	newFnc.reSet = true;
	return newFnc;
};

/**
* id generator, vraci unikatni string,
*
*
*/
SZN.idGenerator = function(){
	this.idCnt = this.idCnt < 10000000 ? this.idCnt : 0;
	var ids = 'm' +  new Date().getTime().toString(16) +  'm' + this.idCnt.toString(16);
	this.idCnt++;
	return ids;	
};

/* MAKRA */
/* getElementById */

SZN.gEl = function(ids){
	return document.getElementById(ids);
};



/* vytvarim HTML uzel */
SZN.cEl = function(name){
	return document.createElement(name);
};

/* vytvarim textovy uzel */
SZN.cTxt = function(cont){
 	return document.createTextNode(cont);
};
