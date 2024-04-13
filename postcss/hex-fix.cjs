// Slightly modified from https://github.com/himynameisdave/postcss-rgb-plz/blob/master/index.js

/**
 * @param {string} hex
 */
function isValidHex(hex) {
    // if it's not 3 or 6 digits, drop it.
    if (hex.length - 1 !== 3 && hex.length - 1 !== 6)
        return false;
    else
        return true;
};

/**
 * @param {string} hexCode
 */
function hexToRgb(hexCode) {
    // Remove the hash symbol if it is present
    if (hexCode.startsWith('#')) {
        hexCode = hexCode.substring(1);
    }

    // Convert hex code to RGB values
    const red = parseInt(hexCode.substring(0, 2), 16);
    const green = parseInt(hexCode.substring(2, 4), 16);
    const blue = parseInt(hexCode.substring(4, 6), 16);
    const alpha = parseInt(hexCode.substring(6, 8), 16);

    // Return an array of RGB values
    if (alpha) return [red, green, blue, alpha];
    return [red, green, blue];
};

const plugin = () => ({
    postcssPlugin: 'postcss-hex-fix',
    //  loop through each CSS declaration
    Declaration(decl) {
        // Only mess with css variables
        if (!decl.prop.startsWith('--')) return;
        if (decl.parent.selector !== ":root") return;

        /** @type {string} */
        //  where we're going to store our new val
        let value = decl.value;

        //  if there even is a value...
        //  ...and if it's not a url value
        if (!value) return

        //  create a list of hexes in a given value
        const hexes = value.match(/#\w{3,6}/g) || [];

        // ...we loop through them and replace them with the rgb string
        for (const hex of hexes) {
            if (!isValidHex(hex)) continue;
            value = value.replace(hex, hexToRgb(hex).join(', '));
        };

        //  and this is what actually sets the outputted value
        decl.value = value;
    }
});

plugin.postcss = true;

module.exports = plugin;
