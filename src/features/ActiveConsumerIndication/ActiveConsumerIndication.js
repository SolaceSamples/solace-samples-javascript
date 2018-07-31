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
 * Active Consumer Indication
 * Demonstrates Consumer ACTIVE/INACTIVE notification to multiple message consumers
 * bound to an exclusive queue
 *
 * This sample will show how multiple message consumers can bind to an exclusive queue,
 * but only one client at a time can actively receive messages. If the Active Indication
 * message consumer property is enabled, a Consumer active/inactive event is returned to
 * the client when its bound consumer becomes/stops being the active consumer. Start this app,
 * then the `basic-samples/ConfirmedPublish` app can be used to send 10 messages to trigger it.
 * The sample is using only one session for demonstration purposes and in a real-world
 * implementation the consumers would be on separate sessions, likely in separate processes.
 *
 * Prerequisite: this sample requires that the queue "tutorial/queue" exists on the message router
 * and configured to be "exclusive".  Ensure the queue is enabled for both Incoming and Outgoing
 * messages and set the Permission to at least 'Consume'.
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var QueueConsumer = function (queueName) {
    'use strict';
    var sample = {};
    sample.session = null;
    sample.msgConsumer1 = null;
    sample.msgConsumer2 = null;
    sample.queueName = queueName;
    sample.consuming = false;
    sample.numOfMessages = 10;
    sample.receivedMessages = 0;

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

    sample.log('\n*** Consumer to queue "' + sample.queueName + '" is ready to connect ***');

    // Establishes connection to Solace message router
    sample.connect = function (argv) {
        if (sample.session !== null) {
            sample.log('Already connected and ready to consume messages.');
            return;
        }
        var hosturl = document.getElementById('hosturl').value;
        // check for valid protocols
        if (hosturl.lastIndexOf('ws://', 0) !== 0 && hosturl.lastIndexOf('wss://', 0) !== 0 &&
            hosturl.lastIndexOf('http://', 0) !== 0 && hosturl.lastIndexOf('https://', 0) !== 0) {
            sample.log('Invalid protocol - please use one of ws://, wss://, http://, https://');
            return;
        }
        var username = document.getElementById('username').value;
        var pass = document.getElementById('password').value;
        var vpn = document.getElementById('message-vpn').value;
        if (!hosturl || !username || !pass || !vpn) {
            sample.log('Cannot connect: please specify all the Solace message router properties.');
            return;
        }
        sample.log('Connecting to Solace message router using url: ' + hosturl);
        sample.log('Client username: ' + username);
        sample.log('Solace message router VPN name: ' + vpn);
        // create session
        try {
            sample.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      hosturl,
                vpnName:  vpn,
                userName: username,
                password: pass,
            });
        } catch (error) {
            sample.log(error.toString());
        }
        // define session event listeners
        sample.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            sample.log('=== Successfully connected and ready to start the message consumer. ===');
        });
        sample.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            sample.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        sample.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            sample.log('Disconnected.');
            sample.consuming = false;
            if (sample.session !== null) {
                sample.session.dispose();
                sample.session = null;
            }
        });
        // if secure connection, first load iframe so the browser can provide a client-certificate
        if (hosturl.lastIndexOf('wss://', 0) === 0 || hosturl.lastIndexOf('https://', 0) === 0) {
            var urlNoProto = hosturl.split('/').slice(2).join('/'); // remove protocol prefix
            document.getElementById('iframe').src = 'https://' + urlNoProto + '/crossdomain.xml';
        } else {
            sample.connectToSolace();   // otherwise proceed
        }
    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    sample.connectToSolace = function () {
        try {
            sample.session.connect();
        } catch (error) {
            sample.log(error.toString());
        }
    };

    // Starts consuming from a queue on Solace message router
    sample.startConsume = function () {
        if (sample.session !== null) {
            if (sample.consuming) {
                sample.log('Already started consumer for queue "' + sample.queueName +
                    '" and ready to receive messages.');
            } else {
                sample.log('Starting consumer for exclusive queue: ' + sample.queueName + ' on two consumers.');
                try {
                    // Create the message consumers
                    sample.msgConsumer1 = sample.createConsumer(sample.session, 'message consumer 1');
                    sample.msgConsumer2 = sample.createConsumer(sample.session, 'message consumer 2');
                    // Connect the message consumer
                    // One consumer will become active, likely the first one, and one will not get the
                    // active-consumer-indication
                    sample.msgConsumer1.connect();
                    sample.msgConsumer2.connect();
                } catch (error) {
                    sample.log("!!!" + error.toString());
                }
            }
        } else {
            sample.log('Cannot start the queue consumer because not connected to Solace message router.');
        }
    };

    sample.createConsumer = function (session, messageConsumerName) {
        // Create a message consumer
        const messageConsumer = sample.session.createMessageConsumer({
            queueDescriptor: { name: sample.queueName, type: solace.QueueType.QUEUE },
            acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT,
            activeIndicationEnabled: true,
        });
        // Define message consumer event listeners
        messageConsumer.on(solace.MessageConsumerEventName.UP, function () {
            sample.consuming = true;
            sample.log('=== ' + messageConsumerName + ': The message consumer is up ===');
        });
        messageConsumer.on(solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, function () {
            sample.consuming = false;
            sample.log('=== ' + messageConsumerName + ': Error: the message consumer could not bind to queue "' +
                sample.queueName + '" ===\n   Ensure this queue exists on the message router vpn');
        });
        messageConsumer.on(solace.MessageConsumerEventName.DOWN, function () {
            sample.consuming = false;
            sample.log('=== ' + messageConsumerName + ': The message consumer is down ===');
        });
        messageConsumer.on(solace.MessageConsumerEventName.ACTIVE, function () {
            sample.log('=== ' + messageConsumerName + ': received ACTIVE event - Ready to receive messages');
        });
        messageConsumer.on(solace.MessageConsumerEventName.INACTIVE, function () {
            sample.log('=== ' + messageConsumerName + ': received INACTIVE event');
        });
        // Define message event listener
        messageConsumer.on(solace.MessageConsumerEventName.MESSAGE, function (message) {
            sample.receivedMessages += 1;
            sample.log('Received message ' + sample.receivedMessages + ' out of ' + sample.numOfMessages +
                ' messages expected on ' + messageConsumerName);
            message.acknowledge();
            // Disconnect message consumer when target number of messages have been received
            if (sample.receivedMessages === sample.numOfMessages/2) {
                // Disconnecting the messageConsumer that receives the 5th message
                // which is the first one active, causing the second one to go active
                console.log('Disconnecting ' + messageConsumerName);
                messageConsumer.disconnect();
            }
            if (sample.receivedMessages === sample.numOfMessages) {
                // Disconnecting the second consumer when we receive the last message
                console.log('Disconnecting ' + messageConsumerName);
                messageConsumer.disconnect();
                sample.disconnect();
            }
        });
        return messageConsumer;
    }

    // Gracefully disconnects from Solace message router
    sample.disconnect = function () {
        sample.log('Disconnecting from Solace message router...');
        if (sample.session !== null) {
            try {
                sample.session.disconnect();
            } catch (error) {
                sample.log(error.toString());
            }
        } else {
            sample.log('Not connected to Solace message router.');
        }
    };

    return sample;
};
