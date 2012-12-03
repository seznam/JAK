/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
* author: topa
*/
JAK.ServiceLocator = JAK.ClassMaker.makeStatic({
	NAME: "JAK.JAK.ServiceLocator",
	VERSION: "1.0"
});

/** Sluzby */
JAK.ServiceLocator._services = {};

/**
* Zaregistruje sluzbu pod jmenem.
*
* @param {string} name
* @param {object} service
**/
JAK.ServiceLocator.addService = function(name, service){
	if(!JAK.ServiceLocator.hasService(name)) JAK.ServiceLocator._services[name] = service;
	else throw new Error("!!! Service with name: " + name + " exist !!!!");
}

/**
* Je sluzba zaregistrovana pod jmenem ?
*
* @param {string} name
* @returns {bool}
**/
JAK.ServiceLocator.hasService = function(name){
	if(JAK.ServiceLocator._services[name] == undefined)	return false; 
	else return true;
}

/**
* Vrati registrovanou sluzbu pod jmenem.
*
* @param {string} name
* @returns {object}
**/
JAK.ServiceLocator.getService = function(name){
	if(!JAK.ServiceLocator.hasService(name)) throw new Error("!!! Service with name: " + name + " NOTexist !!!!");
	else return JAK.ServiceLocator._services[name];
}
