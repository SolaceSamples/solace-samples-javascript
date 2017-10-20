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
 * Solace Web Messaging API for JavaScript
 * Guaranteed Request/Reply tutorial - Guaranteed Requestor
 * Demonstrates how to send a guaranteed request message and
 * waits to receive a reply message as a response.
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var GuaranteedRequestor = function (requestQueueName) {
    'use strict';
    var requestor = {};
    requestor.session = null;
    requestor.requestQueueName = requestQueueName;
    requestor.correlationID = null;

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

    // Establishes connection to Solace message router
    requestor.connect = function (host, username, password, vpn) {
        if (requestor.session !== null) {
            requestor.log('Already connected and ready to send requests.');
        } else {
            var host = document.getElementById('host').value;
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;
            var vpn = document.getElementById('message-vpn').value;
            if (host && vpn && username && password) {
                requestor.connectToSolace(host, username, password, vpn);
            } else {
                requestor.log('Cannot connect: please specify all the Solace message router properties.');
            }
        }
    };

    requestor.connectToSolace = function (host, username, password, vpn) {
        const sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'ws://' + host;
        requestor.log('Connecting to Solace message router using WebSocket transport url ws://' + host);
        sessionProperties.vpnName = vpn;
        requestor.log('Solace message router VPN name: ' + sessionProperties.vpnName);
        sessionProperties.userName = username;
        requestor.log('Client username: ' + sessionProperties.userName);
        sessionProperties.password = password;
        // create session
        requestor.session = solace.SolclientFactory.createSession(sessionProperties);
        // define session event listeners
        requestor.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            requestor.log('=== Successfully connected and ready to send requests. ===');
        });
        requestor.session.on(solace.SessionEventCode.DISCONNECTED, (sessionEvent) => {
            requestor.log('Disconnected.');
            if (requestor.session !== null) {
                requestor.session.dispose();
                requestor.session = null;
            }
        });
        // connect the session
        try {
            requestor.session.connect();
        } catch (error) {
            requestor.log(error.toString());
        }
    };

    // sends one request
    requestor.request = function () {
        if (requestor.session !== null) {
            // creates a temporary queue to listen to responses
            var replyToQueue = requestor.session.createTemporaryQueue();
            // creates a flow to this queue
            var flow = requestor.session.createSubscriberFlow({
                endpoint: {destination: replyToQueue,
                    durable: solace.EndpointDurability.NON_DURABLE_GUARANTEED,
                    permissions: solace.EndpointPermissions.DELETE,}
            });
            // send the request when the listening flow is up
            flow.on(solace.FlowEventName.UP, function onMessage(message) {
                var msg = solace.SolclientFactory.createMessage();
                const requestText = "Sample Request";
                requestor.log('Sending request "' + requestText + '" to request queue "' + requestor.requestQueueName + '"...');
                msg.setDestination(new solace.Destination(requestor.requestQueueName, solace.DestinationType.QUEUE));
                msg.setBinaryAttachment(requestText);
                msg.setReplyTo(replyToQueue);
                requestor.correlationID = 'MyCorrelationID'
                msg.setCorrelationId(requestor.correlationID);
                msg.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
                requestor.session.send(msg);
            });
            // process the response received at the replyToQueue
            flow.on(solace.FlowEventName.MESSAGE, function onMessage(message) {
                if (message.getCorrelationId() === requestor.correlationID) {
                    requestor.log('Received reply: "' + message.getBinaryAttachment() + '", details:\n' + message.dump());
                } else {
                    requestor.log(`Received reply but correlation ID didn't match: "` + message.getBinaryAttachment() +
                    '",' + ' details:\n' + message.dump());
                }
            });
            flow.connect();
        } else {
            requestor.log('Cannot send request because not connected to Solace message router.');
        }
    };

    // Gracefully disconnects from Solace message router
    requestor.disconnect = function () {
        requestor.log('Disconnecting from Solace message router...');
        if (requestor.session !== null) {
            try {
                requestor.session.disconnect();
            } catch (error) {
                requestor.log(error.toString());
            }
        } else {
            requestor.log('Not connected to Solace message router.');
        }
    };

    return requestor;
};
