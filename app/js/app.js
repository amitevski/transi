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

    /**
     * single translation model
     */
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
        },

        /**
         * rateDown by one
         *
         * @param string lang
         * @param int    key array key of the translation in translations[lang] of model
         */
        rateDown: function(lang, key) {
            this.get('translations')[lang][key].rating--;
        },

        /**
         * rateUp by one
         *
         * @param string lang
         * @param int    key array key of the translation in translations[lang] of model
         */
        rateUp: function(lang, key) {
            this.get('translations')[lang][key].rating++;
        }

    });


    /**
     * collection of models
     */
    var TranslationList = Backbone.Collection.extend({
        url: "en",
        model: Translation,
        include_docs: true
    });
    

    /**
     * view for single search result
     */
    var searchResultView = Backbone.View.extend({
        tagName: "li",
        className: "searchResult",

        template: _.template('<span class="word"><%= word %></span>' +
                             '<span class="icon">&#008722;</span>' +
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
            var el = $(this.el);
            el.html(this.template(model));
            this.model.el = el;
            return this;
        }

    });

    /**
     * view for search result list
     */
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
            this.translationsView.unrender();
        },

        appendItem: function(item) {
            var toprated = this.collection.get(
                                item.getToprated(this.collection.url)._id);

            var tempItem = _.clone(item);
            tempItem.set({'translation':toprated.get('word')}, {'silent': true});
            var view = new searchResultView({model: tempItem}),
                    el = view.render(this.search).el;
            var that = this;
            $(el).bind('click', function(){
                that.translationsView.setFromModel(item);
                that.translationsView.render();
            });
            this.items_element.append(el);
        },

        render: function () {
            this.unrender();
            _(this.collection.models).each(function(item){ // in case collection is not empty
                var model = item.toJSON();
                //dont render item without translations for current language
                if (!model.translations ||
                    !model.translations[this.collection.url]) {
                    return;
                }
                this.appendItem(item);
            }, this);
        }
  });

    /**
     * view for single detail result
     */
    var detailResultView = Backbone.View.extend({
        fromModel: null,
        fromModelKey: null,
        model: null,

        tagName: "li",
        className: "detailResult",

        template: _.template('<span class="rating">Rating: <%= rating %></span>' +
                             '<span class="rateUp"> &#000043;</span><span class="rateDown">&#008722;</span>   ' +
                             '<span class="word"> Translation: <%= word %></span>' + '   ' +
                             '<span class="example">Example: <%= example %></span>'),

        initialize: function() {
            _.bindAll(this, 'render', 'unrender');
            this.fromModel = this.options.fromModel;
            this.fromModelKey = this.options.fromModelKey;
            this.model = this.options.model;
            this.model.bind('change', this.render);
            this.fromModel.bind('change', this.render);
            this.model.view = this;
        },

        unrender: function() {
            $(this.model.el).remove();
            return this;
        },

        render: function() {
            var model = _.clone(this.model);
            var fromModelTranslation = this.fromModel.get('translations')[this.model.collection.url][this.fromModelKey];
            model.set({'rating': fromModelTranslation.rating}, {'silent': true});
            var el = $(this.el);
            el.html(this.template(model.toJSON()));
            var that = this;
            $('.rateUp', el).bind('click', function(){
                that.fromModel.rateUp(that.fromModel.collection.url, that.fromModelKey);
                that.fromModel.save();
            });
            $('.rateDown', el).bind('click', function(){
                that.fromModel.rateDown(that.fromModel.collection.url, that.fromModelKey);
                that.fromModel.save();
            });
            this.model.el = el;
            return this;
        }
    });

    /**
     * list view for detail results
     */
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

        appendItem: function(item, key) {
            var targetModel = this.collection.get(item._id);
            var view = new detailResultView({
                'model': targetModel, 'fromModel': this.fromModel, 'fromModelKey': key}),
                    el = view.render(this.search).el;
            //$(el).bind('click', function(e){console.log('clicked translation');});
            this.items_element.append(el);
        },

        render: function () {
            this.unrender();
            _(this.fromModel.get('translations')[this.collection.url]).each(function(item, key){ // in case collection is not empty
                this.appendItem(item, key);
            }, this);
        }
    });
    var translations = new TranslationList();
    var detailResults = new detailListView({'collection': translations});
    var searchResults = new searchResultListView({'collection': translations});
    searchResults.setTranslationsView(detailResults);

})(jQuery);
