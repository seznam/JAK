describe('ClassMaker call super method tests', function(){
			// root (pradedecek)
    var Root_ExtendClass = JAK.ClassMaker.makeClass({
        NAME:'Root_ExtendClass',
        VERSION:'1.0',
        CLASS:'class'
    });

    Root_ExtendClass.prototype.$constructor = function(){
        this.greatGrandFather  = 'Root_ExtendClass'
    }
    // -->

    // predek predka (dedecek)
    var Pre_ExtendClass = JAK.ClassMaker.makeClass({
        NAME:'Pre_ExtendClass',
        VERSION:'1.0',
        EXTEND:Root_ExtendClass,
        CLASS:'class'
    });

    Pre_ExtendClass.prototype.$constructor = function(){
        this.$super();
        this.grandFather = 'Pre_ExtendClass'
    };

    Pre_ExtendClass.prototype.methodWithParams = function(a,b){
        return a + b;
    };

    // -->


    // predek (primy)
    var ExtendClass = JAK.ClassMaker.makeClass({
        NAME:'ExtendClass',
        VERSION:'1.0',
        EXTEND:Pre_ExtendClass,
        CLASS:'class'
    });

    ExtendClass.prototype.$constructor = function(){
        this.$super();
        this.father = 'ExtendClass'
    };

    ExtendClass.prototype.getTitle = function(){
        return this.title;
    };

    ExtendClass.prototype.tmpMethod = function(){
        return true;
    };

    // -->

    // prvni rozhrani
    var InterfaceClass_0 = JAK.ClassMaker.makeClass({
        NAME:'InterfaceClass_0',
        VERSION:'1.0',
        CLASS:'class'
    });

    InterfaceClass_0.prototype.desc = 'xxx';
    InterfaceClass_0.prototype.getAttributes = function(){
        var out = {};
        for(var i in this){
            if((typeof this[i] == 'string') ||(typeof this[i] == 'number')){
                out[i] = this[i];
            }
        }
        return out;
    };
    // -->

    // druhe rozhrani
    var InterfaceClass_1 = JAK.ClassMaker.makeClass({
        NAME:'InterfaceClass_1',
        VERSION:'1.0',
        CLASS:'class'
    });

    InterfaceClass_1.prototype.getNameAndTitle = function(){
        var out = this.name + ' ' + this.title;
        return out;
    };
    // -->

    // trida
    var MyClass = JAK.ClassMaker.makeClass({
        NAME:"RefClass",
        VERSION:"1.0",
        DEPEND:[{
            sClass:ExtendClass,
            ver:'1.0'
        }],
        EXTEND : ExtendClass,
        IMPLEMENT:[InterfaceClass_0,InterfaceClass_1],
        CLASS : "class"
    });

    MyClass.prototype.$constructor = function(name, title) {
        this.$super();
        this.name = name;
        this.title = title;
    };

    MyClass.prototype.$destructor = function(){
        this.sConstructor.destroy(this);
    };

    MyClass.prototype.get = function(){
        return this.name;
    };

    MyClass.prototype.tmpMethod = function() {
        return this.$super();
    };

    MyClass.prototype.obriBroskev = function() {
        return this.$super();
    };

    MyClass.prototype.methodWithParams = function(a, b) {
        return this.$super(a, b);
    };

    MyClass.prototype.superCalling = function(){
        var out = false;
        try{
            out = this.$super();
        } catch(e){
            ;//empty
        } finally {
            return out;
        }
    };

    // -->

    var ref;
    var tst;
    var out = {
        title : 'refClass',
        name : 'RefClass',
        desc : 'xxx',
        father : 'ExtendClass',
        grandFather :'Pre_ExtendClass',
        greatGrandFather:'Root_ExtendClass'
    };


    beforeEach(function(){
        tst = new MyClass('RefClass','refClass');
    });


    describe('implementing more interfaces', function(){
        // testuji dedeni vlastmosti z vice rozhrani
        it('should implement more interfaces',function(){
            var str = 'RefClass refClass';
            for(var i in out){
                expect(out[i]).toEqual(tst.getAttributes()[i]);
            }
            expect(tst.getNameAndTitle()).toEqual(str);
        });
    });

	describe('testing dependencies', function(){
        // test zkousky zavislosti
        it('should create instance from our prepared class',function(){
            try {
                var out = new MyClass('a','b');
            } catch (e){
                expect(true).toBeFalsy();
                //TODO: test na vyhozeni vyjimky
            } finally{
                expect((out instanceof MyClass)).toBe(true);
            }
        });

        it('should not create instance from invalid class', function(){
            expect(function(){

                var Xxx = JAK.ClassMaker.makeClass({
                    NAME:'Xxx',
                    VERSION:'1.0',
                    DEPEND:[{
                        sClass:MyClass,
                        ver:'2.0'
                    }],
                    EXTEND:MyClass,
                    CLASS:'class'
                });
            }).toThrow("Dependency error in class Xxx (Version conflict in RefClass)");
        });
    });

	describe('super call', function(){
        // test selhani volani metody predka
        it('should call parent methods only if they are declared in parent chain',function(){

            function tryCatch() {
                try {
                    tst.obriBroskev();
                    return true;
                } catch (e) {
                    return false;
                }
            };

            expect(tryCatch()).toEqual(false);
            expect(tst.tmpMethod()).toEqual(true);
        });


        // test volani metody predka s argumenty
        it('should call parent method with arguments',function(){
            var obj = new MyClass('a','b');
            expect(obj.methodWithParams(2,3)).toEqual(5);
            expect(obj.methodWithParams('2',3)).toEqual('23');
        });
			
    });
});