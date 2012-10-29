#!/usr/bin/env node

// get the class
var QGetterSetter	= QGetterSetter	|| require('../src/qgettersetter.js')

var foo		= {
	x	: 3
};

console.log('before new getter: foo.x ===', foo.x)

foo.__defineQGetter__('x', function(value){
	return value*2;
});

console.log('after new getter: foo.x ===', foo.x)