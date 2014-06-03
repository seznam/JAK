/**
 * @class A promise - value to be resolved in the future.
 * Implements the "Promises/A+" specification.
 * @group jak
 */
JAK.Promise = JAK.ClassMaker.makeClass({
	NAME: "JAK.Promise",
	VERSION: "1.0"
});

/**
 * @param {function} [resolver] Will be called as resolver(resolve, reject)
 */
JAK.Promise.prototype.$constructor = function(resolver) {
	this._state = 0; /* 0 = pending, 1 = fulfilled, 2 = rejected */
	this._value = null; /* fulfillment / rejection value */

	this._cb = {
		fulfilled: [],
		rejected: []
	}

	this._thenPromises = []; /* promises returned by then() */

	if (resolver) { this._invokeResolver(resolver); }
}

/**
 * Wait for all these promises to complete. One failed => this fails too.
 */
JAK.Promise.all = JAK.Promise.when = function(all) {
	var promise = new this();
	var counter = 0;
	var results = [];

	for (var i=0;i<all.length;i++) {
		counter++;
		all[i].then(function(index, result) {
			results[index] = result;
			counter--;
			if (!counter) { promise.fulfill(results); }
		}.bind(null, i), function(reason) {
			counter = 1/0;
			promise.reject(reason);
		});
	}

	return promise;
}

/**
 * @param {function} onFulfilled To be called once this promise gets fulfilled
 * @param {function} onRejected To be called once this promise gets rejected
 * @returns {JAK.Promise}
 */
JAK.Promise.prototype.then = function(onFulfilled, onRejected) {
	this._cb.fulfilled.push(onFulfilled);
	this._cb.rejected.push(onRejected);

	var thenPromise = new JAK.Promise();

	this._thenPromises.push(thenPromise);

	if (this._state > 0) {
		setTimeout(this._processQueue.bind(this), 0);
	}

	/* 3.2.6. then must return a promise. */
	return thenPromise; 
}

/**
 * @param {function} onRejected To be called once this promise gets rejected
 * @returns {JAK.Promise}
 */
JAK.Promise.prototype["catch"] = function(onRejected) {
	return this.then(null, onRejected);
}

/**
 * Fulfill this promise with a given value
 * @param {*} value
 */
JAK.Promise.prototype.fulfill = function(value) {
	if (this._state != 0) { return this; }

	this._state = 1;
	this._value = value;

	this._processQueue();

	return this;
}

/**
 * Reject this promise with a given value
 * @param {*} value
 */
JAK.Promise.prototype.reject = function(value) {
	if (this._state != 0) { return this; }

	this._state = 2;
	this._value = value;

	this._processQueue();

	return this;
}

/**
 * Pass this promise's resolved value to another promise
 * @param {JAK.Promise} promise
 */
JAK.Promise.prototype.chain = function(promise) {
	return this.then(promise.fulfill.bind(promise), promise.reject.bind(promise));
}

JAK.Promise.prototype._processQueue = function() {
	while (this._thenPromises.length) {
		var onFulfilled = this._cb.fulfilled.shift();
		var onRejected = this._cb.rejected.shift();
		this._executeCallback(this._state == 1 ? onFulfilled : onRejected);
	}
}

JAK.Promise.prototype._executeCallback = function(cb) {
	var thenPromise = this._thenPromises.shift();

	if (typeof(cb) != "function") {
		if (this._state == 1) {
			/* 3.2.6.4. If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value. */
			thenPromise.fulfill(this._value);
		} else {
			/* 3.2.6.5. If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason. */
			thenPromise.reject(this._value);
		}
		return;
	}

	try {
		var returned = cb(this._value);

		if (returned && typeof(returned.then) == "function") {
			/* 3.2.6.3. If either onFulfilled or onRejected returns a promise (call it returnedPromise), promise2 must assume the state of returnedPromise */
			var fulfillThenPromise = function(value) { thenPromise.fulfill(value); }
			var rejectThenPromise = function(value) { thenPromise.reject(value); }
			returned.then(fulfillThenPromise, rejectThenPromise);
		} else {
			/* 3.2.6.1. If either onFulfilled or onRejected returns a value that is not a promise, promise2 must be fulfilled with that value. */ 
			thenPromise.fulfill(returned);
		}

	} catch (e) {
		if (window.console && window.console.error) { console.error(e); }

		/* 3.2.6.2. If either onFulfilled or onRejected throws an exception, promise2 must be rejected with the thrown exception as the reason. */
		thenPromise.reject(e); 
	}
}    

JAK.Promise.prototype._invokeResolver = function(resolver) {
	try {
		resolver(this.fulfill.bind(this), this.reject.bind(this));
	} catch (e) {
		this.reject(e);
	}
}

