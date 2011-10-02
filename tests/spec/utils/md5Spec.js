describe('MD5', function(){
	it('should compute md5 hash of string', function() {
		var hash = JAK.MD5.get("abc");
		expect(hash).toEqual("900150983cd24fb0d6963f7d28e17f72");

		var hash = JAK.MD5.get("řížek");
		expect(hash).toEqual("b45837eba04a6d84e6b5c4b50971801b");
	});
});