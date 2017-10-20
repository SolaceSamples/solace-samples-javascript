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
 * Durable Topic Endpoint Subscriber tutorial - DTE Consumer
 * Demonstrates receiving persistent messages from a DTE
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var DTEConsumer = function (topicEndpointName, topicName) {
    'use strict';
    var consumer = {};
    consumer.session = null;
    consumer.flow = null;
    consumer.topicEndpointName = topicEndpointName;
    consumer.topicName = topicName;
    consumer.topicDestination = new solace.Destination(consumer.topicName, solace.DestinationType.TOPIC);
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

    consumer.log('\n*** Consumer to DTE "' + consumer.topicEndpointName + '" is ready to connect ***');

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
            consumer.log('=== Successfully connected and ready to start the DTE message consumer. ===');
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

    // Starts consuming from a Durable Topic Endpoint (DTE) on Solace message router
    consumer.startConsume = function () {
        if (consumer.session !== null) {
            if (consumer.consuming) {
                consumer.log('Already started consumer for DTE "' + consumer.topicEndpointName +
                    '" and ready to receive messages.');
            } else {
                consumer.log('Starting consumer for DTE: ' + consumer.topicEndpointName);
                consumer.log('The DTE will catch messages published to topic "' + consumer.topicName + '"');
                try {
                    // Create a flow
                    consumer.flow = consumer.session.createSubscriberFlow(new solace.SubscriberFlowProperties({
                        endpoint: {
                            destination: consumer.topicDestination,
                            topicEndpointName: consumer.topicEndpointName,
                        },
                    }));
                    // Define flow event listeners
                    consumer.flow.on(solace.FlowEventName.UP, function () {
                        consumer.consuming = true;
                        consumer.log('=== Ready to receive messages. ===');
                    });
                    consumer.flow.on(solace.FlowEventName.BIND_FAILED_ERROR, function () {
                        consumer.consuming = false;
                        consumer.log('=== Error: the flow could not bind to DTE "' + consumer.topicEndpointName +
                            '" ===\n   Ensure the Durable Topic Endpoint exists on the message router vpn');
                    });
                    consumer.flow.on(solace.FlowEventName.DOWN, function () {
                        consumer.consuming = false;
                        consumer.log('=== An error happened, the flow is down ===');
                    });
                    // Define message event listener
                    consumer.flow.on(solace.FlowEventName.MESSAGE, function (message) {
                        consumer.log('Received message: "' + message.getBinaryAttachment() + '",' +
                            ' details:\n' + message.dump());
                    });
                    // Connect the flow
                    consumer.flow.connect();
                } catch (error) {
                    consumer.log(error.toString());
                }
            }
        } else {
            consumer.log('Cannot start the DTE consumer because not connected to Solace message router.');
        }
    };

    // Disconnects the consumer from DTE on Solace message router
    consumer.stopConsume = function () {
        if (consumer.session !== null) {
            if (consumer.consuming) {
               consumer.consuming = false;
               consumer.log('Disconnecting consumption from DTE: ' + consumer.topicEndpointName);
                try {
                    consumer.flow.disconnect();
                    consumer.flow.dispose();
                } catch (error) {
                    consumer.log(error.toString());
                }
            } else {
                consumer.log('Cannot disconnect the consumer because it is not connected to DTE "' +
                    consumer.topicEndpointName + '"');
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
