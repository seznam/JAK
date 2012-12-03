// Think of an object as a number service 
describe("ServiceLocator", function() {
	it("should Get and Set Service to ServiceLocator", function() {
		JAK.ServiceLocator.addService("firstService", 5);
		expect(JAK.ServiceLocator.getService("firstService")).toEqual(5);
	});

	it("should throw when no service is available", function() {
		var test = function() {
			JAK.ServiceLocator.getService("invalidService");
		}
		expect(test).toThrow(); 
	});
	it("should tell whether a service has not been registered", function() {
		JAK.ServiceLocator.addService("secondService", 3);
		expect(JAK.ServiceLocator.hasService("secondService")).toEqual(true); 
		expect(JAK.ServiceLocator.hasService("invalidService")).toEqual(false); 
	});
	it("should tell whether a service has been registered twice", function() {
		var test = function() {
			JAK.ServiceLocator.addService("secondService", 3);
			JAK.ServiceLocator.addService("secondService", 666);
		}
		expect(test).toThrow(); 
	});
});
