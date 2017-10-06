---
layout: tutorials
title: Persistence with Queues
summary: Learn how to set up persistence for guaranteed delivery.
icon: persistence-tutorial.png
---

This tutorial builds on the basic concepts introduced in the [publish/subscribe tutorial]({{ site.baseurl }}/publish-subscribe), and will show you how to send and receive persistent messages from a Solace message router queue in a point to point fashion.

![]({{ site.baseurl }}/images/persistence-tutorial.png)

## Assumptions

This tutorial assumes the following:

*   You are familiar with Solace [core concepts]({{ site.docs-core-concepts }}){:target="_top"}.

```************** Note: expand with DataGo options **************```

*   You have access to a running Solace message router with the following configuration:
    *   Enabled message VPN
    *   Enabled client username

One simple way to get access to a Solace message router is to start a Solace VMR load [as outlined here]({{ site.docs-vmr-setup }}){:target="_top"}. By default the Solace VMR will run with the “default” message VPN configured and ready for messaging. Going forward, this tutorial assumes that you are using the Solace VMR. If you are using a different Solace message router configuration, adapt the instructions to match your configuration.

## Goals

The goal of this tutorial is to understand the following:

1.  How to send a persistent message to a Solace queue
2.  How to bind to this queue and receive a persistent message

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

## Creating a durable queue on the Solace message router

A difference to the publish/subscribe tutorial is that here a physical endpoint resource – a durable queue, associated with the Queue Destination – needs to be created on the Solace message router, which will persist the messages until consumed.

You can use SolAdmin to create a durable queue. This tutorial assumes that the queue named `tutorial/queue` has been created.

```************** Note: expand **************```

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

## Implementing Persistent Messaging

For persistent messaging, we will use a "producer" to send messages to and a "consumer" to receive messages from a durable queue configured on the Solace message router. The producer will use a `PublisherFlow` object to send, and the consumer will bind to a queue destination and use a `SubscriberFlow` object to receive guaranteed messages.

### Connecting to the Solace message router

Similarly to the publish/subscribe tutorial, an application must connect a Solace session. The Solace session is the basis for all client communication with the Solace message router.

The `solace.SolclientFactory` is used to create Solace session from a set of `SessionProperties`.

The following is an example of session creating and connecting to the Solace message router for the producer. Notice that additionally to the `sessionProperties` fields defining Solace message router properties, the `publisherProperties` field must be set to enabled to __send__ durable messages.  This is not required for the consumer's code.

Compared to the publish/subscribe tutorial, it is also not required to specify a message event listener for the `Session` object. Guaranteed messages are delivered to event listeners defined for the `SubscriberFlow` object instead.

```javascript
var sessionProperties = new solace.SessionProperties();
sessionProperties.url = 'ws://' + host;
sessionProperties.vpnName = vpn;
sessionProperties.userName = username;
sessionProperties.password = password;
sessionProperties.publisherProperties = new solace.PublisherFlowProperties({enabled: true});
// create session
producer.session = solace.SolclientFactory.createSession(sessionProperties);
// define session event listeners
    /*...see section Session Events...*/
// connect the session
try {
    producer.session.connect();
} catch (error) {
    producer.log(error.toString());
}
```

At this point your Node.js application is connected as a client to the Solace message router. You can use SolAdmin to view this client connection and related details.

### Session Events

The Solace Node.js API communicates changes in status and results of connect calls through emitting session events with certain event names.

It is necessary to wire your application logic to events through listeners to take appropriate action. The most important events are:

*   `SessionEventCode.UP_NOTICE`: success connecting session to the Solace message router
*   `SessionEventCode.DISCONNECTED`: session was disconnected from the Solace message router

This is how event listeners can be defined in the sample producer and the sample consumer is very similar:

```JavaScript
// define session event handlers
producer.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
    producer.log('=== Successfully connected and ready to send messages. ===');
    producer.sendMessage();
    producer.exit();
});
producer.session.on(solace.SessionEventCode.CONNECTING, (sessionEvent) => {
    producer.log('Connecting...');
});
producer.session.on(solace.SessionEventCode.DISCONNECTED, (sessionEvent) => {
    producer.log('Disconnected.');
    if (producer.session !== null) {
        producer.session.dispose();
        producer.session = null;
    }
});
```
Note that the application logic can be triggered only after receiving the `solace.SessionEventCode.UP_NOTICE` event.


### Sending a message to a queue

Now it is time to send a message to the queue. 

![sending-message-to-queue]({{ site.baseurl }}/images/sending-message-to-queue-300x160.png)

Remember to enable `publisherProperties` for `sessionProperties` as discussed above:

```
sessionProperties.publisherProperties = new solace.PublisherFlowProperties({enabled: true});
```

The actual method calls to create and send persistent messages to a queue is like for direct messages in the publish/subscribe tutorial. The differences are that:
* a QUEUE type destination is created and used; and
* the delivery mode is set to PERSISTENT.

```JavaScript
var messageText = 'Sample Message';
var message = solace.SolclientFactory.createMessage();
message.setDestination(new solace.Destination(producer.queueName, solace.DestinationType.QUEUE));
message.setBinaryAttachment(messageText);
message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
try {
    producer.session.send(message);
    producer.log('Message sent.');
} catch (error) {
    producer.log(error.toString());
}
```

