import events from 'events';
const EventEmitter = events.EventEmitter;
const exports = {};
const Enhancers = exports.Enhancers = require('./enhancers');
const BaseEnhancerClass = exports.BaseEnhancerClass = require('./base_enhancer');
const defaultEnhancerName = "base";

(() => {
    function BaseEnhancerFactoryFn() {
        return new BaseEnhancerClass();
    };

    Enhancers.registerEnhancerFactory(defaultEnhancerName, BaseEnhancerFactoryFn);
})();


(() => {
    const dirname = require('path').dirname;
    const resolve = require('path').resolve;
    const existsSync = require('fs').existsSync || require('path').existsSync;
    const realpathSync = require('fs').realpathSync;
    const packagePathCache = {};

    exports.loadConfig = loadConfig;
    exports.resolveConfig = resolveConfig;

    function loadConfig(configPath) {
        const config = require(configPath);
        const base = dirname(configPath);
        return resolveConfig(config, base);
    }

    function resolveConfig(config, base) {
        if (!config) {
            console.trace("resolveConfig is provided with empty/null config.");
            return;
        }

        config.forEach((plugin, index) => {
            if (!plugin) {
                console.error(config);
                throw new Error("One of your plugins is undefined");
            }

            if (typeof plugin === "string") {
                plugin = config[index] = { packagePath: plugin };
            }

            if (plugin.hasOwnProperty("packagePath")) {

                const defaults = resolveModule(base, plugin.packagePath);

                if (defaults.hasOwnProperty("packagePath")) {
                    delete plugin.packagePath;
                }
                Object.keys(defaults).forEach(key => {
                    if (!plugin.hasOwnProperty(key)) {
                        plugin[key] = defaults[key];
                    } else {
                        console.warn(`Key conflict! Both app config (used) and plugins package.json (skipped) have key ${key}`);
                    }
                });

            }

            if (!plugin.hasOwnProperty("setup")) {

                try {
                    plugin.setup = require(plugin.packagePath);
                } catch (e) {
                    if (e.code !== 'MODULE_NOT_FOUND') { 
                        throw (e);
                    } 
                    if (e.message.match(plugin.packagePath) === null) { 
                        throw (e);
                    }
                }
            }
            resolveEnhancers(plugin, base);

        });
        return config;
    }

    function resolveModule(base, modulePath) {
        let packagePath;
        try {
            packagePath = resolvePackage(base, `${modulePath}/package.json`);
        }
        catch (err) {
            if (err.code !== "ENOENT") throw err;
        }
        const packageJson = packagePath && require(packagePath) || {};
        const metadata = packagePath && packageJson.plugin || {};

        if (packagePath) {
            modulePath = dirname(packagePath);
        } else {
            try {
                modulePath = resolvePackage(base, modulePath);
            } catch (err1) {
                throw err1;
            }
        }
        let the_module = {};
        if (packageJson.main) {
            the_module = require(modulePath);
        }
        const provides = metadata.provides || the_module.provides;
        const consumes = metadata.consumes || the_module.consumes;

        metadata.packagePath = modulePath;
        if (provides) metadata.provides = provides;
        if (consumes) metadata.consumes = consumes;

        return metadata;
    }

    function resolvePackage(base, packagePath) {
        const originalBase = base;
        if (!(base in packagePathCache)) {
            packagePathCache[base] = {};
        }
        const cache = packagePathCache[base];
        if (packagePath in cache) {
            return cache[packagePath];
        }
        let newPath;
        let newBase;

        newPath = resolve(base, packagePath);
        if (existsSync(newPath)) {
            newPath = realpathSync(newPath);
            cache[packagePath] = newPath;
            return newPath;
        }
        else { 
            while (base) {
                newPath = resolve(base, "node_modules", packagePath);
                if (existsSync(newPath)) {
                    newPath = realpathSync(newPath);
                    cache[packagePath] = newPath;
                    return newPath;
                }
                newBase = resolve(base, '..');
                if (base === newBase) {
                    break;
                }
                base = newBase;
            }
        }
        const err = new Error(`Can't find '${packagePath}' relative to '${originalBase}'`);
        err.code = "ENOENT";
        throw err;
    }

    function resolveEnhancers(plugin, base) {
        if (!plugin.packageEnhancer) {
            plugin.packageEnhancer = defaultEnhancerName;
        }
        const enhancerInst = Enhancers.newEnhancer(plugin.packageEnhancer);
        if (!enhancerInst) {
            const errmsg = `No registered enhancer with the name ${plugin.packageEnhancer}`;
            throw new Error(errmsg);
        }
        enhancerInst.resolveConfig(plugin, base);
        plugin.packageEnhancer = enhancerInst;
    }
})();


export {createApp};

