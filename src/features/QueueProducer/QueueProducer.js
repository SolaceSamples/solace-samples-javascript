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
 * Persistence with Queues tutorial - Queue Producer
 * Demonstrates sending persistent messages to a queue
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var QueueProducer = function (queueName) {
    'use strict';
    var producer = {};
    producer.session = null;
    producer.queueName = queueName;

    // Logger
    producer.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById('log');
        logTextArea.value += timestamp + line + '\n';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    producer.log('\n*** Producer to queue "' + producer.queueName + '" is ready to connect ***');

    // Establishes connection to Solace PubSub+ Event Broker
    producer.connect = function () {
        if (producer.session !== null) {
            producer.log('Already connected and ready to send messages.');
            return;
        }
        var hosturl = document.getElementById('hosturl').value;
        // check for valid protocols
        if (hosturl.lastIndexOf('ws://', 0) !== 0 && hosturl.lastIndexOf('wss://', 0) !== 0 &&
            hosturl.lastIndexOf('http://', 0) !== 0 && hosturl.lastIndexOf('https://', 0) !== 0) {
            producer.log('Invalid protocol - please use one of ws://, wss://, http://, https://');
            return;
        }
        var username = document.getElementById('username').value;
        var pass = document.getElementById('password').value;
        var vpn = document.getElementById('message-vpn').value;
        if (!hosturl || !username || !pass || !vpn) {
            producer.log('Cannot connect: please specify all the Solace PubSub+ Event Broker properties.');
            return;
        }
        producer.log('Connecting to Solace PubSub+ Event Broker using url: ' + hosturl);
        producer.log('Client username: ' + username);
        producer.log('Solace PubSub+ Event Broker VPN name: ' + vpn);
        // create session
        try {
            producer.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      hosturl,
                vpnName:  vpn,
                userName: username,
                password: pass,
                publisherProperties: {
                  acknowledgeMode: solace.MessagePublisherAcknowledgeMode.PER_MESSAGE,
              }          
            });
        } catch (error) {
            producer.log(error.toString());
        }
        // define session event listeners
        producer.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            producer.log('=== Successfully connected and ready to send messages. ===');
                                   
                            
        });
        producer.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            producer.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        producer.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            producer.log('Disconnected.');
            if (producer.session !== null) {
                producer.session.dispose();
                producer.session = null;
            }
        });
        producer.session.on(solace.SessionEventCode.ACKNOWLEDGED_MESSAGE, function (sessionEvent) {
            producer.log('Delivery of message with correlation key = ' +
                sessionEvent.correlationKey.id + ' confirmed.');
        });
        producer.session.on(solace.SessionEventCode.REJECTED_MESSAGE_ERROR, function (sessionEvent) {
            producer.log('Delivery of message with correlation key = ' +
                sessionEvent.correlationKey.id + ' rejected, info: ' + sessionEvent.infoStr);
        });

        producer.connectToSolace();   

    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    producer.connectToSolace = function () {
        try {
            producer.session.connect();
        } catch (error) {
            producer.log(error.toString());
        }
    };

    // Sends one message
    producer.sendMessage = function () {
        if (producer.session !== null) {
            var messageText = 'Sample Message';
            var message = solace.SolclientFactory.createMessage();
            producer.log('Sending message "' + messageText + '" to queue "' + producer.queueName + '"...');
            message.setDestination(solace.SolclientFactory.createDurableQueueDestination(producer.queueName));
            message.setBinaryAttachment(messageText);
            message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
            // OPTIONAL: You can set a correlation key on the message and check for the correlation
            // in the ACKNOWLEDGE_MESSAGE callback. Define a correlation key object
            const correlationKey = {
                name: "MESSAGE_CORRELATIONKEY",
                id: Date.now()
            };
            message.setCorrelationKey(correlationKey);
    
            try {
                // Delivery not yet confirmed. See ConfirmedPublish.js
                producer.session.send(message);
                producer.log('Message sent with correlation key: ' + correlationKey.id);
            } catch (error) {
                producer.log(error.toString());
            }
        } else {
            producer.log('Cannot send messages because not connected to Solace PubSub+ Event Broker.');
        }
    };

    // Gracefully disconnects from Solace PubSub+ Event Broker
    producer.disconnect = function () {
        producer.log('Disconnecting from Solace PubSub+ Event Broker...');
        if (producer.session !== null) {
            try {
                producer.session.disconnect();
            } catch (error) {
                producer.log(error.toString());
            }
        } else {
            producer.log('Not connected to Solace PubSub+ Event Broker.');
        }
    };

    producer.clear = function () {
      producer.log('Clearing log messages...');
      document.getElementById('log').value = "";
    }

    return producer;
};
