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
            translations: {},
            example: 'Example sentence'
        },

        /**
         * find the toprated translation
         *
         * @param  string lang : language to search in
         * @return model  translation object
         */
        getToprated: function(lang) {
            var translations = this.get('translations');
            if (!translations[lang]) {return null;}
            return  _.max(translations[lang], function(translation){return translation.rating;});
        },

        /**
         * add a single translation
         *
         * add _id, rating of new translation to current model
         * then add current models _id, rating:0 to new translation[this.lang]
         *
         * @param translation Backbone.Model
         */
        addTranslation: function(translation) {
            if (!this.get('translations')[translation.get('lang')]) {
                this.get('translations')[translation.get('lang')] = [];
            }
            this.get('translations')[translation.get('lang')].push({
                '_id': translation.get('_id'),
                'rating': 0
            });
        }

    });
    
    var TranslationList = Backbone.Collection.extend({
        url: "en",
        model: Translation,
        include_docs: true
    });
    

    var searchResultView = Backbone.View.extend({
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
                !model.translations[this.model.collection.url]) {
                return this;
            }
            var toprated = this.model.collection.get(
                                this.model.getToprated(this.model.collection.url)._id);

            model.translation = toprated.get('word');
            var el = $(this.el);
            el.html(this.template(model));
            this.model.el = el;
            return this;
        }

    });

    var allSearchResultsView = Backbone.View.extend({
        el: $("#searchResults"),

        currentlySelectedId: 'en_Screen',
        collection: null,

        events : {
            "keyup #searchInput": "search",
            "search #searchInput": "search",
            "click #addTranslation": "add",
            "change #targetLanguage": "changeLang"
        },

        initialize: function() {
            this.items_element = $("#searchResultList");
            _.bindAll(this, 'render', 'search', 'changeLang', 'add', 'appendItem');
            //this.collection = new TranslationList();
            this.collection.bind('refresh', this.render);
            this.collection.bind('add', this.render);
        },

        add: function() {
            var input = $('#newTranslationText').val();
            var currentModel = this.collection.get(this.currentlySelectedId);
            var id = this.collection.url + '_' + input;
            var newWord = new Translation({
                '_id': id,
                'id': id,
                'word': input,
                'lang': this.collection.url
            });
            newWord.addTranslation(currentModel);
            currentModel.addTranslation(newWord);
            currentModel.save();
            this.collection.create(newWord,{'success':_.bind(this.search, this)});
        },

        changeLang: function() {
            this.collection.url = $("#targetLanguage").val();
            this.search();
            console.log('selected lang' + this.collection.url);
        },

        search: function() {
            var input = $("#searchInput");
            var searchText = input.val();
            if (searchText.length < 3) {
                this.unrender();
                return;
            }
            this.collection.startkey = searchText,
            this.collection.endkey = searchText+'\u9999';
            this.collection.fetch({success: _.bind(this.render, this)});
        },

        unrender: function() {
            this.items_element.html("");
        },

        appendItem: function(item) {
            var view = new searchResultView({model: item}),
                    el = view.render(this.search).el;
            this.items_element.append(el);
        },

        render: function () {
            this.items_element.html("");
            _(this.collection.models).each(function(item){ // in case collection is not empty
                this.appendItem(item);
            }, this);
        }
  });
    var translations = new TranslationList();
    new allSearchResultsView({collection: translations});

})(jQuery);
