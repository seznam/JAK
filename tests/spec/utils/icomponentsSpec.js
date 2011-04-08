/**
 * tyto testy lze pouzit i k dodatecnemu testovani JAK.ClassMaker
 *
 *		 		 		
 * COMPONENTS HIERARCHY SCHEME:
 *  ( v zavorce jsou uvedeny nazvy instanci komponent)		 
 *	Main
 *		|__ Part_1	(opice)	 
 *		|		|
 *		|		|__ Sub_Part_1 (sub_Part_1)
 *		|		|
 *		|		|__ Sub_Part_2	(sub_Part_2)	  
 *		|				 		 
 *		|__ Part_2 (part_2)
 *		|		|__ Sub_Part_1 (koza)
 *		|		|
 *		|		|__ Sub_Part_2	(pes)	
 *		|		
 *		|		
 *		|			 
 *		|
 *		|__ Part_3 (part_3)
 *		|
 *		|__ Part_4	(part_4)	 		 		 		 		 
 *
 *
 *
 *	CLASS INHERITACE SCHEME
 *	
 *	Part_1
 *		|__ Part_3
 *		|
 *		|__ Part_4
 *		|
 *		|__ Sub_Part_1
 *					|___ Sub_Part_2		 		 		 		 		 		 		 		 		 
 *
 *
 */
