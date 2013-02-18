
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index',
	{
		"title": "pull json everywhere = jsonp",
		"queryexamples": [
			{
			"description":"Find links from finnkino",
			"query": "http://www.pulljson.com/jquery?site=www.finnkino.fi&selector=find('a')&callback=mySpecialCallback1"
			}
		],
		"contactdetails": [
			{
			"url":"",
			"twitter":"santeriv",
			"icon": "icon-twitter"
			},
			{
			"url":"",
			"twitter":"pulljson",
			"icon": "icon-twitter"
			}]		
	});
};
