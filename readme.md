pulljson
========

[![Travis CI pulljson status](https://travis-ci.org/santeriv/pulljson.svg?branch=master "pulljson - master")](https://travis-ci.org/santeriv/pulljson)

# pull json data from anywhere

hosted at pulljson.com or https://html-to-json.herokuapp.com/

A simple json data parser utilizing jquery on remote page

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Installation

install `pulljson` from npm.

    npm install pulljson

## Usage

### Simple usage

run app.js

	node app.js 
	
go to localhost:3000/jquery?site=jquery.com&selector=find('h2')&forceText=true&callback=myCallbackFunction

```javascript
console.log("todo snippet here");
```

### Known issues

- id jquery hash-selector does not work &find('div#myid') try &find('div[id="myid"]') instead
