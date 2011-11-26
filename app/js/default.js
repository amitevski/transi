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

    var searchResultListView = Backbone.View.extend({
        el: $("#searchResults"),

        currentlySelectedId: 'en_Screen',
        collection: null,
        translationsView: null,

        events : {
            "keyup #searchInput": "search",
            "search #searchInput": "search",
            "click #addTranslation": "add",
            "change #targetLanguage": "changeLang"
        },

        initialize: function() {
            this.items_element = $("#searchResultList");
            _.bindAll(this, 'render', 'search', 'changeLang', 'add', 'appendItem', 'setTranslationsView');
            this.collection.bind('refresh', this.render);
            this.collection.bind('add', this.render);
        },

        setTranslationsView: function(view) {
            this.translationsView = view;
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
            var that = this;
            $(el).bind('click', function(){
                that.translationsView.setFromModel(item);
                that.translationsView.render();
            });
            this.items_element.append(el);
        },

        render: function () {
            this.items_element.html("");
            _(this.collection.models).each(function(item){ // in case collection is not empty
                this.appendItem(item);
            }, this);
        }
  });

    var detailResultView = Backbone.View.extend({
        fromModel: null,
        model: null,

        tagName: "li",

        template: _.template('<span class="rating">Rating: <%= rating %></span>' + '   ' +
                             '<span class="word"> Translation: <%= word %></span>' + '   ' +
                             '<span class="example">Example: <%= example %></span>'),

        initialize: function() {
            _.bindAll(this, 'render', 'unrender');
            this.fromModel = this.options.fromModel;
            this.model = this.options.model;
            this.model.bind('change', this.render);
            this.model.view = this;
        },

        unrender: function() {
            $(this.model.el).remove();
            return this;
        },

        render: function() {
            var model = this.model.toJSON();
            model.rating = this.fromModel.rating;
            var el = $(this.el);
            el.html(this.template(model));
            this.model.el = el;
            return this;
        }

    });

    var detailListView = Backbone.View.extend({
        el: $("#translations"),
        fromModel: null,
        collection: null,

        events : {
            "click #addTranslation": "add"
        },

        initialize: function() {
            this.items_element = $("#searchResultList"); //we append our translations to this alement
            _.bindAll(this, 'render', 'add', 'appendItem', 'setFromModel', 'unrender');
            //this.collection.bind('refresh', this.render);
            //this.collection.bind('add', this.render);
        },

        setFromModel: function(model) {
            this.fromModel = model;
        },

        add: function() {
            console.log('clicked add');
        },

        unrender: function() {
            this.items_element.html("");
        },

        appendItem: function(item) {
            var targetModel = this.collection.get(item._id)
            var view = new detailResultView({'model': targetModel, 'fromModel': item}),
                    el = view.render(this.search).el;
            //$(el).bind('click', function(e){console.log('clicked translation');});
            this.items_element.append(el);
        },

        render: function () {
            this.unrender();
            _(this.fromModel.get('translations')[this.collection.url]).each(function(item){ // in case collection is not empty
                this.appendItem(item);
            }, this);
        }
    });
    var translations = new TranslationList();
    var detailResults = new detailListView({'collection': translations});
    var searchResults = new searchResultListView({'collection': translations});
    searchResults.setTranslationsView(detailResults);

})(jQuery);

