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
 * Guaranteed Request/Reply tutorial - Guaranteed Replier
 * Demonstrates how to receive a request message and responds
 * to it by sending a guaranteed reply message.
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var GuaranteedReplier = function (requestQueueName) {
    'use strict';
    var replier = {};
    replier.session = null;
    replier.flow = null;
    replier.requestQueueName = requestQueueName;
    replier.active = false;

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

    replier.log('\n*** replier to request queue "' + replier.requestQueueName + '" is ready to connect ***');

    // Establishes connection to Solace message router
    replier.connect = function (host, username, password, vpn) {
        if (replier.session !== null) {
            replier.log('Already connected and ready to subscribe to request topic.');
        } else {
            var host = document.getElementById('host').value;
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;
            var vpn = document.getElementById('message-vpn').value;
            if (host && vpn && username && password) {
                replier.connectToSolace(host, username, password, vpn);
            } else {
                replier.log('Cannot connect: please specify all the Solace message router properties.');
            }
        }
    };

    replier.connectToSolace = function (host, username, password, vpn) {
        const sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'ws://' + host;
        replier.log('Connecting to Solace message router using WebSocket transport url ws://' + host);
        sessionProperties.vpnName = vpn;
        replier.log('Solace message router VPN name: ' + sessionProperties.vpnName);
        sessionProperties.userName = username;
        replier.log('Client username: ' + sessionProperties.userName);
        sessionProperties.password = password;
        // create session
        replier.session = solace.SolclientFactory.createSession(sessionProperties);
        // define session event listeners
        replier.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            replier.log('=== Successfully connected and ready to subscribe to request queue. ===');
        });
        replier.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            replier.log('Disconnected.');
            replier.active = false;
            if (replier.session !== null) {
                replier.session.dispose();
                replier.session = null;
            }
        });
        // connect the session
        try {
            replier.session.connect();
        } catch (error) {
            replier.log(error.toString());
        }
    };

    // Subscribes to request topic on Solace message router
    replier.startService = function () {
        if (replier.session !== null) {
            if (replier.active) {
                replier.log('Replier already connected to "' + replier.requestQueueName + '" and ready to receive' +
                    ' messages.');
            } else {
                replier.log('Replier connecting to request queue: ' + replier.requestQueueName);
                try {
                    var destination = new solace.Destination(replier.requestQueueName, solace.DestinationType.QUEUE);
                    replier.flow = replier.session.createSubscriberFlow({
                        endpoint: {destination, durable: solace.EndpointDurability.DURABLE},
                    });
                    replier.flow.on(solace.FlowEventName.MESSAGE, function onMessage(message) {
                        replier.reply(message);
                    });
                    replier.flow.connect();
                    replier.active = true;
                } catch (error) {
                    replier.log(error.toString());
                }
            }
        } else {
            replier.log('Cannot start replier because not connected to Solace message router.');
        }
    };

    replier.reply = function (message) {
        replier.log('Received request: "' + message.getBinaryAttachment() + '", details:\n' + message.dump());
        replier.log('Replying...');
        if (replier.session !== null) {
            try {
                var replyMsg = solace.SolclientFactory.createMessage();
                var replyText = message.getBinaryAttachment() + " - Sample Reply";
                replyMsg.setBinaryAttachment(replyText);
                replyMsg.setDestination(message.getReplyTo());
                replyMsg.setCorrelationId(message.getCorrelationId());
                replyMsg.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
                replier.session.send(replyMsg);
            } catch (error) {
                console.log('Failed to send reply ');
                console.log(error.toString());
            }
            replier.log('Replied.');
        } else {
            replier.log('Cannot reply: not connected to Solace message router.');
        }
    };

    replier.exit = function () {
        replier.stopService();
        replier.disconnect();
        setTimeout(function () {
            process.exit();
        }, 2000); // wait for 2 seconds to finish
    };

    // Stops the replier service on Solace message router
    replier.stopService = function () {
        if (replier.session !== null) {
            if (replier.active) {
                replier.active = false;
                replier.log('Disconnecting from request queue: ' + replier.requestQueueName);
                try {
                    replier.flow.disconnect();
                    replier.flow.dispose();
                } catch (error) {
                    replier.log(error.toString());
                }
            } else {
                replier.log('Cannot stop replier because it is not connected to request queue "' +
                    replier.requestQueueName + '"');
            }
        } else {
            replier.log('Cannot stop replier because not connected to Solace message router.');
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

    return replier;
};
