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


var beautify = require('js-beautify').js_beautify;
var fs = require('fs');
var path = require('path');

var log;
var redNodes;
var settings;

var templateMap;

/*function createNodeFlow(initialNode, nodes){
    var current = initialNode;
    current.wires.forEach(w => {
        var next = nodes.find(element => element.id == w);
    while(next){
        current.next = next;
        next.wires.forEach(w => {
        next = nodes.find(element => element.id == next.id);
        current = current.next;
    }
}*/

function serverTemplate(node){
    var url = node.url;
    var calls = node.callOut.reduce((prev, curr) => prev += `.then(${curr})\n`, "Promise.resolve(msg)\n");
    var t =
    `const http = require('http');
    const server = http.createServer((req, res) => {
        let msg = {request: req, response: res};
        ${calls}
    });
    server.listen('${url}');
    server.listen(8000);`;
    return t;
}

function HttpOutTemplate(node){
    var t = 
    `function(msg){ res.writeHead(msg.statusCode || 200, {'Content-Type': 'application/json'});
    res.end(msg.payload);}`;
    return t;
} 

function functionTemplate(node){
    var t = 
    `function ${node.name}(msg){
        ${node.func}
    }`;
    return t;
}

function functionCallTemplate(node){
    var t = `${node.name}(msg)`;
    return t;
}

function debugCallTemplate(node){
    var t = `console.log(msg)`;
    return t;
}

module.exports = {
    init: function(runtime) {
        settings = runtime.settings;
        redNodes = runtime.nodes;
        log = runtime.log;
        templateMap = {
            "function": functionTemplate,
            "http in": serverTemplate
        };
        callMeMap = {
            "function": functionCallTemplate,
            "http response": HttpOutTemplate,
            "debug": debugCallTemplate
        }
    },
    post: function(req,res) {
        
        
        /*var flows = req.body;
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

        env.lookup(function () {
  env.run('test', {'someAnswer': false, 'skip-install': true }, function (err) {
    console.log('done');
  });
});

    }
}