At this point the producer has sent a message to the Solace message router and it will be waiting for your consumer on the queue.

### Receiving a message from a queue

Now it is time to receive the messages sent to your queue.

![]({{ site.baseurl }}/images/receiving-message-from-queue-300x160.png)

Receiving persistent messages is different from the direct messaging case described in the the publish/subscribe tutorial.

To receive persistent messages, a `SubscriberFlow` object needs to be created and connected so it will bind to the destination queue and can start receiving messages.

```JavaScript
consumer.destination = new solace.Destination(consumer.queueName, solace.DestinationType.QUEUE);
// Create a flow
consumer.flow = consumer.session.createSubscriberFlow(new solace.SubscriberFlowProperties({
    endpoint: {
        destination: consumer.destination,
    },
}));
```

Flow related events will be sent to the event listeners defined for the `SubscriberFlow`. The most important flow events are:

*   `FlowEventName.UP`: the flow has successfully bound to the destination and ready to receive messages
*   `FlowEventName.BIND_FAILED_ERROR`: the flow has not been able to bind to the destination
*   `FlowEventName.DOWN`: a previously active flow is no longer bound to the destination

```JavaScript
// Define flow event listeners
consumer.flow.on(solace.FlowEventName.UP, function () {
    consumer.consuming = true;
    consumer.log('=== Ready to receive messages. ===');
});
consumer.flow.on(solace.FlowEventName.BIND_FAILED_ERROR, function () {
    consumer.consuming = false;
    consumer.log("=== Error: the flow couldn't bind to queue " + consumer.queueName + " ===");
});
consumer.flow.on(solace.FlowEventName.DOWN, function () {
    consumer.consuming = false;
    consumer.log('=== An error happened, the flow is down ===');
});
```

Message received events will be sent to the message listener defined for the flow.

```JavaScript
// Define message event listener
consumer.flow.on(solace.FlowEventName.MESSAGE, function onMessage(message) {
    consumer.log('Received message: "' + message.getBinaryAttachment() + '",' +
        ' details:\n' + message.dump());
});
// Connect the flow
consumer.flow.connect();
```

Note that flows can only be created and connected after receiving the `solace.SessionEventCode.UP_NOTICE` event:

```JavaScript
consumer.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
    consumer.log('=== Successfully connected and ready to start the message consumer. ===');
    consumer.createAndConnectFlow();
});
```

## Summarizing

The full source code for this example is available in [GitHub]({{ site.repository }}){:target="_blank"}. If you combine the example source code shown above results in the following source:

*   [QueueProducer.html]({{ site.repository }}/blob/master/src/basic-samples/QueueProducer/QueueProducer.html)
*   [QueueProducer.js]({{ site.repository }}/blob/master/src/basic-samples/QueueProducer/QueueProducer.js)
*   [QueueConsumer.html]({{ site.repository }}/blob/master/basic-samples/src/QueueConsumer/QueueConsumer.html)
*   [QueueConsumer.js]({{ site.repository }}/blob/master/src/basic-samples/QueueConsumer/QueueConsumer.js)

### Getting the Source

Clone the GitHub repository containing the Solace samples.

```
git clone {{ site.repository }}
cd {{ site.baseurl | remove: '/'}}
```

### Installing the Web Messaging API for JavaScript

It is assumed that the `lib` directory containing the API libraries will be installed at the root of the cloned `solace-samples-javascript` repository:

```bash
cp -R <path_to_unzipped_API_distribution_package>/lib/ .
```

### Running the Samples

The samples consist of two separate producer and consumer browser applications, each comes as a pair: one HTML file and one JavaScript file that is loaded by the HTML file.

**Sample Output**

First open `src/basic-samples/QueueConsumer/QueueConsumer.html` page in the browser and connect to a Solace router by specifying the message router properties and clicking “Connect” button.

Then bound to the destination queue by clicking the “Consume messages” button.

The following is a screenshot of the tutorial’s `QueueConsumer.html` web page with the JavaScript debug console open in the Firefox browser. It captures the page after it was loaded and the “Connect” button was clicked and then the “Consume messages” button was clicked.

![]({{ site.baseurl }}/images/perswithqueues-javascript_img-1.png)

Now, open `src/basic-samples/QueueProducer/QueueProducer.html` page in the browser and connect to the same Solace router by specifying the message router properties and clicking “Connect” button.

Send messages by clicking the “Send Message” button on the page.

The following screenshots of the tutorial’s `QueueProducer.html` and `QueueConsumer.html` web pages with the JavaScript debug console open in the Firefox browser. It captures the pages after a message was sent and received.

This is the producer is sending a message (`QueueProducer.html)`:

![]({{ site.baseurl }}/images/perswithqueues-javascript_img-2.png)

This is the consumer is receiving a message (`QueueConsumer.html)`:

![]({{ site.baseurl }}/images/perswithqueues-javascript_img-3.png)

You have now successfully connected a client, sent persistent messages to a queue and received them from a consumer flow.

If you have any issues sending and receiving a message, check the [Solace community]({{ site.links-community }}){:target="_top"} for answers to common issues.
