import * as events from 'phovea_core/src/event';
import { select, selection, selectAll, mouse, event } from 'd3-selection';
import { format } from 'd3-format';
import { scaleLinear, scaleOrdinal, schemeCategory20c } from 'd3-scale';
import { max, min, mean } from 'd3-array';
import {zoom, zoomIdentity} from 'd3-zoom';
import {geoCentroid,geoMercator,geoPath} from 'd3-geo'
import {forceSimulation,forceCollide} from 'd3-force'
import {timeout} from 'd3-timer'
import {feature as topofeature} from 'topojson';
import * as MapManager from './mapManager';
import {
  TABLE_VIS_ROWS_CHANGED_EVENT
} from './tableManager';

class MapView{
    private mapManager;
    private currentSelectedMapAttribute: string = 'sex';
    private currentViewType = 'map';
    //private topojson_features;
    private map_center;
    private svgWidth = (select('#map').node() as any).getBoundingClientRect().width;
    private svgHeight = (select('#col4').node() as any).getBoundingClientRect().height;
    private node_center;
    private projection;
    private dotDataColloection;

    public init(mapManager){
      this.mapManager = mapManager;
      //document.getElementById('col4').style.display = 'none';


      this.map_center=geoCentroid(this.mapManager.topojson_features);
      this.node_center = [this.svgWidth/2,(this.svgHeight-195)/2];
      select('#map').append('div').attr('id','mapDiv1')
          .append('svg').attr('id','map-util-svg').attr('width',this.svgWidth).attr('height',195)
      select('#map').append('div').attr('id','mapDiv2')
          .append('svg').attr('id','map-svg').attr('width',this.svgWidth).attr('height',this.svgHeight-195);

      select('#map-svg').append('g').attr('id',"mapLayer");
      select('#map-svg').append('g').attr('id','drawLayer');
      select('#map-svg').append('g').attr('id','demoLayer');
      select("#col4").append("div")
          .attr("class", "tooltip")
          .attr('id','circletip')
          .attr("opacity", 0)
          .attr('background','white');

      select('#col4').append('div')
          .attr('class','tooltip')
          .attr('id','countytip')
          .attr('opacity',0)
          .attr('background','white');
      this.initUtil();
    }

    private initUtil(){
      const self = this;
      let buttondiv = select('#map').append('div').attr('id','button-div');
      let resetButton = buttondiv.append('button')
                  .attr('id','reset_button')
                  .text('Reset zoom');
      select('.navbar-collapse')
          .append('ul').attr('class', 'nav navbar-nav navbar-left').attr('id', 'Toggle Tree')
          .append('li')
          .append('a')
          .attr('class', 'btn-link')
          .attr('role', 'button')
          .html('Show/Hide Map')
          .on('click',d=>{
            let map_component = document.getElementById('col4')
            if (map_component.style.display === 'none'){
              map_component.style.display = 'block';
            } else{
              map_component.style.display = 'none';
            }})

    const dropdownMenu = select('.navbar-collapse')
      .append('ul').attr('class', 'nav navbar-nav').attr('id', 'mapAttribute');

      const list = dropdownMenu.append('li').attr('class', 'dropdown');

      list
        .append('a')
        .attr('class', 'dropdown-toggle')
        .attr('data-toggle', 'dropdown')
        .attr('role', 'button')
        .html('Map Attribute')
        .append('span')
        .attr('class', 'caret');

      const menu = list.append('ul').attr('class', 'dropdown-menu');

      menu.append('h4').attr('class', 'dropdown-header')
        .style('font-size', '16px')
        .html('Demographic Attributes');

      let colNames = this.mapManager.tableManager.getDemographicColumns().map((col) => {
        return col.desc.name;
      });

      let menuItems = menu.selectAll('.demoAttr')
        .data(colNames);
      menuItems = menuItems.enter()
        .append('li')
        .append('a')
        .attr('class', 'dropdown-item-map demoAttr')
        .classed('active', d => d===this.currentSelectedMapAttribute)
        .html((d:any) => { return d; })
        .merge(menuItems);

      menu.append('li').attr('class', 'divider').attr('role', 'separator');
      menu.append('h4').attr('class', 'dropdown-header').style('font-size', '16px')
        .html('Clinical Attributes');
      colNames = this.mapManager.tableManager.getAttrColumns().map((col) => {
        return col.desc.name;
      });
      menuItems = menu.selectAll('.clinicalAttr')
        .data(colNames);
      menuItems = menuItems.enter()
        .append('li')
        .append('a')
        .attr('class', 'dropdown-item-map clinicalAttr')
        .classed('active', d=>d== this.currentSelectedMapAttribute)
        .html((d:any) => { return d; })
        .merge(menuItems);

      selectAll('.dropdown-item-map').on('mousedown', function (d) {
          event.preventDefault();
          //Check if is selected, if so remove from table.
          d = d.toString()
          if (self.currentSelectedMapAttribute==d) {
            self.currentSelectedMapAttribute = undefined
            selectAll('.dropdown-item-map').classed('active', false);
          } else {

            self.currentSelectedMapAttribute = d as string;
            selectAll('.dropdown-item-map').classed('active',false);
            select(this).classed('active', true);
          }
        });

      self.update();
    }

