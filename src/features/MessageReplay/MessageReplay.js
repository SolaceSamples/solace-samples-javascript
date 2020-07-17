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
 * Message Replay tutorial
 * Demonstrates initiating and processing the replay of previously published messages
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var QueueConsumer = function (queueName) {
    'use strict';
    var consumer = {};
    consumer.session = null;
    consumer.flow = null;
    consumer.queueName = queueName;
    consumer.queueDestination = new solace.Destination(consumer.queueName, solace.DestinationType.QUEUE);
    consumer.consuming = false;
    consumer.replayStartLocation = null;

    // Logger
    consumer.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById('log');
        logTextArea.value += timestamp + line + '\n';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    consumer.log('\n*** Consumer to queue "' + consumer.queueName + '" is ready to connect ***');

    // Establishes connection to Solace message router
    consumer.connect = function () {
        if (consumer.session !== null) {
            consumer.log('Already connected.');
            return;
        }
        var hosturl = document.getElementById('hosturl').value;
        // check for valid protocols
        if (hosturl.lastIndexOf('ws://', 0) !== 0 && hosturl.lastIndexOf('wss://', 0) !== 0 &&
            hosturl.lastIndexOf('http://', 0) !== 0 && hosturl.lastIndexOf('https://', 0) !== 0) {
            consumer.log('Invalid protocol - please use one of ws://, wss://, http://, https://');
            return;
        }
        var username = document.getElementById('username').value;
        var pass = document.getElementById('password').value;
        var vpn = document.getElementById('message-vpn').value;
        if (!hosturl || !username || !pass || !vpn) {
            consumer.log('Cannot connect: please specify all the Solace message router properties.');
            return;
        }
        consumer.log('Connecting to Solace message router using url: ' + hosturl);
        consumer.log('Client username: ' + username);
        consumer.log('Solace message router VPN name: ' + vpn);
        // create session
        try {
            consumer.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      hosturl,
                vpnName:  vpn,
                userName: username,
                password: pass,
            });
        } catch (error) {
            consumer.log(error.toString());
        }
        // define session event listeners
        consumer.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            if (!consumer.session.isCapable(solace.CapabilityType.MESSAGE_REPLAY)) {
                consumer.log('Message Replay is not supported on this message broker, disconnecting...');
                try {
                    consumer.session.disconnect();
                } catch (error) {
                    consumer.log(error.toString());
                }
            } else {
                consumer.log('=== Successfully connected and ready to start message replay. ===');
            }
        });
        consumer.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            consumer.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        consumer.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            consumer.log('Disconnected.');
            consumer.consuming = false;
            if (consumer.session !== null) {
                consumer.session.dispose();
                consumer.session = null;
            }
        });

        consumer.connectToSolace();   
    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    consumer.connectToSolace = function () {
        try {
            consumer.session.connect();
        } catch (error) {
            consumer.log(error.toString());
        }
    };

    // Starts message replay from a queue on Solace message router
    consumer.startReplay = function () {
        if (consumer.session !== null) {
            if (consumer.consuming) {
                consumer.log('Already started consumer for queue "' + consumer.queueName + '", stop the consumer first.');
            } else {
                consumer.log('Starting message replay for queue: ' + consumer.queueName);
                consumer.replayStartLocation = solace.SolclientFactory.createReplayStartLocationBeginning();
                /***************************************************************
                 * Alternative replay start specifications to try instead of
                 * createReplayStartLocationBeginning().
                 */
                /* Milliseconds after the Jan 1st of 1970 UTC+0: */
                // consumer.replayStartLocation = solace.SolclientFactory.createReplayStartLocationDate(new Date(1554331492));

                /* RFC3339 UTC date with timezone offset 0: */
                // consumer.replayStartLocation = solace.SolclientFactory.createReplayStartLocationDate(new Date(Date.parse('2019-04-03T18:48:00Z')));

                /* RFC3339 date with timezone: */
                // consumer.replayStartLocation = solace.SolclientFactory.createReplayStartLocationDate(new Date(Date.parse('2019-04-03T18:48:00-05:00')));

                consumer.createFlow();
            }
        } else {
            consumer.log('Cannot start the queue consumer because not connected to Solace message router.');
        }
    };

    // Creates and starts a consumer flow from a queue
    consumer.createFlow = function () {
        try {
            // Create a message consumer
            consumer.messageConsumer = consumer.session.createMessageConsumer({
                // solace.MessageConsumerProperties
                queueDescriptor: { name: consumer.queueName, type: solace.QueueType.QUEUE },
                acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT, // Enabling Client ack
                replayStartLocation: consumer.replayStartLocation
            });
            // Define message consumer event listeners
            consumer.messageConsumer.on(solace.MessageConsumerEventName.UP, function () {
                consumer.consuming = true;
            });
            consumer.messageConsumer.on(solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, function (error) {
                consumer.consuming = false;
                consumer.log('\n=== Error: the message consumer could not bind to queue "' + consumer.queueName +
			"' ===\nError message: " + error.message +
                        "\nEnsure that:" +
                        "\n   - The queue exists on the message router vpn" +
			"\n   - You have created the replay log.");
            });
            consumer.messageConsumer.on(solace.MessageConsumerEventName.DOWN, function () {
                consumer.consuming = false;
                consumer.log('=== The message consumer is now down ===');
            });
            consumer.messageConsumer.on(solace.MessageConsumerEventName.DOWN_ERROR, function (details) {
                consumer.consuming = false;
                consumer.log('Received "DOWN_ERROR" event - details: ' + details);
                switch(details.subcode) {
                    case solace.ErrorSubcode.REPLAY_STARTED:
                        consumer.log('Router initiating replay, reconnecting flow to receive messages.');
                        consumer.replayStartLocation = null;   // Client-initiated replay is not neeeded here
                        consumer.createFlow();
                        break;
                    case solace.ErrorSubcode.REPLAY_START_TIME_NOT_AVAILABLE:
                        consumer.log('Replay log does not cover requested time period, reconnecting flow for full log instead.');
                        consumer.replayStartLocation = solace.SolclientFactory.createReplayStartLocationBeginning();
                        consumer.createFlow();
                        break;
                    // Additional events example, may add specific handler code under each:
                    case solace.ErrorSubcode.REPLAY_FAILED:
                    case solace.ErrorSubcode.REPLAY_CANCELLED:
                    case solace.ErrorSubcode.REPLAY_LOG_MODIFIED:
                    case solace.ErrorSubcode.REPLAY_MESSAGE_UNAVAILABLE:
                    case solace.ErrorSubcode.REPLAY_MESSAGE_REJECTED:
                        break;
                    default:
                        consumer.log('=== An error happened, the message consumer is down ===');
                }
            });
            // Define message received event listener
            consumer.messageConsumer.on(solace.MessageConsumerEventName.MESSAGE, function (message) {
                consumer.log('Received message: "' + message.getBinaryAttachment() + '",' +
                    ' details:\n' + message.dump());
                // Need to explicitly ack otherwise it will not be deleted from the message router
                message.acknowledge();
            });
            // Connect the message consumer
            consumer.messageConsumer.connect();
        } catch (error) {
            consumer.log(error.toString());
        }
    };

    // Disconnects the consumer from queue on Solace message router
    consumer.stopConsume = function () {
        if (consumer.session !== null) {
            if (consumer.consuming) {
                consumer.consuming = false;
                consumer.log('Disconnecting consumption from queue: ' + consumer.queueName);
                try {
                    consumer.messageConsumer.disconnect();
                    consumer.messageConsumer.dispose();
                } catch (error) {
                    consumer.log(error.toString());
                }
            } else {
                consumer.log('Cannot disconnect the consumer because it is not connected to queue "' +
                    consumer.queueName + '"');
            }
        } else {
            consumer.log('Cannot disconnect the consumer because not connected to Solace message router.');
        }
    };

    // Gracefully disconnects from Solace message router
    consumer.disconnect = function () {
        consumer.log('Disconnecting from Solace message router...');
        if (consumer.session !== null) {
            try {
                consumer.session.disconnect();
            } catch (error) {
                consumer.log(error.toString());
            }
        } else {
            consumer.log('Not connected to Solace message router.');
        }
    };

    return consumer;
};

