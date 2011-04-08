describe('ClassMaker Advanced Base', function(){
    JAK.Parent0 = JAK.ClassMaker.makeClass({
        NAME: "Parent0",
        VERSION: "1.1",
        CLASS: "class"
    });

    JAK.Parent0.prototype.$constructor = function(){
        //
    };


    JAK.Parent0.prototype.paramObj = {
        name : 'Petr',
        surname : 'Dolezal',
        sex : 'male',
        summ : {
            name : 'Petr',
            surname : 'Dolezal',
            sex : 'male'
        }
    };

    JAK.Parent0.prototype.getProp = function(name){
        if(name in this.paramObj){
            return this.paramObj[name];
        } else {
            return 'not found';
        }
    };

    JAK.Parent0.prototype.setProp = function(name,value){
        if(name in this.paramObj){
            this.paramObj[name] = value;
            return value;
        } else {
            return false;
        }
    };


    JAK.Parent1 = JAK.ClassMaker.makeClass({
        NAME : "Parent1",
        EXTEND : JAK.Parent0,
        VERSION: "1.1",
        CLASS: "class"
    });


    JAK.Parent1.prototype.$constructor = function(){
        //
    };


    JAK.Parent1.prototype.getSum = function(name){
        if(name in this.paramObj['summ']){
            return this.paramObj['summ'][name];
        } else {
            return 'not found';
        }
    };

    JAK.Parent1.prototype.setSum = function(name,value){
        if(name in this.paramObj['summ']){
            this.paramObj[name]['summ'] = value;
            return value;
        } else {
            return false;
        }
    };


    JAK.Parent2 = JAK.ClassMaker.makeClass({
        NAME : "Parent2",
        EXTEND : JAK.Parent1,
        VERSION: "1.1",
        CLASS: "class"
    });


    JAK.Parent2.prototype.$constructor = function(){
        //
    };

    JAK.Parent2.prototype.sayHello = function(){
        return 'Hello'
    };

    var obj_0 = null;
    var obj_1 = null;
    var obj_2 = null;
    var obj_3 = null;

    beforeEach(function(){
        obj_0 = new JAK.Parent0();
        obj_1 = new JAK.Parent1();
        obj_2 = new JAK.Parent1();
        obj_3 = new JAK.Parent2();
    });

    afterEach(function(){
        obj_0 = null;
        obj_1 = null;
        obj_2 = null;
        obj_3 = null;
    });


	describe('testing the class structure', function(){
        it('should properly inherit properties from parent', function(){
            // paramObj je dedena vlastnost do potomku se kopiruje
            expect(obj_0.paramObj).not.toBe(obj_1.paramObj);
            // paramObj je zdedena vlastnost v instancich teze tridy se odkazuje na stejny objekt
            expect(obj_1.paramObj).toBe(obj_2.paramObj);

            // v pocatecnim stavu je paramObj.name shodna u instance predka i potomka
            var a = obj_0.getProp('name');
            var b = obj_1.getProp('name');
            expect(a).toEqual(b);

            // zmenim vlastnost paramObj.name u potomka, instance predka se nezmeni
            // zmena se projevi pouze v instancich potomka
            var a = obj_0.getProp('name');
            obj_1.setProp('name','Karel');
            var b = obj_1.getProp('name');
            var c = obj_2.getProp('name');
            expect(a).not.toEqual(b);
            expect(c).toEqual('Karel');
        });

        it('should pass the instanceof test', function(){
            var a = (obj_0 instanceof JAK.Parent0);
            var b = (obj_1 instanceof JAK.Parent0) && (obj_1 instanceof JAK.Parent1);
            var c = (obj_3 instanceof JAK.Parent0) && (obj_3 instanceof JAK.Parent1) && (obj_3 instanceof JAK.Parent2);

            expect(a).toBe(true);
            expect(b).toBe(true);
            expect(c).toBe(true);
        });
    });
});