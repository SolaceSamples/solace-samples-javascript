////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Systems Messaging API for JavaScript
//
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
//
//
// http://www.Solace.com
//
////////////////////////  UI /////////////////////////////////////////////////

// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.sample = solace.sample || {};

(function() {
    var ns = this;

    this.signal_subscriptionOperationDone = function() {
        ns.utils_Button_AddSubscription_setState(true);
        ns.utils_Button_RemoveSubscription_setState(true);
    };

    this.signal_sessionDisposed = function() {
        ns.utils_Button_AddSubscription_setState(false);
        ns.utils_Button_RemoveSubscription_setState(false);
        ns.utils_Button_StartPublishing_setState(false);
        ns.utils_Button_StopPublishing_setState(false);
        ns.utils_Button_Disconnect_setState(false);
        ns.utils_Button_Connect_setState(false);
        ns.utils_Button_Create_setState(true);
        ns.utils_Button_Dispose_setState(false);
        ns.rxMsgCount = 0;
        ns.intervalCount = 0;
        ns.utils_label_update("stats_rxMsgCount", "(0)");
    };

    this.signal_sessionConnecting = function() {
        ns.utils_Button_AddSubscription_setState(false);
        ns.utils_Button_RemoveSubscription_setState(false);
        ns.utils_Button_StartPublishing_setState(false);
        ns.utils_Button_StopPublishing_setState(false);
        ns.utils_Button_Disconnect_setState(true);
        ns.utils_Button_Connect_setState(false);
    };

    this.signal_sessionConnected = function() {
        ns.utils_Button_AddSubscription_setState(true);
        ns.utils_Button_RemoveSubscription_setState(true);
        ns.utils_Button_StartPublishing_setState(true);
        ns.utils_Button_StopPublishing_setState(false);
        ns.utils_Button_Disconnect_setState(true);
        ns.utils_Button_Connect_setState(false);
    };

    this.signal_sessionFailedToConnect = function() {
        ns.utils_Button_AddSubscription_setState(false);
        ns.utils_Button_RemoveSubscription_setState(false);
        ns.utils_Button_StartPublishing_setState(false);
        ns.utils_Button_StopPublishing_setState(false);
        ns.utils_Button_Disconnect_setState(false);
        if (ns.getSession() === null) {
            ns.utils_Button_Connect_setState(false);
        } else {
            ns.utils_Button_Connect_setState(true);
        }
    };

    this.signal_sessionPublishing = function() {
        ns.utils_Button_StartPublishing_setState(false);
        ns.utils_Button_StopPublishing_setState(true);
    };

    this.signal_sessionStoppedPublishing = function() {
        ns.utils_Button_StartPublishing_setState(true);
        ns.utils_Button_StopPublishing_setState(false);
    };

    this.validate_publishInterval = function() {
        if (ns.utils_getPublishInterval() < 50) {
            $("#input_publish_interval").val('50');
        }
    };

    this.utils_appendToConsole = function(message) {
        ns.utils_appendLineToTextArea("pubsub_logs", message, true);
    };

    this.utils_clearConsole = function() {
         ns.utils_clearTextArea("pubsub_logs");
    };

    this.utils_appendToMessages = function(message) {
        ns.utils_appendLineToTextArea("pubsub_messages", message, true);
    };

    this.utils_getUrl = function() {
        return ns.utils_getField("input_session_url");
    };

    this.utils_getUserName = function() {
        return ns.utils_getField("input_session_username");
    };

    this.utils_getVPN = function() {
        return ns.utils_getField("input_session_vpn");
    };

    this.utils_getPassword = function() {
        return ns.utils_getField("input_session_password");
    };

    this.utils_getAutoReconnect = function() {
        return $('#input_auto_reconnect').attr('checked');
    };

    this.utils_getSubscription = function() {
        return ns.utils_getField("input_subscription");
    };

    this.utils_getMessageText = function() {
        return ns.utils_getField("input_message_text");
    };

    this.utils_getMessageTopic = function() {
        return ns.utils_getField("input_message_topic");
    };

    this.utils_getPublishInterval = function() {
        return ns.utils_getField("input_publish_interval");
    };

    this.utils_Button_Connect_setState = function(state) {
        ns.utils_control_setButtonState("ConnectSession", state);
    };

    this.utils_Button_Create_setState = function(state) {
        ns.utils_control_setButtonState("CreateSession", state);
    };

    this.utils_Button_Disconnect_setState = function(state) {
        ns.utils_control_setButtonState("DisconnectSession", state);
    };

    this.utils_Button_Dispose_setState = function(state) {
        ns.utils_control_setButtonState("DisposeSession", state);
    };

    this.utils_Button_AddSubscription_setState = function(state) {
        ns.utils_control_setButtonState("AddSubscription", state);
    };

    this.utils_Button_RemoveSubscription_setState = function(state) {
        ns.utils_control_setButtonState("RemoveSubscription", state);
    };

    this.utils_Button_StartPublishing_setState = function(state) {
        ns.utils_control_setButtonState("StartPublishing", state);
    };

    this.utils_Button_StopPublishing_setState = function(state) {
        ns.utils_control_setButtonState("StopPublishing", state);
    };
}.apply(solace.sample));

/**
 * UI related
 */
$(function() {
    // Tabs
    $('#tabs').tabs();
    // Button
    $("#CreateSession").button({
        text: true
        //icons: {
        //    primary: "ui-icon-seek-start"
        //}
    });

    $("#ConnectSession").button({
        text: true
        //icons: {
        //    primary: "ui-icon-seek-start"
        //}
    });

    $("#DisconnectSession").button({
        text: true
        //icons: {
        //    primary: "ui-icon-seek-start"
        //}
    });

    $("#DisposeSession").button({
        text: true
        //icons: {
        //    primary: "ui-icon-close"
        //}
    });

    $("#RemoveSubscription").button({
        text: true,
        icons: {
            primary: "ui-icon-minus"
        }
    });

    $("#AddSubscription").button({
        text: true,
        icons: {
            primary: "ui-icon-plus"
        }
    });

    $("#StartPublishing").button({
        text: true,
        icons: {
            primary: "ui-icon-play"
        }
    });

    $("#StopPublishing").button({
        text: true,
        icons: {
            primary: "ui-icon-pause"
        }
    });

    $("#ClearButton").button({
        text: true,
        icons: {
            primary: "ui-icon-trash"
        }
    });
});


/**
 * jquery initialize page function
 */
$(document).ready(function() {
// Defaults
    var path = document.URL;
    var prefix = '';
    var index1 = path.indexOf('//');
    var index2 = -1;
    if (index1 > 0) {
        index2 = path.indexOf('/', index1+2);
        if (index2 > 0) {
            prefix = path.substring(0, index2);
        }
    }

    var DEFAULT_APPLIANCE_URL = prefix + '/solace/smf';
    var DEFAULT_USER_NAME = 'default';
    var DEFAULT_MSG_VPN = 'default';

    solace.sample.signal_sessionDisposed();
    solace.sample.utils_setText('pubsub_logs','');
    solace.sample.utils_setText('input_session_url', DEFAULT_APPLIANCE_URL);
    solace.sample.utils_setText('input_session_username', DEFAULT_USER_NAME);
    solace.sample.utils_setText('input_session_vpn', DEFAULT_MSG_VPN);
    $('#input_auto_reconnect').attr('checked', true);
});

$(window).unload(function() {
    solace.sample.cleanup();
});
