////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Corporation Messaging API for JavaScript
// Copyright 2010-2016 Solace Corporation. All rights reserved. //
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to use
// and copy the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// UNLESS STATED ELSEWHERE BETWEEN YOU AND SOLACE CORPORATION, THE SOFTWARE
// IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
// A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
// IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// http://www.solace.com
//
////////////////////////  User Interface ///////////////////////////////////////////////////////////////////////////////

// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

$(function() {
    // Tabs
    $('#tabs').tabs();
    // Dialog
    $('#dialog').dialog({
        autoOpen: false,
        width: 300,
        buttons: {
            "Ok": function() {
                $(this).dialog("close");
                solace.sample.onLogin();
            },
            "Cancel": function() {
                $(this).dialog("close");
            }
        }
    });
    // Dialog Link
    $('#dialog_link').click(function() {
        $('#dialog').dialog('open');
        return false;
    });
    //hover states on the static widgets
    $('#dialog_link, ul#icons li').hover(
            function() {
                $(this).addClass('ui-state-hover');
            },
            function() {
                $(this).removeClass('ui-state-hover');
            }
            );
    // Button
    $("button.solbutton").button();
    $("#LoginButton").button({
        text: true,
        icons: {
            primary: "ui-icon-check"
        }
    });
    $("#LogoutButton").button({
        text: true,
        icons: {
            primary: "ui-icon-closethick"
        }
    });
    $("#ClearButton").button({
        text: true,
        width: 100,
        icons: {
            primary: "ui-icon-trash"
        }
    });
    $('#ClearResponseButton').button({
        text: true,
        width: 200,
        icons: {
            primary: "ui-icon-trash"
        }
    });

});

var solace = solace || {};
solace.sample = solace.sample || {};

