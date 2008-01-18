/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview deklarace "jmenného prostoru"
 * @version 1.0
 * @author jelc 
 */ 

/**
 * @namespace
 * @name SZN
 * @static {Object} SZN statický objekt, který se používá pro "zapouzdření"
 * 					všech definic a deklarací<br> v podmínce se nalezá pro
 * 					jistotu a pro to že může být definován ještě před svou
 * 					deklarací při použití slovníků a konfigurací   
*/
if(typeof SZN != 'object'){
	var SZN = {};
};

/**
 * vytvoření funkce, která vrací volání funkce ve svém argumentu "fnc" jako metody 
 * objektu z argumentu "obj" s předanými argumenty. Metodu používají další třídy v SZN (např. SZN.Components)
 * @static
 * @method 
 * @param {object} obj objekt v jehož oboru platnosti bude volán druhý argument
 * @param {function} fnc funkce která bude provedena v oboru platnosti prvního argumentu
 * @example var test = function(a,b){
 *		if(a > b) return true;
 *		else return false;  
 *  } 
 *  var obj = new Object();
 *  var pokus = SZN.bind(obj,test)
 *  alert(pokus(1,2))   
 * @return {function} volání takto vytvořené funkce
*/
SZN.bind = function(obj,fnc){
	return function() {
		return fnc.apply(obj,arguments);
	}
};

/**
 * generátor unikatních ID
 * @static
 * @method 
 * @return {string} unikátní ID
 */
SZN.idGenerator = function(){
	this.idCnt = this.idCnt < 10000000 ? this.idCnt : 0;
	var ids = 'm' +  new Date().getTime().toString(16) +  'm' + this.idCnt.toString(16);
	this.idCnt++;
	return ids;	
};
