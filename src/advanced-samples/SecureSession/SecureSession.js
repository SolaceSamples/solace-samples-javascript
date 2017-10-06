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
 * Secure Session tutorial - Topic Subscriber
 * Demonstrates using ssl to connect to the message router
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var TopicSubscriber = function (topicName) {
    "use strict";
    var subscriber = {};
    subscriber.session = null;
    subscriber.topicName = topicName;
    subscriber.subscribed = false;
    subscriber.iframeRequested = false;

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

    // Establishes connection to Solace router
    subscriber.connect = function () {
        if (subscriber.session !== null) {
            subscriber.log('Already connected and ready to subscribe.');
        } else {
            var host = document.getElementById('host').value;
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;
            var vpn = document.getElementById('message-vpn').value;
            if (host && vpn && username && password) {
                subscriber.connectToSolace(host, username, password, vpn);
            } else {
                subscriber.log('Cannot connect: please specify all the Solace message router properties.');
            }
        }
    };

    subscriber.connectToSolace = function (host, username, password, vpn) {
        var sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'wss://' + host;
        subscriber.log('Connecting to Solace message router using WebSocket transport url wss://' + host);
        sessionProperties.vpnName = vpn;
        subscriber.log('Solace message router VPN name: ' + sessionProperties.vpnName);
        sessionProperties.userName = username;
        subscriber.log('Client username: ' + sessionProperties.userName);
        sessionProperties.password = password;
        // set client certificate authentication
        // sessionProperties.authenticationScheme = solace.AuthenticationScheme.BASIC;
        sessionProperties.connectTimeoutInMsecs = 25000;
        // trigger the browser to prompt for client certificate selection
        document.getElementById('iframe').src = 'https://' + host + '/crossdomain.xml';
        subscriber.iframeRequested = true;
        // create session
        try {
            subscriber.session = solace.SolclientFactory.createSession(sessionProperties);
        } catch (error) {
            producer.log(error.toString());
        }
        // stop here, iframe loaded is a pre-requisite for completion of connect
    };

    subscriber.iframeLoaded = function () {
        if (!subscriber.iframeRequested) {
            return;
        }
        subscriber.log('Loaded the iframe.');
        // define session event handlers
        subscriber.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            subscriber.log('=== Successfully connected and ready to subscribe. ===');
        });
        subscriber.session.on(solace.SessionEventCode.CONNECTING, function (sessionEvent) {
            subscriber.log('Connecting...');
            subscriber.subscribed = false;
        });
        subscriber.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            subscriber.log('Disconnected.');
            subscriber.subscribed = false;
            if (subscriber.session !== null) {
                subscriber.session.dispose();
                subscriber.session = null;
            }
        });
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
        // define message event handler
        subscriber.session.on(solace.SessionEventCode.MESSAGE, function (message) {
            subscriber.log('Received message: "' + message.getBinaryAttachment() + '", details:\n' + message.dump());
        });
        // connect the session
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
