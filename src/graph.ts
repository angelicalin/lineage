/**
 * Created by cnobre on 12/10/16.
 */

import * as d3 from 'd3';
import {Config} from './config';
import {glyphSize, height, width, connectorScale, x, y} from './renderGraph';


export let uniqueID = [];
export const relationshipNodes=[];
export const relationshipEdges=[];

let g; // graph

//Set callbacks for all buttons/list items/etc
export function setCallbacks(){

    d3.selectAll(".lifeRect").attr("visibility","hidden");
    d3.selectAll(".ageLabel").attr("visibility","hidden");

    d3.select("#collapse").on('click', function () {
        if (!Config.showLifeLines) {
            d3.selectAll(".lifeRect").attr("visibility", "visible");
            d3.select(this).select('a').html('Remove Life Lines');
            Config.showLifeLines = true;
        }
        else{
            d3.selectAll(".lifeRect").attr("visibility", "hidden");
            d3.select(this).select('a').html('Add Life Lines');
            Config.showLifeLines = false;
        }

    });


    d3.select("#curvedEdges").on('click', function () {
        if (!Config.curvedLines) {
            d3.select(this).select('a').html('Straight Edges');
            Config.curvedLines = true;
        }
        else{
            d3.select(this).select('a').html('Curved Edges');
            Config.curvedLines = false;
        }
        d3.selectAll(".edges")
            .attr("d", elbow);

    });




    d3.select("#addLabels").on('click', function () {
        if (!Config.showAgeLabels) {
            d3.selectAll(".ageLabel").attr("visibility", "visible");
            d3.select(this).select('a').html('Remove Age Labels');
            Config.showAgeLabels = true;
        }
        else{
            d3.selectAll(".ageLabel").attr("visibility", "hidden");
            d3.select(this).select('a').html('Add Age Labels');
            Config.showAgeLabels = false;
        }

    });


    d3.select("#rotate").on('click', function () {
        toggleOrientation()
    });

}

//set orientation of main div w/ visualization (horizontal or vertical)
/*function setOrientation(){
    if (!Config.vertOrientation) {
        d3.select('#allVis').attr("transform", 'translate(' + height + ',0), rotate(90)');
        d3.select("svg").attr('width',height).attr('height',width)
    }
    else {
        d3.select('#allVis').attr("transform", 'translate(0,0), rotate(0)');
        d3.select("svg").attr('width',width).attr('height', height)
    }

}*/

//Toggle Orientation of main vis between horizontal and vertical
function toggleOrientation(){
    if (Config.vertOrientation) {
        Config.vertOrientation = false;
        d3.select('#allVis').attr("transform", 'translate(' + height + ',0), rotate(90)');
        d3.select("svg").attr('width',height).attr('height',width)
    }
    else {
        Config.vertOrientation = true;
        d3.select('#allVis').attr("transform", 'translate(0,0), rotate(0)');
        d3.select("svg").attr('width',width).attr('height',height)
    }

}

//Function that creates graph structure from input data
export function createGraph(data,numElements){
    g = {
            nodes: [],
            edges: []
        };
    uniqueID=[];

    data.forEach(function (d, i) {
        //Limit Size of graph and only consider entries with a valid bdate and id
        if (i <numElements && +d['egoUPDBID']>0 && +d['bdate']>0) {
            //Demographic Info
            d.id = +d['egoUPDBID'];
            d.ma = +d['maUPDBID'];
            d.pa= +d['paUPDBID'];
            d.spouse = undefined;
            d.children = [];

            //Position Info
            d.x = undefined;
            d.y = undefined;
            d.generation = undefined;
            d.linearOrder = undefined;

            //Display Info
            d.hide = false; //used to hide/show nodes
            d.type = 'individual'; //vs aggregate'
            d.color = 'black';

            //Skip duplicate rows
            if (g.nodes.filter(function(node){return node.id == d.id}).length == 0){
                g.nodes.push(d);
                uniqueID.push(d.id);
            }
        }

        //Store spouse and children in each node;
        g.nodes.forEach(function(node,id){
            //Check for the existence of mother and father nodes
            const maID = uniqueID.indexOf(node['ma']);
            const paID = uniqueID.indexOf(node['pa']);

            if (maID >-1 && paID >-1){
                g.nodes[maID].spouse = node['pa'];
                g.nodes[paID].spouse = node['ma'];
                g.nodes[maID].children.push(id);
                g.nodes[paID].children.push(id);
            }
        })

    });

    //Filter out nodes with no parents and no children
    g.nodes = g.nodes.filter(function(node){return node.children.length>0 || uniqueID.indexOf(node['ma'])>-1});
    //Create edges between individuals and their parents
    g.nodes.forEach(function(d,i){

        if (uniqueID.indexOf(d['ma']) != -1){
            g.edges.push({
                source: g.nodes[uniqueID.indexOf(d['id'])],
                target: g.nodes[uniqueID.indexOf(d['ma'])]
            });
        }
        if (uniqueID.indexOf(d['pa']) != -1) {
            g.edges.push({
                source: g.nodes[uniqueID.indexOf(d['id'])],
                target: g.nodes[uniqueID.indexOf(d['pa'])]
            });
        }

    });
    return g;

}

