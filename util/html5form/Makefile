SOURCES=html5form.js html5form-tester.js html5form-element.js html5form-decorators.js html5form-visualizer.js
TARGET=html5form-all.js

.PHONY: all clean

all: $(TARGET)

clean:
	rm -f $(TARGET)

$(TARGET): $(SOURCES)
	cat $(SOURCES) > $(TARGET)
