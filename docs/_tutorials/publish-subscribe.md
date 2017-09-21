---
layout: tutorials
title: Publish/Subscribe
summary: Learn the basis for any publish / subscribe message exchange 
icon: publish-subscribe.png
---

This tutorial will introduce you to the fundamentals of the Solace Web Messaging API for JavaScript by connecting a client, adding a topic subscription and sending a message matching this topic subscription. This forms the basis for any publish / subscribe message exchange illustrated here:  

![]({{ site.baseurl }}/images/publish-subscribe.png)

## Assumptions

This tutorial assumes the following:

*   You are familiar with Solace [core concepts]({{ site.docs-core-concepts }}){:target="_top"}.

```************** Note: expand with DataGo options **************```

*   You have access to a running Solace message router with the following configuration:
    *   Enabled message VPN
    *   Enabled client username

One simple way to get access to a Solace message router is to start a Solace VMR load [as outlined here]({{ site.docs-vmr-setup }}){:target="_top"}. By default the Solace VMR will run with the “default” message VPN configured and ready for messaging. Going forward, this tutorial assumes that you are using the Solace VMR. If you are using a different Solace message router configuration, adapt the instructions to match your configuration.

## Goals

The goal of this tutorial is to demonstrate the most basic messaging interaction using Solace. This tutorial will show you:

1.  How to build and send a message on a topic
2.  How to subscribe to a topic and receive a message

## Solace message router properties

In order to send or receive messages to a Solace message router, you need to know a few details of how to connect to the Solace message router. Specifically you need to know the following:

<table>
<tbody>
<tr>
<td>Resource</td>
<td>Value</td>
<td>Description</td>
</tr>
<tr>
<td>Host</td>
<td>String of the form <code>DNS name</code> or <code>IP:Port</code></td>
<td>This is the address clients use when connecting to the Solace message router to send and receive messages. For a Solace VMR this there is only a single interface so the IP is the same as the management IP address.
For Solace message router appliances this is the host address of the message-backbone.
</td>
</tr>
<tr>
<td>Message VPN</td>
<td>String</td>
<td>The Solace message router Message VPN that this client should connect to. For the Solace VMR the simplest option is to use the “default” message-vpn which is fully enabled for message traffic.</td>
</tr>
<tr>
<td>Client Username</td>
<td>String</td>
<td>The client username. For the Solace VMR default message VPN, authentication is disabled by default, so this can be any value.</td>
</tr>
<tr>
<td>Client Password</td>
<td>String</td>
<td>The client password. For the Solace VMR default message VPN, authentication is disabled by default, so this can be any value.</td>
</tr>
</tbody>
</table>

This information will be need to be passed as parameters to the input fields of the samples as described in the "Running the Samples" section below.

## Obtaining the Solace API

This tutorial depends on you having the Solace Web Messaging API for JavaScript downloaded and available. The Solace Web Messaging API for JavaScript distribution package can be [downloaded here]({{ site.links-downloads }}){:target="_top"}. The Web Messaging API for JavaScript is distributed as a zip file containing the required JavaScript library files and API documentation. The instructions in this tutorial assume you have downloaded the Web Messaging API for JavaScript library and unpacked it to a known location.

The API Reference is available online at the [Web Messaging API for JavaScript documentation]({{ site.docs-api-reference }}){:target="_top"}.

## Trying it yourself

This tutorial is available in [GitHub]({{ site.repository }}){:target="_blank"} along with the other [Solace Developer Getting Started Examples]({{ site.links-get-started }}){:target="_top"}.

At the end, this tutorial walks through downloading and running the sample from source.

## Loading and Initializing the Solace Node.js API

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

The first step to use the API is to initialize the `SolclientFactory`, which is the first entry point to the API. Use the latest `version10` default settings profile to unlock all Solace Node.js API features.

```javascript
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);
```

If the debug version has been loaded the required level of logging can be set like so:

```javascript
solace.SolclientFactory.setLogLevel(solace.LogLevel.DEBUG);
```

## Connecting to the Solace message router

In order to send or receive messages, an application must connect a Solace session. The Solace session is the basis for all client communication with the Solace message router.

The `solace.SolclientFactory` is used to create Solace session from a set of `SessionProperties`.

Then listeners are defined for Session Events of interest and for receiving direct messages, which are explained in the next sections. 

The created session connects to the Solace message router with the `session.connect()` call.

This tutorial’s sample code comes as two separated applications: one (with the “publisher” object) publishes messages to a specific topic and the other (with the “subscriber” object) subscribes to messages on that topic, and receives the messages.

The following is an example of session creating and connecting to the Solace message router for the publisher. The subscriber’s code will be exactly the same.

```javascript
var sessionProperties = new solace.SessionProperties();
sessionProperties.url = 'ws://' + host;
sessionProperties.vpnName = vpn;
sessionProperties.userName = username;
sessionProperties.password = password;
// create session
publisher.session = solace.SolclientFactory.createSession(sessionProperties);
// define session event listeners
    /*...see section Session Events...*/
// define message event listeners
    /*...see section Receiving a message...*/
// connect the session
try {
    publisher.session.connect();
} catch (error) {
    publisher.log(error.toString());
}
```

