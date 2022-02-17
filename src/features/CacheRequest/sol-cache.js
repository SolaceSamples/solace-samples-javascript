////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Corporation Messaging API for JavaScript
// Copyright 2009-2016 Solace Corporation. All rights reserved. //
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to use and
// copy the Software, and to permit persons to whom the Software is furnished to
// do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// UNLESS STATED ELSEWHERE BETWEEN YOU AND SOLACE CORPORATION, THE SOFTWARE IS
// PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
// PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
// BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// http://www.solace.com
//
//                          * SolCache *
//
// This sample demonstrates use of SolCache: creating a cache session, sending cache requests,
// and receiving replies.
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.sample = solace.sample || {};

(function() {

    var OPERATION_TIMEOUT = 30000;

    var ns = this;
    /**
     * Data members in the global scope
     */
    var mySessionProperties = null;
    var mySession = null;
    var myNickName = null;

    var sessionEventCb; // forward declaration
    var messageEventCb; // forward declaration
    var cacheRequestCb; // forward declaration

    var requestID = 0;
    var messageCount = 0;
    var receivingCacheMessages = false;

    var cacheSession;

    /**
     * Invoked when the Ok button is clicked on the login dialog. This method will trigger the creation and connect()
     * operation on the session. When successfully connected, handle_sessionConnected() is invoked
     */
    this.onLogin = function() {       
        // Set UI state for login in progress
        ns.signal_loggingIn();

        // log to console
        var msg = "Creating Session: [ url='" + ns.utils_getUrl() + "', " +
                "user='" + ns.utils_getUserName() + ", vpn='" + ns.utils_getVPN() + "']";
        ns.utils_appendToConsole(msg);
        // create the session
        try {
            // Create Session
            mySessionProperties = new solace.SessionProperties();
            mySessionProperties.connectTimeoutInMsecs = OPERATION_TIMEOUT;
            mySessionProperties.readTimeoutInMsecs = OPERATION_TIMEOUT;
            mySessionProperties.keepAliveIntervalsLimit = 10;
            mySessionProperties.userName = ns.utils_getUserName();
            mySessionProperties.vpnName = ns.utils_getVPN();
            mySessionProperties.password = ns.utils_getPassword();
            mySessionProperties.url = ns.utils_getUrl();
            myNickName = mySessionProperties.clientName = ns.utils_getNickName();

            mySession = solace.SolclientFactory.createSession(
                mySessionProperties,
                new solace.MessageRxCBInfo(
                    function(session, message) {
                        messageEventCb(session, message);
                    },
                    this
                ),
                new solace.SessionEventCBInfo(
                    function(session, event) {
                        sessionEventCb(session, event);
                    },
                    this
                )
            );
            ns.utils_appendToConsole("Session was successfully created.");
            // Connect it
            mySession.connect();
            
        } catch (error) {
            ns.utils_appendToConsole("Could not login");
            ns.utils_appendToConsole(error.toString());
            if (mySession !== null) {
                mySession.dispose();
                mySession = null;
            }
            ns.signal_loggedOut();
        }
    };

    this.onCacheCreate = function() {
        var cacheSessionProperties = new solace.CacheSessionProperties(
            ns.utils_getCacheClusterName(),
            ns.utils_getMaxMessageAge(),
            ns.utils_getMaxMessageCount(),
            ns.utils_getRequestTimeout()
        );

        try {
            cacheSession = mySession.createCacheSession(cacheSessionProperties);
            ns.utils_appendToConsole("Created a cache session: " + cacheSession);
            ns.signal_cacheSessionCreated();
        } catch (e) {
            ns.utils_appendToConsole("Could not create a cache session: " + e);
        }
    };

    this.onCacheDispose = function() {
        try {
            cacheSession.dispose();
            ns.utils_appendToConsole("Cache session disposed: " + cacheSession);
            ns.signal_cacheSessionDisposed();
        } catch (e) {
            ns.utils_appendToConsole("Could not dispose cache session: " + e);
        }
    };

    this.onCacheRequest = function() {
        try {
            messageCount = 0;
            receivingCacheMessages = false;
            var topic = solace.SolclientFactory.createTopic(ns.utils_getTopicName());
            cacheSession.sendCacheRequest(
                requestID,
                topic,
                ns.utils_getSubscribe(),
                ns.utils_getLiveDataAction(),
                new solace.CacheCBInfo(
                    cacheRequestCb,
                    {
                        data: requestID++
                    }
                )
            );
        } catch (e) {
            ns.utils_appendToConsole("Could not send cache request: " + e);
        }
    };

    /**
     * Invoked when the user logs out
     */
    this.onLogout = function() {
        ns.cleanup();
        ns.signal_loggedOut();
    };

    /**
     * Invoked when "Show Console" checkbox is clicked
     */
    this.onShowConsole = function() {
        ns.utils_showConsole();
    };

    /**
     * Invoked when Clear button is clicked
     */
    this.onClearConsole = function() {
        ns.utils_clearConsole();
    };

    this.onClearCacheReply = function() {
        ns.utils_clearCacheReply();
    };

    /**
     * The session was successfully connected, the next step is to add the 'rendez-vous' topic subscription
     */
    this.handle_sessionConnected = function() {
        ns.signal_loggedIn();
    };

    /**
     * General failure
     * @param text
     * @param updateContent
     */
    this.handle_failure = function(text, updateContent) {
        if (updateContent) {
            ns.utils_addContent(text);
        }
        ns.utils_appendToConsole(text);
        ns.cleanup();
        ns.signal_loggedOut();
    };

    /**
     * General cleanup
     */
    this.cleanup = function() {
        if (mySession !== null) {
            mySession.dispose();
            mySession = null;
        }
    };

////////////////////// Callback functions //////////////////////////////////////////////////////////////////////////////

    /**
     * Session event callback
     * @param session
     * @param event
     */
    sessionEventCb = function (session, event) {
        ns.utils_appendToConsole(event.toString());
        if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
            ns.handle_sessionConnected();
        } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_OK) {
            ns.handle_subscriptionOperationSucceeded();
        } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_ERROR) {
            ns.handle_failure("Failed to add subscription", true);
        } else if (event.sessionEventCode === solace.SessionEventCode.LOGIN_FAILURE) {
            ns.handle_failure("Failed to login to appliance:" + event.infoStr, true);
        } else if (event.sessionEventCode === solace.SessionEventCode.CONNECTING) {
            ns.utils_appendToConsole("Connecting...");
        } else if (event.sessionEventCode === solace.SessionEventCode.DISCONNECTED) {
            ns.handle_failure("Session is disconnected", false);
        } else {
            ns.handle_failure("Session failure!", false);
        }
    };

    /**
     * Direct message receive callback
     * @param session
     * @param message
     */
    messageEventCb = function (session, message) {
        try {
            if (message.getCacheRequestId() === null) {
                ns.utils_appendToConsole("Received message: " + JSON.stringify(message));
            } else {
                var status;
                switch (message.getCacheStatus()) {
                    case solace.MessageCacheStatus.LIVE:
                        status = "Live";
                        break;
                    case solace.MessageCacheStatus.CACHED:
                        status = "Cached";
                        break;
                    case solace.MessageCacheStatus.SUSPECT:
                        status = "Suspect";
                }

                if (!receivingCacheMessages) {
                    ns.utils_addContent("Receiving cache messages for request: " + message.getCacheRequestId() + " " +
                        "Status: " + status);
                    receivingCacheMessages = true;
                }
                messageCount++;
            }
        } catch (error) {
            ns.utils_appendToConsole("Failed to send reply ");
            ns.utils_appendToConsole(error.toString());
        }
    };


    cacheRequestCb = function(requestID, cacheRequestResult, userObject) {
        ns.utils_appendToConsole("Received cache request callback");
        var resultString = JSON.stringify(cacheRequestResult);
        var userObjectString = JSON.stringify(userObject);
        var key;
        var returnCodeName;
        var subcodeName;
        for (key in solace.CacheReturnCode) {
            if (cacheRequestResult.returnCode === solace.CacheReturnCode[key]) {
                returnCodeName = key;
                break;
            }
        }
        for (key in solace.CacheReturnSubcode) {
            if (cacheRequestResult.subcode === solace.CacheReturnSubcode[key]) {
                subcodeName = key;
                break;
            }
        }
        ns.utils_addContent("Result for request " + requestID + ":\n" +
            "Result: solace.CacheReturnCode." + returnCodeName + "\n" +
            "Subcode: solace.CacheReturnSubcode." + subcodeName + "\n" +
            "Contents: \n" + resultString + "\nUserObject: \n" + userObjectString + "\n" +
            "Total cache messages received: " + messageCount + "\n");
    };

}.apply(solace.sample));
