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
 * Demonstrates flow ACTIVE/INACTIVE notification to multiple message consumers bound to an exclusive queue
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var QueueConsumer = function (queueName) {
    'use strict';
    var consumer = {};
    consumer.session = null;
    consumer.msgConsumer1 = null;
    consumer.msgConsumer2 = null;
    consumer.queueName = queueName;
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
            return;
        }
        var hosturl = document.getElementById('hosturl').value;
        consumer.log('Connecting to Solace message router using url: ' + hosturl);
        var username = document.getElementById('username').value;
                                                 
        consumer.log('Client username: ' + username);
        var pass = document.getElementById('password').value;
        var vpn = document.getElementById('message-vpn').value;
        consumer.log('Solace message router VPN name: ' + vpn);
        if (!hosturl || !username || !pass || !vpn) {
            consumer.log('Cannot connect: please specify all the Solace message router properties.');
            return;
        }
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
        // if secure connection, first load iframe so the browser can provide a client-certificate
        if (hosturl.lastIndexOf('wss://', 0) === 0 || hosturl.lastIndexOf('https://', 0) === 0) {
            var urlNoProto = hosturl.split('/').slice(2).join('/'); // remove protocol prefix
            document.getElementById('iframe').src = 'https://' + urlNoProto + '/crossdomain.xml';
        } else {
            consumer.connectToSolace();   // otherwise proceed
        }
    };

    // Actually connects the session
    consumer.connectToSolace = function () {
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
                consumer.log('Already started consumer for queue "' + consumer.queueName +
                    '" and ready to receive messages.');
            } else {
                consumer.log('Starting consumer for exclusive queue: ' + consumer.queueName + ' on two flows.');
                try {
                    // Create the message consumers
                    consumer.msgConsumer1 = consumer.createActiveIndFlow(consumer.session, 'message consumer 1');
                    consumer.msgConsumer2 = consumer.createActiveIndFlow(consumer.session, 'message consumer 2');
                    // Connect the message consumer
                    consumer.msgConsumer1.connect();
                    consumer.msgConsumer2.connect();
                } catch (error) {
                    consumer.log("!!!" + error.toString());
                }
            }
        } else {
            consumer.log('Cannot start the queue consumer because not connected to Solace message router.');
        }
    };

    consumer.createActiveIndFlow = function (session, messageConsumerName) {
        // Create a message consumer
        const messageConsumer = consumer.session.createMessageConsumer({
            queueDescriptor: { name: consumer.queueName, type: solace.QueueType.QUEUE },
            acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT,
            activeIndicationEnabled: true,
        });
        // Define message consumer event listeners
        messageConsumer.on(solace.MessageConsumerEventName.UP, function () {
            consumer.consuming = true;
            consumer.log('=== ' + messageConsumerName + ': Ready to receive messages. ===');
        });
        messageConsumer.on(solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, function () {
            consumer.consuming = false;
            consumer.log('=== ' + messageConsumerName + ': Error: the message consumer could not bind to queue "' +
                consumer.queueName + '" ===\n   Ensure this queue exists on the message router vpn');
        });
        messageConsumer.on(solace.MessageConsumerEventName.DOWN, function () {
            consumer.consuming = false;
            consumer.log('=== ' + messageConsumerName + ': The message consumer is down ===');
        });
        messageConsumer.on(solace.MessageConsumerEventName.ACTIVE, function () {
            consumer.log('=== ' + messageConsumerName + ': received ACTIVE event');
        });
        messageConsumer.on(solace.MessageConsumerEventName.INACTIVE, function () {
            consumer.log('=== ' + messageConsumerName + ': received INACTIVE event');
        });
        // Define message event listener
        messageConsumer.on(solace.MessageConsumerEventName.MESSAGE, function (message) {
            consumer.receivedMessages += 1;
            consumer.log('Received message ' + consumer.receivedMessages + ' out of ' + consumer.numOfMessages +
                ' messages expected on ' + messageConsumerName);
            message.acknowledge();
            // Disconnect message consumer when target number of messages have been received
            if (consumer.receivedMessages === consumer.numOfMessages/2) {
                console.log('Disconnecting ' + messageConsumerName);
              messageConsumer.disconnect();
            }
            if (consumer.receivedMessages === consumer.numOfMessages) {
                console.log('Disconnecting ' + messageConsumerName);
                messageConsumer.disconnect();
                consumer.disconnect();
            }
        });
        return messageConsumer;
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
