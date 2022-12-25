import {resolve} from 'path';
import util from 'util';

const BaseEnhancer = function () {
    this.enhancerName = "base";
    this.__instantiateBeforeInjection = true; 
};


(function () {


    this.resolveConfig = (plugin, base) => {
        debug('resolveConfig');
        if (!base) {
            throw new Error("base should be provided in arguments (use __dirname)");
        }

        if (!plugin.packagePath)
            throw new Error('packagePath missing in plugin');

        if (!plugin.consumes)
            plugin.consumes = [];

        if (!plugin.provides)
            plugin.provides = [];

        if (typeof plugin.consumes === 'string')
            plugin.consumes = [plugin.consumes];

        if (typeof plugin.provides === 'string')
            plugin.provides = [plugin.provides];

        if (Array.isArray(plugin.provides)) {
            return; 
        }


        const modulePath = plugin.packagePath;
        const provides = [];
        const consumes = plugin.consumes;
        const providesAsMap = {};

        const resolveFn = (_servMap, prefix) => {
            let _servicePath;
            let _serviceName;
            let pathOrObj;

            for (const key in _servMap) {
                pathOrObj = _servMap[key];
                _serviceName = prefix + key;
                if (typeof pathOrObj === 'object') { 
                    resolveFn(pathOrObj, `${_serviceName}.`);
                    providesAsMap[_serviceName] = pathOrObj;
                } else { 
                    _servicePath = resolve(base, modulePath, pathOrObj);
                    _servMap[key] = _servicePath;
                    providesAsMap[_serviceName] = _servicePath; 
                }
                provides.push(_serviceName);
            }
        };
        resolveFn(plugin.provides, "");

        plugin.enhancers = providesAsMap;
        plugin.providesIsJson = true;
        plugin.provides = provides;
    };

    this.setupPlugin = async function (plugin, imports) {
        const __instantiateBeforeInjection = plugin.__instantiateBeforeInjection || this.__instantiateBeforeInjection;

        debug("setupPlugin");
        debug(plugin);

        if (plugin.setup) {
            let registerObjsOrPromise = plugin.setup(plugin, imports);
            debug(registerObjsOrPromise);
            return registerObjsOrPromise;

        } else {

            const _registerObjs = {};

            let subKey;
            let tmpKey;
            let mkObj;

            const maybePromises = [];

            plugin.provides.forEach(key => {

                if (typeof plugin.enhancers[key] === 'string') { 
                    debug(`${key} leaf`);

                    const ConstructorFn = require(plugin.enhancers[key]);
                    if (!__instantiateBeforeInjection) {
                        debug(`    is class`);
                        _registerObjs[key] = ConstructorFn;

                    } else {
                        debug(`    is instance ${key}`);
                        _registerObjs[key] = new ConstructorFn(plugin, imports);
                        maybePromises.push(key);
                    }

                } else {  // non-leaf
                    debug(`${key} non-leaf`);

                    mkObj = {};
                    plugin.provides.forEach(subKey => {
                        if (key === subKey) {
                            return false;
                        }
                        if (subKey.indexOf(key) === 0) { 
                            tmpKey = subKey.slice(key.length + 1);
                            mkObj[tmpKey] = _registerObjs[subKey]; 
                        }
                    });
                    _registerObjs[key] = mkObj;

                }

            })

            const results = await Promise.all(
                maybePromises.map((key) => _registerObjs[key])
            )

            for (let idx in results) {
                let key = maybePromises[idx];
                let item = results[idx];
                _registerObjs[key] = item;
            }

            debug('register done');
            debug(_registerObjs);

            return _registerObjs;
        }

    }

}).call(BaseEnhancer.prototype);

export default BaseEnhancer;
