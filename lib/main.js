/**
 * @overview deklarace "jmenneho prostoru"
 * @version 1.0
 * @author jelc 
 */ 

/**
 * @namespace
 * @name SZN
 * @static {Object} SZN staticky objekt, ktery se pouziva pro "zapouzdreni"
 * 					vsech definic a deklaraci<br> v podmince se naleza pro
 * 					jistotu a pro to ze muze byt definovan jeste pred svou
 * 					deklaraci pri pouziti slovniku a konfiguraci   
*/
if(typeof SZN != 'object'){
	var SZN = {};
};

/**
 * @static
 * @method 	vytvoreni funkce ktera vola funkci ve svem argumentu "fnc" jako metodu 
 * objektu z argumentu "obj" a vraci takto modifikovanou funkci.
 * <br> Zavisi na ni nektere dalsi knihovni tridy
 * 
*/
SZN.bind = function(obj,fnc){
	return function() {
		return fnc.apply(obj,arguments);
	}
};

/**
* @static
* @method generator unikatnich ID
*/
SZN.idGenerator = function(){
	this.idCnt = this.idCnt < 10000000 ? this.idCnt : 0;
	var ids = 'm' +  new Date().getTime().toString(16) +  'm' + this.idCnt.toString(16);
	this.idCnt++;
	return ids;	
};
