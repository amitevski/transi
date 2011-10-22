function(doc) {
  if (doc.lang == 'en') {
    emit(doc.en, null);
    if (doc.de) {
        for (var i in doc.de) {
            emit(doc.en, {_id: doc.de[i]._id});
        }
    }
  }
}