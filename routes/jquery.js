jquery = require('jquery');
var url = require('url');
var http = require('follow-redirects').http
var sanitizer = require('sanitizer');
/*
TODO: enable safe vm calls
http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
*/
var vm = require('vm');

/*
 * GET jquery 
 */

exports.fetch = function(req, res){

	html = '';
	returnvalue = [];
	jqueryselector = '';
	var callbackfunction = '';
		
	var queryParams = url.parse(req.url,true).query;
	console.log(queryParams);
	if(queryParams === undefined || queryParams.site === undefined){
		res.redirect('/');
	} 
	/*{ site: 'jquery.com', selector: '(\'title\')', callback: '?' }*/
	var sitepath = url.parse(queryParams.site,true).path;
	console.log('sitepath (original)='+sitepath);
	var sitehost = url.parse(queryParams.site,true).host;
	console.log('sitehost (original)='+sitehost);
	
	// code.fi/haku instead of http://code.fi/haku
	if(sitehost === undefined && sitepath !== undefined) {
		sitehost = sitepath.split('/')[0];
		//just www.code.fi
		if(sitepath.split('/')[1] === undefined) {
			sitepath = undefined;
		}
		else {
			sitepath = '/' + sitepath.split('/')[1] + '/';
		}
	}
	//iterate all possible sitepath variables
	Object.keys(queryParams).forEach(function(param) {
		var paramstr = ''+param;/*cast property to string*/
		if(paramstr !== 'site' 
			&& paramstr !== 'selector'
			&& paramstr !== 'callback'
			&& paramstr !== '_') {
			//param,value
			console.log(param, queryParams[param]);
			//add param and value to sitepath
			sitepath = sitepath + '&'+paramstr+'='+queryParams[param];
		}
	});	
	console.log('sitepath (final,parsed)='+sitepath);
	console.log('sitehost (final,parsed)'+sitehost);
	callbackfunction = queryParams.callback;
	console.log('callbackfunction '+callbackfunction);

	jqueryselector = queryParams.selector;
	console.log('jqueryselector '+jqueryselector);
	sitehost = sitehost || 'jquery.com';
	sitepath = sitepath || '/';
	var options = {
		host: sanitizer.escape(sitehost),
		port: 80,
		path: sanitizer.escape(sitepath)
	};
	jqueryselector = sanitizer.sanitize(jqueryselector);
	http.get(options, function(htmlresponse) {
		htmlresponse.on('data', function(data) {
			html += data;
		}).on('end', function() {
			// webpage data has loaded
			setTimeout(function(){
				if(jqueryselector !== undefined) {
					console.log('creating jquery');
					var queryresultnodes = [];
					var jquerycall = 'jquery(html).'+jqueryselector+'.each(function(index,data){returnvalue.push(data);})';
					var jqueryscript = vm.createScript(jquerycall, 'myjquery.vm');
					jqueryscript.runInThisContext();
					jquery.each(returnvalue,function(index,data){
						queryresultnodes.push(xmlToJson(data));
					});
					res.jsonp({size : queryresultnodes.length, results : queryresultnodes});
				}
				else {
					res.jsonp({size : -1, results : 'no selector was given eg. &selector=find(\'a\').children()'});
				}
			}, 1);
		});
	});
};

function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};
 
	// console.log(xml.nodeType, xml.nodeName );
	
	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} 
	else if (xml.nodeType == 4) { // cdata section
		obj = xml.nodeValue
	}

	else if (xml.nodeType == 3) { // text section
		obj = xml.nodeValue
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if(nodeName === '#text') nodeName = 'text';
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].length) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				if (typeof(obj[nodeName]) === 'object') {
					obj[nodeName].push(xmlToJson(item));
				}
			}
		}
	}
	return obj;
};