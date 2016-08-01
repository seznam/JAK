/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Čtečka EXIF dat
 * @group jak-utils
 */
JAK.EXIF = JAK.ClassMaker.makeClass({
	NAME: "JAK.EXIF",
	VERSION: "1.1"
});

JAK.EXIF.NAMES = {
	0x0001: "InteropIndex",
	0x0002: "InteropVersion",
	0x0100: "ImageWidth",
	0x0101: "ImageHeight",
	0x0102: "BitsPerSample",
	0x0103: "Compression",
	0x0106: "PhotometricInterpretation",
	0x010E: "ImageDescription",
	0x010F: "Make",
	0x0110: "Model",
	0x0111: "StripOffsets",
	0x0112: "Orientation",
	0x0115: "SamplesPerPixel",
	0x0116: "RowsPerStrip",
	0x0117: "StripByteCounts",
	0x011C: "PlanarConfiguration",
	0x011A: "XResolution",
	0x011B: "YResolution",
	0x0128: "ResolutionUnit",
	0x012D: "TransferFunction",
	0x013E: "WhitePoint",
	0x013F: "PrimaryChromaticities",
	0x0131: "Software",
	0x0132: "DateTime",
	0x013B: "Artist",
	0x0201: "JPEGInterchangeFormat",
	0x0202: "JPEGInterchangeFormatLength",
	0x0211: "YCbCrCoefficients",
	0x0212: "YCbCrSubSampling",
	0x0213: "YCbCrPositioning",
	0x0214: "ReferenceBlackWhite",
	0x8298: "Copyright",

	0x8769: { /* EXIF IFD */
		0x829A: "ExposureTime",
		0x829D: "FNumber",
		0x8822: "ExposureProgram",
		0x8824: "SpectralSensitivity",
		0x8827: "ISOSpeedRatings",
		0x8828: "OECF",
		0x9000: "ExifVersion",
		0x9003: "DateTimeOriginal",
		0x9004: "DateTimeDigitized",
		0x9101: "ComponentsConfiguration",
		0x9102: "CompressedBitsPerPixel",
		0x9201: "ShutterSpeedValue",
		0x9202: "ApertureValue",
		0x9203: "BrightnessValue",
		0x9204: "ExposureBias",
		0x9205: "MaxApertureValue",
		0x9206: "SubjectDistance",
		0x9207: "MeteringMode",
		0x9208: "LightSource",
		0x9209: "Flash",
		0x920A: "FocalLength",
		0x9214: "SubjectArea",
		0x927C: "MakerNote",
		0x9286: "UserComment",
		0x9290: "SubsecTime",
		0x9291: "SubsecTimeOriginal",
		0x9292: "SubsecTimeDigitized",
		0xA000: "FlashpixVersion",
		0xA001: "ColorSpace",
		0xA002: "PixelXDimension",
		0xA003: "PixelYDimension",
		0xA004: "RelatedSoundFile",
		0xA20B: "FlashEnergy",
		0xA20C: "SpatialFrequencyResponse",
		0xA20E: "FocalPlaneXResolution",
		0xA20F: "FocalPlaneYResolution",
		0xA210: "FocalPlaneResolutionUnit",
		0xA214: "SubjectLocation",
		0xA215: "ExposureIndex",
		0xA217: "SensingMethod",
		0xA300: "FileSource",
		0xA301: "SceneType",
		0xA302: "CFAPattern",
		0xA401: "CustomRendered",
		0xA402: "ExposureMode",
		0xA403: "WhiteBalance",
		0xA404: "DigitalZoomRation",
		0xA405: "FocalLengthIn35mmFilm",
		0xA406: "SceneCaptureType",
		0xA407: "GainControl",
		0xA408: "Contrast",
		0xA409: "Saturation",
		0xA40A: "Sharpness",
		0xA40B: "DeviceSettingDescription",
		0xA40C: "SubjectDistanceRange",
		0xA420: "ImageUniqueID"
	},

	0x8825: { /* GPS IFD */
		0x0000: "GPSVersionID",
		0x0001: "GPSLatitudeRef",
		0x0002: "GPSLatitude",
		0x0003: "GPSLongitudeRef",
		0x0004: "GPSLongitude",
		0x0005: "GPSAltitudeRef",
		0x0006: "GPSAltitude",
		0x0007: "GPSTimeStamp",
		0x0008: "GPSSatellites",
		0x0009: "GPSStatus",
		0x000A: "GPSMeasureMode",
		0x000B: "GPSDOP",
		0x000C: "GPSSpeedRef",
		0x000D: "GPSSpeed",
		0x000E: "GPSTrackRef",
		0x000F: "GPSTrack",
		0x0010: "GPSImgDirectionRef",
		0x0011: "GPSImgDirection",
		0x0012: "GPSMapDatum",
		0x0013: "GPSDestLatitudeRef",
		0x0014: "GPSDestLatitude",
		0x0015: "GPSDestLongitudeRef",
		0x0016: "GPSDestLongitude",
		0x0017: "GPSDestBearingRef",
		0x0018: "GPSDestBearing",
		0x0019: "GPSDestDistanceRef",
		0x001A: "GPSDestDistance",
		0x001B: "GPSProcessingMethod",
		0x001C: "GPSAreaInformation",
		0x001D: "GPSDateStamp",
		0x001E: "GPSDifferential"
	}
};

