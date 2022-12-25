const optionDefs = [
  { name: 'app', alias: 'a', type: String, defaultOption: true, defaultValue: 'app' }
];
import clArgs from 'command-line-args';
import modularJs from './config/common/modularJs.js';
import deptree from './deptree';
require('./config/common/mongoose');

const theAppTree = deptree[theApp];
const theArgs = clArgs(optionDefs);
const theApp = theArgs.app;

if(!Array.isArray(theAppTree)) {
  throw new Error(`${theApp} config does not exported.`)
}

const tree = modularJs.resolveConfig(theAppTree, process.cwd());
export default modularJs.createApp(tree, (err, module) => {
    if(err){
        throw err;
    }
}).on('error', (err) => {throw err;});
