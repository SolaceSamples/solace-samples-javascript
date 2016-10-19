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
 * RequestReply tutorial - Basic Requestor
 * Demonstrates sending a request and receiving a reply
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var BasicRequestor = function (topicName) {
    'use strict';
    var requestor = {};
    requestor.session = null;
    requestor.topicName = topicName;

    // Logger
    requestor.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2), ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById('log');
        logTextArea.value += timestamp + line + '\n';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    requestor.log('\n*** requestor to topic "' + requestor.topicName + '" is ready to connect ***');

    // Callback for message events
    requestor.messageEventCb = function (session, message) {
        requestor.log('Received message: "' + message.getSdtContainer().getValue() + '"');
    };

    // Callback for session events
    requestor.sessionEventCb = function (session, event) {
        requestor.log(event.toString());
        if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
            requestor.log('=== Successfully connected and ready to send requests. ===');
        } else if (event.sessionEventCode === solace.SessionEventCode.CONNECTING) {
            requestor.log('Connecting...');
        } else if (event.sessionEventCode === solace.SessionEventCode.DISCONNECTED) {
            requestor.log('Disconnected.');
            if (requestor.session !== null) {
                requestor.session.dispose();
                requestor.session = null;
            }
        }
    };

    // Establishes connection to Solace message router
    requestor.connect = function () {
        if (requestor.session !== null) {
            requestor.log('Already connected and ready to send requests.');
        } else {
            var host = document.getElementById('host').value;
            if (host) {
                requestor.connectToSolace(host);
            } else {
                requestor.log('Cannot connect: please specify the Solace message router web transport URL.');
            }
        }
    };

    requestor.connectToSolace = function (host) {
        requestor.log('Connecting to Solace message router web transport URL ' + host + '.');
        var sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'ws://' + host;
        // NOTICE: the Solace message router VPN name
        sessionProperties.vpnName = 'default';
        requestor.log('Solace message router VPN name: ' + sessionProperties.vpnName);
        // NOTICE: the client username
        sessionProperties.userName = 'tutorial';
        requestor.log('Client username: ' + sessionProperties.userName);
        requestor.session = solace.SolclientFactory.createSession(
            sessionProperties,
            new solace.MessageRxCBInfo(function (session, request) {
                // calling callback for message events
                requestor.messageEventCb(session, request);
            }, requestor),
            new solace.SessionEventCBInfo(function (session, event) {
                // calling callback for session events
                requestor.sessionEventCb(session, event);
            }, requestor)
        );
        try {
            requestor.session.connect();
        } catch (error) {
            requestor.log(error.toString());
        }
    };

    // Gracefully disconnects from Solace message router
    requestor.disconnect = function () {
        requestor.log('Disconnecting from Solace message router...');
        if (requestor.session !== null) {
            try {
                requestor.session.disconnect();
                requestor.session.dispose();
                requestor.session = null;
            } catch (error) {
                requestor.log(error.toString());
            }
        } else {
            requestor.log('Not connected to Solace message router.');
        }
    };

    // Callback for replies
    requestor.replyReceivedCb = function (session, message) {
        requestor.log('Received reply: "' + message.getSdtContainer().getValue() + '"');
    };

    // Callback for request failures
    requestor.requestFailedCb = function (session, event) {
        requestor.log('Request failure: ' + event.toString());
    };

    // sends one request
    requestor.request = function () {
        if (requestor.session !== null) {
            var requestText = 'Sample Request';
            var request = solace.SolclientFactory.createMessage();
            requestor.log('Sending request "' + requestText + '" to topic "' + requestor.topicName + '"...');
            request.setDestination(solace.SolclientFactory.createTopic(requestor.topicName));
            request.setSdtContainer(solace.SDTField.create(solace.SDTFieldType.STRING, requestText));
            request.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
            try {
                requestor.session.sendRequest(
                    request,
                    5000, // 5 seconds timeout for this operation
                    function (session, message) {
                        requestor.replyReceivedCb(session, message);
                    },
                    function (session, event) {
                        requestor.requestFailedCb(session, event);
                    },
                    null // not providing correlation object
                );
            } catch (error) {
                requestor.log(error.toString());
            }
        } else {
            requestor.log('Cannot send request because not connected to Solace message router.');
        }
    };

    return requestor;
};