function checkConfig(config) {

    config.forEach(plugin => {
        if (plugin.checked) { return; }
        if (!plugin.hasOwnProperty("provides")) {
            throw new Error(`Plugin is missing the provides array ${JSON.stringify(plugin)}`);
        }
        if (!plugin.hasOwnProperty("consumes")) {
            throw new Error(`Plugin is missing the consumes array ${JSON.stringify(plugin)}`);
        }
    });

    return checkCycles(config);
}

function checkCycles(config) {
    const plugins = [];
    config.forEach(({packagePath, provides, consumes}, index) => {
        plugins.push({
            packagePath,
            provides: provides.concat(),
            consumes: consumes.concat(),
            i: index
        });
    });
    const resolved = {};
    let changed = true;
    const sorted = [];
    while (plugins.length && changed) {
        changed = false;

        plugins.concat().forEach(plugin => {
            const consumes = plugin.consumes.concat();

            let resolvedAll = true;

            consumes.forEach(service => {
                if (!resolved[service]) {
                    resolvedAll = false;
                } else {
                    plugin.consumes.splice(plugin.consumes.indexOf(service), 1);
                }
            });

            if (!resolvedAll)
                return;

            plugins.splice(plugins.indexOf(plugin), 1);
            plugin.provides.forEach(service => {
                resolved[service] = true;
            });
            sorted.push(config[plugin.i]);
            changed = true;
        });
    }

    if (plugins.length) {
        const unresolved = {};
        plugins.forEach(plugin => {
            delete plugin.config;
            plugin.consumes.forEach(name => {
                if (unresolved[name] == false)
                    return;
                if (!unresolved[name])
                    unresolved[name] = [];
                unresolved[name].push(plugin.packagePath);
            });
            plugin.provides.forEach(name => {
                unresolved[name] = false;
            });
        });
        Object.keys(unresolved).forEach(name => {
            if (unresolved[name] == false)
                delete unresolved[name];
        });

        console.error("Could not resolve dependencies of these plugins:", plugins);
        console.error("Resolved services:", Object.keys(resolved));
        console.error("Missing services:", unresolved);
        throw new Error("Could not resolve dependencies");
    }

    return sorted;
}

class ModularJS {
    constructor(config) {
        const app = this;
        app.config = [];
        app.destructors = [];
        app.services = {};
    }

    destroy() {
        const app = this;
        app.destructors.forEach(destroy => {
            destroy();
        });
        app.destructors = [];
    }

    async loadPlugins(config) {
        const app = this;
        let sortedConfig = checkConfig(config.concat(app.config));

        const occur = {};
        sortedConfig = sortedConfig.filter(({packagePath}) => {
            const key = packagePath;
            if (!occur[key]) {
                return occur[key] = true;
            } else {
                return false; 
            }
        });

        for (const idx in sortedConfig) {
            const plugin = sortedConfig[idx];
            await app.registerPlugin(plugin)
        }
    }

    async registerPlugin(plugin) {
        const app = this;
        const imports = {};
        if (plugin.consumes) {
            for (var name of plugin.consumes) {
                imports[name] = app.services[name];
            }
        }
        const pluginServices = await plugin.packageEnhancer.setupPlugin.call(plugin.packageEnhancer, plugin, imports);
        for (var name of plugin.provides) {
            if (!pluginServices.hasOwnProperty(name)) {
                const err = new Error(`Plugin failed to provide ${name} service.`);
                throw (err);
            }
            if (emptyServiceWarning(pluginServices[name])) {
                console.warn(`Warning! looks like service '${name}' does not exports or module.exports any objects.`);
            }

            app.services[name] = pluginServices[name];

            app.emit("service", name, app.services[name]);
        }

        if (pluginServices && pluginServices.hasOwnProperty("onDestroy")) {
            app.destructors.push(pluginServices.onDestroy);
        }

        plugin.destroy = () => {
            if (plugin.provides.length) {
                const err = new Error(`Plugins that provide services cannot be destroyed. ${JSON.stringify(plugin)}`);
                return app.emit("error", err);
            }

            if (pluginServices && pluginServices.hasOwnProperty("onDestroy")) {
                app.destructors.splice(app.destructors.indexOf(pluginServices.onDestroy), 1);
                pluginServices.onDestroy();
            }
            app.config.splice(app.config.indexOf(plugin), 1);
            app.emit("destroyed", plugin);
        };
        app.emit("plugin", plugin);
    }

    getService(name) {
        if (!this.services[name]) {
            throw new Error(`Service '${name}' not found in ModularJS app!`);
        }
        return this.services[name];
    }
}

ModularJS.prototype = Object.create(EventEmitter.prototype, { constructor: { value: ModularJS } });

async function createApp(config) {
    const app = new ModularJS(config);
    await app.loadPlugins(config);
    return app;
}

function emptyServiceWarning(obj) {
    if (typeof obj == 'function')
        return false;
    for (const prop in obj) {
        return false;
    }
    return true;
}
export default exports;
