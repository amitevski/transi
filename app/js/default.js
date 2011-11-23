(function($) {

    Backbone.couch.databaseName = "app-dev";
    Backbone.couch.ddocName = "app";
    Backbone.couch.enableChangesFeed = true;
    Backbone.couch.debug = true;
    
    Backbone.couch.ddocChange(function(ddocName){
        if (console && console.log) {
            console.log("current ddoc: '" + ddocName + "' changed");
            console.log("restarting...");
        }
    window.location.reload();
    });
    
    var Translation = Backbone.Model.extend({
        url: "word",
        defaults: {
            rating: '0',
            example: 'Example sentence'
        }
    });
    
    var TranslationList = Backbone.Collection.extend({
        url: "toprated",
        model: Translation,
        targetLanguage: 'en',
        include_docs: true
    });
    
    var translationList = new TranslationList();

    var translationView = Backbone.View.extend({
        tagName: "li",

        template: _.template('<span class="word"><%= word %></span>' + ' - ' +
                             '<span class="translation"><%= translation %></span>'),

        initialize: function() {
          _.bindAll(this, 'render', 'unrender');
          this.model.bind('change', this.render);
          this.model.view = this;
        },

        unrender: function() {
          $(this.model.el).remove();
          return this;
        },

        render: function() {
            var model = this.model.toJSON();
            if (!model.translations ||
                !model.translations[translationList.targetLanguage]) {
                return this;
            }
            model.translation = model.translations[translationList.targetLanguage][0].word;
            var el = $(this.el);
            el.html(this.template(model));
            this.model.el = el;
            return this;
        }

    });

    var allTranslationsView = Backbone.View.extend({
    el: $("#searchResults"),

    events : {
        "keyup #searchInput": "search",
        "change #targetLanguage": "changeLang"
    },

    initialize: function() {
        this.items_element = $("#translation-list");
        _.bindAll(this, 'render', 'search', 'changeLang');
        translationList.bind('refresh', this.render);
    },

    changeLang: function(e) {
        translationList.targetLanguage = $("#targetLanguage").val();
        this.render();
        console.log('selected lang' + translationList.targetLanguage);
    },

    search: function(e) {
        var input = $("#searchInput");
        var searchText = input.val();
        if (searchText.length < 3) {
            this.unrender();
            return;
        }
        translationList.startkey = searchText,
        translationList.endkey = searchText+'\u9999';
        translationList.fetch();
        this.render();
    },

    unrender: function() {
        this.items_element.html("");
    },

    render: function () {
      //translations.models = translations.models.slice(0, translations.limit);
      this.items_element.html("");
      var that = this;
      translationList.each(function(item) {
          var view = new translationView({model: item}),
              el = view.render().el;
          that.items_element.prepend(el);
      });
    }

  });
  new allTranslationsView();

})(jQuery);

