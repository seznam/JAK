TARGETS=lib util/history2 util/graphics util/range util/login widgets/loginForm util/html5form widgets/imageslider

.PHONY: all clean $(TARGETS)

all: $(TARGETS)

clean:
	for i in $(TARGETS) ; do $(MAKE) -C $$i clean ; done

$(TARGETS):
	$(MAKE) -C $@