At this point your browser is connected as a client to the Solace message router. You can use SolAdmin to view this client connection and related details.

## Session Events

The Solace Web Messaging API for JavaScript communicates changes in status and results of connect and subscription calls through emitting session events with certain event names.

It is necessary to wire your application logic to events through listeners to take appropriate action. The most important events are:

*   `SessionEventCode.UP_NOTICE`: success connecting session to the Solace message router
*   `SessionEventCode.DISCONNECTED`: session was disconnected from the Solace message router
*   `SessionEventCode.SUBSCRIPTION_OK`: subscription to a topic was successfully created on the Solace message router

This is how event listeners can be defined in the sample publisher:

```javascript
publisher.session = solace.SolclientFactory.createSession(sessionProperties);
// define session event listeners
publisher.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
                                          
    publisher.log('=== Successfully connected and ready to publish messages. ===');
    publisher.publish();
    publisher.exit();
});
publisher.session.on(solace.SessionEventCode.CONNECTING, (sessionEvent) => {
    publisher.log('Connecting...');
});
publisher.session.on(solace.SessionEventCode.DISCONNECTED, (sessionEvent) => {
    publisher.log('Disconnected.');
    if (publisher.session !== null) {
        publisher.session.dispose();
        publisher.session = null;
                                         
    }
});
```

Note that the application logic can be triggered only after receiving the `solace.SessionEventCode.UP_NOTICE` event:

```javascript
publisher.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
    publisher.log('=== Successfully connected and ready to publish messages. ===');
    publisher.publish();
    publisher.exit();
});
```

On the subscriber side we also might want to implement reaction to subscription error and to subscription added or removed:

```javascript
subscriber.session = solace.SolclientFactory.createSession(sessionProperties);
// define session event listeners
subscriber.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
    /*...SNIP...*/
                                         
subscriber.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
    subscriber.log('Cannot subscribe to topic: ' + sessionEvent.correlationKey);
});
subscriber.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function (sessionEvent) {
    if (subscriber.subscribed) {
        subscriber.subscribed = false;
        subscriber.log('Successfully unsubscribed from topic: ' + sessionEvent.correlationKey);
    } else {
        subscriber.subscribed = true;
        subscriber.log('Successfully subscribed to topic: ' + sessionEvent.correlationKey);
        subscriber.log('=== Ready to receive messages. ===');
                                                                             
    }
});
```

The subscriber application logic is also triggered only after receiving the `solace.SessionEventCode.UP_NOTICE` event:

```javascript
subscriber.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
    subscriber.log('=== Successfully connected and ready to subscribe. ===');
    subscriber.subscribe();
});
```

See the [Web Messaging API Concepts: “Handling session events”]({{ site.docs-session-events }}){:target="_top"} documentation for the full list of session event codes.

## Receiving a message

This tutorial uses “Direct” messages which are at most once delivery messages. So first, let’s express interest in the messages by subscribing to a Solace topic. Then you can look at publishing a matching message and see it received.

![pub-sub-receiving-message]({{ site.baseurl }}/images/pub-sub-receiving-message-300x134.png)

With a subscriber session created in the previous step, we declare a message event listener.

```javascript
publisher.session = solace.SolclientFactory.createSession(sessionProperties);
// define session event listeners
    /*...see section Session Events...*/
// define message event listener
subscriber.session.on(solace.SessionEventCode.MESSAGE, function (message) {
    subscriber.log('Received message: "' + message.getBinaryAttachment() + '", details:\n' + message.dump());
        '", details:\n' + message.dump());
});
// connect the session
```

When a message is received, this listener is called with the message as one of the parameters.

You must subscribe to a topic in order to express interest in receiving messages. This tutorial uses the topic _“tutorial/topic”_.

```javascript
subscriber.subscribe = function () {
/*...SNIP...*/
    try {
        subscriber.session.subscribe(
            solace.SolclientFactory.createTopic("tutorial/topic"),
            true,
            "tutorial/topic",
            10000
        );
    } catch (error) {
        subscriber.log(error.toString());
    }
/*...SNIP...*/
}
```

Notice parameters to the session `subscribe` function.

*   __The first parameter__ is the subscription topic.
*   __The second (Boolean) parameter__ specifies whether a corresponding events will be generated when the subscription is added successfully.
*   __The third parameter__ is the correlation key. This parameters value will be returned to the `SUBSCRIPTION_OK` session event listener for as the `correlationKey` property of the event: `event.correlationKey`.
*   __The last, fourth parameter__ is the function call timeout. The timeout sets the limit in milliseconds the `subscribe` function is allowed to block the execution thread. If this limit is reached and the subscription is still not added, then an exception is thrown.

After the subscription is successfully added the subscriber is ready to receive messages and nothing happens until a message is received.