function assignLinearOrder(node){
    const maID = uniqueID.indexOf(node['ma']);
    const paID = uniqueID.indexOf(node['pa']);
    const spouseID = uniqueID.indexOf(node['spouse']);

    if (!node.y) {
        node.y = d3.max(g.nodes,function(d:any){return d.y})+1;
    }
    //Put spouse to the left of the current node (at least in a first pass)
    if (node.spouse && !g.nodes[spouseID].y) {
        g.nodes[spouseID].y = node.y;

        if (!Config.collapseParents){
            //Push all nodes one to the right
            g.nodes.forEach(function (d) {
                if (d.y > node.y) d.y = d.y + 1
            });
            node.y = node.y + 1;
        }
    }
    else if (node.spouse && g.nodes[spouseID].y && Config.collapseParents){
        node.y = g.nodes[spouseID].y;
    }

    if (maID >-1 && paID >-1){

        if (g.nodes[maID].y) {
            if (g.nodes[maID].y < node.y){
                node.y = g.nodes[maID].y;
                g.nodes.forEach(function (d) {if (d.y > node.y) d.y = d.y + 1});
                g.nodes[maID].y = node.y + 1;

                if (!Config.collapseParents){
                    g.nodes[paID].y = g.nodes[maID].y+1;
                }
                else
                    g.nodes[paID].y = g.nodes[maID].y;

            }
        }
        else{
            if (!Config.collapseParents){
                g.nodes.forEach(function (d) {if (d.y > node.y) d.y = d.y + 2 });
                g.nodes[paID].y = node.y + 2;
            }
            else{
                g.nodes.forEach(function (d) {if (d.y > node.y) d.y = d.y + 1 });
                g.nodes[paID].y = node.y + 1;
            }
            g.nodes[maID].y = node.y + 1;

        }
    }

}

export function arrangeLayout(g){
    g.nodes.forEach(function(node,ind){assignGeneration(node,ind)});

    g.nodes.forEach(function(node){node.x = node.generation});

    //sort by x
    g.nodes.sort(function(a, b) {
        return parseFloat(a['x']) - parseFloat(b['x']);
    });

    uniqueID=[];
    g.nodes.forEach(function(d){
        uniqueID.push(d.id);
    });

    g.nodes[0].y = 1;
    g.nodes.forEach(function(node){assignLinearOrder(node)});

    g.nodes.forEach(function(thisNode){

        if (g.nodes.filter(function(n){return n.y!=undefined && n.y == thisNode.y }).length>1) {
            g.nodes.forEach(function (d) {
                if (d.y > thisNode.y) d.y = d.y + 1;
            });
            thisNode.y = thisNode.y + 1;
        }
    });

    const randColor = d3.scaleOrdinal(d3.schemeCategory20b);

    //Create relationship nodes
    g.nodes.forEach(function(node){
        const maID = uniqueID.indexOf(node['ma']);
        const paID = uniqueID.indexOf(node['pa']);

        if (maID >-1 && paID >-1){

            const rColor = randColor(node.y);

            if (g.nodes[maID].color == 'black') {
                g.nodes[maID].color = rColor;
                g.nodes[paID].color = rColor;
            }

            const rnode={
                'x':(g.nodes[maID].x + g.nodes[paID].x)/2,
                'y':(g.nodes[maID].y + g.nodes[paID].y)/2,
                'y1':g.nodes[maID].y,
                'y2':g.nodes[paID].y,
                'x1':g.nodes[maID].x,
                'x2':g.nodes[paID].x,
                'color':g.nodes[maID].color,
                'type':'parent'
            };

            relationshipNodes.push(rnode);
            relationshipEdges.push({
                source: rnode,
                target: node,
                'color':g.nodes[maID].color
            });
        }
    });

    return g;
}

