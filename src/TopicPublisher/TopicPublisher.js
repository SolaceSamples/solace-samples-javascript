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
 * PublishSubscribe tutorial - Topic Publisher
 * Demonstrates publishing direct messages to a topic
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var TopicPublisher = function (topicName) {
    'use strict';
    var publisher = {};
    publisher.session = null;
    publisher.topicName = topicName;

    // Logger
    publisher.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2), ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById('log');
        logTextArea.value += timestamp + line + '\n';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    publisher.log('\n*** Publisher to topic "' + publisher.topicName + '" is ready to connect ***');

    // Callback for message events
    publisher.messageEventCb = function (session, message) {
        publisher.log(message);
    };

    // Callback for session events
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

    // Establishes connection to Solace router
    publisher.connect = function () {
        if (publisher.session !== null) {
            publisher.log('Already connected and ready to publish messages.');
        } else {
            var host = document.getElementById('host').value;
            if (host) {
                publisher.connectToSolace(host);
            } else {
                publisher.log('Cannot connect: please specify the Solace router web transport URL.');
            }
        }
    };

    publisher.connectToSolace = function (host) {
        publisher.log('Connecting to Solace router web transport URL ' + host + '.');
        var sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'ws://' + host;
        // NOTICE: the Solace router VPN name
        sessionProperties.vpnName = 'default';
        publisher.log('Solace router VPN name: ' + sessionProperties.vpnName);
        // NOTICE: the client username
        sessionProperties.userName = 'tutorial';
        publisher.log('Client username: ' + sessionProperties.userName);
        publisher.session = solace.SolclientFactory.createSession(
            sessionProperties,
            new solace.MessageRxCBInfo(function (session, message) {
                // calling callback for message events
                publisher.messageEventCb(session, message);
            }, publisher),
            new solace.SessionEventCBInfo(function (session, event) {
                // calling callback for session events
                publisher.sessionEventCb(session, event);
            }, publisher)
        );
        try {
            publisher.session.connect();
        } catch (error) {
            publisher.log(error.toString());
        }
    };

    // Gracefully disconnects from Solace router
    publisher.disconnect = function () {
        publisher.log('Disconnecting from Solace router...');
        if (publisher.session !== null) {
            try {
                publisher.session.disconnect();
                publisher.session.dispose();
                publisher.session = null;
            } catch (error) {
                publisher.log(error.toString());
            }
        } else {
            publisher.log('Not connected to Solace router.');
        }
    };

    // Publishes one message
    publisher.publish = function () {
        var messageText = 'Sample Message';
        var message = solace.SolclientFactory.createMessage();
        publisher.log('Publishing message "' + messageText + '" to topic "' + publisher.topicName + '"...');
        message.setDestination(solace.SolclientFactory.createTopic(publisher.topicName));
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
    };

    return publisher;
};
