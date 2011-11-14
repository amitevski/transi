// Backbone.couch.js - literal version - (c) 2011 Andrzej Sliwa
//
// Based on Jan Monschke backbone.couchdb.js connector with some improvements.
//
//   Example configuration:
//
//        Backbone.couch.databaseName = "couchwatch";
//        Backbone.couch.ddocName = "couchwatch";
//        Backbone.couch.enableChangesFeed = true;
//        Backbone.couch.ddocChange(function(ddocName){
//          console.log("current ddoc: '" + ddocName + "' changed");
//          console.log("restarting...");
//          window.location.reload();
//        });

Backbone.couch = {

  debug: false,

  enableChangesFeed: true,

  databaseName : "",

  ddocName : "",

  baseUrl : null,

  _watchList : [],

  db: function() {
    this.log( "db" );

    var db = $.couch.db( this.databaseName );
    if ( this.baseUrl ) {
      db.uri = this.baseUrl + "/" + this.databaseName + "/";

    }
    return db;
  },

  log: function ( message ) {
    if ( this.debug && console && console.log ) {
      console.log( "Backbone.couch - " + message );
    }
  },

  create: function( model, _success, _error ) {
    this.log( "create" );

    var db = this.db(),
      data = model.toJSON();
    if ( !data.type ) { data.type = this.getType( model ); }
    if ( !data.id && data._id ) { data.id = data._id; }
    db.saveDoc( data, {
      success: function( respone ){
        _success( {
          "id": respone.id,
          "_id": respone.id,
          "_rev": respone.rev
        });
      },
      error: _error
    });
  },

  getType: function( model ) {
    return model.url;
  },

  remove: function( model, _success, _error ) {
    this.log( "remove" );

    var db = this.db(),
      data = model.toJSON();

    db.removeDoc(data, {
      success: _success,
      error: function (_nr, _req, e) {
        if ( e == "deleted" ) {
          _success();
        } else {
          _error();
        }
      }
    })
  },

  fetchCollection: function( collection, _success, _error) {
    this.log( "fetchCollection" );

    var db = this.db(),
      // retrive view name from 'url' of collection
      viewName = this.getView( collection ),
      // build query name
      query = this.ddocName + "/" + viewName;
    // if descending not defined set default false
    collection.descending || ( collection.descending = false );
	collection.include_docs || ( collection.include_docs = true );

    var options = {
      descending: collection.descending,
      include_docs: collection.include_docs,
      success: function( result ) {
        var models = [];
        // custom implementation for transi
        _.each( result.rows, function( row ) {
          var model = row.doc;
          if (row.value && row.value.rating) {
              model.rating = row.value.rating;
          }
          if ( !model.id ) { model.id = row.id }
          models.push( model );
        });
        // if no result then should result null
        if ( models.length == 0 ) { models = null }
        _success( models );
      },
      error: _error
    };
      if (collection.startkey && collection.endkey) {
            options.startkey = collection.startkey;
            options.endkey = collection.endkey;
       }
    if (collection.limit) { options.limit = collection.limit; }
    db.view(query, options);

    var model = new collection.model;
    if (! model.url ) {
      throw new Error( "No 'url' property on collection.model!" );
    }

    var type = this.getType(new collection.model);
    if ( !this._watchList[ type ] ) {
      this._watchList[ type ] = collection;
    }
  },

  fetchModel: function( model, _success, _error) {
    this.log( "fetchModel" );

    var db = this.db();
    db.openDoc( model.id, {
      success: function(doc) { _success(doc); },
      error: _error
    });
  },

  _changes: function() {
    this.log( "changesFeed" );

    var db = this.db(),
      that = this,
      currentDdoc = "_design/" + this.ddocName;

    db.info( {
      success: function ( data ) {
        var since = ( data.update_seq || 0);
        that.changesFeed = db.changes( since, { include_docs: true, limit:10 } );
        that.changesFeed.onChange( function( changes ) {
          _.each( changes.results, function( row ) {
            var doc = row.doc;
            var handlerDefined = typeof that.ddocChangeHandler === "function";
            var id = ( doc.id || doc._id );

            if ( handlerDefined  && ( id === currentDdoc )) {
              that.ddocChangeHandler(currentDdoc);
            }

            if ( doc.type ) {
              var collection = that._watchList[ doc.type ];
              if ( collection ) {
                var model = collection.get( id );
                if ( model ) {
                  if ( model && doc._rev != model.get( "_rev" ) ) {
                    model.set(doc);
                  }
                } else {
                  if ( !doc.id ) { doc.id = doc._id; }
                  collection.add(doc);
                }
              }
            }
          })
        });
      },
      error: function () {
        that.log("problem with db connection");
      }
    })
  },

  ddocChange: function( callback ) {
    this.log( "ddocChange" );
    this.ddocChangeHandler = callback;
  },

  getView: function( collection ) {
    this.log( "getViewName" );

    if (!( collection && collection.url )) {
      throw new Error( "No url property / function!" );
    }
    // if url is function evaluate else use as value
    return _.isFunction( collection.url ) ? collection.url() : collection.url;
  },

  destroyAllData : function() {
    this.log( "ddocChange" );

    var db = this.db(),
      currentDoc = "_design/" + this.ddocName;

    db.allDocs({
      success: function( result ) {
        var docs = _.select( result.rows, function( doc ) {
          return doc.id !== currentDoc;
        });

        if (docs.length > 0) {
          var toRemove = _.map( docs, function( doc ) {
            return { "_rev": doc.value.rev, "_id": doc.id };
          });
          db.bulkRemove({ docs:toRemove }, {
            success: function() {},
            error: function() {}
          });
        }
      }
    });
  }
};

Backbone.sync = function(method, obj, success, error) {

  if ( method === "create" || method === "update" ) {
    // triggered on "model.save(...)"
    Backbone.couch.create( obj, success, error );
  } else if ( method === "delete" ) {
    // triggered on "model.destroy(...)"
    Backbone.couch.remove( obj, success, error );
  } else if ( method === "read" ) {
    // depends from where sync is called
    if ( obj.model ) {
      // triggered on "collection.fetch(...)"
      Backbone.couch.fetchCollection( obj, success, error );
    } else {
      // triggered on "model.fetch(...)"
      Backbone.couch.fetchModel( obj, success, error );
    }
  }

  // run changes changes feed handler
  if( Backbone.couch.enableChangesFeed && !Backbone.couch.changesFeed ) {
    Backbone.couch._changes();
  }
};
