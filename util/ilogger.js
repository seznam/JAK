/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Logovací rozhraní pro zjednodušený přístup k loggeru
 * @group jak-utils
 */
JAK.ILogger = JAK.ClassMaker.makeInterface({
	NAME: "JAK.ILogger",
	VERSION: "1.0"
});

/**
 * @param {string} message Zpráva k zalogování
 * @param {int} [type] Typ zprávy (konstanta JAK.Logger.XYZ)
 */
JAK.ILogger.prototype.log = function(message, type) {
	return JAK.Logger.getInstance().log(message, this, type);
}
