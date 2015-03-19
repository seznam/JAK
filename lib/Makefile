SOURCES=main.js \
		polyfills/es5.js \
		polyfills/js16.js \
		polyfills/classList.js \
		classmaker.js \
		events.js \
		browser.js \
		dom.js \
		object.js \
		request.js \
		signals.js \
		isignals.js \
		decorator.js \
		idecorable.js \
		timekeeper.js \
		console.js \
		promise.js \
		polyfills/childNode.js \
		polyfills/eventtarget.js \
		polyfills/mouseevent.js \
		polyfills/customevent.js \
		polyfills/domcontentloaded.js \
		polyfills/raf.js \
		polyfills/gesturechange.js
TARGET=jak.js

.PHONY: all clean

all: $(TARGET)

clean:
	rm -f $(TARGET)

$(TARGET): $(SOURCES)
	cat $(SOURCES) > $(TARGET)