    deleteHighlight(){

    }

    async update(){
      const self = this;
      self.dotDataColloection = await self.mapManager.prepareData(this.currentSelectedMapAttribute);
      if (this.currentViewType == 'map'){
        self.drawGeographicalMap();
        self.drawMapDots();
      }
    }

    private drawMapDots(){
      let self = this;

      let draw = select("#drawLayer");
      draw.selectAll('rect').remove()

      let circle_tip = select('#col4').select('#circletip');

      // if (this.selectedValue==='Age'){
      //   legendScale = scaleLinear().domain([0,90]).range([d3.interpolatePuRd(0.3),d3.interpolatePuRd(1)])
      // }
      // else{
      //   let uniques = actualAttrData.filter((v, i, a) => a.indexOf(v) === i);
      //   legendScale = scaleOrdinal().domain(uniques).range(d3.schemeSet1 );
      // }

      //TODO make new legend
      // select('.legend').selectAll('.rectLegend').remove()
      //
      // let legend = svglegend.legendColor()
      // legend.scale(self.legendScale);
      // legend.shapeWidth((that.svgWidth)/8);
      // d3.select('.legend').call(legend);
      self.dotDataColloection.forEach(dot =>{
        [dot.x,dot.y] = self.projection([dot.longitude,dot.latitude])
      })

      let simulation = forceSimulation(self.dotDataColloection)
                          .force('collide',forceCollide().radius(5).iterations(10))
                          .stop();

      timeout(function(){
      for (var i = 0,
        n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
         i < n; ++i) {
          simulation.tick();}

      let circles = draw.selectAll('circle').data(self.dotDataColloection);
          circles.exit().remove();
          circles = circles.enter()
                      .append('circle')
                      .merge(circles);
          circles.attr('cx',(d:any)=>d.x)
                     .attr('cy',(d:any)=>d.y)
                     .attr('r',5)
                     .attr('fill','blue')
                     // .on("mouseover", function(d:any) {
                     //    circle_tip.transition()
                     //    .duration(10)
                     //    .style("opacity", .9);
                     //    // circle_tip.html(d.id + ' ' + d.bdate + '-' + d.ddate)
                     //    // .style("left", (event.pageX) + "px")
                     //    // .style("top", (event.pageY - 28) + "px");
                     //    draw.append('line')
                     //      .attr('id','exactLocationLine')
                     //      .attr('stroke','red')
                     //      .attr('strokeWidth',2)
                     //      .attr('x1',d.x)
                     //      .attr('y1',d.y)
                     //      .attr('x2',self.projection(d.longitude))
                     //      .attr('y2',self.projection(d.latitude))
                     //      .attr('opacity',1);
                     //    })
                     // .on("mouseout", function(d:any) {
                     //    circle_tip.transition()
                     //    .duration(10)
                     //    .style("opacity", 0);
                     //    draw.select('#exactLocationLine').remove();
                     //  });
                  }
              )
    }

    private drawGeographicalMap(){
      const self = this;
      this.projection = geoMercator()
            .translate(this.node_center)
            .scale(5000)
            .center(this.map_center);
      const path_fuction = geoPath().projection(self.projection);
      const county_tooltip = select('#countytip');

      let paths = select('#mapLayer').selectAll('path').data(self.mapManager.topojson_features.features);
      paths.exit().remove();
      paths = paths.enter().append('path').merge(paths).classed('map-paths',true);
      // paths.transition()
      //      .duration(700)
      paths.attr("id",(d)=>(d as any).properties.GEOID)
           .attr("d", path_fuction);
    //  console.log(self.mapManager.topojson_features.features)
      paths.on('mouseover',function(d){
               county_tooltip.transition()
               .duration(200)
               .style('opacity',0.9);
               county_tooltip.html((d as any).properties.NAME)
               .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
              })
             .on('mouseout',function(d){
               county_tooltip.transition()
                       .duration(200)
                       .style('opacity',0)});

         select('#map-svg').call(zoom().on('zoom',function(){
                 self.projection.scale(event.transform.k*5000).center(self.map_center)
                 .translate([self.node_center[0]+event.transform.x,self.node_center[1]+event.transform.y]);
                 select('#mapLayer').selectAll('path').attr('d',path_fuction);
                 self.drawMapDots()
                 }))



         select('#reset_button').on('click',function(){
           if(self.currentViewType==='mapView'){
             zoom().transform(select('map-svg'),zoomIdentity)
             self.projection.scale(5000).translate(self.node_center).center(self.map_center);
             select('#mapLayer').selectAll('path').attr('d',path_fuction);
             self.drawMapDots();
           }
         })

       }

       private attachListener() {
         const self = this;
         events.on(TABLE_VIS_ROWS_CHANGED_EVENT, () => {
           self.update();
         });
       }


}
export function create(){
    return new MapView();
}
