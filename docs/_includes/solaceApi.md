
## Obtaining the Solace API

This tutorial depends on you having the Solace Systems Web Messaging API for JavaScript downloaded and available. The Solace Systems Web Messaging API for JavaScript distribution package can be [downloaded here]({{ site.links-downloads }}){:target="_top"}. The Web Messaging API for JavaScript is distributed as a zip file containing the required JavaScript files, API documentation, and examples. The instructions in this tutorial assume you have downloaded the Web Messaging API for JavaScript library and unpacked it to a known location.

## Loading Solace Systems Web Messaging API for JavaScript

To load the Solace Systems Web Messaging API for JavaScript on your HTML page simply include the `lib/solclient.js` file from the distribution.

~~~HTML
<head>
    <script src="lib/solclient.js"></script>
</head>
~~~

Use the debug version of the API in `lib/solclient-debug.js` file instead, if you’re planning to see console log messages and/or debug it.

~~~HTML
<head>
    <script src="lib/solclient-debug.js"></script>
</head>
~~~

If the debug version is used, it is necessary to initialize `solace.SolclientFactory` with required level of logging like so:

~~~javascript
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.logLevel = solace.LogLevel.INFO;
solace.SolclientFactory.init(factoryProps);
~~~

