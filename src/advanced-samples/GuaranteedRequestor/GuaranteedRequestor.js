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
 *
 * This sample will show the implementation of guaranteed Request-Reply messaging,
 * where `GuaranteedRequestor` is a message Endpoint that sends a guaranteed request message
 * to a request topic and waits to receive a reply message on a dedicated temporary queue as
 * a response; `GuaranteedReplier` is a message Endpoint that waits to receive a request message
 * on a request topic - it will create a non-durable topic endpoint for that - and responds to
 * it by sending a guaranteed reply message.
 * Start the replier first as the non-durable topic endpoint will only be created for the
 * duration of the replier session and any request sent before that will not be received.
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var GuaranteedRequestor = function (requestTopicName) {
    'use strict';
    var requestor = {};
    requestor.session = null;
    requestor.requestTopicName = requestTopicName;
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

    requestor.log('\n*** requestor to topic "' + requestor.requestTopicName + '" is ready to connect ***');

    // Establishes connection to Solace message router
    requestor.connect = function () {
        if (requestor.session !== null) {
            requestor.log('Already connected and ready to send requests.');
            return;
        }
        var hosturl = document.getElementById('hosturl').value;
        // check for valid protocols
        if (hosturl.lastIndexOf('ws://', 0) !== 0 && hosturl.lastIndexOf('wss://', 0) !== 0 &&
            hosturl.lastIndexOf('http://', 0) !== 0 && hosturl.lastIndexOf('https://', 0) !== 0) {
            requestor.log('Invalid protocol - please use one of ws://, wss://, http://, https://');
            return;
        }
        var username = document.getElementById('username').value;
        var pass = document.getElementById('password').value;
        var vpn = document.getElementById('message-vpn').value;
        if (!hosturl || !username || !pass || !vpn) {
            requestor.log('Cannot connect: please specify all the Solace message router properties.');
            return;
        }
        requestor.log('Connecting to Solace message router using url: ' + hosturl);
        requestor.log('Client username: ' + username);
        requestor.log('Solace message router VPN name: ' + vpn);
        // create session
        try {
            requestor.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      hosturl,
                vpnName:  vpn,
                userName: username,
                password: pass,
            });
        } catch (error) {
            requestor.log(error.toString());
        }
        // define session event listeners
        requestor.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            requestor.log('=== Successfully connected and ready to send requests. ===');
        });
        requestor.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            requestor.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        requestor.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            requestor.log('Disconnected.');
            if (requestor.session !== null) {
                requestor.session.dispose();
                requestor.session = null;
            }
        });
        // if secure connection, first load iframe so the browser can provide a client-certificate
        if (hosturl.lastIndexOf('wss://', 0) === 0 || hosturl.lastIndexOf('https://', 0) === 0) {
            var urlNoProto = hosturl.split('/').slice(2).join('/'); // remove protocol prefix
            document.getElementById('iframe').src = 'https://' + urlNoProto + '/crossdomain.xml';
        } else {
            requestor.connectToSolace();   // otherwise proceed
        }
    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    requestor.connectToSolace = function () {
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
            const replyMessageConsumer = requestor.session.createMessageConsumer({
                queueDescriptor: { type: solace.QueueType.QUEUE, durable: false },
            });
            // send the request when the listening message consumer is up
            replyMessageConsumer.on(solace.MessageConsumerEventName.UP, function () {
                var msg = solace.SolclientFactory.createMessage();
                const requestText = "Sample Request";
                requestor.log('Sending request "' + requestText + '" to request topic "' + requestor.requestTopicName + '"...');
                msg.setDestination(solace.SolclientFactory.createTopicDestination(requestor.requestTopicName));
                msg.setBinaryAttachment(requestText);
                msg.setReplyTo(replyMessageConsumer.getDestination());
                requestor.correlationID = 'MyCorrelationID'
                msg.setCorrelationId(requestor.correlationID);
                msg.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
                requestor.session.send(msg);
            });
            // process the response received at the replyToQueue
            replyMessageConsumer.on(solace.MessageConsumerEventName.MESSAGE, function onMessage(message) {
                if (message.getCorrelationId() === requestor.correlationID) {
                    requestor.log('Received reply: "' + message.getBinaryAttachment() +
                        '", details:\n' + message.dump());
                } else {
                    requestor.log("Received reply but correlation ID didn't match: " +
                        '"' +  message.getBinaryAttachment() + '" details:\n' + message.dump());
                }
            });
            replyMessageConsumer.connect();
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
