/**
 * @overview deklarace "jmeneho prostoru"
 * @version 1.0
 * @author jelc 
 */ 

/**
 * @namespace
 * @static {Object} SZN staticky objekt, ktery se pouziva pro "zapouzdreni"
 * 					vsech definic a deklaraci<br> v podmince se naleza pro
 * 					jistotu a pro to ze muze byt definovan jeste pred svou
 * 					deklaraci pri pouziti slovniku a konfiguraci   
*/
if(typeof SZN != 'object'){
	var SZN = {};
};




