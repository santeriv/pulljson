# pull json data from anywhere

hosted at pulljson.com

A simple json data parser utilizing jquery on remote page

## Installation

install `apify` from npm.

    npm install apify

## Usage

### Simple usage

run app.js

	node app.js 
	
go to localhost:3000/jquery?site=jquery.com&selector=find('h2')&forceText=true&callback=myCallbackFunc

```javascript
console.log("todo snippet here");
```

### Known issues

- id jquery hash-selector does not work &find('div#myid') try &find('div[id="myid"]') instead