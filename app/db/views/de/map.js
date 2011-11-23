/**
 * Created by JetBrains PhpStorm.
 * User: acomitevski
 * Date: 11/23/11
 * Time: 11:10 PM
 * To change this template use File | Settings | File Templates.
 */
function(doc) {
    if (doc.translations.de) {
        emit(doc.word, null);
        for (var i in doc.translations.de) {
            emit(doc.word, {"_id": doc.translations.de[i]._id});
        }
    }
}