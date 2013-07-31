SOURCES=geometry.js vector.js svg.js vml.js
TARGET=../graphics.js

.PHONY: all clean

all: $(TARGET)

clean:
	rm -f $(TARGET)

$(TARGET): $(SOURCES)
	cat $(SOURCES) > $(TARGET)
