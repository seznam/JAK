SOURCES=form.js window.js input.js login.js register.js done.js
TARGET=loginForm.js

.PHONY: all clean

all: $(TARGET)

clean:
	rm -f $(TARGET)

$(TARGET): $(SOURCES)
	cat $(SOURCES) > $(TARGET)