function assignGeneration(node,ind){

    node.generation = +node['bdate'];
    //
    // if (node.generation == undefined) {
    //     node.generation = getParentGeneration(ind);
    //     if (node.generation == undefined)
    //         node.generation = 1;
    //     setParentGeneration(ind, node.generation)
    // }
}

function setParentGeneration(nodeID,generation){
    const node = g.nodes[nodeID];

    const maID = uniqueID.indexOf(node['ma']);
    const paID = uniqueID.indexOf(node['pa']);

    //Mother exists in array of nodes and does not have a generation assigned
    if (maID > -1 && g.nodes[maID].generation == undefined) {
        g.nodes[maID].generation = generation + 1;
        setParentGeneration(maID,generation+1);
    }

    //Father exists in array of nodes and does not have a generation assigned
    if (paID > -1 && g.nodes[paID].generation == undefined) {
        g.nodes[paID].generation = generation + 1;
        setParentGeneration(paID,generation+1);
    }

}
function getParentGeneration(nodeID){

    const node = g.nodes[nodeID];
    const maID = uniqueID.indexOf(node['ma']);
    const paID = uniqueID.indexOf(node['pa']);
    let maGeneration;
    let paGeneration;


    if (maID >-1) { //Mother exists in array of nodes
        maGeneration = g.nodes[maID].generation;
        if (maGeneration == undefined) {
            maGeneration = getParentGeneration(maID)
        }
    }
    else {
        maGeneration = false;
    }
    if (paID >-1) { //Father exists in array of nodes
        paGeneration = g.nodes[paID].generation;
        if (paGeneration == undefined) {
            paGeneration = getParentGeneration(paID); //continue searching up the tree
        }
    }
    else {
        paGeneration = false;
    }

    if (maGeneration && paGeneration)
        return (maGeneration + paGeneration) / 2 -1;
    else if (maGeneration || paGeneration)
        return (maGeneration || paGeneration) - 1;
    else
        return undefined;
}

export function xPOS(node){
    if (node['sex'] == 'F')
        if (node['spouse'] && Config.collapseParents)
            return x(node.x); //+glyphSize/2
        else
            return x(node.x);
    else
            return x(node.x)-glyphSize;
}

export function yPOS(node){
    if (node['sex'] == 'F')
        if (node['spouse'] && Config.collapseParents)
            return y(node.y); //- glyphSize/2
        else
            return y(node.y);
    else
        return y(node.y)-glyphSize
}

const  lineFunction = d3.line<any>()
    .x(function (d:any) {
        return x(d.x);
    }).y(function (d:any) {
        return y(d.y);
    });


export function elbow(d) {
    const xdiff = d.source.x - d.target.x;
    const ydiff = d.source.y - d.target.y;
    const nx = d.source.x - xdiff * connectorScale(ydiff) ;

    const linedata = [{
        x: d.source.x,
        y: d.source.y
    }, {
        x: nx,
        y: d.source.y
    },{
        x: nx,
        y: d.target.y
    },{
        x: d.target.x,
        y: d.target.y
    }];

    if (Config.curvedLines)
        lineFunction.curve(d3.curveBasis);
    else
        lineFunction.curve(d3.curveLinear);

    return lineFunction(linedata);
}

export function parentEdge(d) {

    const linedata = [{
        x: d.x1,
        y: d.y1
    }, {
        x: d.x2,
        y: d.y2
    }];

    return lineFunction(linedata);
}
