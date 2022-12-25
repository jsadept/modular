const enhancerFactory = {
};

export function registerEnhancerFactory(name, factoryFn) {
    if(enhancerFactory[name]){
        console.warn("WARNING! You are overwriting a enhancer that is already registered with ModularJS module");
        console.warn(`  Enhancer Name : ${name}`);
        //console.trace();
    }

    enhancerFactory[name] = factoryFn;
}

export function newEnhancer(name) {
    if(enhancerFactory[name]){
        return enhancerFactory[name]();
    }else{
        console.warn(`WARINING! Unable to create ${name} enhancer - it is not registered.`);
    }
}
