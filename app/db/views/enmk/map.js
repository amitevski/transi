function(doc) {
  if (doc.lang == 'en') {
    emit(doc.word, null);
    if (doc.translations.mk) {
        for (var i in doc.translations.mk) {
            emit(doc.word, {"_id": doc.translations.mk[i]._id});
        }
    }
  }
}