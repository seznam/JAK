jasmine.Matchers.prototype.toRaise = function(expected) {
    try {
        this.actual();
        return false;
    } catch(e) {
        var message = e.message || e;
        expected = (expected.message || expected);
        return expected ? (expected instanceof RegExp ? expected.test(message) : expected === message) : true;
    }
};

