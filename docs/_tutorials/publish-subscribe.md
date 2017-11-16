---
layout: tutorials
title: Publish-Subscribe
summary: Learn the basis for any publish / subscribe message exchange
icon: I_dev_P+S.svg
links:
    - label: TopicPublisher.html
      link: /blob/master/src/TopicPublisher/TopicPublisher.html
    - label: TopicPublisher.js
      link: /blob/master/src/TopicPublisher/TopicPublisher.js
    - label: TopicSubscriber.html
      link: /blob/master/src/TopicSubscriber/TopicSubscriber.html
    - label: TopicSubscriber.js
      link: /blob/master/src/TopicSubscriber/TopicSubscriber.js
---

This tutorial will introduce you to the fundamentals of the Solace API by connecting a client, adding a topic subscription and sending a message matching this topic subscription. This forms the basis for any publish / subscribe message exchange.

## Assumptions

This tutorial assumes the following:

*   You are familiar with Solace [core concepts]({{ site.docs-core-concepts }}){:target="_top"}.
*   You have access to Solace messaging with the following configuration details:
    *   Connectivity information for a Solace message-VPN
    *   Enabled client username and password

{% if jekyll.environment == 'solaceCloud' %}
One simple way to get access to Solace messaging quickly is to create a messaging service in Solace Cloud [as outlined here]({{ site.links-solaceCloud-setup}}){:target="_top"}. You can find other ways to get access to Solace messaging below.
{% else %}
One simple way to get access to a Solace message router is to start a Solace VMR load [as outlined here]({{ site.docs-vmr-setup }}){:target="_top"}. By default the Solace VMR will with the “default” message VPN configured and ready for guaranteed messaging. Going forward, this tutorial assumes that you are using the Solace VMR. If you are using a different Solace message router configuration adapt the tutorial appropriately to match your configuration.
{% endif %}

## Goals

The goal of this tutorial is to demonstrate the most basic messaging interaction using Solace. This tutorial will show you:

1.  How to build and send a message on a topic
2.  How to subscribe to a topic and receive a message

{% if jekyll.environment == 'solaceCloud' %}
    {% include solaceMessaging-cloud.md %}
{% else %}
    {% include solaceMessaging.md %}
{% endif %}  
{% include solaceApi.md %}

## Connecting to the Solace message router

In order to send or receive messages, an application must connect a Solace session. The Solace session is the basis for all client communication with the Solace message router.

The `solace.SolclientFactory` is used to create Solace session from a set of `SessionProperties`.

Notice the two mandatory callbacks in the `createSession()` call. The first one (of `solace.MessageRxCBInfo` type) is the message event callback. It receives messages. The second one (of `solace.SessionEventCBInfo` type) is the session event callback. It receives events indicating the Solace session connected, disconnected, ready for publishing messages or subscribing to a topic or encountered an error.

The created session connects to the Solace router with the `session.connect()` call.

This tutorial’s sample code comes as two separated applications: one (with the “publisher” object) publishes messages to a specific topic and the other (with the “subscriber” object) subscribes to messages on that topic, and receives the messages.

The following is an example of session creating and connecting to the Solace router for the publisher. The subscriber’s code will be exactly the same.

~~~javascript
var sessionProperties = new solace.SessionProperties();
//Adds 'ws://' prefix to host if missing

sessionProperties.url = 'ws://' + host;
sessionProperties.vpnName = vpnname;
sessionProperties.userName = username;
sessionProperties.password = password;
publisher.session = solace.SolclientFactory.createSession(
    sessionProperties,
    new solace.MessageRxCBInfo(function (session, message) {
        publisher.messageEventCb(session, message);
    }, publisher),
    new solace.SessionEventCBInfo(function (session, event) {
        publisher.sessionEventCb(session, event);
    }, publisher)
);
try {
    publisher.session.connect();
} catch (error) {
    publisher.log(error.toString());
}
~~~

