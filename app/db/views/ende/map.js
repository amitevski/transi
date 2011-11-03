function(doc) {
  if (doc.lang == 'en') {
    emit(doc.word, null);
    if (doc.translations.de) {
        for (var i in doc.translations.de) {
            emit(doc.word, {"_id": doc.translations.de[i]._id});
        }
    }
  }
}