describe("iComponents", function(){
    var xxx,
        Main, Part_1, Part_2, Part_3, Part_4,
        Sub_Part_1, Sub_Part_2,
        Obluda, Obluda2;
        
        beforeEach(function(){ 
		 		 		 		 		 		 		 		 		 		
			// main class
			Main = JAK.ClassMaker.makeClass({
				NAME:'Main',
				VERSION:'1.0',
				IMPLEMENT:JAK.IComponents,
				CLASS:'class'
			});
			
			Main.prototype.TOP_LEVEL = true;
			
			Main.prototype.$constructor = function(){
				this.inited = false;
				this.components = [
					{part:Part_1,name:'opice',setting:{type:'AHQ'}},
					{part:Part_2,name:'vlk'},
					{part:Part_3},
					{part:Part_4,setting:{type:'BAHQ'}}
				];
				
				this.addAllComponents();
				this.registredMethod(this.main);
			};
			
			Main.prototype.$destructor = function(){
				this.callChildDestructor();
				this.destroy();
			}
			
			Main.prototype.destroy = function() {
				for (var p in this) { this[p] = null; }
			}
			
			Main.prototype.init = function(){
				this.inited = true;
			};
			// -->
			
			// part_1 class
			Part_1 = JAK.ClassMaker.makeClass({
				NAME:'Part_1',
				VERSION:'1.0',
				IMPLEMENT:JAK.IComponents,
				CLASS:'class'				
			});
			
			Part_1.prototype.$constructor = function(owner,name){
				this._owner = owner;
				this._name = name;
				this.specialValue = arguments[2] ? arguments[2].type : '';
				this.Part_1();
			};
			
			Part_1.prototype.Part_1 = function(){
				this.main = this.getMain();
				this.value = '';
				this.components = [
					{part:Sub_Part_1,name:'sub_Part_1',setting:{type:'BGHQ'}},
					{part:Sub_Part_2}
				];
				this.addAllComponents();
				this.registredMethod(this.main);		
			}
			
			Part_1.prototype.$destructor = function(){
				this.callChildDestructor();
				this.destroy();
			};

			Part_1.prototype.destroy = function() {
				for (var p in this) { this[p] = null; }
			}

			Part_1.prototype.set = function(str){
				this.value = str;
			}
			Part_1.prototype.set.access = 'public';
			
			Part_1.prototype.get = function(str){
				return this.value;
			}
			Part_1.prototype.get.access = 'public';			
			// -->
			
			// part_2 class	
			Part_2 = JAK.ClassMaker.makeClass({
				NAME:'Part_2',
				VERSION:'1.0',
				IMPLEMENT:JAK.IComponents,
				CLASS:'class'				
			});
							
			Part_2.prototype.$constructor = function(owner,name){
				this._owner = owner;
				this._name = name;
				this.main = this.getMain();
				this.components = [
					{part:Sub_Part_1,name:'koza',setting:{type:'BGHQ'}},
					{part:Sub_Part_2,name:'pes'}
				];
				this.addAllComponents();
				this.registredMethod(this.main);				
				this.value = '';
			};
			
			Part_2.prototype.$destructor = function(){
				this.callChildDestructor();
				this.destroy();
			};
			
			Part_2.prototype.destroy = function(){
				for(key in this) {
					this[key] = null;
				}				
			}
			
			Part_2.prototype.set = function(str){
				this.value = str;
			}
			Part_2.prototype.set.access = 'public setValue';
			
			Part_2.prototype.get = function(str){
				return this.value;
			}
			Part_2.prototype.get.access = 'public getValue';				
			// --->
			
			// part_3 class
			Part_3 = JAK.ClassMaker.makeClass({
				NAME:'Part_3',
				VERSION:'1.0',
				EXTEND:Part_1,
				CLASS:'class'				
			});			
			
			Part_3.prototype.$constructor = function(owner,name){
				this._owner = owner;
				this._name = name;
				this.main = this.getMain();
				this.registredMethod(this.main);
			};
			// -->

			// part_3 class
			Part_4 = JAK.ClassMaker.makeClass({
				NAME:'Part_4',
				VERSION:'1.0',
				EXTEND:Part_1,
				CLASS:'class'				
			});			
			
			Part_4.prototype.$constructor = function(owner,name){
				this._owner = owner;
				this._name = name;
				this.main = this.getMain();
				this.specialValue = arguments[2] ? arguments[2].type : '';
				this.registredMethod(this.main);
			};
			// -->			

			// part_3 class
			Sub_Part_1 = JAK.ClassMaker.makeClass({
				NAME:'Sub_Part_1',
				VERSION:'1.0',
				EXTEND:Part_1,
				CLASS:'class'				
			});			
			
			Sub_Part_1.prototype.$constructor = function(owner,name){
				this._owner = owner;
				this._name = name;
				this.components = []
				this.main = this.getMain();
				this.specialValue = arguments[2] ? arguments[2].type : '';
				this.registredMethod(this.main);
			};
			// -->

			// part_3 class
			Sub_Part_2 = JAK.ClassMaker.makeClass({
				NAME:'Sub_Part_2',
				VERSION:'1.0',
				EXTEND:Sub_Part_1,
				CLASS:'class'				
			});			
			
			Sub_Part_2.prototype.$constructor = function(owner,name){
				this.$super(owner, name, arguments[2]);
			};
			// -->
			
			// Dynamicky pridavana komponenta
			Obluda = JAK.ClassMaker.makeClass({
				NAME:'Obluda',
				VERSION:'1.0',
				EXTEND:Sub_Part_1,
				CLASS:'class'				
			});
			
			Obluda.prototype.$constructor = function(owner,name){
				if(arguments[2]){
					this.$super(owner, name, arguments[2]);
				} else {
					this.$super(owner, name);
				}
				
				//vlastnost co se destruktorem nici
				this.superVlastnost = 'supervlastnost';
			};
			
			Obluda.prototype.$destructor = function() {
				this.callChildDestructor();
				//jednoduche destrojovani
				for(key in this) {
					this[key] = null;
				}
			}
			
			//Dynamicky pridavana komponenta 2
			Obluda2 = JAK.ClassMaker.makeClass({
				NAME: 'Obluda2',
				VERSION: '1.0',
				EXTEND: Obluda,
				CLASS: 'class'
			});
			
			Obluda2.prototype.$constructor = function(owner,name){
				this.$super(owner, name);
			}
			
			Obluda2.prototype.metoda = function() {
				return true;
			}
			Obluda2.prototype.metoda.access = 'public obludackaMetoda';
			
			xxx = new Main();
		});
		
        afterEach(function(){
            delete xxx, Main, Part_1, Part_2, Part_3, Part_4,
                Sub_Part_1, Sub_Part_2,
                Obluda, Obluda2;
        });	
			
        describe("#hasComponents", function(){		
			// ptam se vybranych trid zda maji komponenty a ocekavam true || false
			it("should has components if instance is not the leaf in the structure", function(){
				expect(xxx.hasComponents()).toEqual(true);
				expect(xxx.opice.hasComponents()).toEqual(true);
				expect(xxx.part_3.hasComponents()).toEqual(false);
				expect(xxx.opice.sub_Part_1.hasComponents()).toEqual(false);
			});
        });			
        describe("right structure test", function(){
			// testuji zda structura opdovida pozadovane - viz schema skladby v zahlavi
			it("should reflect the real structure", function(){
				var test = {
					opice : {
						sub_Part_1:true,
						sub_Part_2:true
					},
					vlk : {
						koza:true,
						pes:true
					},
					part_3 : {},
					part_4 : {}					
				};
				for(var i in test){
					if(test[i]){
						expect((typeof xxx[i])).toEqual('object');
						for(var j in test[i]){
							expect((typeof xxx[i][j])).toEqual('object');
						}
					}
				}
			});
			
			
			// testuji zda se mi do hlavni tridy spravne zaregistrovali metody komponent s nastavenym "access"
			it("should be registered all subparts in main class", function(){
				var test = {
					opice : {
						opiceSet:true,
						opiceGet:true,
						sub_Part_1:{
							sub_Part_1Set:true,
							sub_Part_1Get:true
						},
						sub_Part_2:{
							sub_Part_2Set:true,
							sub_Part_2Get:true						
						}
					},
					vlk : {
						setValue:true,
						getValue:true,
						koza:{
							kozaSet : true,
							kozaGet :true
						},
						pes:{
							pesSet:true,
							pesGet:true
						}
					},
					part_3 : {
						part_3Set:true,
						part_3Get:true
					},
					part_4 : {
						part_4Set:true,
						part_4Get:true					
					}					
				};
				var str = 'function';
				for(var i in test){
					if(typeof test[i] == 'boolean'){
						expect((typeof xxx[i])).toEqual(str);
					} else {
						for(var j in test[i]){
							if(typeof test[i][j] == 'boolean'){
								expect((typeof xxx[j])).toEqual(str);
							}
						}
					}
				}
			});
            // test na spravnou funkcnost registrovanych metod
			it("should register methods properly", function(){
					xxx.opiceSet('opice');
					expect(xxx.opiceGet()).toEqual(xxx.opice.get());
					
					var str = 'jedna';
					xxx.vlk.koza.set(str);
					var a = xxx.kozaGet();
					
					xxx.kozaSet(str);
					var b = xxx.vlk.koza.get();
					expect(a).toEqual(b); 
			});	
		});	
			
		describe("#addNewComponent", function(){	
			// test na dynamicke pridani komponenty za behu
			it("should dynamically add new component on the fly", function(){
				var yyy = new Main();
				yyy.addNewComponent({part:Obluda,name:'slon',setting:{type:'slonisko'}});
				expect(yyy.slon.specialValue).toEqual('slonisko');
				
				var str = 'jedna';
				yyy.slon.set(str);
				var b = yyy.slonGet();
				expect(b).toEqual(str);
			});
		});
        describe("#removeComponent", function(){	
			//testovani rozhrani pro odebrani komponent
			it("should remove component on the fly", function() {
				var yyy = new Main();
				var opice = yyy.opice;
				yyy.removeComponent('opice');
				expect(opice).not.toEqual(yyy.opice);
				expect(opice).not.toEqual(null);
			});
			
			//testovani odebrani komponenty se zavolanim jejiho destructoru
			it("should remove component and destruct it", function() {
				var yyy = new Main();
				yyy.addNewComponent({part:Obluda, name:'slon'});
				expect(null).not.toEqual(yyy.slon);
				expect(yyy.slon.superVlastnost).toEqual('supervlastnost');
				var slon = yyy.slon;
				expect(slon.superVlastnost).toEqual('supervlastnost');
				yyy.removeComponent(slon, true);
				expect(slon).not.toEqual(yyy.slon);
				expect(slon.superVlasnost).toEqual(undefined);
			});
        });
        describe("#unregistredMethod", function(){
			//testovani odregistrovani registrovane metody
			it("should unregister method from parent instance", function() {
				var xxx = new Main();
				xxx.addNewComponent({part:Obluda2, name:'obluda'});
				
				expect(null).not.toEqual(xxx.obluda);
				
				expect(xxx.obludackaMetoda()).toEqual(true);
				//odregistrace
				expect(typeof xxx.obluda.unregistredMethod).toEqual("function");
				xxx.obluda.unregistredMethod(xxx);
				expect(typeof xxx.obludackaMetoda).toEqual('undefined');
			});
			
		});
		describe("#callChildDestructor", function(){
			// testovani destruckce pres callChildDestructor 
			it("should call this method and destruct all childs", function(){
				var main = new Main();
				main.addNewComponent({part:Obluda, name:'slon'});
				/* dynamicky pridana komponenta */
				var dynamic = main.slon;
				/* jedna z nejhlobeji zanorenych komponent */
				var deepest = main.opice.sub_Part_1;
				var dyn_test = true;
				var deep_test = true;
				
				/* overuji zda se vse zdestruovalo (ma vsechny vlastnosti !== null) */
				for(var i in deepest){
					if(deepest[i] === null){
						deep_test = false;
					}
				}
				
				for(var i in dynamic){
					if(dynamic[i] === null){
						dyn_test = false;
					}
				}				
				
				expect(dyn_test && deep_test).toEqual(true);
			
				
				main.$destructor();
				
				/* overuji zda se vse zdestruovalo (ma vsechny vlastnosti === null) */
				for(var i in deepest){
					if(deepest[i] !== null){
						deep_test = false;	
					}
				}
				
				for(var i in dynamic){
					if(dynamic[i] !== null){
						dyn_test = false;	
					}
				}
				/* povedlo se pro obe testovane komponenty */
				var out = dyn_test && deep_test;
				
				expect(out).toEqual(true);
				
			});
        });
			
	
});