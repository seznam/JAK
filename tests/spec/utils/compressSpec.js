describe('Compress', function(){
  function createTestData(min, max) {
  	var arr = [];
  	for (var i=min;i<max;i++) { arr.push(String.fromCharCode(i)); }
  
  	var result = "";
  	for (var i=0;i<3;i++) { result += arr.join(""); }
  	return result;
  }
  
  describe('UNICODE', function() {
  	var s = "ahojš";
  	var b = JAK.Compress.stringToArray(s, JAK.Compress.UNICODE);
  	var s2 = JAK.Compress.arrayToString(b, JAK.Compress.UNICODE);
  	
  	it('should convert string -> array unicode codepoints', function(){
       expect(b.join(",")).toEqual("97,104,111,106,353");
    });
    
  	it('should covert array unicode codepoints -> string', function(){
      expect(s).toEqual(s2);
    });
  });
  
  describe('UTF8', function() {
  	var s = "žšč";
  	var b = JAK.Compress.stringToArray(s, JAK.Compress.UTF8);
  	var s2 = JAK.Compress.arrayToString(b, JAK.Compress.UTF8);
  	it('should convert string -> array ot utf8 baits -> string', function(){
        expect(s).toEqual(s2);
    });
    
    it('should return 6 bytes', function(){
        expect(b.length).toEqual(6);
    });
  	
  });
  
  describe('BASE64', function() {
  	var b64 = "YWhvag==";
  	var b = JAK.Compress.stringToArray(b64, JAK.Compress.BASE64);
  	var s = JAK.Compress.arrayToString(b, JAK.Compress.UNICODE);
  	var s2 = JAK.Compress.arrayToString(b, JAK.Compress.BASE64);
  	
    it ('should decode string "ahoj"', function() {
        expect(s).toEqual("ahoj");
    });
  	
  	it('should encode string back to get same value', function(){
        expect(s2).toEqual(b64);
  	});
  });
  
  describe('MTF', function() {
  	it("MTF", function(){
        var data = createTestData(0, 256);
    	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    	var mtf = JAK.Compress.MTF(bytes);
    	var imtf = JAK.Compress.iMTF(mtf);
    	var result = JAK.Compress.arrayToString(imtf, JAK.Compress.UTF8); 
        
        expect(data).toEqual(result);
  	});
  	
  	it('MFT in place', function(){
    	var data = createTestData(0, 256);
    	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    	JAK.Compress.MTF(bytes, {inPlace:true});
    	JAK.Compress.iMTF(bytes, {inPlace:true});
    	var result = JAK.Compress.arrayToString(bytes, JAK.Compress.UTF8);
    	
        expect(data).toEqual(result);
    });
  });
  
  describe('BWT', function() {
  	var data = createTestData(0, 256);
  	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
  	
  	it('must fail if mark is present', function(){
        var fn = function() {
    		JAK.Compress.BWT(bytes);
    	}
    	expect(fn).toThrow('Marker detected in input');
    });
    
    it('should compress given 256 marks', function() {
    	var data = createTestData(1, 256);
    	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    	var bwt = JAK.Compress.BWT(bytes);
    	var ibwt = JAK.Compress.iBWT(bwt);
    	var result = JAK.Compress.arrayToString(ibwt, JAK.Compress.UTF8);
    	
        expect(data).toEqual(result);
  	});
  	
  	it('should compress given 255 marks', function(){
    	var data = createTestData(0, 255);
    	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    	var bwt = JAK.Compress.BWT(bytes, {mark:255});
    	var ibwt = JAK.Compress.iBWT(bwt, {mark:255});
    	var result = JAK.Compress.arrayToString(ibwt, JAK.Compress.UTF8);
    	
        expect(data).toEqual(result);
  	});
  });
  
  describe('RLE', function() {
    var data = createTestData(0, 256);
    var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    var rle = JAK.Compress.RLE(bytes);
    var irle = JAK.Compress.iRLE(rle);
    var result = JAK.Compress.arrayToString(irle, JAK.Compress.UTF8);
  	
  	it('should decompress compressed data and return same data', function(){
        expect(data).toEqual(result);
    });
  });
  
  describe('LZW', function() {
  	it('should compress/decompress string with LZW', function() {
        var data = createTestData(0, 256);
    	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    	var lzw = JAK.Compress.LZW(bytes);
    	var ilzw = JAK.Compress.iLZW(lzw);
    	var result = JAK.Compress.arrayToString(ilzw, JAK.Compress.UTF8);
    	
        expect(data).toEqual(result);
    });
  	
  	it('should compress/decompress string with LZW with fixed-width output', function(){
    	var data = createTestData(0, 256);
    	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    	var lzw = JAK.Compress.LZW(bytes, {fixedWidth:true});
    	var ilzw = JAK.Compress.iLZW(lzw, {fixedWidth:true});
    	var result = JAK.Compress.arrayToString(ilzw, JAK.Compress.UTF8);
    	
        expect(data).toEqual(result);
  	});
  	
  	it ('should compress/decompress string with LZW with 8bit output', function(){
    	var data = createTestData(0, 256);
    	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    	var lzw = JAK.Compress.LZW(bytes, {maxBits:8});
    	var ilzw = JAK.Compress.iLZW(lzw, {maxBits:8});
    	var result = JAK.Compress.arrayToString(ilzw, JAK.Compress.UTF8);
    	
        expect(bytes.length).toEqual(lzw.length);
        expect(data).toEqual(result);
  	});
  
    it('should compress/decompress string with LZW with 12bit output', function(){
    	var data = createTestData(0, 256);
    	var bytes = JAK.Compress.stringToArray(data, JAK.Compress.UTF8);
    	var lzw = JAK.Compress.LZW(bytes, {maxBits:12});
    	var ilzw = JAK.Compress.iLZW(lzw, {maxBits:12});
    	var result = JAK.Compress.arrayToString(ilzw, JAK.Compress.UTF8);
    	
        expect(data).toEqual(result);
  	});
  });
  
});