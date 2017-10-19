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
 * Active Flow Indication - Consumer
 * Demonstrates active flow notification to multiple flows bound to an exclusive queue
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var QueueConsumer = function (queueName) {
    'use strict';
    var consumer = {};
    consumer.session = null;
    consumer.flow1 = null;
    consumer.flow2 = null;
    consumer.queueName = queueName;
    consumer.queueDestination = new solace.Destination(consumer.queueName, solace.DestinationType.QUEUE);
    consumer.consuming = false;
    consumer.numOfMessages = 10;
    consumer.receivedMessages = 0;

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
    consumer.connect = function (argv) {
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
        sessionProperties.url = 'http://' + host;
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
                consumer.log('Starting consumer for exclusive queue: ' + consumer.queueName + ' on two flows.');
                try {
                    // Create the flows
                    consumer.flow1 = consumer.createActiveIndFlow(consumer.session, 'flow 1');
                    consumer.flow2 = consumer.createActiveIndFlow(consumer.session, 'flow 2');
                    // Connect the flow
                    consumer.flow1.connect();
                    consumer.flow2.connect();
                } catch (error) {
                    consumer.log("!!!" + error.toString());
                }
            }
        } else {
            consumer.log('Cannot start the queue consumer because not connected to Solace message router.');
        }
    };

    consumer.createActiveIndFlow = function (session, flowname) {
        // Create a flow
        var flow = session.createSubscriberFlow(new solace.SubscriberFlowProperties({
            endpoint: {
                destination: consumer.queueDestination,
            },
            acknowledgeMode: solace.SubscriberFlowAcknowledgeMode.CLIENT,
            activeIndicationEnabled: true,
        }));
        // Define flow event listeners
        flow.on(solace.FlowEventName.UP, function () {
            consumer.consuming = true;
            consumer.log('=== ' + flowname + ': Ready to receive messages. ===');
        });
        flow.on(solace.FlowEventName.BIND_FAILED_ERROR, function () {
            consumer.consuming = false;
            consumer.log('=== ' + flowname + ': Error: the flow could not bind to queue "' + consumer.queueName +
                '" ===\n   Ensure the queue exists on the message router vpn');
        });
        flow.on(solace.FlowEventName.DOWN, function () {
            consumer.consuming = false;
            consumer.log('=== ' + flowname + ': The flow is down ===');
        });
        flow.on(solace.FlowEventName.ACTIVE, () => {
            consumer.log('=== ' + flowname + ': received ACTIVE event');
        });
        flow.on(solace.FlowEventName.INACTIVE, () => {
            consumer.log('=== ' + flowname + ': received INACTIVE event');
        });
        // Define message event listener
        flow.on(solace.FlowEventName.MESSAGE, function (message) {
            consumer.receivedMessages += 1;
            consumer.log('Received message ' + consumer.receivedMessages + ' out of ' + consumer.numOfMessages +
                ' messages expected on ' + flowname);
            message.acknowledge();
            // Disconnect flow when target number of messages have been received
            if (consumer.receivedMessages === consumer.numOfMessages/2) {
                console.log('Disconnecting ' + flowname);
              flow.disconnect();
            }
            if (consumer.receivedMessages === consumer.numOfMessages) {
                console.log('Disconnecting ' + flowname);
                flow.disconnect();
                consumer.consuming = false;
                consumer.receivedMessages = 0;
            }
        });
        return flow;
    }

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
