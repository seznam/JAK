#!/bin/sh
# rem Zretezeni vsech knihoven do jedne
cat main.js > common.js
cat classmaker.js >> common.js
cat events.js >> common.js 
cat browser.js >> common.js 
cat components.js >> common.js 
cat dom.js >> common.js 
cat object.js >> common.js 
cat request.js >> common.js 
cat siginterface.js >> common.js 
cat signals.js  >> common.js 
