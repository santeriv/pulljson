
/*
 * GET home page.
 */

exports.show = function(req, res){
  res.render('contact', 
	{ 
		title: 'Contact',
		details: [{
		icon: 'icon-twitter',
		url: 'http://www.twitter.com/pulljson'}]
	});
};