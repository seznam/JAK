describe("Gettext", function(){
	JAK._.DICT = {
		menu: {
			file: {
				name: "soubory",
				operations: {
					open: "Otevtit",
					save: "Ulozit",
					saveAs: "Ulozit jako",
					close: "Zavrit"
				}
			}
		},
		messages: "probehlo %s krat...",
		messages2: "presny vysledek je %s nebo %s a mozna taky %s"
	}
	describe("Find translation", function(){
		it("should return key if the result is not string",function(){
			var key = "menu.file";
			var r = _(key);
			expect(r).toEqual(key);
		});
		it("should return key if the key doesn't exist",function(){
			var key = "menu.bradavice";
			var r = _(key);
			expect(r).toEqual(key);
		});
		it("should return translation if the key exist", function(){
			var key = "menu.file.operations.saveAs";
			var r = _(key);
			expect(r).toEqual("Ulozit jako");
		});
	});
	describe("Replace wildcard",function(){
		it("should return translation with undefined if arguments[1] doesn't exist",function(){
			var r = _("messages");
			expect(r).toEqual("probehlo undefined krat...");
		});
		it("should return translation with wildcard",function(){
			var r = _("messages",25);
			expect(r).toEqual("probehlo 25 krat...");
		});
		it("should return translation with more wildcard",function(){
			var r = _("messages2",1,2,3);
			expect(r).toEqual("presny vysledek je 1 nebo 2 a mozna taky 3");
		});
	});
});
