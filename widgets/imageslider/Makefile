SOURCES=imageslider.js main.js description.js navigation.js strip.js
TARGET=imageslider-all.js

.PHONY: all clean

all: $(TARGET)

clean:
	rm -f $(TARGET)

$(TARGET): $(SOURCES)
	cat $(SOURCES) > $(TARGET)
