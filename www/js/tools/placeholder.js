"use strict";
(function Polyfill_querySelector_querySelectorAll() {
    if (!document.querySelectorAll) {
        document.querySelectorAll = function (selectors) {
            var style = document.createElement('style'),
                elements = [],
                element;
            document.documentElement.firstChild.appendChild(style);
            document._qsa = [];

            style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
            window.scrollBy(0, 0);
            style.parentNode.removeChild(style);

            while (document._qsa.length) {
                element = document._qsa.shift();
                element.style.removeAttribute('x-qsa');
                elements.push(element);
            }
            document._qsa = null;
            return elements;
        };
    }

    if (!document.querySelector) {
        document.querySelector = function (selectors) {
            var elements = document.querySelectorAll(selectors);
            return (elements.length) ? elements[0] : null;
        };
    }
})();
(function Placeholders() {

    var styles = "<style>"
    styles += " @keyframes placeholderNodeInserted { from {opacity:0.99;} to {opacity:1;} }"
    styles += " input[placeholder] { animation-duration:0.001s; animation-name: placeholderNodeInserted; }"
    styles += " span.placeholder { position: absolute; transition: all 0.5s; opacity: 0.5; } "
    styles += " div.placeholder-container { position: relative; display: block; width: 100%; } "
    styles += " </style>"

    var styleContainer = document.createElement("div")
    styleContainer.innerHTML = styles
    document.head.appendChild(styleContainer.firstChild)

    document.addEventListener("animationstart", applyPlaceholder, false)
    document.addEventListener("MSAnimationStart", applyPlaceholder, false)
    document.addEventListener("webkitAnimationStart", applyPlaceholder, false)

    function applyPlaceholder(event) {
        var placeholder = event.target.getAttribute("placeholder")
        var element = event.target
        if (!placeholder) {
            return;
        }

        element.removeAttribute("placeholder")

        var lpad = Number( getStyle(element, "padding-left").replace("px","") )
        var lmrg = Number( getStyle(element, "margin-left").replace("px","") )
        var left = Number(lpad+lmrg)+"px"

        var tpad = Number( getStyle(element, "padding-top").replace("px","") )
        var tmrg = Number( getStyle(element, "margin-top").replace("px","") )
        var top  = Number(tpad+tmrg)+"px"

        var placeholderContainer = document.createElement("div")
        placeholderContainer.innerHTML = "<span style='top:" + top + "; left:" + left + ";' class='placeholder'>" + placeholder + "</span>"
        placeholderContainer.className = "placeholder-container"

        element.parentNode.replaceChild(placeholderContainer, element)
        placeholderContainer.appendChild(element)

        element.addEventListener("input", function(event) {
            
            var placeholder_element = this.parentNode.firstChild
            if ( this.value ) {
                placeholder_element.style.fontSize = "0.7em";
                placeholder_element.style.top  = "0";
                placeholder_element.style.color = "blue";
                placeholder_element.style.opacity = "1";
            } else {
                placeholder_element.style.fontSize = "1em";
                placeholder_element.style.top  = top;
                placeholder_element.style.color = "inherit";
                placeholder_element.style.opacity = "0.5";
            }

        })
    }

    function getStyle(el, styleProp) {
        var value, defaultView = (el.ownerDocument || document).defaultView;
        if (defaultView && defaultView.getComputedStyle) {
            styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
            return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
        } else if (el.currentStyle) {
            styleProp = styleProp.replace(/\-(\w)/g, function (str, letter) {
                return letter.toUpperCase();
            });
            value = el.currentStyle[styleProp];
            if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
                return (function (value) {
                    var oldLeft = el.style.left,
                        oldRsLeft = el.runtimeStyle.left;
                    el.runtimeStyle.left = el.currentStyle.left;
                    el.style.left = value || 0;
                    value = el.style.pixelLeft + "px";
                    el.style.left = oldLeft;
                    el.runtimeStyle.left = oldRsLeft;
                    return value;
                })(value);
            }
            return value;
        }
    }
})();