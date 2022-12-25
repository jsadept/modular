// TODO fix bug in deep inheritence
import DbEnhancer from './db_base_enhancer';

const MongodbEnhancer = function(){
    DbEnhancer.call(this);
    this.enhancerName = "mongodb-enhancer";
    this.baseEnhancer.__instantiateBeforeInjection = false;
    this.mongoConfig = {};
    const me = this;
    process.once( 'exit', sig => {
        me.closeClient();
    });
};

MongodbEnhancer.extends(DbEnhancer);


(function(){

    this.resolveConfig = function(plugin, base){
        if(!plugin.server){
            throw new Error("ModuleJS ERROR.");
        }

        if(!plugin.mongoose) {
            plugin.mongoose = require('./peer_dependencies').mongoose;
        }

        this.super.resolveConfig.call(this, plugin, base);
        this.mongoose = plugin.mongoose;
        this.mongoConfig = {
            uri: plugin.server.uri,
            options: plugin.server.options || {},
            debug: plugin.debug || process.env.MONGODB_DEBUG || false,
            useMongoClient: true
        };
    };

    this.setupPlugin = async function(plugin, imports){
        debug('mongo: setupPlugin');
        await this.openClient()
        const result = await this.super.setupPlugin.call(this, plugin, imports);
        return result;
    };

    this.openClient = async function(){
        debug('mongo: openClient');
        if(!this.mongoConfig.uri){
            throw new Error("ModuleJS ERROR.");
        }
        this.db = await this.mongoose.connect(this.mongoConfig.uri, this.mongoConfig.options)
        this.mongoose.set('debug', this.mongoConfig.debug);
        debug('mongo: mongoose connected');
    };

    this.closeClient = async function(){
        debug('mongo: closeClient');
        await this.mongoose.disconnect()
        console.info('Disconnected from mongodb');
    };

    this.getClient = function(cb){
        debug('mongo: getClient');
        return this.db;
    };

}).call(MongodbEnhancer.prototype);

export default MongodbEnhancer;