At this point your browser is connected as a client to the Solace message router. You can use SolAdmin to view this client connection and related details.

## Session Events

The Solace Systems Web Messaging API for JavaScript communicates changes in status and results of connect and subscription calls through the session callback of type `solace.SessionEventCBInfo`.

It is necessary to wire your application logic to events from this callback. The most important events are:

*   `SessionEventCode.UP_NOTICE`: success connecting session to the Solace router
*   `SessionEventCode.DISCONNECTED`: session was disconnected from the Solace router
*   `SessionEventCode.SUBSCRIPTION_OK`: subscription to a topic was successfully created on the Solace router

This is how this callback can be implemented in the sample publisher:

~~~javascript
publisher.sessionEventCb = function (session, event) {
    publisher.log(event.toString());
    if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
        publisher.log('=== Successfully connected and ready to publish messages. ===');
    } else if (event.sessionEventCode === solace.SessionEventCode.CONNECTING) {
        publisher.log('Connecting...');
    } else if (event.sessionEventCode === solace.SessionEventCode.DISCONNECTED) {
        publisher.log('Disconnected.');
        if (publisher.session !== null) {
            publisher.session.dispose();
            publisher.session = null;
        }
    }
};
~~~

On the subscriber side we also might want to implement reaction to subscription error and to subscription added or removed:

~~~javascript
subscriber.sessionEventCb = function (session, event) {
    subscriber.log(event.toString());
    if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
        subscriber.log('=== Successfully connected and ready to subscribe. ===');
    } else if (event.sessionEventCode === solace.SessionEventCode.CONNECTING) {
        subscriber.log('Connecting...');
        subscriber.subscribed = false;
    } else if (event.sessionEventCode === solace.SessionEventCode.DISCONNECTED) {
        subscriber.log('Disconnected.');
        subscriber.subscribed = false;
        if (subscriber.session !== null) {
            subscriber.session.dispose();
            subscriber.session = null;
        }
    } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_ERROR) {
        subscriber.log('Cannot subscribe to topic: ' + event.correlationKey);
    } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_OK) {
        if (subscriber.subscribed) {
            subscriber.subscribed = false;
            subscriber.log('Successfully unsubscribed from topic: ' + event.correlationKey);
        } else {
            subscriber.subscribed = true;
            subscriber.log('Successfully subscribed to topic: ' + event.correlationKey);
            subscriber.log('=== Ready to receive messages. ===');
        }
    }
};
~~~

See the [Web Messaging API Concepts: “Handling session events”]({{ site.docs-session-events }}){:target="_top"} documentation for the full list of session event codes.

## Receiving a message

This tutorial uses “Direct” messages which are at most once delivery messages. So first, let’s express interest in the messages by subscribing to a Solace topic. Then you can look at publishing a matching message and see it received.

![pub-sub-receiving-message]({{ site.baseurl }}/images/pub-sub-receiving-message-300x134.png)

With a subscriber session created and connected in the previous step, we declared the message event callback of `solace.MessageRxCBInfo` type that redirects its call to the `messageEventCb` function.

