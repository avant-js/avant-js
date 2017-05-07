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

class Caller{
    constructor(name, type, input, code){
        this.name = name;
        this.type = type;
        this.code = code;
        this.input = input;
    }
}

class CallBuilder{
    buildCall(node, input){
        if(node.type === 'function') return this.createFunctionCall(node, input);
        if(node.type === 'mongo out') return this.createModelCall(node, input);
    }

    createFunctionCall(node, input){
        let call = new Caller(node.name, 'function', input);
        if(node.inline){
            call.code = node.func;
        }else{
            call.code = node.name;
        }
        return call;
    }

    createModelCall(node, input){

    }
}

class Declaration{
    constructor(name, type, input, code){
        this.name = name;
        this.type = type;
        this.input = input;
        this.code = code;
    }
}

class DeclarationBuilder{
    findInputForNode(node, nodeList){
        for (let i = 0; i < nodeList.length; i++){
            let n = nodeList[i];
            if(!n.wires)
                continue;
            for (let j = 0; j < n.wires.length; j++){
                let w = n.wires[j];
                if(Array.isArray(w))
                    if(node.id === w[0]) return n.output;
            }
        }
    }

    buildDeclaration(node, nodeList){
        let input = this.findInputForNode(node, nodeList);
        let decl = new Declaration(node.name, node.type, input);
        if(node.type === 'function') decl.code = node.func;
        return decl;
    }

    buildDeclarationList(route, nodeList){
        let declarations = [];
        route.nodes.forEach(node => {
            if(node.type === 'function' && node.inline === false){
                declarations.push(this.buildDeclaration(node, nodeList));
            }
        });
        return declarations;
    }
}

class Route{
    constructor(name){
        this.name = name;
        this.urls = [];
        this.imports = [],
        this.declarations = [];
        this.nodes = [];
    }

}

class Url{
    constructor(id, name, url, method, output){
        this.id = id;
        this.name = name;
        this.path = url;
        this.method = method;
        this.output = output;
        this.calls = [];
        this.wires = [];
    }

    getNextNode(node, nodeList){
        for (let i = 0; i < node.wires.length; i++){
            let w = node.wires[i];
            if(Array.isArray(w)){
                return nodeList.find(n => n.id === w[0]);
            } else {
                return nodeList.find(n => n.id === w);
            }
        } 
    }

    buildCallList(nodes){
        let builder = new CallBuilder();
        let next = this.getNextNode(this, nodes);
        let input = this.output;
        while(next){
            let call = builder.buildCall(next, input);
            if(call) this.calls.push(call);
            input = next.output;
            next = this.getNextNode(next, nodes);
        }
    }
}

module.exports = {
    init: function(runtime) {
        settings = runtime.settings;
        redNodes = runtime.nodes;
        log = runtime.log;
    },
    post: function(req,res) {
        let allNodes = req.body.flows;
        let flows = [];
        let nodes = [];
        let paths = [];
        allNodes.forEach(node => {
            if (node.type === 'tab'){
                flows.push(node);
            }
            else if (node.type === 'http in'){
                paths.push(node);
            }
            else{
                nodes.push(node);
            }
        });

        let server = {
            port: 3000,
            host: 'localhost',
            routes: []
        }  

        flows.map(flow => {
            flow.nodes = nodes.filter(node => node.z === flow.id);
            let route = new Route(flow.label.replace(' ', ''));
            route.nodes = flow.nodes;
            paths.filter(path => path.z === flow.id).forEach(path => {
                 let url = new Url(path.id, path.name, path.url, path.method.toUpperCase(), path.output);
                 url.wires = path.wires;
                 url.buildCallList(flow.nodes);
                 route.urls.push(url);
            });
            let declBuilder = new DeclarationBuilder();
            route.declarations = declBuilder.buildDeclarationList(route, allNodes);
            server.routes.push(route); 
        });

        var app = {
            server: server,
            database: {
                name: "mydb",
                models: [
                    {
                        name: "music",
                        entity: "Music",
                        schema: {
                            title: { type: "String" },
                            artist: { type: "String" },
                            album: { type: "String" }
                        }
                    }
                ]
            }
        }

        env.lookup(function () {
            env.run('avantjs', {'app': app, 'skip-install': true }, function (err) {
                console.log('done');
            });
        }); 

    }
}
