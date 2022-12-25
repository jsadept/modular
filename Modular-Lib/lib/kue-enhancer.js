import {resolve} from 'path';
import kue from 'kue';
import MicroserviceEnhancer from './micro_base_enhancer';

const KUE_TIMEOUT = 5000;


const KueEnhancer = function(){
    MicroserviceEnhancer.call(this);
    this.wrapperName = "kuewrapper";
    this.redisConfig = {};
    const me = this;
    process.once( 'exit', sig => {
        me.closeClient();
    });
};

KueEnhancer.extends(MicroserviceEnhancer);


(function(){

    this.setupPlugin = function(plugin, imports){
        if(!plugin.prefix) plugin.prefix="";
        if (plugin.packageRole === 'server' || plugin.packageRole === 'client')
        {
            this.redisConfig = {
                redis: plugin.server,
                prefix: plugin.prefix
            };
            this.openClient();
        }
        return this.super.setupPlugin.call(this, plugin, imports);
    };

    this.openClient = function(){
        if(!this.redisConfig.redis || !this.redisConfig.redis.host || !this.redisConfig.redis.port){
            throw new Error("modularJs kue error");
        }
        this.jobsClient = kue.createQueue(this.redisConfig);
    };

    this.closeClient = function(){
        const me = this;
        return new Promise((resolve, reject) => {
            if(me.jobsClient){
                me.jobsClient.shutdown(KUE_TIMEOUT, err => {
                    if(err) {
                        reject(err);
                    } else {
                        me.jobsClient = null;
                        resolve();
                    }
                });
            }
        });
    };

    this.getClient = function(){
        return this.jobsClient;
    };

    this.makePluginEnhancer = function(serviceName, functionName){
        const jobKey = `${serviceName}.${functionName}`;
        const me = this;
        return (...args) => {
                const _a = me.parseServiceArgs(args);
                const data = _a.data;
                const options = _a.options;
                const cb = _a.callback;
                const job = me.jobsClient.create(jobKey, data);
                if(options.priority){
                    job.priority(options.priority);
                }
                if(options.attempts){
                    job.priority(options.attempts);
                }
                job.save(err => {
                    if(err) return cb(err);
                })
                .on('failed', err => {
                    return cb(err);
                })
                .on('complete', result => {
                    return cb(null, result);
                });
                return job;
            };
    };

    this.makePluginHook = function(serviceName, functionName, serviceInstance){
        const jobKey = `${serviceName}.${functionName}`;
        const me = this;
        this.jobsClient.process( jobKey, ({data}, done) => {
            const _data = me.createServiceArgs(data, done);
            serviceInstance[functionName](..._data);
            return;
        });
    };
}).call(KueEnhancer.prototype);
export default KueEnhancer;