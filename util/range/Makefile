SOURCES=range-lib.js range-ie.js range-ie-utils.js range-ie-selection.js
TARGET=range.js

.PHONY: all clean

all: $(TARGET)

clean:
	rm -f $(TARGET)

$(TARGET): $(SOURCES)
	cat $(SOURCES) > $(TARGET)