~~~javascript
subscriber.messageEventCb = function (session, message) {
    subscriber.log('Received message: "' + message.getBinaryAttachment() + '"');
};
<...SNIP...>
subscriber.session = solace.SolclientFactory.createSession(
    sessionProperties,
    new solace.MessageRxCBInfo(function (session, message) {
        subscriber.messageEventCb(session, message);
    }, subscriber),
<...SNIP...>
~~~

When a message is received, this `messageEventCb` function is called with the message as one of the parameters.

You must subscribe to a topic in order to express interest in receiving messages. This tutorial uses the topic `tutorial/topic`.

~~~javascript
subscriber.subscribe = function () {
<...SNIP...>
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
<...SNIP...>
~~~

Notice parameters to the session `subscribe` function.

*   The first parameter is the subscription topic.
*   The second (Boolean) parameter specifies whether a corresponding events will be generated when the subscription is added successfully.
*   The third parameter is the correlation key. This parameters value will be returned to the session event callback as the `correlationKey` property of the event (`event.correlationKey`).
*   The last, fourth parameter is the function call timeout. The timeout sets the limit in milliseconds the `subscribe` function is allowed to block the execution thread. If this limit is reached and the subscription is still not added, then an exception is thrown.

After the subscription is successfully added the subscriber is ready to receive messages and nothing happens until a message is received.

## Sending a message

Now it is time to send a message to the waiting consumer.

![pub-sub-receiving-message]({{ site.baseurl }}/images/pub-sub-sending-message-300x134.png)

## Creating and sending the message

To send a message, you must create a message and a topic. Both of these are created from the `solace.SolclientFactory`.

This tutorial uses “Direct” messages which are at most once delivery messages and will send a message with Text contents “Sample Message”.

This is how it is done in the sample publisher code:

~~~javascript
var messageText = 'Sample Message';
var message = solace.SolclientFactory.createMessage();
publisher.log('Publishing message "' + messageText + '" to topic "tutorial/topic"...');
message.setDestination(solace.SolclientFactory.createTopic("tutorial/topic");
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
    publisher.log('Cannot publish because not connected to Solace router.');
}
~~~

At this point a message to the Solace message router has been sent and your waiting consumer will have received the message and printed its contents to the web page and JavaScript debug console.

## Summarizing

Combining the example source code shown above results in the following source code files:

<ul>
{% for item in page.links %}
<li><a href="{{ site.repository }}{{ item.link }}" target="_blank">{{ item.label }}</a></li>
{% endfor %}
</ul>

### Running samples

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

### Sample Output

First open `TopicSubscriber/TopicSubscriber.html` page in the browser and connect to a Solace router by specifying the router’s connection properties and clicking “Connect” button.

The following is a screenshot of the tutorial’s `TopicSubscriber/TopicSubscriber.html` web page with the JavaScript debug console open in the Firefox browser. It captures the page after it was loaded and the “Connect” button was clicked.

![]({{ site.baseurl }}/images/pubsub-javascript_img-1.png)

Then subscribe to the subscription topic by clicking the “Subscribe” button.

The following is a screenshot of the tutorial’s `TopicSubscriber/TopicSubscriber.html` web page with the JavaScript debug console open in the Firefox browser. It captures the page after it was loaded and the “Connect” button was clicked and then the “Subscribe” button was clicked.

![]({{ site.baseurl }}/images/pubsub-javascript_img-2.png)

Now, open `TopicPublisher/TopicPublisher.html` page in the browser and connect to a Solace router specifying the router’s connection properties and clicking “Connect” button.

The following is a screenshot of the tutorial’s `TopicPublisher/TopicPublisher.html` web page with the JavaScript debug console open in the Firefox browser. It captures the page after it was loaded and the “Connect” button was clicked.

![]({{ site.baseurl }}/images/pubsub-javascript_img-3.png)

Publish messages by clicking the “Publish Message” button on the _TopicPublisher/TopicPublisher.html_ page.

The following screenshots of the tutorial’s `TopicPublisher/TopicPublisher.html` and `TopicSubscriber/TopicSubscriber.html` web pages with the JavaScript debug console open in the Firefox browser. It captures the page after a message was published and received.

This is the publisher is publishing a message (`TopicPublisher/TopicPublisher.html)`:

![]({{ site.baseurl }}/images/pubsub-javascript_img-4.png)

This is the subscriber is receiving a message (`TopicSubscriber/TopicSubscriber.html)`:

![]({{ site.baseurl }}/images/pubsub-javascript_img-5.png)

With that you now know how to successfully implement publish-subscribe message exchange pattern using Direct messages.

If you have any issues publishing and receiving a message, check the [Solace community Q&A]({{ site.links-community }}){:target="_top"} for answers to common issues seen.