JAK.EXIF.NAMES[0x8769][0xA005] = JAK.EXIF.NAMES; /* exif interopindex -> tiff ifd :) */

/**
 * @param {int[]} data Binární data (bajty)
 */
JAK.EXIF.prototype.$constructor = function(data) {
	this._data = data;
	this._tags = {};
	this._bigEndian = true;

	if (this._getValue(0) != 0xFF || this._getValue(1) != 0xD8) { throw new Error("Not a valid JPEG data"); }
	this._scan();
}

/**
 * Vrátí seznam přítomných tagů
 */
JAK.EXIF.prototype.getTags = function() {
	return this._tags;
}

JAK.EXIF.prototype._scan = function() {
	var offset = 2;
	var len = this._data.length;
	while (offset < len) {
		if (this._getValue(offset) != 0xFF) { throw new Error("Invalid marker ("+this._getValue(offset)+") at byte #"+offset); }

		var marker = this._getValue(offset+1);
		if (marker == 0xE1) { /* APP1 */
			this._readEXIF(offset+4, this._getValue(offset+2, 2)-2);
			return;
		} else if (marker == 0xDA) { /* Start-Of-Scan */
			offset += 2 + this._getValue(offset+2, 2); /* skip to SCAN data */
			while (offset < len) { /* jump through data, look for 0xFF + not-zero */
				if (this._getValue(offset) == 0xFF && this._getValue(offset+1) != 0) { break; } /* END marker */
				offset++;
			}
		} else {
			offset += 2 + this._getValue(offset+2, 2);
		}

	}
}

JAK.EXIF.prototype._readEXIF = function(start, length) {
	var str = "Exif";
	for (var i=0;i<str.length;i++) {
		if (this._getValue(start+i) != str.charCodeAt(i)) { throw new Error("Invalid EXIF section"); }
	}

	var tiffStart = start+6;
	var endianness = this._getValue(tiffStart, 2);
	if (endianness == 0x4949) {
		this._setBigEndian(false);
	} else if (endianness == 0x4D4D) {
		this._setBigEndian(true);
	} else {
		throw new Error("Invalid endianness "+endianness);
	}

	if (this._getValue(tiffStart+2, 2) != 0x002A) { throw new Error("Invalid TIFF data (not 0x002A)"); }

	var firstOffset = this._getValue(tiffStart+4, 4);
	if (firstOffset != 0x00000008) { throw new Error("Invalid TIFF data (IFD0 offset not 8)"); }
	this._readIFD(tiffStart+firstOffset, tiffStart, JAK.EXIF.NAMES);
}