(function() {
    var ns = this;

    this.utils_appendToConsole = function(message) {
        ns.utils_appendLineToTextArea("output_console", message, true);
    };

    this.utils_showConsole = function() {
        var visible = ns.utils_isChecked("input_show_console");
        ns.utils_setVisibility("output_console", visible);
        ns.utils_setVisibility("ClearButton", visible);
    };

    this.utils_clearConsole = function() {
         ns.utils_clearTextArea("output_console");
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

    this.utils_getNickName = function() {
        return ns.utils_getField("input_session_nickname");
    };

    this.utils_getCacheClusterName = function() {
        return ns.utils_getField("input_clusterName");
    };

    this.utils_getMaxMessageAge = function() {
        return parseInt(ns.utils_getField("input_maxAge"));
    };

    this.utils_getMaxMessageCount = function() {
        return parseInt(ns.utils_getField("input_maxMessages"));
    };

    this.utils_getRequestTimeout = function() {
        return parseInt(ns.utils_getField("input_requestTimeout"));
    };

    this.utils_getSubscribe = function() {
        return ns.utils_isChecked("input_subscribe");
    };

    this.utils_getTopicName = function() {
        return ns.utils_getField("input_cacheTopic");
    };

    this.utils_getLiveDataAction = function() {
        return parseInt(ns.utils_getField("input_liveDataAction"));
    };

    this.utils_clearCacheReply = function() {
         ns.utils_clearTextArea("cache_reply");
    };

    this.utils_Button_Login_setState = function(state) {
        ns.utils_control_setButtonState("LoginButton", state);
    };

    this.utils_Button_Logout_setState = function(state) {
        ns.utils_control_setButtonState("LogoutButton", state);
    };

    this.utils_Button_ConnectCache_setState = function(state) {
        ns.utils_control_setButtonState("CacheConnect", state);
    };

    this.utils_Button_DisconnectCache_setState = function(state) {
        ns.utils_control_setButtonState("CacheDisconnect", state);
    };

    this.utils_Button_CacheRequest_setState = function(state) {
        ns.utils_control_setButtonState("CacheRequest", state);
    };

    this.utils_CacheParameters_setState = function(state) {
        var selector = '#input_clusterName, #input_maxAge, #input_maxMessages, #input_requestTimeout';
        if (state) {
            $(selector).removeAttr('disabled');
        } else {
            $(selector).attr('disabled', 'disabled');
        }
    };

    this.utils_RequestParameters_setState = function(state) {
         var selector = '#input_cacheTopic, #input_subscribe, #input_liveDataAction';
        if (state) {
            $(selector).removeAttr('disabled');
        } else {
            $(selector).attr('disabled', 'disabled');
        }
    };

    this.utils_addContent = function(msg) {
        ns.utils_appendLineToTextArea("cache_reply", msg, false);
    };
	
    this.signal_loggedIn = function() {
        ns.utils_Button_Login_setState(false);
        ns.utils_Button_Logout_setState(true);
        ns.utils_Button_ConnectCache_setState(true);
        ns.utils_Button_DisconnectCache_setState(false);
        ns.utils_Button_CacheRequest_setState(false);
        ns.utils_CacheParameters_setState(true);
        ns.utils_RequestParameters_setState(false);
         $('#nickname').html("SolCache - Signed In");
    };

    this.signal_loggedOut = function() {
        ns.utils_clearCacheReply();
        ns.utils_Button_Login_setState(true);
        ns.utils_Button_Logout_setState(false);
        ns.utils_Button_ConnectCache_setState(false);
        ns.utils_Button_DisconnectCache_setState(false);
        ns.utils_Button_CacheRequest_setState(false);
        ns.utils_CacheParameters_setState(false);
        ns.utils_RequestParameters_setState(false);
        $('#nickname').html("SolCache - Signed Out");
    };

    this.signal_loggingIn = function() {
        ns.utils_clearCacheReply();
        ns.utils_Button_Login_setState(false);
        ns.utils_Button_Logout_setState(false);
        ns.utils_Button_ConnectCache_setState(false);
        ns.utils_Button_DisconnectCache_setState(false);
        ns.utils_Button_CacheRequest_setState(false);
        ns.utils_CacheParameters_setState(false);
        ns.utils_RequestParameters_setState(false);
    };

    this.signal_cacheSessionCreated = function() {
        ns.utils_clearCacheReply();
        ns.utils_Button_Login_setState(false);
        ns.utils_Button_Logout_setState(true);
        ns.utils_Button_ConnectCache_setState(false);
        ns.utils_Button_DisconnectCache_setState(true);
        ns.utils_Button_CacheRequest_setState(true);
        ns.utils_CacheParameters_setState(false);
        ns.utils_RequestParameters_setState(true);
    };

    this.signal_cacheSessionDisposed = function() {
        ns.utils_clearCacheReply();
        ns.utils_Button_Login_setState(false);
        ns.utils_Button_Logout_setState(true);
        ns.utils_Button_ConnectCache_setState(true);
        ns.utils_Button_DisconnectCache_setState(false);
        ns.utils_Button_CacheRequest_setState(false);
        ns.utils_CacheParameters_setState(true);
        ns.utils_RequestParameters_setState(false);
    };
    
}.apply(solace.sample));

/**
 * jquery initialize page function
 */
$(document).ready(function() {
    var path = document.URL;
    var prefix = '';
    var index1 = path.indexOf('//');
    var index2 = -1;
    if (index1 > 0) {
        index2 = path.indexOf('/', index1 + 2);
        if (index2 > 0) {
            prefix = path.substring(0, index2);
        }
    }

    var DEFAULT_APPLIANCE_URL = prefix + '/solace/smf';
    var DEFAULT_USER_NAME  = 'default';
    var DEFAULT_MSG_VPN    = 'default';
    var DEFAULT_NICKNAME   = "John";
    var DEFAULT_CLUSTER    = "v1.d1";
    var DEFAULT_MAX_AGE    = "0";
    var DEFAULT_MAX_COUNT  = "1000";
    var DEFAULT_TIMEOUT    = "10000";
    var DEFAULT_TOPIC      = "sanity/0000/0000/0000/0000";

    solace.sample.signal_loggedOut();
    solace.sample.utils_setChecked('input_show_console', true);
    solace.sample.utils_setVisibility('output_console', true);
    solace.sample.utils_setVisibility('ClearButton', true);
    solace.sample.utils_setText('output_console','');
    $('body').layout({ applyDefaultStyles: true });

    solace.sample.utils_setText('input_session_url',DEFAULT_APPLIANCE_URL);
    solace.sample.utils_setText('input_session_username',DEFAULT_USER_NAME);
    solace.sample.utils_setText('input_session_vpn',DEFAULT_MSG_VPN);
    solace.sample.utils_setText('input_session_nickname',DEFAULT_NICKNAME);
    solace.sample.utils_setText('input_clusterName', DEFAULT_CLUSTER);
    solace.sample.utils_setText('input_maxAge', DEFAULT_MAX_AGE);
    solace.sample.utils_setText('input_maxMessages', DEFAULT_MAX_COUNT);
    solace.sample.utils_setText('input_requestTimeout', DEFAULT_TIMEOUT);
    solace.sample.utils_setText('input_cacheTopic', DEFAULT_TOPIC);


});

$(window).unload(function() {
    solace.sample.cleanup();
});


