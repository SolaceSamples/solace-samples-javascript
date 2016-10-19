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
 * RequestReply tutorial - Basic Replier
 * Demonstrates sending a request and receiving a reply
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var BasicReplier = function (topicName) {
    "use strict";
    var replier = {};
    replier.session = null;
    replier.topicName = topicName;
    replier.subscribed = false;

    // Logger
    replier.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2), ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById('log');
        logTextArea.value += timestamp + line + '\n';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    replier.log('\n*** replier to topic "' + replier.topicName + '" is ready to connect ***');

    replier.reply = function (message) {
        replier.log('Received message: "' + message.getSdtContainer().getValue() + '", replying...');
        if (replier.session !== null) {
            var reply = solace.SolclientFactory.createMessage();
            var replyText = message.getSdtContainer().getValue() + " - Sample Reply";
            reply.setSdtContainer(solace.SDTField.create(solace.SDTFieldType.STRING, replyText));
            replier.session.sendReply(message, reply);
            replier.log('Replied.');
        } else {
            replier.log('Cannot reply: not connected to Solace message router.');
        }
    };

    // Callback for message events
    replier.messageEventCb = function (session, message) {
        try {
            replier.reply(message);
        } catch (error) {
            replier.log(error.toString());
        }
    };

    // Callback for session events
    replier.sessionEventCb = function (session, event) {
        replier.log(event.toString());
        if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
            replier.log('=== Successfully connected and ready to subscribe to request topic. ===');
        } else if (event.sessionEventCode === solace.SessionEventCode.CONNECTING) {
            replier.log('Connecting...');
            replier.subscribed = false;
        } else if (event.sessionEventCode === solace.SessionEventCode.DISCONNECTED) {
            replier.log('Disconnected.');
            replier.subscribed = false;
            if (replier.session !== null) {
                replier.session.dispose();
                replier.session = null;
            }
        } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_ERROR) {
            replier.log('Cannot subscribe to topic: ' + event.correlationKey);
        } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_OK) {
            if (replier.subscribed) {
                replier.subscribed = false;
                replier.log('Successfully unsubscribed from request topic: ' + event.correlationKey);
            } else {
                replier.subscribed = true;
                replier.log('Successfully subscribed to request topic: ' + event.correlationKey);
                replier.log('=== Ready to receive requests. ===');
            }
        }
    };

    // Establishes connection to Solace message router
    replier.connect = function () {
        if (replier.session !== null) {
            replier.log('Already connected and ready to subscribe to request topic.');
        } else {
            var host = document.getElementById('host').value;
            if (host) {
                replier.connectToSolace(host);
            } else {
                replier.log('Cannot connect: please specify the Solace message router web transport URL.');
            }
        }
    };

    replier.connectToSolace = function (host) {
        replier.log('Connecting to Solace message router web transport URL ' + host + '.');
        var sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'ws://' + host;
        // NOTICE: the Solace message router VPN name
        sessionProperties.vpnName = 'default';
        replier.log('Solace message router VPN name: ' + sessionProperties.vpnName);
        // NOTICE: the client username
        sessionProperties.userName = 'tutorial';
        replier.log('Client username: ' + sessionProperties.userName);
        replier.session = solace.SolclientFactory.createSession(
            sessionProperties,
            new solace.MessageRxCBInfo(function (session, message) {
                // calling callback for message events
                replier.messageEventCb(session, message);
            }, replier),
            new solace.SessionEventCBInfo(function (session, event) {
                // calling callback for session events
                replier.sessionEventCb(session, event);
            }, replier)
        );
        try {
            replier.session.connect();
        } catch (error) {
            replier.log(error.toString());
        }
    };

    // Gracefully disconnects from Solace message router
    replier.disconnect = function () {
        replier.log('Disconnecting from Solace message router...');
        if (replier.session !== null) {
            try {
                replier.session.disconnect();
                replier.session.dispose();
                replier.session = null;
            } catch (error) {
                replier.log(error.toString());
            }
        } else {
            replier.log('Not connected to Solace message router.');
        }
    };

    // Subscribes to request topic on Solace message router
    replier.subscribe = function () {
        if (replier.session !== null) {
            if (replier.subscribed) {
                replier.log('Already subscribed to "' + replier.topicName + '" and ready to receive messages.');
            } else {
                replier.log('Subscribing to topic: ' + replier.topicName);
                try {
                    replier.session.subscribe(
                        solace.SolclientFactory.createTopic(replier.topicName),
                        true, // generate confirmation when subscription is added successfully
                        replier.topicName, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    replier.log(error.toString());
                }
            }
        } else {
            replier.log('Cannot subscribe because not connected to Solace message router.');
        }
    };

    // Unsubscribes from request topic on Solace message router
    replier.unsubscribe = function () {
        if (replier.session !== null) {
            if (replier.subscribed) {
                replier.log('Unsubscribing from topic: ' + replier.topicName);
                try {
                    replier.session.unsubscribe(
                        solace.SolclientFactory.createTopic(replier.topicName),
                        true, // generate confirmation when subscription is removed successfully
                        replier.topicName, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    replier.log(error.toString());
                }
            } else {
                replier.log('Cannot unsubscribe because not subscribed to the topic "' + replier.topicName + '"');
            }
        } else {
            replier.log('Cannot unsubscribe because not connected to Solace message router.');
        }
    };

    return replier;
};
