//only return top rated translations
function(doc) {
    emit(doc.word, null);
    for (var i in doc.translations) {
        var highest = '0';
        for (var j in doc.translations[i]) {
            if ('0' === highest ||
                doc.translations[i][highest].rating < doc.translations[i][j].rating)
                    {
                highest = j;
                    }
            }
        emit(doc.word, {"_id": doc.translations[i][highest]._id, "rating":doc.translations[i][highest].rating});
        highest = '0';
    }
}

