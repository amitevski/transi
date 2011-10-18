function(doc) {
    if ('translation' == doc.type && doc.englishText &&
    	doc.germanText && doc.germanRating) {
        emit(doc.englishText, doc);
    }
}
