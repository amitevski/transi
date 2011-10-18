function (newDoc, oldDoc, userCtx) {
  function require(field, message) {
    message = message || "Document must have a " + field;
    if (!newDoc[field]) throw({forbidden : message});
  };

  if(newDoc.type == "translation") {
    require("severity");
    require("message");
  }
}
