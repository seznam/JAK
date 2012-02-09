describe('Events', function(){
    var evntClick0 = {
        type: 'click',
        canBuble:true,
        cancelable:true,
        abstView:window,
        detail:1,
        sX:0,
        sY:0,
        cX:0,
        cY:0,
        ctrlKey:false,
        altKey:false,
        shiftKey:false,
        metaKey:false,
        button:0,
        relatedTarget:document
    };


    var getEventClick = function(param){
        //alert(arguments[1])
        if(JAK.Browser.client != 'ie'){
            var ev = document.createEvent('MouseEvents');

            ev.initMouseEvent(
                param.type,
                param.canBuble,
                param.cancelable,
                param.abstView,
                param.detail,
                param.sX,
                param.sY,
                param.cX,
                param.cY,
                param.ctrlKey,
                param.altKey,
                param.shiftKey,
                param.metaKey,
                param.button,
                (arguments[1] ? arguments[1] : document)
            );
        } else {
            var ev = document.createEventObject();
            ev.type = param.type;
            ev.button = 1;
            ev.screenX = param.screenX;
            ev.screenY = param.screenY;
            ev.clientX = param.clientX;
            ev.screenY = param.clientY;
            ev.altKey = param.altKey;
            ev.ctrlKey = param.ctrlKey;
            ev.shiftKey = param.shiftKey;
            ev.x = param.clientX;
            ev.y = param.clientY;
            ev.cancelBubble = false;
            ev.srcElement = (arguments[1] ? arguments[1] : document)


        }
        return ev;
    }
    var r = 0;
			
    window.ctest_1 = function(e,elm){
        elm.firstChild.nodeValue++;
    }


    window.ctest_2 = function(e,elm){
        elm.getElementsByTagName('div')[0].firstChild.nodeValue = 'A';
    }

    window.ctest_3 = function(e,elm){
        JAK.Events.stopEvent(e)
    }

     //prepare HTML data
    var html = '<div id="d1" style="width:10px;height:10px">1</div><div id="d2" style="width:40px;height:40px"><div id="d3" style="margin:10px;">X</div></div>';

    beforeEach(function(){
        document.getElementById('test_box').innerHTML = html;
    });

    afterEach(function(){
        document.getElementById('test_box').innerHTML = '';
    });

	var val1 = 0;

    describe('testing click event handling', function(){
        it('should handle fired click event', function(){
            var trg = JAK.gel('d1');
            var cla = JAK.Events.addListener(trg,'click',window,'ctest_1');

            if(JAK.Browser.client != 'ie'){
                trg.dispatchEvent(getEventClick(evntClick0,trg));
            } else {
                trg.fireEvent('onclick',getEventClick(evntClick0,trg));
            }

            //testing click
            expect('2').toEqual(trg.firstChild.nodeValue);

            //expecting that handler is saved in internal array
            var eId = JAK.Events._eventFolder[cla];
            expect(eId).toBeDefined();

            //test of right unregistering
            JAK.Events.removeListener(cla);
            var ok = true;
            try {
                JAK.Events.removeListener(cla);
                ok = false;
            } catch (e) {
            }
            expect(ok).toEqual(true);

            if(JAK.Browser.client != 'ie'){
                trg.dispatchEvent(getEventClick(evntClick0,trg));
            } else {
                trg.fireEvent('onclick',getEventClick(evntClick0,trg));
            }

            expect('2').toEqual(trg.firstChild.nodeValue);

            //is handler deleted?
            var eId = JAK.Events._eventFolder[cla];
            expect(eId).toBeUndefined();

        });

        it('should handle mutiple events attached together', function(){
            var trg = JAK.gel('d1');
            var cla = JAK.Events.addListener(trg,"mouseover click", window, 'ctest_1');

            if(JAK.Browser.client != 'ie'){
                trg.dispatchEvent(getEventClick(evntClick0,trg));
            } else {
                trg.fireEvent('onclick',getEventClick(evntClick0,trg));
            }
            //testing click
            expect('2').toEqual(trg.firstChild.nodeValue);

            //expecting that handler is saved in internal array
            var eId = JAK.Events._eventFolder[cla];
            expect(eId).toBeDefined();

            //test of right unregistering
            JAK.Events.removeListener(cla);
            var ok = true;
            try {
                JAK.Events.removeListener(cla);
                ok = false;
            } catch (e) {
            }
            expect(ok).toEqual(true);

            if(JAK.Browser.client != 'ie'){
                trg.dispatchEvent(getEventClick(evntClick0,trg));
            } else {
                trg.fireEvent('onclick',getEventClick(evntClick0,trg));
            }

            expect('2').toEqual(trg.firstChild.nodeValue);

            //is handler deleted?
            var eId = JAK.Events._eventFolder[cla];
            expect(eId).toBeUndefined();

        });


        it('should bubble event to parent node', function(){
            var trg = JAK.gel('d3');
            var trg0 = JAK.gel('d2');
            // klik na vnitrnim DIVu
            var cla_0 = JAK.Events.addListener(trg,'click',window,'ctest_3');
            // klik na vnejsim DIVu
            var cla_1 = JAK.Events.addListener(trg0,'click',window,'ctest_2');

            if(JAK.Browser.client != 'ie'){
                trg.dispatchEvent(getEventClick(evntClick0,trg));
            } else {
                trg.fireEvent('onclick',getEventClick(evntClick0,trg));
            }
            //kliknuti na dcerinem prvku zastavi prostupovani k rodicovskemu prvku s handlerem
            expect('X').toEqual(trg.firstChild.nodeValue);

            JAK.Events.removeListener(cla_0);
            JAK.Events.removeListener(cla_1);

        });

	     it('should remove all listeners by list of IDs', function(){
		     var len = 3
			var ec = [];
			var nodes = [];
			for(var i = 0; i < 3; i++) {
				nodes.push(JAK.cel("div"));
				ec.push(JAK.Events.addListener(nodes[i],"click",alert));
			}
			JAK.Events.removeListeners(ec);
			expect(0).toEqual(ec.length);
	     });
    });
});
