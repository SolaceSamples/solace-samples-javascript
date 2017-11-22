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
 * NoLocal tutorial
 * Demonstrates the use of the NO_LOCAL Session and MessageConsumer properties.
 *
 * This sample will:
 *  - Subscribe to a Topic for Direct messages on a Session with No Local delivery enabled.
 *  - Create a message consumer to a Queue with No Local Delivery enabled on the Message Consumer,
 *    but not on the Session.
 *  - Publish a Direct message on each Session, and verify it is not delivered locally.
 *  - Publish a message to the Queue on each Session, and verify it is not delivered locally.
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var NoLocalPubSub = function (topicName) {
    'use strict';
    var sample = {};
    sample.sessionProperties = null;
    sample.session1 = null;
    sample.session2 = null;
    sample.topicName = topicName;
    sample.topicDestination = new solace.Destination(sample.topicName, solace.DestinationType.TOPIC);
    sample.queueDestination = null;
    sample.sessionsUp = 0;

    // Logger
    sample.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById('log');
        logTextArea.value += timestamp + line + '\n';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    sample.log('\n*** NoLocalPubSub is ready to connect ***');

    // Establishes connection to Solace message router
    sample.connect = function () {
        if (sample.session1 !== null) {
            sample.log('Already connected and ready to start demo.');
            return;
        }
        var hosturl = document.getElementById('hosturl').value;
        sample.log('Connecting to Solace message router using url: ' + hosturl);
        var username = document.getElementById('username').value;
        sample.log('Client username: ' + username);
        var pass = document.getElementById('password').value;
        var vpn = document.getElementById('message-vpn').value;
        sample.log('Solace message router VPN name: ' + vpn);
        if (!hosturl || !username || !pass || !vpn) {
            sample.log('Cannot connect: please specify all the Solace message router properties.');
            return;
        }
        sample.sessionProperties = new solace.SessionProperties({
            url:      hosturl,
            vpnName:  vpn,
            userName: username,
            password: pass,
        });
        // if secure connection, first load iframe so the browser can provide a client-certificate
        if (hosturl.lastIndexOf('wss://', 0) === 0 || hosturl.lastIndexOf('https://', 0) === 0) {
            var urlNoProto = hosturl.split('/').slice(2).join('/'); // remove protocol prefix
            document.getElementById('iframe').src = 'https://' + urlNoProto + '/crossdomain.xml';
        } else {
            sample.connectToSolace();   // otherwise proceed
        }
    };

    // Actually connects the session
    sample.connectToSolace = function () {
        try {
            // session 1: session level NoLocal is not set,
            // consuming on queue with message consumer level NoLocal is SET
            sample.sessionProperties.noLocal = false;
            sample.session1 = sample.createSession('Session1 (session NoLocal=false, ' +
                'message consumer NoLocal=true)', sample.sessionProperties, false, true);
            sample.session1.connect();
            // session 2: session level NoLocal is SET, will consume direct messages on topic
            sample.sessionProperties.noLocal = true;
            sample.session2 = sample.createSession('Session2 (session NoLocal=true, ' +
                'direct message consumer)', sample.sessionProperties, true, false);
            sample.session2.connect();
        } catch (error) {
            sample.log(error.toString());
        }
    };

    sample.createSession = function (sessionName, sessionProperties,
                                     subscribeDirectTopicFlag, consumeFlowQueueFlag) {
        // create session
        var session = null;
        session = solace.SolclientFactory.createSession(sessionProperties);
        // define session event listeners
        session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            sample.log('=== ' + sessionName + ' successfully connected ===');
            if (subscribeDirectTopicFlag) {
                if (!session.isCapable(solace.CapabilityType.NO_LOCAL)) {
                    sample.log('This sample requires an appliance with support for NO_LOCAL.');
                    sample.exit();
                }
                session.subscribe(
                    sample.topicDestination,
                    false, // not interested in confirmation this time
                    '', // not used
                    10000 // 10 seconds timeout for this operation
                );
                sample.log('Subscribed to topic: ' + sample.topicName);
            };
            if (consumeFlowQueueFlag) {
                // Create the message consumer with NoLocal SET
                var messageConsumer = session.createMessageConsumer({
                    queueDescriptor: { type: solace.QueueType.QUEUE, durable: false },
                    queueProperties: {
                        permissions: solace.QueuePermissions.DELETE,
                        quotaMB: 100,
                        maxMessageSize: 50000 },
                    noLocal: true,
                });
                // Define message consumer event listeners
                messageConsumer.on(solace.MessageConsumerEventName.UP, function () {
                    sample.log('=== ' + sessionName + ' consumer flow to temporary queue is up. ===');
                    sample.queueDestination = messageConsumer.getDestination();
                    // start demo if both sessions up
                    if (sample.sessionsUp === 2) {
                        sample.startDemo();
                    }
                });
                // Define message event listener
                messageConsumer.on(solace.MessageConsumerEventName.MESSAGE, function (message) {
                    sample.log('Received ' + message.getBinaryAttachment() + '! - session: ' + sessionName + ', ' +
                        'guaranteed message.');
                });
                // Connect the message consumer
                messageConsumer.connect();
            };
            sample.sessionsUp++;
        });
        if (subscribeDirectTopicFlag) {
            // define message event listener
            session.on(solace.SessionEventCode.MESSAGE, function (message) {
                sample.log('Received ' + message.getBinaryAttachment() + '! - session: ' + sessionName + ',' +
                    'direct message.');
            });
        };
        session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            sample.log('Disconnected.');
            if (session !== null) {
                session.dispose();
                session = null;
            }
        });
        return session;
    };

    sample.startDemo = function () {
        if (sample.session1 === null) {
            sample.log('Please connect the sessions first.');
        } else {
            // Demo 1
            sample.log('Sending Message1: direct message from Session1, ' +
                'expecting it is received by Session2');
            sample.sendMessage(sample.session1, 'Message1', sample.topicDestination,
                solace.MessageDeliveryModeType.DIRECT);
            // Demo 2
            sample.log('Sending Message2: guaranteed message from Session1, ' +
                'expecting it is NOT received by Session1 message consumer');
            sample.sendMessage(sample.session1, 'Message2', sample.queueDestination,
                solace.MessageDeliveryModeType.PERSISTENT);
            // Demo 3
            sample.log('Sending Message3: direct message from Session2, ' +
                'expecting it is NOT received by local Session2');
            sample.sendMessage(sample.session2, 'Message3', sample.topicDestination,
                solace.MessageDeliveryModeType.DIRECT);
            // Demo 4
            sample.log('Sending Message4: guaranteed message from Session2, ' +
                'expecting it is received by message consumer on Session1');
            sample.sendMessage(sample.session2, 'Message4', sample.queueDestination,
                solace.MessageDeliveryModeType.PERSISTENT);
        }
    };

    sample.sendMessage = function (fromSession, messageText, destination, deliveryMode) {
        var message = solace.SolclientFactory.createMessage();
        message.setDeliveryMode(deliveryMode);
        message.setDestination(destination);
        message.setBinaryAttachment(messageText);
        fromSession.send(message);
    };

    // Gracefully disconnects from Solace message router
    sample.disconnect = function () {
        sample.log('Disconnecting both sessions from Solace message router...');
        [sample.session1, sample.session2].forEach(function(session) {
            if (session && session !== null) {
                try {
                    session.disconnect();
                } catch (error) {
                    sample.log(error.toString());
                }
            };
        });
        sample.session1 = null;
        sample.session2 = null;
    };

    return sample;
};
