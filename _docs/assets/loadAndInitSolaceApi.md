
## Loading and Initializing the Solace JavaScript API

To load the Solace Web Messaging API for JavaScript on your HTML page simply include the `solclient.js` file from the distribution.

~~~HTML
<head>
     <script src="../../../lib/solclient.js"></script>
</head>
~~~

Use the debug version of the API in `lib/solclient-debug.js` file instead, if you’re planning to see console log messages and/or debug it.

~~~HTML
<head>
    <script src="../../../lib/solclient-debug.js"></script>
</head>
~~~

Then initialize the `SolclientFactory`, which is the first entry point to the API. Add the following to initialize with the latest `version10` behavior profile to run with the default property values that Solace recommends at the time of the version 10 release.

```javascript
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);
```

If the debug version of the API has been loaded the required level of logging can be set like so:

```javascript
solace.SolclientFactory.setLogLevel(solace.LogLevel.DEBUG);
```
