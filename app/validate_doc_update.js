function (newDoc, oldDoc, userCtx) {
    function require(field, message) {
        message = message || "Document must have a " + field;
        if (!newDoc[field]) throw({forbidden : message});
    };

    if (newDoc.type == 'word') {
        require('word');
        require('example');
        require('lang');
        require('_id');
    }
}
