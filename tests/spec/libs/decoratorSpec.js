describe("Decorator", function(){		
	var ClassA = JAK.ClassMaker.makeClass({
		CLASS: "class",
		NAME: "ClassA",
		VERSION: "1.0"
	});
	
	ClassA.prototype.$constructor = function() {
		this.pole = [];
	}
	
	ClassA.prototype.pridaniDoPole = function() {
		this.pole.push("a");
	}
	
	var ClassB = JAK.ClassMaker.makeClass({
		CLASS: "class",
		NAME: "ClassB",
		VERSION: "1.0",
		EXTEND: ClassA,
		IMPLEMENT: JAK.IDecorable
	});
	
	ClassB.prototype.pridaniDoPole = function() {
		this.$super();
		this.pole.push("b");
	}
	
	ClassB.prototype.staraMetoda = function() {
		return 777;
	}
	
	var D1 = JAK.ClassMaker.makeSingleton({
		NAME: "D1",
		VERSION: "1.0",
		EXTEND: JAK.AbstractDecorator
	});
	
	D1.prototype.decorate = function(instance) {
		this.$super(instance);
		instance.pridaniDoPole = this.pridaniDoPole;
		instance.novaMetoda = this.novaMetoda;
	}
	
	D1.prototype.pridaniDoPole = function() {
		this.$super();
		this.pole.push("d1");
	}
	
	D1.prototype.novaMetoda = function() {
		return 3;
	}
	
	var D2 = JAK.ClassMaker.makeSingleton({
		NAME: "D2",
		VERSION: "1.0",
		EXTEND: JAK.AbstractDecorator
	});
	
	D2.prototype.decorate = function(instance) {
		this.$super(instance);
		instance.pridaniDoPole = this.pridaniDoPole;
		instance.staraMetoda = this.staraMetoda;
	}
	
	D2.prototype.staraMetoda = function() {
		return 2*this.$super();
	}

	D2.prototype.pridaniDoPole = function() {
		this.$super();
		this.pole.push("d2");
	}

	var D3 = JAK.ClassMaker.makeSingleton({
		NAME: "D3",
		VERSION: "1.0",
		EXTEND: JAK.AbstractDecorator
	});
	
	D3.prototype.decorate = function(instance) {
		this.$super(instance);
		instance.pridaniDoPole = this.pridaniDoPole;
		instance.novaMetoda = this.novaMetoda;
	}
	
	D3.prototype.pridaniDoPole = function() {
		this.$super();
		this.pole.push("d3");
	}
	
	D3.prototype.novaMetoda = function() {
		return this.$super() + 5;
	}
	
	var AD = JAK.ClassMaker.makeSingleton({
		CLASS: "singleton",
		NAME: "AD",
		VERSION: "1.0",
		EXTEND: JAK.AutoDecorator
	});
	
	AD.prototype.staraMetoda = function() {
		return this.$super()-1;
	}

	AD.prototype.novaMetoda = function() {
	}

      beforeEach(function() {
          var instance = null;
      });

	describe("test decorators", function() {
        it("should decorate instance with decorators D1, D2 and D3", function(){  			
    		instance = new ClassB();
    		instance.decorate(D1);
    		instance.decorate(D2);
    		instance.decorate(D3);
    		instance.pridaniDoPole();
    		expect("abd1d2d3").toEqual(instance.pole.join(""));
		});
        it("should decorate instance with decorators D1 and D3", function(){
    		instance = new ClassB();
    		instance.decorate(D1);
    		instance.decorate(D3);
    		instance.pridaniDoPole();
    		expect("abd1d3").toEqual(instance.pole.join(""));
		});
		it("should be added new method from decorators", function(){
    		instance = new ClassB();
    		instance.decorate(D1);
    		instance.decorate(D2);
    		instance.decorate(D3);
    		expect(8).toEqual(instance.novaMetoda());
		});
		it("should decorate old method with new one and be able to call super method", function() {
    		instance = new ClassB();
    		instance.decorate(D1);
    		instance.decorate(D2);
    		instance.decorate(D3);
    		expect(1554).toEqual(instance.staraMetoda());
		});
        it("should return same value as above even if we changed the decoration order", function() {
    		instance = new ClassB();
    		instance.decorate(D3);
    		instance.decorate(D1);
    		instance.decorate(D2);
    		expect(1554).toEqual(instance.staraMetoda());
		});
	});
	
	describe("test auto decoration",function() {
        it("should correctly autodecorate instance", function() {
    		instance = new ClassB();
    		instance.decorate(AD);
    		expect(776).toEqual(instance.staraMetoda());
    		expect(true).toEqual("novaMetoda" in instance);
    		expect(false).toEqual("_$super" in instance);
		});
	});
});