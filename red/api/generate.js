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
        if(node.type === 'mongodb out' || node.type === 'mongodb in') return this.createModelCall(node, input);
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
        let call = new Caller(node.name, 'model', node.parameters.join(' ,'), node.code);
        return call;
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

class ImportDeclaration{
    constructor(name, type, entity, code){
        this.name = name;
        this.type = type;
        this.entity = entity;
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

    buildFunctionDeclaration(node, nodeList){
        let input = this.findInputForNode(node, nodeList);
        let decl = new Declaration(node.name, node.type, input, node.func);
        return decl;
    }

    buildImportDeclaration(node){
        let decl = new ImportDeclaration(node.name, 'model', node.entity);
        return decl;
    }
    

    buildDeclarationList(route, nodeList){
        let declarations = [];
        route.nodes.forEach(node => {
            let decl = null;
            if(node.type === 'function' && node.inline === false){
                decl = this.buildFunctionDeclaration(node, nodeList);
            }
            else if(node.type === 'mongodb in' || node.type === 'mongodb out'){
                decl = this.buildImportDeclaration(node);
            }
            if(decl){
                let alreadyExists = declarations.find(d => d.name === decl.name && d.type === decl.type);
                if(!alreadyExists)
                    declarations.push(decl);
            }
        });
        return declarations;
    }
}

class Model{
    constructor(id, name, schema){
        this.id = id;
        this.name = name.toLowerCase();
        this.entity = this.name.charAt(0).toUpperCase() + this.name.slice(1); //capitalize first letter;
        this.schema = schema || {};
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
        let swagger = req.body.swagger;
        let flows = [];
        let nodes = [];
        let paths = [];
        let collections = [];
        let mongodb = null;
        let docs = [];

        allNodes.forEach(node => {
            if (node.type === 'tab'){
                flows.push(node);
            }
            else if (node.type === 'http in'){
                paths.push(node);
            }
            else if(node.type === 'collection'){
                collections.push(node);
            }
            else if(node.type === 'mongodb'){
                mongodb = node;
            }
            else if(node.type === 'swagger-doc'){
                docs.push(node);
            }
            else{
                nodes.push(node);
            }
        });

        let server = {
            port: 3000,
            host: 'localhost',
            routes: [],
            swagger: swagger
        }

        let database = mongodb;
        if(database){
            database.models = [];
            collections.map(c => {
                let model = new Model(c.id, c.name);
                if(c.properties){
                    c.properties.forEach(p => {
                        model.schema[p.v] = {type: p.t};
                    });
                }
                database.models.push(model);
            });
        }

        nodes.forEach(n => {
            if(n.type !== 'mongodb in' && n.type !== 'mongodb out')
                return;
            try{
                let model = database.models.find(m => n.collection === m.id);
                n.name = model.name;
                n.entity = model.entity;
                n.parameters = [];
                if(n.operation !== 'insertMany' && n.query) n.parameters.push(n.query);
                if(n.data && (n.operation === 'insertMany' || n.operation === 'updateMany')){
                    if(n.operation === 'insertMany' && !Array.isArray(n.data)){
                        n.parameters.push(n.data);
                    }
                    else n.parameters.push(n.data);
                } 
                n.code = n.entity + '.' + n.operation;
            }catch(err){}
        })

        flows.map(flow => {
            flow.nodes = nodes.filter(node => node.z === flow.id);
            let route = new Route(flow.label.replace(' ', ''));
            route.nodes = flow.nodes;
            paths.filter(path => path.z === flow.id).forEach(path => {
                 let url = new Url(path.id, path.name, path.url, path.method.toUpperCase(), path.output, path.swaggerDoc);
                 url.wires = path.wires;
                 url.buildCallList(flow.nodes);
                 route.urls.push(url);
            });
            let declBuilder = new DeclarationBuilder();
            let declarations = declBuilder.buildDeclarationList(route, allNodes);
            route.declarations = declarations.filter(d => d.type === 'function');
            route.imports = declarations.filter(d => d.type !== 'function');
            server.routes.push(route); 
        });

        var app = {}
        app.server = server;
        app.database = database;        

        //console.log(require('util').inspect(app, {showHidden: false, depth: null}));

        env.lookup(function () {
            env.run('avantjs', {'app': app}, function (err) {
                console.log('done');
            });
        }); 

    }
}
