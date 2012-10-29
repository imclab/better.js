/**
 * @namespace
 */
var PropertyAttr	= {};

/**
 * Define a property attribute
 * 
 * @param {Object} baseObject the base object to which the property belong
 * @param {String} property   the name of the property
 * @return {PropertyAttr}	builder for property attributes
 */
PropertyAttr.define	= function(baseObject, property){
	return new PropertyAttr.Builder(baseObject, property);
};

/**
 * Constructor
 * 
 * @param {Object} baseObject the base object to which the property belong
 * @param {String} property   the name of the property
 */
 PropertyAttr.Builder	= function(baseObject, property){
	// sanity check
	console.assert(typeof(baseObject) === 'object');
	console.assert(typeof(property) === 'string');
	// set local values
	this._baseObject= baseObject;
	this._property	= property; 
}

// export the class in node.js - if running in node.js
if( typeof(window) === 'undefined' )	module.exports	= PropertyAttr;

//////////////////////////////////////////////////////////////////////////////////
//										//
//////////////////////////////////////////////////////////////////////////////////

var TypeCheck	= TypeCheck	|| require('../src/typecheck.js')

/**
 * check if this property is of validTypes
 * @param  {[type]} types valid types in typecheck.js format
 * @return {PropertyAttr.Builder} for chained API
 */
PropertyAttr.Builder.prototype.typeCheck	= function(types){
	TypeCheck.setter(this._baseObject, this._property, types);
	return this;	// for chained API;
}


//////////////////////////////////////////////////////////////////////////////////
//										//
//////////////////////////////////////////////////////////////////////////////////

var QGetterSetter	= QGetterSetter	|| require('../src/qgettersetter.js')
var Stacktrace		= Stacktrace	|| require('../src/stacktrace.js');

// create the tracker for .trackUsage
PropertyAttr.usageTracker	= new Stacktrace.Tracker();

/**
 * track where this property is used (getter and setter)
 * @param {String|undefined} trackName	optional name for Stacktrace.Tracker. default to originId
 * @return {PropertyAttr.Builder} for chained API
 */
PropertyAttr.Builder.prototype.trackUsage	= function(trackName){
	// handle polymorphism
	trackName	= trackName	|| 'PropertyAttr.trackerUsage:'+Stacktrace.parse()[1].originId();
	// define getter
	QGetterSetter.defineGetter(this._baseObject, this._property, function(value){
		var tracker	= PropertyAttr.usageTracker;
		tracker.record(trackName, 1);
		return value;	// return value unchanged	
	});
	// define setter
	QGetterSetter.defineSetter(this._baseObject, this._property, function(value){
		var tracker	= PropertyAttr.usageTracker;
		tracker.record(trackName, 1);
		return value;	// return value unchanged	
	});
	return this;	// for chained API
}


