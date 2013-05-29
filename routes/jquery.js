jquery = require('jquery');
var url = require('url');
var http = require('follow-redirects').http
var https = require('follow-redirects').https
var sanitizer = require('sanitizer');
var vm = require('vm');
var domain = require('domain');

/*
 * GET jquery 
 */

exports.fetch = function(req, res){
	html = '';
	onerrorAddress = req.connection.remoteAddress;
	jqerrorString = null;
	returnvalue = [];
	jqueryselector = '';
	jqueryforcetext = 'false';
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
			&& paramstr !== 'forcetext'
			&& paramstr !== 'forceText'
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

	jqueryforcetext = queryParams.forceText || queryParams.forcetext || 'false';
	jqueryforcetext = sanitizer.sanitize(jqueryforcetext);

	console.log('9:jqueryforcetext '+jqueryforcetext);
	
	var options = {
		host: sitehost,
		port: 80,
		path: sitepath
	};
	/*TODO: use https and port 443 if specified*/
	http.get(options, function(htmlresponse) {
	    htmlresponse.setEncoding('binary');
		htmlresponse.on('data', function(data) {
			html += data;
		}).on('end', function() {
			/* webpage data has loaded */
			setTimeout(function(){
				if(jqueryselector !== undefined) {
					console.log('10:executing server jquery');
					var queryresultnodes = [];
					/*TODO: validate improper jquery methods out + strip away .text() */
					var jquerycall = 
									'try {\
										var _jqo = jquery(html).'+jqueryselector+'; \
										/*check if user wants to force .text() instead of pushing domified data*/ \
										if('+jqueryforcetext+' == true) { \
											returnvalue.push(_jqo.text()); \
										} else { \
											_jqo.each(function(index,data){ \
												returnvalue.push(data); \
											}); \
										} \
									} catch(err) { jqerrorString = err; console.log(\'ERROR : internal jquery error from IP=\'+onerrorAddress+\' err=\',err,err.stack); } ';
					/* Execute script in a domain and in own vm in this context */
					var d = domain.create();
					d.on('error', function(err){
						/* handle the script load error safely */
						console.log('ERROR : jquerycall error from IP='+onerrorAddress+' err=',err,err.stack);
						res.jsonp({size : -1, results : 'error=[ '+err+' ] occured on executing selector=[ '+jqueryselector+' ]'});
					});
					d.run(function(){
						var jqueryscript = vm.createScript(jquerycall, 'myjquery.vm');
						jqueryscript.runInThisContext();
					});
					
					/*If query was executed without errors, next process result into json compatible format*/
					queryresultnodes = setQueryResultNodes(returnvalue,jqueryforcetext,jquery);
					/*check if global jqerrorString is defined*/
					if(jqerrorString !== null) {
						res.jsonp({size : -1, results : 'error=[ '+jqerrorString+' ] occured on executing selector=[ '+jqueryselector+' ]'});
					} 
					else {
						if(queryresultnodes.length === 0 && jqueryforcetext === false) {
							res.jsonp({size : 0, results : 'no results, sorry. Have you tried already &forcetext=true which calls jquery.text() instead of returning result in DOMified format.'});
						} 
						else {
							res.jsonp({size : queryresultnodes.length, results : queryresultnodes});
						}
					}
				}
				else {
					res.jsonp({size : -1, results : 'no selector was given eg. &selector=find(\'a\').children()'});
				}
			}, 1);
		});
	});
};

function setQueryResultNodes(undomifiedvalue,forcedText,nodejquery) {
	var queryResults = [];
	if(forcedText == 'true') { /*remove extra array from queryResults*/ queryResults = null; queryResults = undomifiedvalue; }
	else { nodejquery.each(undomifiedvalue,function(i,dat){queryResults.push(xmlToJson(dat));}) }
	return queryResults;
}

/*Modified from https://gist.github.com/miohtama/1570295*/
/*not used yet*/
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