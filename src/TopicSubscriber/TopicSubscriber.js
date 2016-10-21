/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Solace Systems Web Messaging API for JavaScript
 * PublishSubscribe tutorial - Topic Subscriber
 * Demonstrates subscribing to a topic for direct messages and receiving messages
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var TopicSubscriber = function (topicName) {
    "use strict";
    var subscriber = {};
    subscriber.session = null;
    subscriber.topicName = topicName;
    subscriber.subscribed = false;

    // Logger
    subscriber.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2), ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById('log');
        logTextArea.value += timestamp + line + '\n';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    subscriber.log('\n*** Subscriber to topic "' + subscriber.topicName + '" is ready to connect ***');

    // Callback for message events
    subscriber.messageEventCb = function (session, message) {
        subscriber.log('Received message: "' + message.getBinaryAttachment() + '"');
    };

    // Callback for session events
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

    // Establishes connection to Solace router
    subscriber.connect = function () {
        if (subscriber.session !== null) {
            subscriber.log('Already connected and ready to subscribe.');
        } else {
            var host = document.getElementById('host').value;
            if (host) {
                subscriber.connectToSolace(host);
            } else {
                subscriber.log('Cannot connect: please specify the Solace router web transport URL.');
            }
        }
    };

    subscriber.connectToSolace = function (host) {
        subscriber.log('Connecting to Solace router web transport URL ' + host + '.');
        var sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'ws://' + host;
        // NOTICE: the Solace router VPN name
        sessionProperties.vpnName = 'default';
        subscriber.log('Solace router VPN name: ' + sessionProperties.vpnName);
        // NOTICE: the client username
        sessionProperties.userName = 'tutorial';
        subscriber.log('Client username: ' + sessionProperties.userName);
        subscriber.session = solace.SolclientFactory.createSession(
            sessionProperties,
            new solace.MessageRxCBInfo(function (session, message) {
                // calling callback for message events
                subscriber.messageEventCb(session, message);
            }, subscriber),
            new solace.SessionEventCBInfo(function (session, event) {
                // calling callback for session events
                subscriber.sessionEventCb(session, event);
            }, subscriber)
        );
        try {
            subscriber.session.connect();
        } catch (error) {
            subscriber.log(error.toString());
        }
    };

    // Gracefully disconnects from Solace router
    subscriber.disconnect = function () {
        subscriber.log('Disconnecting from Solace router...');
        if (subscriber.session !== null) {
            try {
                subscriber.session.disconnect();
                subscriber.session.dispose();
                subscriber.session = null;
            } catch (error) {
                subscriber.log(error.toString());
            }
        } else {
            subscriber.log('Not connected to Solace router.');
        }
    };

    // Subscribes to topic on Solace Router
    subscriber.subscribe = function () {
        if (subscriber.session !== null) {
            if (subscriber.subscribed) {
                subscriber.log('Already subscribed to "' + subscriber.topicName + '" and ready to receive messages.');
            } else {
                subscriber.log('Subscribing to topic: ' + subscriber.topicName);
                try {
                    subscriber.session.subscribe(
                        solace.SolclientFactory.createTopic(subscriber.topicName),
                        true, // generate confirmation when subscription is added successfully
                        subscriber.topicName, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    subscriber.log(error.toString());
                }
            }
        } else {
            subscriber.log('Cannot subscribe because not connected to Solace router.');
        }
    };

    // Unsubscribes from topic on Solace Router
    subscriber.unsubscribe = function () {
        if (subscriber.session !== null) {
            if (subscriber.subscribed) {
                subscriber.log('Unsubscribing from topic: ' + subscriber.topicName);
                try {
                    subscriber.session.unsubscribe(
                        solace.SolclientFactory.createTopic(subscriber.topicName),
                        true, // generate confirmation when subscription is removed successfully
                        subscriber.topicName, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    subscriber.log(error.toString());
                }
            } else {
                subscriber.log('Cannot unsubscribe because not subscribed to the topic "' + subscriber.topicName + '"');
            }
        } else {
            subscriber.log('Cannot unsubscribe because not connected to Solace router.');
        }
    };

    return subscriber;
};