JAK.EXIF.prototype._readIFD = function(ifdStart, tiffStart, names) {
	var ignore = [/*0x927C,*/ 0x9286, 0xC4A5]; /* ignorovat makernote, user comment, printim */

	var count = this._getValue(ifdStart, 2);
	for (var i=0;i<count;i++) {
		var tagStart = ifdStart + i*12 + 2;
		var tag = this._getValue(tagStart, 2);
		if (ignore.indexOf(tag) != -1) { continue; }

		var value = this._readTagValue(tagStart, tiffStart);
		if (value === null) { continue; } /* ignorovat nezname typy */

		if (tag in names) {
			if (typeof(names[tag]) == "object") {
				this._readIFD(tiffStart+value, tiffStart, names[tag])
				value = null;
			} else {
				tag = names[tag];
			}
		}

		if (value !== null) { this._tags[tag] = value; }
	}

	var nextOffset = this._getValue(ifdStart + 2 + count*12, 4);
	if (nextOffset) { this._readIFD(tiffStart + nextOffset, tiffStart, names); }
}

JAK.EXIF.prototype._readTagValue = function(tagStart, tiffStart) {
	var type = this._getValue(tagStart+2, 2);
	var count = this._getValue(tagStart+4, 4);
	var shortValueStart = tagStart+8; /* for values <= 4b */
	var longValueStart = this._getValue(shortValueStart, 4) + tiffStart; /* for values > 4b */

	switch (type) {
		case 1: /* byte, 8-bit unsigned int */
		case 7: /* undefined, 8-bit byte, value depending on field */
			if (count == 1) {
				return this._getValue(shortValueStart);
			} else {
				var data = [];
				var start = (count>4 ? longValueStart : shortValueStart);
				for (var i=0;i<count;i++) {
					var val = this._getValue(start+i);
					data.push(val);
				}
				return data;
			}
		break;

		case 2: /* ascii, 8-bit byte */
			var data = [];
			var start = (count>4 ? longValueStart : shortValueStart);
			for (var i=0;i<count-1;i++) {
				var code = this._getValue(start + i);
				data.push(String.fromCharCode(code));
			}
			return data.join("");
		break;

		case 3: /* short, 16 bit int */
			if (count == 1) {
				return this._getValue(shortValueStart, 2);
			} else {
				var data = [];
				var start = (count>2 ? longValueStart : shortValueStart);
				for (var i=0;i<count;i++) {
					data.push(this._getValue(start + 2*i, 2));
				}
				return data;
			}
		break;

		case 4: /* long, 32 bit int */
			if (count == 1) {
				return this._getValue(shortValueStart, 4);
			} else {
				var data = [];
				for (var i=0;i<count;i++) {
					data.push(this._getValue(longValueStart + 4*i, 4));
				}
				return data;
			}
		break;

		case 5:	/* rational = two long values */
			if (count == 1) {
				var a = this._getValue(longValueStart, 4);
				var b = this._getValue(longValueStart+4, 4);
				return a/b;
			} else {
				var data = [];
				for (var i=0;i<count;i++) {
					var a = this._getValue(longValueStart + 8*i, 4);
					var b = this._getValue(longValueStart + 4 + 8*i, 4);
					data.push(a/b);
				}
				return data;
			}
		break;

		case 9: /* signed long, 32 bit signed int */
			if (count == 1) {
				return this._getValue(shortValueStart, 4);
			} else {
				var data = [];
				for (var i=0;i<count;i++) {
					data.push(this._getValue(longValueStart + 4*i, 4));
				}
				return data;
			}
		break;

		case 10: /* signed rational, two signed longs */
			if (count == 1) {
				var a = this._getValue(longValueStart, 4);
				var b = this._getValue(longValueStart+4, 4);
				return a/b;
			} else {
				var data = [];
				for (var i=0;i<count;i++) {
					var a = this._getValue(longValueStart + 8*i, 4);
					var b = this._getValue(longValueStart + 4 + 8*i, 4);
					data.push(a/b);
				}
				return data;
			}
		break;

		default:
			return null;
		break;
	}
}

JAK.EXIF.prototype._setBigEndian = function(bigEndian) {
	this._bigEndian = bigEndian;
}

JAK.EXIF.prototype._getValue = function(index, length) {
	var len = length || 1;
	var result = 0;

	for (var i=0;i<len;i++) {
		var offset = (this._bigEndian ? len-1-i : i);
		result += this._data[index+offset] * Math.pow(2, 8*i);
	}
	return result;
}