## Sending a message

Now it is time to send a message to the waiting consumer.

![pub-sub-receiving-message]({{ site.baseurl }}/images/pub-sub-sending-message-300x134.png)

### Creating and sending the message

To send a message, you must create a message and a topic. Both of these are created from the `solace.SolclientFactory`.

This tutorial uses “Direct” messages which are at most once delivery messages and will send a message with Text contents “Sample Message”.

This is how it is done in the sample publisher code:

```javascript
var messageText = 'Sample Message';
var message = solace.SolclientFactory.createMessage();
publisher.log('Publishing message "' + messageText + '" to topic "tutorial/topic"...');
message.setDestination(solace.SolclientFactory.createTopic("tutorial/topic"));
message.setBinaryAttachment(messageText);
message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
if (publisher.session !== null) {
    try {
        publisher.session.send(message);
        publisher.log('Message published.');
    } catch (error) {
        publisher.log(error.toString());
    }
} else {
    publisher.log('Cannot publish because not connected to Solace message router.');
}
```

At this point a message to the Solace message router has been sent and your waiting consumer will have received the message and printed its contents to the web page and JavaScript debug console.

## Integrating the code into a web application

The samples consist of two separate publisher and subscriber browser applications, each comes as a pair: one HTML file and one JavaScript file that is loaded by the HTML file.

JavaScript functions get connected to HTML buttons when the browser window loads (`window.onload`) as follows.

In the publisher (`TopicPublisher.html`):

```
document.getElementById("connect").addEventListener("click", publisher.connect);
document.getElementById("disconnect").addEventListener("click", publisher.disconnect);
document.getElementById("publish").addEventListener("click", publisher.publish);
```

In the subscriber (`TopicSubscriber.html`):

```
document.getElementById("connect").addEventListener("click", subscriber.connect);
document.getElementById("disconnect").addEventListener("click", subscriber.disconnect);
document.getElementById("subscribe").addEventListener("click", subscriber.subscribe);
document.getElementById("unsubscribe").addEventListener("click", subscriber.unsubscribe);
```

## Summarizing

The full source code for this example is available in [GitHub]({{ site.repository }}){:target="_blank"}. If you combine the example source code shown above results in the following source:

*   [TopicPublisher.html]({{ site.repository }}/blob/master/src/basic-samples/TopicPublisher/TopicPublisher.html)
*   [TopicPublisher.js]({{ site.repository }}/blob/master/src/basic-samples/TopicPublisher/TopicPublisher.js)
*   [TopicSubscriber.html]({{ site.repository }}/blob/master/basic-samples/src/TopicSubscriber/TopicSubscriber.html)
*   [TopicSubscriber.js]({{ site.repository }}/blob/master/src/basic-samples/TopicSubscriber/TopicSubscriber.js)


### Getting the Source

Clone the GitHub repository containing the Solace samples.

```
git clone https://github.com/SolaceSamples/solace-samples-javascript
cd {{ site.baseurl | remove: '/'}}
```

### Installing the Web Messaging API for JavaScript

It is assumed that the `lib` directory containing the API libraries will be installed at the root of the cloned `solace-samples-javascript` repository:

```bash
cp -R <path_to_unzipped_API_distribution_package>/lib/ .
```

### Running the Samples

The samples consist of two separate requestor and replier browser applications, each comes as a pair: one HTML file and one JavaScript file that is loaded by the HTML file.

**Sample Output**

First open `src/basic-samples/TopicSubscriber/TopicSubscriber.html` page in the browser and connect to a Solace router by specifying the message router properties and clicking “Connect” button.

Then subscribe to the subscription topic by clicking the “Subscribe” button.

The following is a screenshot of the tutorial’s `TopicSubscriber.html` web page with the JavaScript debug console open in the Firefox browser. It captures the page after it was loaded and the “Connect” button was clicked and then the “Subscribe” button was clicked.

![]({{ site.baseurl }}/images/pubsub-javascript_img-1.png)

Now, open `src/basic-samples/TopicPublisher/TopicPublisher.html` page in the browser and connect to the same Solace router by specifying the message router properties and clicking “Connect” button.

Publish messages by clicking the “Publish Message” button on the _TopicPublisher/TopicPublisher.html_ page.

The following screenshots of the tutorial’s `TopicPublisher.html` and `TopicSubscriber.html` web pages with the JavaScript debug console open in the Firefox browser. It captures the pages after a message was published and received.

This is the publisher is publishing a message (`TopicPublisher.html)`:

![]({{ site.baseurl }}/images/pubsub-javascript_img-2.png)

This is the subscriber is receiving a message (`TopicSubscriber.html)`:

![]({{ site.baseurl }}/images/pubsub-javascript_img-3.png)

With that you now know how to successfully implement publish-subscribe message exchange pattern using Direct messages.

If you have any issues publishing and receiving a message, check the [Solace community Q&A]({{ site.links-community }}){:target="_top"} for answers to common issues seen.