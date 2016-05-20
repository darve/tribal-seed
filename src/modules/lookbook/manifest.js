
/**
 * This file is used by Assemble to generate static HTML for each view state that is needed
 */

module.exports = {
    name: 'lookbook',
    layout: 'body',
    states: {
        default: {
            title: 'This is a regular title'
        },
        error: {
            title: 'Oh no this is an error title'
        },
    }
};
