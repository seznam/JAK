/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
* author: topa
*/
ServiceLocator = JAK.ClassMaker.makeStatic({
	NAME: "JAK.ServiceLocator",
	VERSION: "1.0"
});

/** Sluzby */
ServiceLocator._services = {};

/**
* Zaregistruje sluzbu pod jmenem.
*
* @param {string} name
* @param {object} service
**/
ServiceLocator.addService = function(name, service){
	if(!ServiceLocator.hasService(name)) ServiceLocator._services[name] = service;
	else throw new Error("!!! Service with name: " + name + " exist !!!!");
}

/**
* Je sluzba zaregistrovana pod jmenem ?
*
* @param {string} name
* @returns {bool}
**/
ServiceLocator.hasService = function(name){
	if(ServiceLocator._services[name] == undefined)	return false; 
	else return true;
}

/**
* Vrati registrovanou sluzbu pod jmenem.
*
* @param {string} name
* @returns {object}
**/
ServiceLocator.getService = function(name){
	if(!ServiceLocator.hasService(name)) throw new Error("!!! Service with name: " + name + " NOTexist !!!!");
	else return ServiceLocator._services[name];
}
