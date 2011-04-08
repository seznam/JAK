describe('ClassMaker static', function(){


    var staticParams = {
        NAME:"Singleton",
        VERSION:"1.0"
    };
    var Static = JAK.ClassMaker.makeStatic(staticParams);


    Static.getName = function(){
        return this.NAME;
    };

    Static.getVersion = function(){
        return this.VERSION;
    };

    describe('testing obtaining static attributes', function(){
			it('should return NAME attribute',function(){
				expect(Static.getName()).toEqual(staticParams.NAME);
			});
			
			it('should return VERSION attribute',function(){
				expect(Static.getVersion()).toEqual(staticParams.VERSION);
			});
    });
});
