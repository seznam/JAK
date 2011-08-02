/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Třída provádí operace s objekty jako je jejich porovnávaní a serializace a deserializace. Obsolete!
 * @group jak
 */    
JAK.ObjLib = JAK.ClassMaker.makeClass({
	NAME: "ObjLib",
	VERSION: "3.1"
});

JAK.ObjLib.prototype.reSetOptions = function() {
}

JAK.ObjLib.prototype.pretty = function(str) {
	return str;
}

JAK.ObjLib.prototype.serialize = function(objToSource) {
	return JSON.stringify(objToSource);
};

JAK.ObjLib.prototype.unserialize = function(serializedString) {
	return JSON.parse(serializedString);
}

JAK.ObjLib.prototype.match = function(refObj, matchObj){
	return (JSON.stringify(refObj) == JSON.stringify(matchObj));
};

JAK.ObjLib.prototype.copy = function(objToCopy) {
	return JSON.parse(JSON.stringify(objToCopy));
};

JAK.ObjLib.prototype.arrayCopy = function(arrayToCopy) {
	return this.copy(arrayToCopy);
};
