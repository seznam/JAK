SOURCES=$(foreach file,gettext.js form.js window.js input.js login.js register.js done.js,src/$(file))
TARGET=loginForm.js
LANGUAGES=cs
LOCALES=$(foreach locale,$(LANGUAGES),loginForm.$(locale).js)

.PHONY: all clean

all: $(TARGET) $(LOCALES)

clean:
	rm -f $(TARGET)

$(TARGET): $(SOURCES)
	echo ";(function(){" > $(TARGET)
	cat $(SOURCES) >> $(TARGET)
	echo "})();" >> $(TARGET)

$(LOCALES): loginForm.%.js: locale/%/loginForm.json
	messageformat -l $* -i locale/$* -s -ns i18n_ > $@
