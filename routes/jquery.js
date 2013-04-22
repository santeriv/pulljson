jquery = require('jquery');
var url = require('url');
var http = require('follow-redirects').http
var https = require('follow-redirects').https
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
	var urlEncoded = encodeURIComponent(req.url);
	console.log('0:urlEncoded='+urlEncoded);
	var queryParams = url.parse(req.url,true).query;
	console.log('1:queryParams='+queryParams);
	if(queryParams === undefined || queryParams.site === undefined || queryParams.site == null){
		res.redirect('/');
	} 
	/*{ site: 'jquery.com', selector: '(\'title\')', callback: '?' }*/
	var sitepath = url.parse(queryParams.site,true).path;
	console.log('2:sitepath (original)='+sitepath);
	var sitehost = url.parse(queryParams.site,true).host;
	console.log('3:sitehost (original)='+sitehost);
	
	/*
     *	jquerymobile.com/demos/1.2.1/docs/pages/multipage-template.html
   	 *  instead of http://code.fi/haku
	 */
	if((sitehost === undefined && sitepath !== undefined) || (sitehost == null && sitepath != null)) {
		sitehost = sitepath.split('/')[0];
		/*just www.code.fi */
		if(sitepath.split('/')[1] === undefined) {
			sitepath = null;
		}
		else {
			sitepath = sitepath.split(sitehost)[1];
		}
	}
	/*iterate all possible sitepath variables*/
	var paramPairNumber = 0;
	Object.keys(queryParams).forEach(function(param) {
	    /*cast property to string*/
		var paramstr = ''+param;
		if(paramstr !== 'site' 
			&& paramstr !== 'selector'
			&& paramstr !== 'callback'
			&& paramstr !== '_') {
			/*param,value*/
			paramPairNumber++;
			var pair='&'+paramstr+'='+queryParams[param];
			console.log('4.'+paramPairNumber+': '+ pair);
			/*add param and value to sitepath*/
			sitepath = sitepath + pair;
		}
	});	
    /*final param values before server side execute*/
	sitehost = sitehost || 'jquery.com';
	/*TODO: WOT url check*/
	sitehost = sanitizer.escape(sitehost);
	sitepath = sitepath || '/';
	/*TODO: how to sanitize without killing &param=&param2=*/
	/*sitepath = sanitizer.escape(sitepath);*/
	console.log('5:sitepath (final,parsed)='+sitepath);
	console.log('6:sitehost (final,parsed)='+sitehost);

	callbackfunction = queryParams.callback;
	console.log('7:callbackfunction '+callbackfunction);

	jqueryselector = queryParams.selector;
	jqueryselector = sanitizer.sanitize(jqueryselector);
	console.log('8:jqueryselector '+jqueryselector);

	var options = {
		host: sitehost,
		port: 80,
		path: sitepath
	};
	/*TODO: use https and port 443 if specified*/
	http.get(options, function(htmlresponse) {
		htmlresponse.on('data', function(data) {
			html += data;
		}).on('end', function() {
			/* webpage data has loaded */
			setTimeout(function(){
				if(jqueryselector !== undefined) {
					console.log('10:executing server jquery');
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

/*Modified from https://gist.github.com/miohtama/1570295*/
function parseHashArgs(aURL) {
 
	/*aURL = aURL || window.location.href;*/
	
	var vars = {};
	var hashes = aURL.slice(aURL.indexOf('#') + 1).split('&');
 
    for(var i = 0; i < hashes.length; i++) {
       var hash = hashes[i].split('=');
      
       if(hash.length > 1) {
    	   vars[hash[0]] = hash[1];
       } else {
     	  vars[hash[0]] = null;
       }      
    }
 
    return vars;
}

/*Modified from https://gist.github.com/hugeen/4662065 */
function xmlToJson(xml) {
	
	/* Create the return object */
	var obj = {};
 
	/* console.log(xml.nodeType, xml.nodeName ); */
	
	if (xml.nodeType == 1) { /* element */
		/* do attributes */
		if (xml.attributes.length > 0) {
		obj["attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} 
	else if (xml.nodeType == 4) { /* cdata section */
		obj = xml.nodeValue
	}

	else if (xml.nodeType == 3) { /* text section */
		obj = xml.nodeValue
	}

	/* do children */
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