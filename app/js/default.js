(function($) {

    Backbone.couch.databaseName = "app-dev";
    Backbone.couch.ddocName = "app";
    Backbone.couch.enableChangesFeed = true;
    Backbone.couch.include_docs = true;
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
        model: Translation
    });
    
    var translations = new TranslationList();

    var translationView = Backbone.View.extend({
        tagName: "li",

        template: _.template('<span class="rating"><%= rating %></span> <span class="word"><%= word %></span> <br />' +
                             '<span class="example"><%= example %></span>'),

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
          var el = $(this.el);
          el.html(this.template(this.model.toJSON()));
          this.model.el = el;
          return this;
        }

    });

    var allTranslationsView = Backbone.View.extend({
    el: $("#searchResults"),

    events : {
      "click #refresh": "refresh",
      "keyup #searchInput": "search"
    },

    initialize: function() {
        this.items_element = $("#translation-list");
        _.bindAll(this, 'render', 'refresh', 'search');
        translations.bind('refresh', this.render);
        translations.fetch();
        this.render();
    },

    refresh: function () {
        this.render();
        return false;
    },

    search: function(e) {
      var input = $("#searchInput");
      var searchText = input.val();
      translations.fetch({startkey:searchText, endkey:searchText+'\u9999'});
    },

    render: function () {
      //translations.models = translations.models.slice(0, translations.limit);
      this.items_element.html("");
      var that = this;
      translations.each(function(item) {
      var view = new translationView({model: item}),
          el = view.render(this.search).el;
      that.items_element.prepend(el);
      });
    }

  });
  new allTranslationsView();

})(jQuery);

