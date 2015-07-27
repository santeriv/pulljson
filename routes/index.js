
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index',
	{
		"title": "pull html data in json from a webpage",
		"queryexamples": [
			{
			"description":"Find links from finnkino",
			"query": "http://pulljson.com/jquery?site=www.finnkino.fi&selector=find('a')&callback=mySpecialCallback1"
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
