// @ts-nocheck
// Slightly modified from https://github.com/himynameisdave/postcss-rgb-plz/blob/master/index.js

var postcss = require('postcss');

module.exports = postcss.plugin('postcss-rgb-plz', function (opts) {

    var isValidHex = function (hex) {
        // if it's not 3 or 6 digits, drop it.
        if (hex.length - 1 !== 3 && hex.length - 1 !== 6)
            return false;
        else
            return true;
    };

    function hexToRgb(hexCode) {
        // Remove the hash symbol if it is present
        if (hexCode.startsWith('#')) {
            hexCode = hexCode.substring(1);
        }

        // Check if the hex code is valid
        if (!/^[0-9a-f]{3,6}$/i.test(hexCode)) {
            throw new Error('Invalid hex code');
        }

        // Convert hex code to RGB values
        const red = parseInt(hexCode.substring(0, 2), 16);
        const green = parseInt(hexCode.substring(2, 4), 16);
        const blue = parseInt(hexCode.substring(4, 6), 16);

        // Return an array of RGB values
        return [red, green, blue];
    };

    return function (css) {
        // //  loop through each CSS declaration
        css.walkDecls(function (decl) {
            // Only mess with css variables
            if (!decl.prop.startsWith('--')) return;

            // The value of that declaration
            var val = decl.value;
            //  if there even is a value...
            //  ...and if it's not a url value
            if (val) {
                //  create a list of hexes in a given value
                var hexes = val.match(/#\w{3,6}/g);
                //  as long as there actually are hexes...
                if (hexes && hexes.length > 0) {
                    //  where we're going to store our new val
                    var newVal = val;
                    // ...we loop through them and replace them with the rgb string
                    hexes.forEach(function (hex) {
                        if (isValidHex(hex))
                            newVal = newVal.replace(hex, hexToRgb(hex).join(', '));
                    });
                    //  and this is what actually sets the outputted value
                    decl.value = newVal;
                }
            }
        });
    };
});