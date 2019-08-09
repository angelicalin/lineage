/**
 * Created by Caleydo Team on 31.08.2016.
 */
import * as tslib_1 from "tslib";
// import * as d3 from 'd3';
import { select, selectAll } from 'd3-selection';
//Import typescript modules for the views
import * as tree from './genealogyTree';
import * as table from './attributeTable';
import * as panel from './attributePanel';
import * as familySelector from './familySelector';
import * as map from './mapView';
//Import Data Structure for graph & table
import * as graphData from './graphData';
import * as TableManager from './tableManager';
import * as MapManager from './mapManager';
import { layoutState } from './Node';
/**
 * The main class for the Lineage app
 */
var App = /** @class */ (function () {
    function App(parent) {
        // console.log(parent)
        // console.log(select(parent),select('#app'))
        this.$node = select(parent);
        // this.$node = select('#col1');
        this.$node.select('#col1').append('div').attr('id', 'data_selection');
        this.$node.select('#col2').append('div').attr('id', 'graph');
        this.$node.select('#col3').append('div').attr('id', 'table');
        this.$node.select('#col4').append('div').attr('id', 'map');
        //Add div for tooltip that sits on top of all other divs.
        select('#app').append('div').attr('id', 'tooltipMenu');
        select('#app').append('div').attr('id', 'treeMenu');
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<App>}
     */
    App.prototype.init = function () {
        // //Add a Dataset Picker
        // const datasetPicker = select('.navbar-collapse')
        //   .append('ul').attr('class', 'nav navbar-nav navbar-left').attr('id', 'datasetPicker');
        // const dropdownList = datasetPicker.append('li').attr('class', 'dropdown');
        // dropdownList
        //   .append('a')
        //   .attr('class', 'dropdown-toggle')
        //   .attr('data-toggle', 'dropdown')
        //   .attr('role', 'button')
        //   .html('Pick Dataset')
        //   .append('span')
        //   .attr('class', 'caret');
        // const dataMenu = dropdownList.append('ul').attr('class', 'dropdown-menu');
        // let menuItems = dataMenu.selectAll('.datasetMenuItem')
        //   .data([
        //     { 'title': 'Suicide Families (Anonymized)', 'type': 'suicide_anon' },
        //     { 'title': 'Suicide Families', 'type': 'suicide' },
        //     { 'title': 'Autism Families', 'type': 'autism' }]);
        // menuItems = menuItems.enter()
        //   .append('li')
        //   .append('a')
        //   .attr('class', 'datasetMenuItem')
        //   .classed('active', false)
        //   .html((d: any) => { return d.title; })
        //   .merge(menuItems);
        return this.build();
    };
    /**
     * Load and initialize all necessary views
     * @returns {Promise<App>}
     */
    App.prototype.build = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tableManager, parsedUrl, dataset, attributePanel, mapManager, graphDataObj, genealogyTree, mapView, attributeTable, familySelectorView;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tableManager = TableManager.create();
                        parsedUrl = new URL(window.location.href);
                        dataset = parsedUrl.search.split('ds=')[1];
                        if (!(dataset === 'suicide' || !dataset)) return [3 /*break*/, 2];
                        dataset = 'suicide';
                        return [4 /*yield*/, tableManager.loadData('TenFamiliesDescend', 'TenFamiliesAttr')];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 2:
                        if (!(dataset === 'autism')) return [3 /*break*/, 4];
                        return [4 /*yield*/, tableManager.loadData('AllAutismFamiliesDescend', 'AllAutismFamiliesAttributes')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        if (!(dataset === 'suicide_anon')) return [3 /*break*/, 6];
                        dataset = 'suicide';
                        return [4 /*yield*/, tableManager.loadData('TenFamiliesDescendAnon', 'TenFamiliesAttrAnon')];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        attributePanel = panel.create(this.$node.select('#data_selection').node());
                        mapManager = MapManager.create();
                        mapManager.init(tableManager);
                        attributePanel.build();
                        attributePanel.init(tableManager, dataset);
                        graphDataObj = graphData.create(tableManager);
                        return [4 /*yield*/, graphDataObj.createTree().then(function () {
                                graphDataObj.aggregateTreeWrapper(undefined, layoutState.Aggregated); //default to aggregated state;
                            })];
                    case 7:
                        _a.sent();
                        genealogyTree = tree.create(this.$node.select('#graph').node());
                        genealogyTree.init(graphDataObj, tableManager);
                        genealogyTree.update();
                        mapView = map.create();
                        mapView.init(mapManager);
                        attributeTable = table.create(this.$node.select('#table').node());
                        //  attributeTable.setMapView(mapView);
                        tableManager.setMapView(mapView);
                        return [4 /*yield*/, attributeTable.init(tableManager)];
                    case 8:
                        _a.sent();
                        familySelectorView = familySelector.create(this.$node.select('#familySelector').node());
                        familySelectorView.init(tableManager);
                        familySelectorView.updateTable();
                        // const changeDataset = async function(d:any){
                        //   //If item is already selected, do nothing;
                        //   if (select(this).classed('active')) {
                        //     return;
                        //   }
                        //   // if (d.type === 'suicide_anon') {
                        //   //   await tableManager.loadData('TenFamiliesDescend', 'TenFamiliesAttr');
                        //   //   tableManager.setAffectedState('suicide');
                        //   // } else if (d.type === 'suicide') {
                        //   //   await tableManager.loadData('AllAutismFamiliesDescend', 'AllAutismFamiliesAttributes');
                        //   //   tableManager.setAffectedState('affected');
                        //   //   // console.log('here')
                        //   //   // return;
                        //   //   // await tableManager.loadData('AllFamiliesDescend', 'AllFamiliesAttr');
                        //   // } else if (d.type === 'autism') {
                        //   //   // tableManager.setAffectedState('affected');
                        //   //   // await tableManager.loadData('AllAutismFamiliesDescend', 'AllAutismFamiliesAttributes');
                        //   // }
                        //   selectAll('.datasetMenuItem').classed('active',false);
                        //   select(this).classed('active',true);
                        //   // attributePanel.init(tableManager);
                        //   // await graphDataObj.createTree();
                        //   // genealogyTree.update();
                        //   // genealogyTree.init(graphDataObj, tableManager);
                        //   // attributeTable.init(tableManager);
                        //   // familySelectorView.updateTable();
                        // };
                        // selectAll('.datasetMenuItem').on('click',changeDataset);
                        this.$node.select('#loading').remove();
                        this.setBusy(false);
                        //Set listener on document so that clicking anywhere removes the menus
                        select('body').on('click', function () {
                            console.log('clearing all...');
                            select('#treeMenu').select('.menu').remove();
                            selectAll('.highlightedNode').classed('highlightedNode', false);
                            selectAll('.edges').classed('selected', false);
                            selectAll('.parentEdges').classed('selected', false);
                            selectAll('.clicked').classed('clicked', false);
                        });
                        return [2 /*return*/, Promise.resolve(this)];
                }
            });
        });
    };
    /**
     * Show or hide the application loading indicator
     * @param isBusy
     */
    App.prototype.setBusy = function (isBusy) {
        this.$node.select('.busy').classed('hidden', !isBusy);
    };
    return App;
}());
export { App };
/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent) {
    return new App(parent);
}
//# sourceMappingURL=app.js.map