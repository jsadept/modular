// This is an abstract class.

import {resolve} from 'path';
const DEBUG = false;

import {moduleJs} from './modular_js';

const BaseEnhancerClass = moduleJs.BaseEnhancerClass;

const MicroservEnhancer = function(){
    this.baseEnhancer = new BaseEnhancerClass();
    this.enhancerName = "microservice";
};

(function(){
    this.resolveConfig = (plugin, base) => {
        if(!base)
            throw new Error("base path must be provided in arguments");

        if(plugin.packageRole === 'default') plugin.packageRole = null;
        plugin.enhancers = {};
        plugin.implementations = {};

        if(!plugin.consumes)
            plugin.consumes = [];

        if(typeof plugin.consumes === 'string')
            plugin.consumes = [ plugin.consumes ];

        if(!plugin.provides){
            plugin.provides = [];
            return;
        }

        const provides = Object.keys(plugin.provides);
        const modulePath = plugin.packagePath;
        const enhancers = {};
        const implementations = {};
        let provide;
        let tmpPath;

        // parse the enhancers

        for(const serviceName in plugin.provides){
            provide = plugin.provides[serviceName];
            if(typeof provide === 'string'){ // file
                tmpPath = resolve(base, modulePath, provide);
                enhancers[serviceName] = tmpPath;
                implementations[serviceName] = tmpPath;
            } else {
                if(typeof provide !== 'object' || provide.implementations === null || provide.interface === null){
                    console.error(`Skipping ${serviceName}`);
                    console.warn(MicroservEnhancer.WARN_MSG1);
                    continue; // skip
                }
                enhancers[serviceName] = resolve(base, modulePath, provide.interface);
                implementations[serviceName] = resolve(base, modulePath, provide.implementation);
            }
        }

        if (plugin.packageRole === 'client'){
            plugin.consumes = [];
            plugin.provides = provides;
            plugin.enhancers = enhancers;
        }else if(plugin.packageRole === 'server'){
            plugin.provides = [];
            plugin.implementations = implementations;
            plugin.enhancers = enhancers;
        }else{ // default
            plugin.provides = provides;
            plugin.enhancers = implementations;
        }
    };

    this.setupPlugin = function(plugin, imports){
        if(plugin.packageRole === 'client'){
            return this.setupPluginClient(plugin, imports);
        } else if (plugin.packageRole === 'server'){
            return this.setupPluginServer(plugin, imports);
        } else {
            // normal module - runs in process (because the developer did not specify client/server role
            return this.baseEnhancer.setupPlugin(plugin, imports);
        }
    };

    this.setupPluginClient = function(plugin, imports){
        const me = this;
        Object.keys(plugin.enhancers) // each service
        .forEach(serviceName => {
            // create an object that wraps each enhancer function
            const EnhancerObj = () => {};

            // add functions to enhancer object
            const ServiceObj = require(plugin.enhancers[serviceName]);
            const proto = (ServiceObj.prototype) ? (ServiceObj.prototype) : (ServiceObj); // is an object or instance?
            Object.keys(proto) // wrap exposed functions
            .forEach(functionName => {
                if(proto[functionName]) { // is not false
                    const fn = me.makePluginEnhancer(serviceName, functionName);
                    if(!fn){
                        console.warn(`makePluginEnhancer for ${serviceName}.${functionName} returned undefined.`);
                    }else{
                        EnhancerObj.prototype[functionName] = fn;
                    }
                }
            });

            // create an enhancer
            plugin.enhancers[serviceName] = new EnhancerObj(plugin, imports);
        });
        return plugin.enhancers;
    };

    this.setupPluginServer = function(plugin, imports){
        const me = this;
        let err;

        // objects being initialized can throw an error
        Object.keys(plugin.enhancers) // each service
        .forEach(serviceName => {
            // makeHooks
            const makeHooksFn = (theServiceName, theEnhancer, theInstance) => () => {
                const proto = (theEnhancer.prototype) ? (theEnhancer.prototype) : (theEnhancer); // is an object or instance?
                Object.keys(proto) // wrap exposed functions
                .forEach(functionName => {
                    if(proto[functionName]) { // is not false
                        me.makePluginHook(theServiceName, functionName, theInstance);
                    }
                 });
            };

            // implementation
            let serviceInstance;
            const ServiceObj = require(plugin.implementations[serviceName]);
            const wrap = require(plugin.enhancers[serviceName]);
            if (ServiceObj.prototype){ // if this is an object
                serviceInstance = new ServiceObj(plugin, imports); // make an instance
            }else{
                serviceInstance = ServiceObj; // is an instance
            }
            plugin.implementations[serviceName] = serviceInstance;
            makeHooksFn(serviceName, wrap, serviceInstance)(); // make hooks
        });

        // microservice server plugin does not provide these functions
        // via provides interface, to avoid various entry points into these
        // functions (keeps things simple).

        if(DEBUG)
            return plugin.implementations; // if we are testing/degugging
        else
            return {};
    };
    

    
    this.makePluginEnhancer = (serviceName, functionName) => {
        throw new Error("override");
    };

    this.makePluginHook = (serviceName, functionName) => {
        throw new Error("override");
    };

    this.openClient = () => {
        throw new Error("override");
    };

    this.closeClient = () => {
        throw new Error("override");
    };

    this.getClient = () => {
        throw new Error("override");
    };

    this.parseServiceArgs = _args => {
        let max=-1;
        let idx=-1;
        for(var key in _args){
            idx = Number(key);
            if(!isNaN(idx) && idx > max){
                max = idx;
            }
        }
        if ( max < 0 ) {
            throw new Error("no callback provided");
        }
        let callback;
        let options = _args[max];
        --max;
        if (typeof(options) === 'function') {
            callback = options;
            options = {};
        } else {
            if ( max < 0 ) {
                throw new Error("no callback provided");
            }
            callback = _args[max];
            if( typeof(callback) !== 'function') {
                throw new Error("no callback provided");
            }
            --max;
        }
        const data = {};
        for(var key in _args){
            idx = Number(key);
            if(key <= max){
                data[key] = _args[key];
            }
        }
        return {
            data,
            callback,
            options
        };
    };
    
    this.createServiceArgs = (data, cb) => {
        const results = [];
        for(const key in data){
            results.push( data[key] );
        }
        if(cb){
            results.push( cb );
        }
        return results;
    };
}).call(MicroservEnhancer.prototype);

export default MicroservEnhancer;