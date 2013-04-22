describe('ClassMaker extend tests', function(){
	it('should fail when we try to instantiate class "Trida", which extend "Test" which is defined later', function(){
		function tryCatch() {
			var SZN;
			try {
				SZN = {};

				SZN.Trida = JAK.ClassMaker.makeClass({
					NAME: 'SZN.Trida',
					VERSION: '1.0',
					EXTEND: SZN.Test
				});


				SZN.Trida.prototype.$constructor = function() {};

				SZN.Test = JAK.ClassMaker.makeClass({
					NAME: 'SZN.Test',
					VERSION: '1.0'
				});

				var t = new SZN.Trida();
				return true;
			} catch (e) {
				return false;
			}
		}

		expect(tryCatch()).toBe(false);
	});
			
	it('should be not possible to extend class which is not created by JAK', function() {
		function tryCatch() {
			var SZN = {};
			//nonSZN constructor
			SZN.Best = function() {this.a = 'test'; };
			//extending nonSZN constructor
			SZN.Rest = JAK.ClassMaker.makeClass({
				NAME: 'SZN.Rest',
				VERSION: '1.0',
				EXTEND: SZN.Best
			});
		}

		expect(tryCatch).toThrow();
	});

	it('should be not possible to extend non-object',function() {
		function tryCatch() {
			var X = JAK.ClassMaker.makeClass({
				NAME: 'X',
				VERSION: '1.0',
				EXTEND: "Y"
			});
		}

		expect(tryCatch).toThrow("Cannot extend non-function");
	});
});