describe('ClassMaker depend tests', function(){

    // predek
    var ExtendClass = JAK.ClassMaker.makeClass({
        NAME:'ExtendClass',
        VERSION:'1.0',
        CLASS:'class'
    });

    ExtendClass.prototype.$constructor = function(){
        this.father = 'ExtendClass'
    }

    ExtendClass.prototype.getTitle = function(){
        return this.title;
    }


    // prvni rozhrani
    var InterfaceClass_0 = JAK.ClassMaker.makeClass({
        NAME:'InterfaceClass_0',
        VERSION:'1.0',
        CLASS:'class'
    });

    InterfaceClass_0.prototype.desc = 'xxx';
    InterfaceClass_0.prototype.getAttributes = function(){
        var out = {}
        for(var i in this){
            if((typeof this[i] == 'string') ||(typeof this[i] == 'number')){
                out[i] = this[i];
            }
        }
        return out;
    }
    // druhe rozhrani
    var InterfaceClass_1 = JAK.ClassMaker.makeClass({
        NAME:'InterfaceClass_1',
        VERSION:'1.0',
        CLASS:'class'
    });

    InterfaceClass_1.prototype.getNameAndTitle = function(){
        var out = this.name + ' ' + this.title;
        return out;
    }

    var MyClass = JAK.ClassMaker.makeClass({
        NAME:"RefClass",
        VERSION:"1.0",
        EXTEND : ExtendClass,
        IMPLEMENT:[InterfaceClass_0,InterfaceClass_1],
        CLASS : "class"
    });

    MyClass.prototype.$constructor = function(name,title){
        this.name = name;
        this.title = title;
    }

    MyClass.prototype.$destructor = function(){
        this.sConstructor.destroy(this);
    };

    MyClass.prototype.get = function(){
        return this.name;
    };

    var ref;
    var tst;
    var out = {
        title : 'refClass',
        name : 'RefClass',
        desc : 'xxx'
    };

    beforeEach(function(){
        tst = new MyClass('RefClass','refClass');
    });

    describe('extending tests', function(){
        // testuju dedeni vlastnosti z predka
        it('should get methods from parent',function(){
            var str = 'function';
            var prop = 'getTitle';
            expect((typeof tst[prop])).toEqual(str);
            expect(tst[prop]()).toEqual(tst.title);
        });

        // testuji dedeni vlastmosti z vice rozhrani
        it('should inherit methods from interfaces',function(){
            var str = 'RefClass refClass';
            for(var i in out){
                expect(out[i]).toEqual(tst.getAttributes()[i]);
            }
            expect(tst.getNameAndTitle()).toEqual(str);
        });
    });
});