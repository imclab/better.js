/**
 * @namespace
 */
var Stacktrace	= {};

// export the class in node.js - if running in node.js
if( typeof(window) === 'undefined' )	module.exports	= Stacktrace;

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//										//
//		Stacktrace.parse						//
//										//
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


/**
 * parse the stacktrace of an Error
 * 
 * @param  {Error|undefined} error optional error to parse. if not provided, generate one.
 * @return {Array.<Object>}	parsed stacktrace
 */
Stacktrace.parse	= function(nShift, error){
	// handle polymorphism
	nShift	= nShift !== undefined ? nShift	: 0;
	error	= error	|| new Error();
	// sanity check
	console.assert(error instanceof Error);
	// call the proper parser depending on the usage 
	if( typeof(window) === 'undefined' ){
		var stacktrace	= _parserV8(error)
	}else if( navigator.userAgent.match('Chrome/') ){
		var stacktrace	= _parserV8(error)		
	}else if( navigator.userAgent.match('Firefox/') ){
		var stacktrace	= _parserFirefox(error)				
	}else{
		console.assert(false, 'Stacktrace.parse() not yet implemented for', navigator.userAgent)
		return [];
	}
	// add one to remove the parser*() function
	nShift	+= 1;
	console.assert(stacktrace.length >= nShift, 'stacktrace length not large enougth to shift '+nShift)
	return stacktrace.slice(nShift);

	//////////////////////////////////////////////////////////////////////////
	//									//
	//////////////////////////////////////////////////////////////////////////

	/**
	 * parse stacktrace for v8 - works in node.js and chrome
	 */
	function _parserV8(error){
		// start parse the error stack string
		var lines	= error.stack.split("\n").slice(1);
		var stacktrace	= [];
		lines.forEach(function(line){
			if( line.match(/\)$/) ){
				var matches	= line.match(/^\s*at (.+) \((.+):(\d+):(\d+)\)/);
				var result	= {
					fct	: matches[1],
					url	: matches[2],
					line	: parseInt(matches[3], 10),
					column	: parseInt(matches[4], 10)
				};
				stacktrace.push(result);
			}else{
				var matches	= line.match(/^\s*at (.+):(\d+):(\d+)/);
				var result	= {
					url	: matches[1],
					fct	: '<anonymous>',
					line	: parseInt(matches[2], 10),
					column	: parseInt(matches[3], 10)
				};
				stacktrace.push(result);
			}
		});
		return stacktrace;
	};

	/**
	 * parse the stacktrace from firefox
	 */
	function _parserFirefox(error){
		// start parse the error stack string
		var lines	= error.stack.split("\n").slice(0, -1);
		var stacktrace	= [];
		lines.forEach(function(line){
			var matches	= line.match(/^(.*)@(.+):(\d+)$/);
			stacktrace.push({
				fct	: matches[1] === '' ? '<anonymous>' : matches[1],
				url	: matches[2],
				line	: parseInt(matches[3], 10),
				column	: 1
			});
		});
		return stacktrace;
	};
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//										//
//		Stacktrace.Track						//
//										//
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

/**
 * Tracker of stacktrace
 */
Stacktrace.Tracker	= function(){
	this._klasses	= {};
}

/**
 * record an allocation of a class
 * @param  {String} className The class name under which this record is made
 */
Stacktrace.Tracker.prototype.record	= function(className){
	// init variable
	var at			= Stacktrace.Track;
	var stackFrame		= Stacktrace.parse()[2];
	// init Stacktrace.Track._klasses entry if needed
	this._klasses[className]= this._klasses[className]	|| {
		counter		: 0,
		perOrigins	: {}
	}
	// increase the counter
	var klass		= this._klasses[className];
	klass.counter		+= 1;
	// build the originId from stackFrame
	var originId		= stackFrame.fct + '@' + stackFrame.url + ':' + stackFrame.line;
	// update counters for this originId
	var perOrigins		= klass.perOrigins;
	perOrigins[originId]	= perOrigins[originId] !== undefined ? perOrigins[originId]  : 0;
	perOrigins[originId]	+= 1;		
}

/**
 * reset all counters kepts by Stacktrace.Track
 */
Stacktrace.Tracker.prototype.reset	= function(){
	this._klasses	= {};
}

/**
 * Reporter in a String
 * 
 * @param  {RegExp} classNameRegExp regexp of the classname to keep
 * @param  {Number} maxNOrigin      nb origin to display per class
 */
Stacktrace.Tracker.prototype.reportString	= function(classNameRegExp, maxNOrigin){
	classNameRegExp	= classNameRegExp	|| /./;
	maxNOrigin	= maxNOrigin !== undefined ? maxNOrigin	: 3;
	var output	= [];
	var classNames	= Object.keys(this._klasses);
	// sort classes by descending .counter
	classNames.sort(function(a, b){
		return this._klasses[b].counter - this._klasses[a].counter;
	}.bind(this));
	// filter by classname
	classNames	= classNames.filter(function(className){
		return className.match(classNameRegExp) ? true : false
	});
	// display the rest
	classNames.forEach(function(className){
		var klass	= this._klasses[className];
		output.push(className+': allocated '+klass.counter+' times');
		
		var perOrigins	= klass.perOrigins;

		var ranks	= Object.keys(perOrigins);
		ranks.sort(function(a, b){
			return perOrigins[b] - perOrigins[a];
		});

		//console.dir(aClass._newCounters)
		//console.log('ranks', ranks)

		ranks.slice(0, maxNOrigin).forEach(function(originId){
			var perOrigin	= perOrigins[originId];
			output.push('\t'+originId+' - '+perOrigin+' times')
			//console.log(counters[origin], "new aClass at ", origin);
		})
	}.bind(this))
	return output.join('\n');
};



