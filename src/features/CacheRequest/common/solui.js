////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Corporation Messaging API for JavaScript
// Copyright 2010-2017 Solace Corporation. All rights reserved. //
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
// http://www.Solace.com
//
// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.sample = solace.sample || {};

(function() {
    function padLeft(str, padChar, length) {
        str = str + "";
        while (str.length < length) {
            str = padChar + str;
        }
        return str;
    }

    function utils_currentTime() {
        var currentTime = new Date();
        return padLeft(currentTime.getHours(), '0', 2) + ":" +
                padLeft(currentTime.getMinutes(), '0', 2) + ":" +
                padLeft(currentTime.getSeconds(), '0', 2) + "." +
                padLeft(currentTime.getMilliseconds(), '0', 3);
    }

    this.utils_appendLineToTextArea = function(textAreaId, line, logTime) {
        var message = (logTime ? (utils_currentTime() + ":") : "") + line + "\n";
        var txtarea = $("#" + textAreaId);
        txtarea.val(message + txtarea.val());
        //$("#" + textAreaId).val(message);
    };

    this.utils_clearTextArea = function(textAreaId) {
        var txtarea = $("#" + textAreaId);
        txtarea.val("");        
    };

    this.utils_setVisibility = function(controlId, visible) {
        if (visible) {
            $("#" + controlId).show();
        }
        else {
           $("#" + controlId).hide(); 
        }
    };

    this.utils_loadFrame = function(frameId, src) {
        $("#" + frameId).attr("src", src);
    };

    this.utils_getField = function(fieldId) {
        return $("#" + fieldId).val();
    };

    this.utils_isChecked = function(controlId) {
        return $("#" + controlId).attr("checked");
    };

    this.utils_setChecked = function(controlId, state) {
        $("#" + controlId).attr("checked", state);  
    };

    this.utils_control_setButtonState = function(controlId, state) {
        if (state) {
            $("#" + controlId).button("enable");
        } else {
            $("#" + controlId).button("disable");
        }
    };

    this.utils_label_update = function(labelId, msg) {
        $("#" + labelId).text(msg);
    };

    this.utils_element_enable = function(elementId, state) {
        if (!state) {
            $('#' + elementId).attr('disabled', 'disabled');
        } else {
            $('#' + elementId).removeAttr('disabled');
        }
    };

    this.utils_setText = function(controlId, msg) {
        $('#' + controlId).val(msg);
    };
    
    this.utils_printList = function(divId, list) {
        list.sort();
        var htmlText = "<UL>";
        for (var i = 0; i < list.length; i++) {
            htmlText += "<LI>" + list[i] + "</LI>";
        }
        htmlText += "</UL>";
        $('#' + divId).html(htmlText);
    };

    this.utils_printHtml = function(divId, msg) {
        $('#' + divId).html(msg);
    };

    this.fireOnclick = function(objID) {
        var target = document.getElementById(objID);
        if (document.dispatchEvent) { // W3C
            var oEvent = document.createEvent("MouseEvents");
            oEvent.initMouseEvent("click", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, target);
            target.dispatchEvent(oEvent);
        }
        else if (document.fireEvent) { // IE
            target.fireEvent("onclick");
        }
    };

    this.fireNewWindow = function(url, title, options) {
        window.open(url, title, options, false);
    };

    var myThis = this;
    function UIConsoleLogger (textAreaId) {

        this.trace = function (text) {
            myThis.utils_appendLineToTextArea(textAreaId, "TRACE: " + text);
        };
        this.debug = function (text) {
            myThis.utils_appendLineToTextArea(textAreaId, "DEBUG: " + text);
        };
        this.info = function (text) {
            myThis.utils_appendLineToTextArea(textAreaId, "INFO: " + text);
        };
        this.warn = function (text) {
            myThis.utils_appendLineToTextArea(textAreaId, "WARN: " + text);
        };
        this.error = function (text) {
            myThis.utils_appendLineToTextArea(textAreaId, "ERROR: " + text);
        };
        this.fatal = function (text) {
            myThis.utils_appendLineToTextArea(textAreaId, "FATAL: " + text);
        };

    }

    solace.sample.UIConsoleLogger = UIConsoleLogger;

}.apply(solace.sample));


(function($) {
    var map = [];
    $.Watermark = {
        ShowAll:function() {
            for (var i = 0; i < map.length; i++) {
                if (map[i].obj.val() === "") {
                    map[i].obj.val(map[i].text);
                    map[i].obj.css("color", map[i].WatermarkColor);
                } else {
                    map[i].obj.css("color", map[i].DefaultColor);
                }
            }
        },
        HideAll:function() {
            for (var i = 0; i < map.length; i++) {
                if (map[i].obj.val() === map[i].text) {
                    map[i].obj.val("");
                }
            }
        }
    };

    $.fn.Watermark = function(text, color) {
        if (!color) {
            color = "#aaa";
        }
        return this.each(
                function() {
                    var input = $(this);
                    var defaultColor = input.css("color");
                    map[map.length] = {text:text,obj:input,DefaultColor:defaultColor,WatermarkColor:color};
                    function clearMessage() {
                        if (input.val() === text) {
                            input.val("");
                        }
                        input.css("color", defaultColor);
                    }

                    function insertMessage() {
                        if (input.val().length === 0 || input.val() === text) {
                            input.val(text);
                            input.css("color", color);
                        } else {
                            input.css("color", defaultColor);
                        }
                    }

                    input.focus(clearMessage);
                    input.blur(insertMessage);
                    input.change(insertMessage);

                    insertMessage();
                }
                );
    };
}(jQuery));

