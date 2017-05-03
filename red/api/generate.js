/**
 * Copyright Matheus Webler, http://mwebler.me
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const Mustache = require('mustache');

var yeoman = require('yeoman-environment');
var env = yeoman.createEnv();

// Here we register a generator based on its path. Providing the namespace
// is optional.
// The #lookup() method will search the user computer for installed generators. 
// The search if done from the current working directory. 

var fs = require('fs');
var path = require('path');

var log;
var redNodes;
var settings;

module.exports = {
    init: function(runtime) {
        settings = runtime.settings;
        redNodes = runtime.nodes;
        log = runtime.log;
    },
    post: function(req,res) {
        var flows = req.body;

        // Get function parameters
        flows.flows.forEach(node => {
           if(node.type == 'function'){
                var functionName = node.name.split('(')[0];
                var regExp = /\(([^)]+)\)/;
                var parameters = node.name.match(regExp)[1];
                if(parameters)
                    parameters = parameters.split(',').map(param => param.trim());
                console.log(parameters);
                console.log(node.output);
           }
        });
        
        /*
        flows.flows.forEach(node => {
            if(callMeMap[node.type])
                node.callMe = callMeMap[node.type](node);
        });

        flows.flows.forEach(node => {
            if(node.primary && node.wires){
                var outputs = [];
                var next = flows.flows.find(element => element.id == node.wires[0]);
                while(next){
                    outputs.push(next.callMe);
                    if(next.wires && next.wires[0]){
                        next = flows.flows.find(element => element.id == next.wires[0]);
                    }
                    else{
                        break;
                    }
                }
                node.callOut = outputs;
            }

            if(templateMap[node.type])
                node.code = templateMap[node.type](node);
        });

        var code = "";
        flows.flows.forEach(node => {
            if(node.code)
                code += node.code + '\n';
        })
        fs.writeFile(path.join(__dirname, '..', '..', 'generated.js'), beautify(code, { indent_size: 4 }));*/

        /*env.lookup(function () {
  env.run('test', {'someAnswer': false, 'skip-install': true }, function (err) {
    console.log('done');
  });
}); */

    }
}
