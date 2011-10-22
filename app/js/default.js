(function($) {

    Backbone.couch.databaseName = "app-dev";
    Backbone.couch.ddocName = "app-dev";
    Backbone.couch.enableChangesFeed = true;
    Backbone.couch.ddocChange(function(ddocName){
        if (console && console.log) {
            console.log("current ddoc: '" + ddocName + "' changed");
            console.log("restarting...");
        }
    window.location.reload();

    var Translation = Backbone.Model.extend({
        url: "translation"
    });
    
    var TranslationList = Backbone.Collection.extend({
        url: "germanTranslations",
        model: Translation,
        
        comparator: function(todo) {
            return todo.get('germanRating');
        }
    });

})(jQuery);

