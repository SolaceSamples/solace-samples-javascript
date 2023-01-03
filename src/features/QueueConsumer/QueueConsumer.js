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
 * Persistence with Queues tutorial - Queue Consumer
 * Demonstrates receiving persistent messages from a queue
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var QueueConsumer = function (queueName) {
    'use strict';
    var consumer = {};
    consumer.session = null;
    consumer.flow = null;
    consumer.queueName = queueName;
    consumer.consuming = false;

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

    // Establishes connection to Solace PubSub+ Event Broker
    consumer.connect = function () {
        if (consumer.session !== null) {
            consumer.log('Already connected and ready to consume messages.');
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
            consumer.log('Cannot connect: please specify all the Solace PubSub+ Event Broker properties.');
            return;
        }
        consumer.log('Connecting to Solace PubSub+ Event Broker using url: ' + hosturl);
        consumer.log('Client username: ' + username);
        consumer.log('Solace PubSub+ Event Broker VPN name: ' + vpn);
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
            consumer.log('=== Successfully connected and ready to start the message consumer. ===');
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

    // Starts consuming from a queue on Solace PubSub+ Event Broker
    consumer.startConsume = function () {
        if (consumer.session !== null) {
            if (consumer.consuming) {
                consumer.log('Already started consumer for queue "' + consumer.queueName + '" and ready to receive messages.');
            } else {
                consumer.log('Starting consumer for queue: ' + consumer.queueName);
                try {
                    // Create a message consumer
                    consumer.messageConsumer = consumer.session.createMessageConsumer({
                        // solace.MessageConsumerProperties
                        queueDescriptor: { name: consumer.queueName, type: solace.QueueType.QUEUE },
                        acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT, // Enabling Client ack
                        createIfMissing: true // Create queue if not exists
                    });
                    // Define message consumer event listeners
                    consumer.messageConsumer.on(solace.MessageConsumerEventName.UP, function () {
                        consumer.consuming = true;
                        consumer.log('=== Ready to receive messages. ===');
                    });
                    consumer.messageConsumer.on(solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, function () {
                        consumer.consuming = false;
                        consumer.log('=== Error: the message consumer could not bind to queue "' + consumer.queueName +
                            '" ===\n   Ensure this queue exists on the Solace PubSub+ Event Broker');
                    });
                    consumer.messageConsumer.on(solace.MessageConsumerEventName.DOWN, function () {
                        consumer.consuming = false;
                        consumer.log('=== The message consumer is now down ===');
                    });
                    consumer.messageConsumer.on(solace.MessageConsumerEventName.DOWN_ERROR, function () {
                        consumer.consuming = false;
                        consumer.log('=== An error happened, the message consumer is down ===');
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
            }
        } else {
            consumer.log('Cannot start the queue consumer because not connected to Solace PubSub+ Event Broker.');
        }
    };

    // Disconnects the consumer from queue on Solace PubSub+ Event Broker
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
            consumer.log('Cannot disconnect the consumer because not connected to Solace PubSub+ Event Broker.');
        }
    };

    // Gracefully disconnects from Solace PubSub+ Event Broker
    consumer.disconnect = function () {
        consumer.log('Disconnecting from Solace PubSub+ Event Broker...');
        if (consumer.session !== null) {
            try {
                consumer.session.disconnect();
            } catch (error) {
                consumer.log(error.toString());
            }
        } else {
            consumer.log('Not connected to Solace PubSub+ Event Broker.');
        }
    };

    consumer.clear = function () {
      consumer.log('Clearing log messages...');
      document.getElementById('log').value = "";
    }

    return consumer;
};

