////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Systems Messaging API for JavaScript
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to use
// and copy the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// UNLESS STATED ELSEWHERE BETWEEN YOU AND SOLACE SYSTEMS, INC., THE SOFTWARE
// IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
// A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
// IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// http://www.SolaceSystems.com
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
