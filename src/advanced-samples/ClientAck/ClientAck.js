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
 * Client Ack tutorial - Queue Consumer
 * Demonstrates acknowledging persistent messages by the application
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var QueueConsumerClientAck = function (queueName) {
    'use strict';
    var consumer = {};
    consumer.session = null;
    consumer.flow = null;
    consumer.queueName = queueName;
    consumer.topicDestination = new solace.Destination(consumer.queueName, solace.DestinationType.QUEUE);
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

    // Establishes connection to Solace message router
    consumer.connect = function () {
        if (consumer.session !== null) {
            consumer.log('Already connected and ready to consume messages.');
        } else {
            var host = document.getElementById('host').value;
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;
            var vpn = document.getElementById('message-vpn').value;
            if (host && vpn && username && password) {
                consumer.connectToSolace(host, username, password, vpn);
            } else {
                consumer.log('Cannot connect: please specify all the Solace message router properties.');
            }
        }
    };

    consumer.connectToSolace = function (host, username, password, vpn) {
        const sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'ws://' + host;
        consumer.log('Connecting to Solace message router using WebSocket transport url ws://' + host);
        sessionProperties.vpnName = vpn;
        consumer.log('Solace message router VPN name: ' + sessionProperties.vpnName);
        sessionProperties.userName = username;
        consumer.log('Client username: ' + sessionProperties.userName);
        sessionProperties.password = password;
        // create session
        try {
            consumer.session = solace.SolclientFactory.createSession(sessionProperties);
        } catch (error) {
            consumer.log(error.toString());
        }
        // define session event listeners
        consumer.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            consumer.log('=== Successfully connected and ready to start the message consumer. ===');
        });
        consumer.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            consumer.log('Disconnected.');
            consumer.consuming = false;
            if (consumer.session !== null) {
                consumer.session.dispose();
                consumer.session = null;
            }
        });
        // connect the session
        try {
            consumer.session.connect();
        } catch (error) {
            consumer.log(error.toString());
        }
    };

    // Starts consuming from a queue on Solace message router
    consumer.startConsume = function () {
        if (consumer.session !== null) {
            if (consumer.consuming) {
                consumer.log('Already started consumer for queue "' + consumer.queueName + '" and ready to receive messages.');
            } else {
                consumer.log('Starting consumer for queue: ' + consumer.queueName);
                try {
                    // Create a flow
                    consumer.flow = consumer.session.createSubscriberFlow(new solace.SubscriberFlowProperties({
                        endpoint: {
                            destination: consumer.topicDestination,
                        },
                        acknowledgeMode: solace.SubscriberFlowAcknowledgeMode.CLIENT, // Enabling Client ack
                    }));
                    // Define flow event listeners
                    consumer.flow.on(solace.FlowEventName.UP, function () {
                        consumer.consuming = true;
                        consumer.log('=== Ready to receive messages. ===');
                    });
                    consumer.flow.on(solace.FlowEventName.BIND_FAILED_ERROR, function () {
                        consumer.consuming = false;
                        consumer.log('=== Error: the flow could not bind to queue "' + consumer.queueName +
                            '" ===\n   Ensure the queue exists on the message router vpn');
                    });
                    consumer.flow.on(solace.FlowEventName.DOWN, function () {
                        consumer.consuming = false;
                        consumer.log('=== An error happened, the flow is down ===');
                    });
                    // Define message event listener
                    consumer.flow.on(solace.FlowEventName.MESSAGE, function (message) {
                        consumer.log('Received message: "' + message.getBinaryAttachment());
                        // Need to explicitly ack otherwise it will not be deleted from the message router
                        message.acknowledge();
                        consumer.log('Acknowledged message from the application.');
                    });
                    // Connect the flow
                    consumer.flow.connect();
                } catch (error) {
                    consumer.log(error.toString());
                }
            }
        } else {
            consumer.log('Cannot start the queue consumer because not connected to Solace message router.');
        }
    };

    // Disconnects the consumer from queue on Solace message router
    consumer.stopConsume = function () {
        if (consumer.session !== null) {
            if (consumer.consuming) {
               consumer.consuming = false;
               consumer.log('Disconnecting consumption from queue: ' + consumer.queueName);
                try {
                    consumer.flow.disconnect();
                    consumer.flow.dispose();
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
