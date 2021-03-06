/**
 * Copyright JS Foundation and other contributors, http://js.foundation
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

RED.deploy = (function() {

    //Matheus Webler edit
    function generateCode(){
        save(true, true);
        $( "#node-dialog-confirm-deploy" ).dialog( "open" );        
    }

    var deploymentTypes = {
        "full":{img:"red/images/deploy-full-o.png"},
        "nodes":{img:"red/images/deploy-nodes-o.png"},
        "flows":{img:"red/images/deploy-flows-o.png"}
    }

    var ignoreDeployWarnings = {
        unknown: false,
        unusedConfig: false,
        invalid: false
    }

    var deploymentType = "full";

    var currentDiff = null;

    function changeDeploymentType(type) {
        deploymentType = type;
        $("#btn-deploy-icon").attr("src",deploymentTypes[type].img);
    }

    /**
     * options:
     *   type: "default" - Button with drop-down options - no further customisation available
     *   type: "simple"  - Button without dropdown. Customisations:
     *      label: the text to display - default: "Deploy"
     *      icon : the icon to use. Null removes the icon. default: "red/images/deploy-full-o.png"
     */
    function init(options) {
        options = options || {};

        var label = 'Save';
        var icon = 'red/images/deploy-full-o.png';
        if (options.hasOwnProperty('icon')) {
            icon = options.icon;
        }

        $('<li><span class="deploy-button-group button-group">'+
            '<a id="btn-deploy" class="deploy-button disabled" href="#">'+
            '<span class="deploy-button-content">'+
                '<i class="fa fa-save"></i> '+
                '<span>'+label+'</span>'+
            '</span>'+
            '</a>'+
            '</span></li>').prependTo(".header-toolbar");

        //Matheus Webler edit
        $('<li><span class="deploy-button-group button-group">'+
        '<a id="btn-generate" class="deploy-button" href="#">'+
        '<span class="deploy-button-content">'+
            '<img id="btn-deploy-icon" src="red/images/deploy-full-o.png"> '+
            '<span>'+RED._("deploy.generate")+'</span>'+
        '</span>'+
        '</a>'+
        '</span></li>').prependTo(".header-toolbar");

        $('#btn-deploy').click(function() { save(true, true); });

        RED.actions.add("core:deploy-flows",save);

        //Matheus Webler edit
        $('#btn-generate').click(function() { generateCode(); });
        RED.actions.add("core:generate-flows",generateCode);

        $( "#node-dialog-confirm-deploy" ).dialog({
                title: 'Confirm code generation',
                modal: true,
                autoOpen: false,
                width: 550,
                height: 300,
                buttons: [
                    {
                        text: RED._("common.label.cancel"),
                        click: function() {
                            $( this ).dialog( "close" );
                        }
                    },
                    {
                        id: "node-dialog-confirm-deploy-deploy",
                        text: RED._("deploy.confirm.button.confirm"),
                        class: "primary",
                        click: function() {
                            var dialog = $( this );
                            $( "#node-dialog-confirm-deploy-loading" ).show();
                            $( "#node-dialog-confirm-deploy-config").hide();
                            $("#node-dialog-confirm-deploy-deploy" ).addClass("disabled");
                            var nns = RED.nodes.createCompleteNodeSet();
                            $.ajax({
                                url:"http-api/swagger.json",
                                type: "GET",
                                success: function(data) {
                                    var swaggerDoc = data;
                                    var app = {
                                        flows:nns,
                                        swagger: swaggerDoc
                                    }
                                    
                                    $.ajax({
                                        url:"generate",
                                        type: "POST",
                                        data: JSON.stringify(app),
                                        contentType: "application/json; charset=utf-8",
                                        headers: {
                                            "Node-RED-Deployment-Type":deploymentType
                                        },
                                        success: function(data){
                                            $( "#node-dialog-confirm-deploy-loading" ).hide();
                                            $( "#node-dialog-confirm-deploy-config").show();
                                            $("#node-dialog-confirm-deploy-deploy" ).removeClass("disabled");
                                            dialog.dialog( "close" );
                                            alert("Application created!");
                                        },
                                        error: function(err){
                                            $( "#node-dialog-confirm-deploy-loading" ).hide();
                                            $( "#node-dialog-confirm-deploy-config").show();
                                            $("#node-dialog-confirm-deploy-deploy" ).removeClass("disabled");
                                            dialog.dialog( "close" );
                                            alert("Error creating the application!");
                                        }
                                    });
                                },
                                contentType: "application/json; charset=utf-8",
                            });
                            //
                        }
                    }
                ],
                create: function() {

                },
                open: function() {
                    $("#node-dialog-confirm-deploy-deploy").show();
                    $( "#node-dialog-confirm-deploy-loading" ).hide();
                    $( "#node-dialog-confirm-deploy-config").show();
                    $("node-dialog-confirm-deploy-deploy" ).removeClass("disabled");     
                }
        });

        RED.events.on('nodes:change',function(state) {
            if (state.dirty) {
                window.onbeforeunload = function() {
                    return RED._("deploy.confirm.undeployedChanges");
                }
                $("#btn-deploy").removeClass("disabled");
            } else {
                window.onbeforeunload = null;
                $("#btn-deploy").addClass("disabled");
            }
        });


    }

    function getNodeInfo(node) {
        var tabLabel = "";
        if (node.z) {
            var tab = RED.nodes.workspace(node.z);
            if (!tab) {
                tab = RED.nodes.subflow(node.z);
                tabLabel = tab.name;
            } else {
                tabLabel = tab.label;
            }
        }
        var label = "";
        if (typeof node._def.label == "function") {
            try {
                label = node._def.label.call(node);
            } catch(err) {
                console.log("Definition error: "+node_def.type+".label",err);
                label = node_def.type;
            }
        } else {
            label = node._def.label;
        }
        label = label || node.id;
        return {tab:tabLabel,type:node.type,label:label};
    }
    function sortNodeInfo(A,B) {
        if (A.tab < B.tab) { return -1;}
        if (A.tab > B.tab) { return 1;}
        if (A.type < B.type) { return -1;}
        if (A.type > B.type) { return 1;}
        if (A.name < B.name) { return -1;}
        if (A.name > B.name) { return 1;}
        return 0;
    }

    function resolveConflict(currentNodes) {
        
        $( "#node-dialog-confirm-deploy-type" ).val("conflict");
        $( "#node-dialog-confirm-deploy" ).dialog( "open" );
    }

    function save(skipValidation,force) {
        skipValidation = true;
        force = true;
        if (!$("#btn-deploy").hasClass("disabled")) {

            var nns = RED.nodes.createCompleteNodeSet();

            var startTime = Date.now();


            var data = {flows:nns};

            if (!force) {
                data.rev = RED.nodes.version();
            }

            $.ajax({
                url:"flows",
                type: "POST",
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8",
                headers: {
                    "Node-RED-Deployment-Type":deploymentType
                }
            }).done(function(data,textStatus,xhr) {
                RED.nodes.dirty(false);
                RED.nodes.version(data.rev);
                RED.nodes.originalFlow(nns);

                RED.notify(RED._("deploy.successfulDeploy"),"success");
                RED.nodes.eachNode(function(node) {
                    if (node.changed) {
                        node.dirty = true;
                        node.changed = false;
                    }
                    if(node.credentials) {
                        delete node.credentials;
                    }
                });
                RED.nodes.eachConfig(function (confNode) {
                    confNode.changed = false;
                    if (confNode.credentials) {
                        delete confNode.credentials;
                    }
                });
                RED.nodes.eachWorkspace(function(ws) {
                    ws.changed = false;
                })
                // Once deployed, cannot undo back to a clean state
                RED.history.markAllDirty();
                RED.view.redraw();
                RED.events.emit("deploy");
            }).fail(function(xhr,textStatus,err) {
                RED.nodes.dirty(true);
                if (xhr.status === 401) {
                    RED.notify(RED._("deploy.deployFailed",{message:RED._("user.notAuthorized")}),"error");
                } else if (xhr.status === 409) {
                    resolveConflict(nns);
                } else if (xhr.responseText) {
                    RED.notify(RED._("deploy.deployFailed",{message:xhr.responseText}),"error");
                } else {
                    RED.notify(RED._("deploy.deployFailed",{message:RED._("deploy.errors.noResponse")}),"error");
                }
            }).always(function() {
                var delta = Math.max(0,300-(Date.now()-startTime));
                setTimeout(function() {
                },delta);
            });
        }
    }
    return {
        init: init
    }
})();
