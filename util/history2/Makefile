SOURCES=history2.js history2-hash.js history2-html5.js history2-processor.js
TARGET=../history2.js

.PHONY: all clean

all: $(TARGET)

clean:
	rm -f $(TARGET)

$(TARGET): $(SOURCES)
	cat $(SOURCES) > $(TARGET)
