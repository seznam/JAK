/**
 * @overview "MAKRA"
 * @version 2.0
 * @author jelc, zara
 */
 
   
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
