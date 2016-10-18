////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Systems Messaging API for JavaScript
// Copyright 2010-2016 Solace Systems, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to use and
// copy the Software, and to permit persons to whom the Software is furnished to
// do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// UNLESS STATED ELSEWHERE BETWEEN YOU AND SOLACE SYSTEMS, INC., THE SOFTWARE IS
// PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
// PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
// BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// http://www.SolaceSystems.com
//
//                              * DirectPubSub *
//
// This sample demonstrates:
//  - Subscribing to a topic for direct messages.
//  - Publishing direct messages to a topic.
//  - Receiving messages with callbacks
//
// In this sample, we show the basics of creating a session, connecting a session, subscribing to a topic,
// and publishing direct messages to a topic.
// This is meant to be a very basic example, so we use minimal session properties and a message and session
// event callbacks that simply prints the number of received message to the screen.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

(function() {
    var OPERATION_TIMEOUT = 30000;
    var ns = this;
    
    /**
     * Data members in the global scope
     */
    var mySessionProperties = null;
    var publishIntervalId = null;
    var statsIntervalId = null;
    var elapsedTimeInSecs = 0;
    var connectedOnce = false;
    var autoReconnect = false;
    var previousTick = 0;
    var mySession = null;

    // public fields
    this.rxMsgCount = 0;
    this.intervalCount = 0;

    // An array of subscriptions that cannot be sent temporarily due to network congestion
    // They will be resent upon receiving CAN_ACCEPT_DATA event.
    // The array will be cleared when session is disconnected.
    var subscriptionsInWaiting = [];

    var sessionEventCb; // forward declaration
    var messageEventCb; // forward declaration

    this.getSession = function() {
        return mySession;
    };

    /**
     * Invoked when create button is clicked
     */
    this.onCreateSession = function() {
        // log to console
        var msg = "Creating Session: [ url='" +
                ns.utils_getUrl() + "', " +
                "user='" + ns.utils_getUserName() + "', " +
                "vpn='" + ns.utils_getVPN() +
                "']";
        ns.utils_appendToConsole(msg);
        // create the session
        try {
            autoReconnect = ns.utils_getAutoReconnect();
            mySessionProperties = new solace.SessionProperties();


            mySessionProperties.connectTimeoutInMsecs = 25000;
            mySessionProperties.transportDowngradeTimeoutInMsecs = 5000;

            mySessionProperties.readTimeoutInMsecs = OPERATION_TIMEOUT;
            mySessionProperties.keepAliveIntervalsLimit = 10;
            mySessionProperties.userName = ns.utils_getUserName();
            mySessionProperties.vpnName = ns.utils_getVPN();
            mySessionProperties.password = ns.utils_getPassword();
            mySessionProperties.url = ns.utils_getUrl();
            mySessionProperties.reapplySubscriptions = autoReconnect;
            mySessionProperties.keepAliveIntervalInMsecs = 3000;

            
            mySession = solace.SolclientFactory.createSession(mySessionProperties,
                    new solace.MessageRxCBInfo(function(session, message) {
                            ns.messageEventCb(session, message);
                    }, this),
                    new solace.SessionEventCBInfo(function(session, event) {
                        ns.sessionEventCb(session, event);
                    }, this));
            // Update UI
            ns.utils_Button_Connect_setState(true);
            ns.utils_Button_Dispose_setState(true);
            ns.utils_Button_Create_setState(false);
            // log it
            ns.utils_appendToConsole("Session was successfully created.");
        } catch (error) {
            ns.utils_appendToConsole("Session creation failed");
            ns.utils_appendToConsole(error.toString());
        }
    };

    /**
     *  Invoked when connect button is clicked
     */
    this.onConnectSession = function() {
        // Update UI
        ns.utils_appendToConsole("About to connect session...");
        //
        try {
            ns.disconnectRequested = false;
            if (connectedOnce) {
                mySession.connect();
            }
            else {
                mySession.connect();
                ns.utils_Button_Connect_setState(false);
                ns.signal_sessionConnected();
                connectedOnce = true;
            }
        } catch (error) {
            ns.utils_appendToConsole("Failed to connect session");
            ns.utils_appendToConsole(error.toString());
            ns.signal_sessionFailedToConnect();
        }
    };

    /**
     * Invoked when disconnect button is clicked
     */
    this.onDisconnectSession = function() {
        ns.utils_appendToConsole("About to disconnect session...");
        ns.utils_Button_Connect_setState(true);
        try {
            ns.disconnectRequested = true;
            ns.requestRestartPublishing = false;
            subscriptionsInWaiting = [];
            mySession.disconnect();
            ns.utils_Button_Disconnect_setState(false);
        } catch (error) {
            ns.utils_appendToConsole("Failed to connect session");
            ns.utils_appendToConsole(error.toString());
            ns.utils_Button_Disconnect_setState(true);
        }
    };

    /**
     * Invoked when dispose button is clicked
     */
    this.onDisposeSession = function() {
        ns.utils_appendToConsole("Disposing ...");
        ns.disconnectRequested = true;
        ns.requestRestartPublishing = false;
        subscriptionsInWaiting = [];
        if (mySession !== null) {
            try {
                ns.cleanup();
                ns.signal_sessionDisposed();
            } catch (error) {
                ns.utils_appendToConsole("Failed to dispose session");
                ns.utils_appendToConsole(error.toString());
            }
        }
    };

    /**
     * General cleanup
     */
    this.cleanup = function() {
        if (mySession !== null) {
            subscriptionsInWaiting = [];
            mySession.dispose();
            mySession = null;
            connectedOnce = false;
            if (statsIntervalId !== null) {
                clearInterval(statsIntervalId);
                statsIntervalId = null;
            }

        }
    };

    /**
     * Invoked when add subscription button is clicked
     */
    this.onAddSubscription = function() {
        ns.utils_appendToConsole("About to add subscription '" + ns.utils_getSubscription() + "'");
        if (mySession !== null) {
            try {
                var topic = solace.SolclientFactory.createTopic(ns.utils_getSubscription());
                try {
                    mySession.subscribe(topic, true, ns.utils_getSubscription(), OPERATION_TIMEOUT);
                } catch (e) {
                     if (e instanceof solace.OperationError && e.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {
                        ns.utils_appendToConsole("Add subscription blocked");
                        subscriptionsInWaiting.push(
                            {
                                subscription: topic,
                                add: true
                            });
                        return;
                    }
                    throw e;
                }
                // UI
                ns.utils_Button_AddSubscription_setState(false);
                ns.utils_Button_RemoveSubscription_setState(false);
            } catch (error) {
                ns.utils_appendToConsole("Failed to add subscription '" + ns.utils_getSubscription() + "'");
                ns.utils_appendToConsole(error.toString());
            }
        }
    };

    /**
     * Invoked when remove subscription button is clicked
     */
    this.onRemoveSubscription = function() {
        ns.utils_appendToConsole("About to remove subscription '" + ns.utils_getSubscription() + "'");
        if (mySession !== null) {
            try {
                var topic = solace.SolclientFactory.createTopic(ns.utils_getSubscription());
                try {
                    mySession.unsubscribe(topic, true, ns.utils_getSubscription(), OPERATION_TIMEOUT);
                } catch (e) {
                    if (e instanceof solace.OperationError && e.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {
                        ns.utils_appendToConsole("Remove subscription blocked");
                        subscriptionsInWaiting.push(
                            {
                                subscription: topic,
                                add: false
                            });
                        return;
                    }
                    throw e;
                }
                // UI
                ns.utils_Button_AddSubscription_setState(false);
                ns.utils_Button_RemoveSubscription_setState(false);
            } catch (error) {
                ns.utils_appendToConsole("Failed to add subscription '" + ns.utils_getSubscription());
                ns.utils_appendToConsole(error.toString());
            }
        }
    };

    /** 
     * Invoked when start publishing button is clicked
     */
    this.onStartPublishing = function(updateUI) {
        if (publishIntervalId === null) {
            ns.requestRestartPublishing = false;
            publishIntervalId = setInterval(function() {
                var msg = solace.SolclientFactory.createMessage();
                msg.setDestination(solace.SolclientFactory.createTopic(ns.utils_getMessageTopic()));
                msg.setBinaryAttachment(ns.utils_getMessageText());
                msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
                try {
                    mySession.send(msg);
                } catch (error) {
                    // failed to send, therefore stop publishing and log the error thrown
                    ns.utils_appendToConsole("Failed to send message '" + msg.toString() + "'");
                    ns.utils_appendToConsole(error.toString() + error.Message);
                    var requestRestart = (error instanceof solace.OperationError && error.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE);
                    ns.onStopPublishing(requestRestart);
                }
            }, ns.utils_getPublishInterval());
            if (updateUI) {
                ns.signal_sessionPublishing();
            }
        }
    };

    /**
     * Invoked when stop publishing button is clicked
     */
    this.onStopPublishing = function(requestRestart) {
        if (publishIntervalId !== null) {
            clearInterval(publishIntervalId);
            if (requestRestart) {
                ns.requestRestartPublishing = true;
            } else {
                ns.requestRestartPublishing = false;
                ns.utils_Button_StopPublishing_setState(false);
                ns.utils_Button_StartPublishing_setState(true);
            }
            publishIntervalId = null;
        }

    };

    /**
     * Invoked when Clear button is clicked
     */
    this.onClearConsole = function() {
        ns.utils_clearConsole();
    };

    /**
     * Direct message receive callback
     * @param session
     * @param message
     */
    this.messageEventCb = function (session, message) {
        ns.rxMsgCount++;
        ns.intervalCount++;
        if (statsIntervalId === null) {
            previousTick = (new Date()).getTime();
            statsIntervalId = setInterval(function() {
                var currentTick = (new Date()).getTime();
                var elapsedMsecs = currentTick - previousTick;
                previousTick = currentTick;
                ns.utils_label_update("stats_rxMsgCount", "(" + ns.rxMsgCount + "@ " + (ns.intervalCount / (elapsedMsecs / 1000)).toFixed(2) + " msgs/sec on average )");
                ns.intervalCount = 0;
                //
            }, 1000);
        }
    };

    /**
     * Session event callback
     * @param session
     * @param event
     */
    this.sessionEventCb = function (session, event) {
        ns.utils_appendToConsole(event.toString());
        if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
            ns.signal_sessionConnected();
            if (ns.requestRestartPublishing) {
                ns.onStartPublishing(false);
            }
        } else if (event.sessionEventCode === solace.SessionEventCode.CAN_ACCEPT_DATA) {
            while (subscriptionsInWaiting.length > 0) {
                var sub = subscriptionsInWaiting[0].subscription;
                var add = subscriptionsInWaiting[0].add;
                ns.utils_appendToConsole("Resend subscription '" + sub.m_name + "'");
                try {
                    if (add) {
                        mySession.subscribe(sub, true, sub.m_name, OPERATION_TIMEOUT);
                    }
                    else {
                        mySession.unsubscribe(sub, true, sub.m_name, OPERATION_TIMEOUT);
                    }
                    subscriptionsInWaiting.shift();
                } catch (e) {
                    if (e instanceof solace.OperationError && e.subcode === solace.ErrorSubcode.INSUFFICIENT_SPACE) {
                        ns.utils_appendToConsole("Resend subscription blocked");
                        return;
                    }
                    throw e;
                }
            }
            if (ns.requestRestartPublishing) {
                // data congestion cleared and we can restart publishing
                ns.onStartPublishing(false);
            }
        } else if (event.sessionEventCode === solace.SessionEventCode.DISCONNECTED) {
            ns.signal_sessionFailedToConnect();
            subscriptionsInWaiting = [];
            if (ns.disconnectRequested) {
                ns.onStopPublishing(false);
            } else {
                // error occurred!
                // stop publishing but request restart
                ns.onStopPublishing(true);
                if (autoReconnect) {
                    setTimeout(
                        function(){
                            ns.onConnectSession();
                        }, 100);
                }
            }
        } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_OK) {
            ns.utils_appendToConsole("Subscription added/removed: '" + event.correlationKey + "'");
            ns.signal_subscriptionOperationDone();
        } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_ERROR) {
            ns.utils_appendToConsole("Failed to add subscription:  '" + event.correlationKey + "'");
            ns.signal_subscriptionOperationDone();
        } else if (event.sessionEventCode === solace.SessionEventCode.LOGIN_FAILURE) {
            ns.utils_appendToConsole("Login Failure!");
        } else if (event.sessionEventCode === solace.SessionEventCode.CONNECTING) {
            ns.utils_appendToConsole("Connecting...");
            ns.signal_sessionConnecting();
        } else {
            ns.utils_appendToConsole("Error!");
            ns.signal_sessionFailedToConnect();
        }
    };

}.apply(solace.sample));
