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

    // Establishes connection to Solace message router by its hostname
    producer.connect = function (host, username, password, vpn) {
        if (producer.session !== null) {
            producer.log('Already connected and ready to send messages.');
        } else {
            var host = document.getElementById('host').value;
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;
            var vpn = document.getElementById('message-vpn').value;
            if (host && vpn && username && password) {
                producer.connectToSolace(host, username, password, vpn);
            } else {
                producer.log('Cannot connect: please specify all the Solace message router properties.');
            }
        }
    };

    producer.connectToSolace = function (host, username, password, vpn) {
        const sessionProperties = new solace.SessionProperties();
        sessionProperties.url = 'ws://' + host;
        producer.log('Connecting to Solace message router using WebSocket transport url ws://' + host);
        sessionProperties.vpnName = vpn;
        producer.log('Solace message router VPN name: ' + sessionProperties.vpnName);
        sessionProperties.userName = username;
        producer.log('Client username: ' + sessionProperties.userName);
        sessionProperties.password = password;
        // create session
        try {
            producer.session = solace.SolclientFactory.createSession(sessionProperties);
        } catch (error) {
            producer.log(error.toString());
        }
        // define session event handlers
        producer.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            producer.log('=== Successfully connected and ready to send messages. ===');
        });
        producer.session.on(solace.SessionEventCode.CONNECTING, (sessionEvent) => {
            producer.log('Connecting...');
        });
        producer.session.on(solace.SessionEventCode.DISCONNECTED, (sessionEvent) => {
            producer.log('Disconnected.');
            if (producer.session !== null) {
                producer.session.dispose();
                producer.session = null;
            }
        });
        // connect the session
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
            message.setDestination(
                solace.SolclientFactory.createDestination(solace.DestinationType.QUEUE, producer.queueName));
            message.setBinaryAttachment(messageText);
            message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
            try {
                producer.session.send(message);
                producer.log('Message sent.');
            } catch (error) {
                producer.log(error.toString());
            }
        } else {
            producer.log('Cannot send messages because not connected to Solace message router.');
        }
    };

    producer.exit = function () {
        producer.disconnect();
        setTimeout(function () {
            process.exit();
        }, 1000); // wait for 1 second to finish
    };

    // Gracefully disconnects from Solace message router
    producer.disconnect = function () {
        producer.log('Disconnecting from Solace message router...');
        if (producer.session !== null) {
            try {
                producer.session.disconnect();
            } catch (error) {
                producer.log(error.toString());
            }
        } else {
            producer.log('Not connected to Solace message router.');
        }
    };

    return producer;
};
