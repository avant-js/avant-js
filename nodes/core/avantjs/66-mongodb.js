
module.exports = function(RED) {
    "use strict";

    function MongoNode(n) {
        RED.nodes.createNode(this,n);
    }

    RED.nodes.registerType("mongodb",MongoNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });

    RED.nodes.registerType("collection",MongoNode,{});

    RED.nodes.registerType("mongodb out",function(){});

    RED.nodes.registerType("mongodb in",function(){});
}
