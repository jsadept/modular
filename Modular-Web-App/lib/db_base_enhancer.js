import {moduleJs} from './modular_js';

const BaseEnhancerClass = moduleJs.BaseEnhancerClass;

const DbEnhancer = function(){
    this.baseEnhancer = new BaseEnhancerClass(); // contains base class
    this.enhancerName = "dbenhancer";
};

(function(){
    
    this.resolveConfig = function(plugin, base){
        if(typeof plugin.provides !== 'object' || Array.isArray(plugin.provides)){
            throw new Error("Incorrect dbEnhancer provides format");
        }
        this.baseEnhancer.resolveConfig(plugin, base);
    };

    this.setupPlugin = function(plugin, imports){
        return this.baseEnhancer.setupPlugin(plugin, imports);
    };
    
    this.openClient = cb => {
        throw new Error("override");
    };

    this.closeClient = cb => {
        throw new Error("override");
    };

    this.getClient = () => {
        throw new Error("override");
    };

}).call(DbEnhancer.prototype);

export default DbEnhancer;