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

var GuaranteedReplier = function (requestTopicName) {
    'use strict';
    var replier = {};
    replier.session = null;
    replier.messageConsumer = null;
    replier.requestTopicName = requestTopicName;
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

    replier.log('\n*** replier to request topic "' + replier.requestTopicName + '" is ready to connect ***');

    // Establishes connection to Solace message router
    replier.connect = function () {
        if (replier.session !== null) {
            return;
        }
        var hosturl = document.getElementById('hosturl').value;
        replier.log('Connecting to Solace message router using url: ' + hosturl);
        var username = document.getElementById('username').value;
        replier.log('Client username: ' + username);
        var pass = document.getElementById('password').value;
        var vpn = document.getElementById('message-vpn').value;
        replier.log('Solace message router VPN name: ' + vpn);
        if (!hosturl || !username || !pass || !vpn) {
                    
            replier.log('Cannot connect: please specify all the Solace message router properties.');
            return;
        }
        // create session
        try {
            replier.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      hosturl,
                vpnName:  vpn,
                userName: username,
                password: pass,
            });
        } catch (error) {
            replier.log(error.toString());
        }
        // define session event listeners
        replier.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            replier.log('=== Successfully connected and ready to consume messages sent to request topic ===');
        });
        replier.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            replier.log('Disconnected.');
            replier.active = false;
            if (replier.session !== null) {
                replier.session.dispose();
                replier.session = null;
            }
        });
        // if secure connection, first load iframe so the browser can provide a client-certificate
        if (hosturl.lastIndexOf('wss://', 0) === 0 || hosturl.lastIndexOf('https://', 0) === 0) {
            var urlNoProto = hosturl.split('/').slice(2).join('/'); // remove protocol prefix
            document.getElementById('iframe').src = 'https://' + urlNoProto + '/crossdomain.xml';
        } else {
            replier.connectToSolace();   // otherwise proceed
        }
    };

    // Actually connects the session
    replier.connectToSolace = function () {
        try {
            replier.session.connect();
        } catch (error) {
            replier.log(error.toString());
        }
    };

    // Subscribes to temporary topic endpoint on Solace message router
    replier.startService = function () {
        if (replier.session !== null) {
            if (replier.active) {
                replier.log('Replier already connected to temporary topic endpoint and ready to receive' +
                    ' messages.');
            } else {
                try {
                    replier.messageConsumer = replier.session.createMessageConsumer({
                        topicEndpointSubscription: replier.requestTopicName,
                        queueDescriptor: { type: solace.QueueType.TOPIC_ENDPOINT, durable: false }
                    });
                    replier.messageConsumer.on(solace.MessageConsumerEventName.MESSAGE, function onMessage(message) {
                        replier.reply(message);
                    });
                    replier.messageConsumer.connect();
                    replier.active = true;
                    replier.log('Replier is consuming from temporary topic endpoint, which is attracting messages to '
                        + replier.requestTopicName);
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
                replier.log('Disconnecting from request topic endpoint: ' + replier.requestTopicName);
                try {
                    replier.messageConsumer.disconnect();
                    replier.messageConsumer.dispose();
                } catch (error) {
                    replier.log(error.toString());
                }
            } else {
                replier.log('Cannot stop replier because it is not connected to request topic endpoint "' +
                    replier.requestTopicName + '"');
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
