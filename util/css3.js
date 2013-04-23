/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Statická třída pro praci s CSS vendor prefixy
 * @version 1.0
 * @author zara
 */
 
JAK.CSS3 = JAK.ClassMaker.makeStatic({
	NAME: "JAK.CSS3",
	VERSION: "1.0"
});

JAK.CSS3._node = JAK.mel("div"); 
JAK.CSS3.PREFIXES = ["", "ms", "Webkit", "O", "Moz"];

/** 
 * Vrací CSS vlastnost doplněnou o prefix (je-li potřeba), nebo null
 * @param {string} property CSS vlastnost
 * @returns {string | null } CSS vlastnost, nebo null jestliže neexistuje
 */
JAK.CSS3.getProperty = function(property) {
﻿  ﻿  var prefix = this.getPrefix(this._normalize(property));
﻿  ﻿  if (prefix === null) { return null; }
﻿  ﻿  return (prefix ? "-" + prefix.toLowerCase() + "-" : "") + property;
}

/**
 * Nastaví předanému uzlu CSS vlastnost 
 * @param {object} node HTML uzel, kterému chceme nastavit CSS vlastnost
 * @param {string} prop název CSS vlastnosti, kterou chceme nastavit
 * @param {string} value hodnota CSS vlastnosti, kterou nastavujeme
 * @returns {boolean} true v případě že takovou vlastnost nastavit lze, false v opačném případě
 */
JAK.CSS3.set = function(node, prop, value) {
﻿  ﻿  prop = this._normalize(prop);
﻿  ﻿  var prefix = this.getPrefix(prop);
﻿  ﻿  if (prefix === null) { return false; }
﻿  ﻿  var p = (prefix ? prefix + prop.charAt(0).toUpperCase() + prop.substring(1) : prop);
﻿  ﻿  node.style[p] = value;
﻿  ﻿  return true;
}

/**
 * Vrací patřičný prefix pro CSS vlastnost, je-li potřeba, nebo null pokud
 * vlastnost neexistuje
 * @param {string} property CSS vlastnost
 * @returns {string | null} CSS vlastnost doplněná o prefix, je-li potřeba nebo null
 */
JAK.CSS3.getPrefix = function(property) {
﻿  ﻿  for (var i=0;i<this.PREFIXES.length;i++) {
﻿  ﻿  ﻿  var p = this.PREFIXES[i];
﻿  ﻿  ﻿  var prop = (p ? p + property.charAt(0).toUpperCase() + property.substring(1) : property);
﻿  ﻿  ﻿  if (prop in this._node.style) { return p; }
﻿  ﻿  }
﻿  ﻿  return null;
}

/**
 * Převede název CSS vlastnosti na javascriptový zápis
 * @param {string} property název CSS vlastnosti ("border-bottom-colors")
 * @returns {string} javascriptový název vlastnosti ("borderBottomColors")
 */
JAK.CSS3._normalize = function(property) {
﻿  ﻿  return property.replace(/-([a-z])/g, function(match, letter) { return letter.toUpperCase(); });
}
