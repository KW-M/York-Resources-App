/*
    angularGrid.js v 0.6.5
    Author: Sudhanshu Yadav
    Copyright (c) 2015-2016 Sudhanshu Yadav - ignitersworld.com , released under the MIT license.
    Demo on: http://ignitersworld.com/lab/angulargrid/
    Documentation and download on https://github.com/s-yadav/angulargrid
*/

/* module to create pinterest like responsive masonry grid system for angular */

!function(a,b){"undefined"!=typeof module&&module.exports?module.exports=b(require("angular"),a):"function"==typeof define&&define.amd?define(["angular"],function(c){return b(c,a)}):b(a.angular,a)}(this,function(a,b,c){"use strict";function i(a){return a.complete&&("undefined"==typeof a.naturalWidth||0!==a.naturalWidth)}function j(a){return Array.prototype.slice.call(a)}var d={gridWidth:300,gutterSize:10,gridNo:"auto",direction:"ltor",refreshOnImgLoad:!0,cssGrid:!1,performantScroll:!1,pageSize:"auto",scrollContainer:"body",infiniteScrollDelay:3e3,infiniteScrollDistance:100},e=a.element,f=function(a){return a.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()},g={visibility:"hidden",opacity:0,top:0,left:0,width:""},h=function(){var a=e(b);return function(b){return a[0]=b,a}}();return e(document.head).append("<style>.ag-no-transition{-webkit-transition: none !important;transition: none !important;} .angular-grid{position : relative;} .angular-grid > *{opacity : 0} .angular-grid > .angular-grid-item{opacity : 1}</style>"),a.module("angularGrid",[]).directive("angularGrid",["$timeout","$window","$q","angularGridInstance",function(k,l,m,n){return{restrict:"A",scope:{model:"=angularGrid",dep_gridWidth:"=gridWidth",dep_gutterSize:"=gutterSize",dep_refreshOnImgLoad:"=refreshOnImgLoad",dep_direction:"=direction",dep_cssGrid:"=cssGrid",dep_options:"=angularGridOptions",dep_gridNo:"=gridNo",dep_agId:"@angularGridId",gridNo:"=agGridNo",gridWidth:"=agGridWidth",gutterSize:"=agGutterSize",refreshOnImgLoad:"=agRefreshOnImgLoad",direction:"=agDirection",cssGrid:"=agCssGrid",options:"=agOptions",agId:"@",pageSize:"=agPageSize",performantScroll:"=agPerformantScroll",scrollContainer:"@agScrollContainer",infiniteScroll:"&agInfiniteScroll",infiniteScrollDistance:"=agInfiniteScrollDistance",infiniteScrollDelay:"=agInfiniteScrollDelay"},link:function(o,p,q){function y(){x={},Object.keys(d).forEach(function(a){o[a]!==c?x[a]=o[a]:o["dep_"+a]!==c&&(x[a]=o["dep_"+a])}),x=a.extend({},d,x,o.options||o.dep_options),x.cssGrid&&(x.gutterSize=0),"auto"==x.pageSize&&(x.pageSize=b.offsetWidth>=768?2:3)}function A(a,b){b=b||document.body;var c=0,d=0;if(a.offsetParent)do c+=a.offsetLeft,d+=a.offsetTop,a=a.offsetParent;while(a&&a!=b);return{left:c,top:d}}function B(){var a=e(document.querySelector(x.scrollContainer)),b=a[0],c="body"===x.scrollContainer?s:a;return{height:c[0].innerHeight||c[0].offsetHeight,scrollHeight:b.scrollHeight,startFrom:A(r,b).top,$elm:c}}function C(a,b,c){z.pageInfo=[{from:0}];var d,e,f,g=x.pageSize,h=z.scrollContInfo.height,i=h*g,j=Math.ceil(b/i),k=0;for(k=0;k<j;k++)for(var l=0,m=a.length;l<m;l++)if(d=a[l],e=k?i*k:0,f=i*(k+1),d.bottom<e||d.top>f){if(d.top>f)break}else z.pageInfo[k]||(z.pageInfo[k]={from:l}),z.pageInfo[k].to=l;z.pageInfo=z.pageInfo.map(function(a,b){var c=Math.max(b-1,0),d=Math.min(b+1,z.pageInfo.length-1);return{from:z.pageInfo[c].from,to:z.pageInfo[d].to}})}function D(a){var b,c,d,e;for(d=0,e=u.length;d<e;d++)c=h(u[d]),b=c.data(),b.$scope&&(c.data("_agOldWatchers",b.$scope.$$watchers),b.$scope.$$watchers=[]);for(d=0,e=a.length;d<e;d++)b=h(a[d]).data(),b.$scope&&(b.$scope.$$watchers=b._agOldWatchers||[],b.$scope.$digest())}function E(a){z.lastScrollPosition=a;var b;if(!z.isBusy){var c=0,d=x.pageSize;if(a>z.scrollContInfo.startFrom+z.scrollContInfo.height*d&&(c=Math.floor((a-z.scrollContInfo.startFrom)/(z.scrollContInfo.height*d))),c!=z.lastPage){z.lastPage=c;var e=z.pageInfo[c];e&&(p.children().detach(),b=Array.prototype.slice.call(u,e.from,e.to+1),D(b),p.append(b))}}}function F(){clearTimeout(z.infiniteScrollTimeout),z.isLoading=!1}function G(a){if(!z.isLoading&&o.model.length){var b=z.scrollContInfo.scrollHeight,c=z.scrollContInfo.height;a>=b-c*(1+x.infiniteScrollDistance/100)&&(z.isLoading=!0,o.infiniteScroll(),z.infiniteScrollTimeout=setTimeout(F,x.infiniteScrollDelay))}}function H(){var a=this.scrollTop||this.scrollY;x.performantScroll&&E(a),o.infiniteScroll&&G(a)}function I(){var b,a=r.offsetWidth;if(x.cssGrid){b=e(u[0]).clone(),b.css(g).addClass("ag-no-transition ag-clone"),p.append(b);var c=b[0].offsetWidth;return b.remove(),{no:c?Math.floor((a+12)/c):0,width:c}}var d="auto"==x.gridNo?x.gridWidth:Math.floor(a/x.gridNo)-x.gutterSize,f="auto"==x.gridNo?Math.floor((a+x.gutterSize)/(d+x.gutterSize)):x.gridNo,h=(a+x.gutterSize)%(d+x.gutterSize);return d+=Math.floor(h/f),{no:f,width:d}}function J(b,c){var d=c.beforeLoad||a.noop,e=c.onLoad||a.noop,f=c.isLoaded||a.noop,g=c.onFullLoad||a.noop,h=c.ignoreCheck||a.noop,k=b.find("img"),l=[];j(k).forEach(function(a){a.src&&(d(a),i(a)||h(a)?f(a):l.push(m(function(b,c){a.onload=function(){e(a),b()},a.onerror=c})))}),l.length?m.all(l).then(g,g):setTimeout(function(){g()},0)}function K(){if(u&&u.length){v++;var f,b=I(),c=b.width,d=b.no;if(d){var i=[];for(f=0;f<d;f++)i.push(0);j(u).forEach(function(a){var b=h(a);j(b.find("img")).forEach(function(a){var d=e(a);if(d.hasClass("img-loaded"))return void d.css("height","");b.addClass("ag-no-transition"),b.css("width",c+"px");var f=d.attr("actual-width")||d.attr("data-actual-width"),g=d.attr("actual-height")||d.attr("data-actual-height");f&&g&&d.css("height",g*a.width/f+"px")}),b.removeClass("ag-no-transition")});var k=u.clone();k.addClass("ag-no-transition ag-clone");var l=a.extend({},g);l.width=c+"px",k.css(l),p.append(k),function(a){J(k,{ignoreCheck:function(a){return!h(a).hasClass("img-loaded")},onFullLoad:function(){if(a<v)return void k.remove();var f,g,j,b=[],e=[];for(g=0,j=k.length;g<j;g++)b.push(k[g].offsetHeight);for(g=0,j=u.length;g<j;g++){f=h(u[g]);var l=b[g],m=Math.min.apply(Math,i),n=i.indexOf(m);i[n]=m+l+x.gutterSize;var q=n*(c+x.gutterSize),r={position:"absolute",top:m+"px"};"rtol"==x.direction?r.right=q+"px":r.left=q+"px",r.width=c+"px",e.push({top:m,bottom:m+l}),f.css(r).addClass("angular-grid-item")}var s=Math.max.apply(Math,i);p.css("height",s+"px"),k.remove(),(x.performantScroll||o.infiniteScroll)&&(z.scrollContInfo=B()),x.performantScroll&&(z.lastPage=null,C(e,s,d),z.isBusy=!1,E(z.lastScrollPosition||0)),F()}})}(v)}}}function L(){var a=!1;j(u).forEach(function(b){var c=e(b),d=c.find("img");d.length&&(c.addClass("img-loading"),J(c,{beforeLoad:function(a){h(a).addClass("img-loading")},isLoaded:function(a){h(a).removeClass("img-loading").addClass("img-loaded")},onLoad:function(b){!a&&x.refreshOnImgLoad&&(a=!0,k(function(){K(),a=!1},100)),h(b).removeClass("img-loading").addClass("img-loaded")},onFullLoad:function(){c.removeClass("img-loading").addClass("img-loaded")}}))})}function M(){return e(j(p.children()).filter(function(a){return!h(a).hasClass("ag-clone")}))}function N(){var a=j(u).filter(function(a){return h(a).hasClass("ng-leave")});return m(function(b){a.length?h(a[0]).one("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd",function(){k(function(){u=M(),b()})}):b()})}function O(){z.isBusy=!0,k(function(){u=M(),N().then(function(){L(),k(function(){K()})})})}function P(){y(),u&&K()}function R(){z.isBusy=!0;var a=r.offsetWidth;Q!=a&&(Q=a,w&&k.cancel(w),w=k(function(){x.performantScroll&&(p.children().detach(),p.append(u)),K()},100))}var u,w,r=p[0],s=e(l),t=o.agId||o.dep_agId,v=0;p.addClass("angular-grid");var x;["gridWidth","gutterSize","refreshOnImgLoad","direction","options","cssGrid","gridNo","agId"].forEach(function(a){var b=f(a),d="ag-"+f(a);"options"==a&&(b="angular-grid-options"),"agId"==a&&(b="angular-grid-id",d="ag-id"),o["dep_"+a]!==c&&console&&console.warn&&console.warn(b+" is deprecated. Use "+d+" instead in template.")}),y();var z={};setTimeout(function(){z.scrollContInfo=B(),z.scrollContInfo.$elm.on("scroll",H)},0),o.$watch("model",O,!0),o.$watch("options",P,!0),Object.keys(d).forEach(function(a){o[a]!==c&&o.$watch(a,P)});var Q=r.offsetWidth;s.on("resize",R),t&&(n[t]={refresh:function(){O()},handleScroll:function(a){x.performantScroll&&E(a),o.infiniteScroll&&G(a)}}),o.$on("$destroy",function(){t&&delete n[t],s.off("resize",R),clearTimeout(z.infiniteScrollTimeout),z.scrollContInfo&&z.scrollContInfo.$elm.off("scroll",H)})}}}]).factory("angularGridInstance",function(){var a={};return a}).name});




// /*
//     angularGrid.js v 0.6.4
//     Author: Sudhanshu Yadav
//     Copyright (c) 2015-2016 Sudhanshu Yadav - ignitersworld.com , released under the MIT license.
//     Demo on: http://ignitersworld.com/lab/angulargrid/
//     Documentation and download on https://github.com/s-yadav/angulargrid
// */

// /* module to create pinterest like responsive masonry grid system for angular */

// ;
// (function (root, factory) {
//   if (typeof module !== 'undefined' && module.exports) {
//     // CommonJS
//     module.exports = factory(require('angular'), root);
//   } else if (typeof define === 'function' && define.amd) {
//     // AMD
//     define(['angular'], function (angular) {
//       return factory(angular, root);
//     });
//   } else {
//     // Global Variables
//     factory(root.angular, root);
//   }
// }(this, function (angular, window, undefined) {
//   "use strict";

//   //defaults for plugin
//   var defaults = {
//     gridWidth: 300, //minumum width of a grid, this may increase to take whole space of container
//     gutterSize: 10, //spacing between two grid,
//     gridNo: 'auto', // grid number, by default calculate auto matically
//     direction: 'ltor', //direction of grid item
//     refreshOnImgLoad: true, // to make a refresh on image load inside container
//     cssGrid: false,
//     performantScroll: false,
//     pageSize: 'auto', //decide based on screen size
//     scrollContainer: 'body',
//     infiniteScrollDelay: 3000,
//     infiniteScrollDistance: 100,
//   };

//   var $ = angular.element;
//   var camelCaseToHyphenCase = function (str) {
//     return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
//   };

//   //css for the clones
//   var cloneCss = {
//     visibility: 'hidden',
//     opacity: 0,
//     top: 0,
//     left: 0,
//     width: ''
//   };

//   var single = (function () {
//     var $elm = $(window);
//     return function (elm) {
//       $elm[0] = elm;
//       return $elm;
//     };
//   }());

//   //function to check if image is loaded
//   function imageLoaded(img) {
//     return img.complete && (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0);
//   }

//   //function to covert domlist to array
//   function domToAry(list) {
//     return Array.prototype.slice.call(list);
//   }

//   //add required css
//   $(document.head).append('<style>' +
//     '.ag-no-transition{' +
//     '-webkit-transition: none !important;' +
//     'transition: none !important;' +
//     '} ' +
//     '.angular-grid{position : relative;} ' +
//     '.angular-grid > *{opacity : 0} ' +
//     '.angular-grid > .angular-grid-item{opacity : 1}' + '</style>');

//   return angular.module('angularGrid', [])
//     .directive('angularGrid', ['$timeout', '$window', '$q', 'angularGridInstance',
//       function ($timeout, $window, $q, angularGridInstance) {
//         return {
//           restrict: 'A',
//           scope: {
//             model: '=angularGrid',
//             /** deprecated options ***/
//             dep_gridWidth: '=gridWidth',
//             dep_gutterSize: '=gutterSize',
//             dep_refreshOnImgLoad: '=refreshOnImgLoad',
//             dep_direction: '=direction',
//             dep_cssGrid: '=cssGrid',
//             dep_options: '=angularGridOptions',
//             dep_gridNo: '=gridNo',
//             dep_agId: '@angularGridId',
//             /** deprecated options end***/

//             gridNo: '=agGridNo',
//             gridWidth: '=agGridWidth',
//             gutterSize: '=agGutterSize',
//             refreshOnImgLoad: '=agRefreshOnImgLoad',
//             direction: '=agDirection',
//             cssGrid: '=agCssGrid',
//             options: '=agOptions',
//             agId: '@',
//             pageSize: '=agPageSize',
//             performantScroll: '=agPerformantScroll',
//             scrollContainer: '@agScrollContainer',
//             infiniteScroll: '&agInfiniteScroll',
//             infiniteScrollDistance: '=agInfiniteScrollDistance',
//             infiniteScrollDelay: '=agInfiniteScrollDelay'
//           },
//           link: function (scope, element, attrs) {
//             var domElm = element[0],
//               win = $($window),
//               agId = scope.agId || scope.dep_agId, // angularGridId is deprecated
//               listElms,
//               reflowCount = 0, //to keep tack of times reflowgrid been called
//               timeoutPromise,
//               content_container = document.getElementById("content_container");//---my addition---
//             element.addClass('angular-grid');



//             //get the user input options
//             var options;

//             //check deprecated options
//             ['gridWidth', 'gutterSize', 'refreshOnImgLoad', 'direction', 'options', 'cssGrid', 'gridNo', 'agId'].forEach(function (key) {
//               var depKey = camelCaseToHyphenCase(key);
//               var correctKey = 'ag-' + camelCaseToHyphenCase(key);
//               if (key == 'options') depKey = "angular-grid-options";
//               if (key == 'agId') {
//                 depKey = "angular-grid-id";
//                 correctKey = "ag-id";
//               }
//               if (scope['dep_' + key] !== undefined) {
//                 if (console && console.warn) console.warn(depKey + ' is deprecated. Use ' + correctKey + ' instead in template.');
//               }
//             });

//             function getOptions() {
//               options = {};
//               Object.keys(defaults).forEach(function (key) {
//                 if (scope[key] !== undefined) {
//                   options[key] = scope[key];
//                 } else if (scope['dep_' + key] !== undefined) {
//                   options[key] = scope['dep_' + key];
//                 }
//               });
//               options = angular.extend({}, defaults, options, scope.options || scope.dep_options);
//               if (options.cssGrid) options.gutterSize = 0;
//               if (options.pageSize == 'auto') {
//                 options.pageSize = window.offsetWidth >= 768 ? 2 : 3;
//               }
//             }

//             getOptions();


//             /********
//             code to allow performant scroll
//             *****/
//             var scrollNs = {}; //namespace for performantScroll
//             scrollNs.scrollContInfo = getScrollContainerInfo();

//             function findPos(obj, withRespectTo) {
//               withRespectTo = withRespectTo || document.body;
//               var curleft = 0,
//                 curtop = 0;
//               if (obj.offsetParent) {
//                 do {
//                   curleft += obj.offsetLeft;
//                   curtop += obj.offsetTop;
//                   obj = obj.offsetParent;
//                 } while (obj && obj != withRespectTo);
//               }
//               return {
//                 left: curleft,
//                 top: curtop
//               };
//             }

//             function getScrollContainerInfo() {
//               var container = $(document.querySelector(options.scrollContainer)),
//                 contElm = container[0];

//               var $elm = options.scrollContainer === 'body' ? win : container;

//               return {
//                 height: $elm[0].innerHeight || $elm[0].offsetHeight,
//                 scrollHeight: contElm.scrollHeight,
//                 startFrom: findPos(domElm, contElm).top,
//                 $elm: $elm
//               };
//             }


//             //this method check what all elements should be present on dom at specific page
//             function calculatePageInfo(listElmPosInfo, scrollBodyHeight, colNo) {

//               scrollNs.pageInfo = [{
//                 from: 0
//               }];

//               var elmInfo, from, to,
//                 pageSize = options.pageSize,
//                 scrollContHeight = scrollNs.scrollContInfo.height,
//                 pageHeight = scrollContHeight * pageSize,
//                 totalPages = Math.ceil(scrollBodyHeight / pageHeight),
//                 pageNo = 0;


//               for (pageNo = 0; pageNo < totalPages; pageNo++) {
//                 for (var idx = 0, ln = listElmPosInfo.length; idx < ln; idx++) {
//                   elmInfo = listElmPosInfo[idx];
//                   from = pageNo ? pageHeight * pageNo : 0;
//                   to = pageHeight * (pageNo + 1);

//                   if (elmInfo.bottom < from || elmInfo.top > to) {
//                     if (elmInfo.top > to) break;
//                   } else {
//                     if (!scrollNs.pageInfo[pageNo]) scrollNs.pageInfo[pageNo] = {
//                       from: idx
//                     };
//                     scrollNs.pageInfo[pageNo].to = idx;
//                   }
//                 }
//               }

//               scrollNs.pageInfo = scrollNs.pageInfo.map(function (page, idx) {
//                 var fromPage = Math.max(idx - 1, 0),
//                   toPage = Math.min(idx + 1, scrollNs.pageInfo.length - 1);
//                 return {
//                   from: scrollNs.pageInfo[fromPage].from,
//                   to: scrollNs.pageInfo[toPage].to
//                 };
//               });
//             }

//             //unbind/bind watchers
//             function bindWatchersOnVisible(visibleELm) {
//               var itemData, $item, i, ln;
//               //unbind watchers from all element
//               for (i = 0, ln = listElms.length; i < ln; i++) {
//                 $item = single(listElms[i]);
//                 itemData = $item.data();
//                 if (itemData.$scope) {
//                   $item.data('_agOldWatchers', itemData.$scope.$$watchers);
//                   itemData.$scope.$$watchers = [];
//                 }
//               }

//               //bind watchers on all visible element
//               for (i = 0, ln = visibleELm.length; i < ln; i++) {
//                 itemData = single(visibleELm[i]).data();
//                 if (itemData.$scope) {
//                   itemData.$scope.$$watchers = itemData._agOldWatchers || [];
//                   //trigger digest on each child scope
//                   itemData.$scope.$digest();
//                 }
//               }
//             }

//             function refreshDomElm(scrollTop) {
//               scrollNs.lastScrollPosition = scrollTop;
//               var filteredElm;
//               if (scrollNs.isBusy) return;
//               var currentPage = 0,
//                 pageSize = options.pageSize;

//               if (scrollTop > scrollNs.scrollContInfo.startFrom + scrollNs.scrollContInfo.height * pageSize) {
//                 currentPage = Math.floor((scrollTop - scrollNs.scrollContInfo.startFrom) / (scrollNs.scrollContInfo.height * pageSize));
//               }
//               if (currentPage == scrollNs.lastPage) return;
//               scrollNs.lastPage = currentPage;
//               var curPageInfo = scrollNs.pageInfo[currentPage];

//               if (curPageInfo) {
//                 element.children().detach();
//                 filteredElm = Array.prototype.slice.call(listElms, curPageInfo.from, curPageInfo.to + 1);
//                 bindWatchersOnVisible(filteredElm);
//                 element.append(filteredElm);
//               }
//             }


//             /********
//             code to allow performant scroll end
//             *****/

//             /***** code for infiniteScroll start ******/
//             function reEnableInfiniteScroll() {
//               clearTimeout(scrollNs.infiniteScrollTimeout);
//               scrollNs.isLoading = false;
//             }

//             function infiniteScroll(scrollTop) {
//               if (scrollNs.isLoading || !scope.model.length) return;
//               var scrollHeight = scrollNs.scrollContInfo.scrollHeight,
//                 contHeight = scrollNs.scrollContInfo.height;

//               if (scrollTop >= (scrollHeight - contHeight * (1 + options.infiniteScrollDistance / 100))) {
//                 scrollNs.isLoading = true;
//                 scope.infiniteScroll();
//                 scrollNs.infiniteScrollTimeout = setTimeout(reEnableInfiniteScroll, options.infiniteScrollDelay);
//               }
//             }
//             /***** code for infiniteScroll end ******/

//             //scroll event on scroll container element to refresh dom depending on scroll positions
//             function scrollHandler() {
//               var scrollTop = this.scrollTop || this.scrollY;
//               if (options.performantScroll) refreshDomElm(scrollTop);
//               if (scope.infiniteScroll) infiniteScroll(scrollTop);
//             }

//             setTimeout(function () {
//               scrollNs.scrollContInfo.$elm.on('scroll', scrollHandler);
//             }, 0);

//             //function to get column width and number of columns
//             function getColWidth() {

//               var contWidth = domElm.offsetWidth,
//                 clone; // a clone to calculate width without transition

//               if (options.cssGrid) {
//                 clone = $(listElms[0]).clone();
//                 clone.css(cloneCss).addClass('ag-no-transition ag-clone');

//                 element.append(clone);

//                 var width = clone[0].offsetWidth;
//                 clone.remove();

//                 return {
//                   no: width ? Math.floor((contWidth + 12) / width) : 0,
//                   width: width
//                 };
//               }

//               var colWidth = options.gridNo == 'auto' ? options.gridWidth : Math.floor(contWidth / options.gridNo) - options.gutterSize,
//                 cols = options.gridNo == 'auto' ? Math.floor((contWidth + options.gutterSize) / (colWidth + options.gutterSize)) : options.gridNo,
//                 remainingSpace = ((contWidth + options.gutterSize) % (colWidth + options.gutterSize));

//               colWidth = colWidth + Math.floor(remainingSpace / cols);

//               return {
//                 no: cols,
//                 width: colWidth
//               };
//             }

//             //method check for image loaded inside a container and trigger callback
//             function afterImageLoad(container, options) {
//               var beforeLoad = options.beforeLoad || angular.noop,
//                 onLoad = options.onLoad || angular.noop,
//                 isLoaded = options.isLoaded || angular.noop,
//                 onFullLoad = options.onFullLoad || angular.noop,
//                 ignoreCheck = options.ignoreCheck || angular.noop,
//                 allImg = container.find('img'),
//                 loadedImgPromises = [];

//               domToAry(allImg).forEach(function (img) {
//                 if (!img.src) return;
//                 beforeLoad(img);
//                 if (!imageLoaded(img) && !ignoreCheck(img)) {
//                   loadedImgPromises.push($q(function (resolve, reject) {
//                     img.onload = function () {
//                       onLoad(img);
//                       resolve();
//                     };
//                     img.onerror = reject;
//                   }));
//                 } else {
//                   isLoaded(img);
//                 }
//               });

//               if (loadedImgPromises.length) {
//                 $q.all(loadedImgPromises).then(onFullLoad, onFullLoad);
//               } else {
//                 setTimeout(function () {
//                   onFullLoad();
//                 }, 0);
//               }
//             }


//             //function to reflow grids
//             function reflowGrids() {
//               //return if there are no elements
//               if (!(listElms && listElms.length)) return;

//               reflowCount++;

//               //claclulate width of all element
//               var colInfo = getColWidth(),
//                 colWidth = colInfo.width,
//                 cols = colInfo.no,
//                 i;

//               if (!cols) return;

//               //initialize listRowBottom
//               var lastRowBottom = [];
//               for (i = 0; i < cols; i++) {
//                 lastRowBottom.push(0);
//               }

//               //if image actual width and actual height is defined update image size so that it dosent cause reflow on image load
//               domToAry(listElms).forEach(function (item) {
//                 var $item = single(item);

//                 domToAry($item.find('img')).forEach(function (img) {
//                   var $img = $(img);
//                   //if image is already loaded don't do anything
//                   if ($img.hasClass('img-loaded')) {
//                     $img.css('height', '');
//                     return;
//                   }

//                   //set the item width and no transition state so image width can be calculated properly
//                   $item.addClass('ag-no-transition');
//                   $item.css('width', colWidth + 'px');

//                   var actualWidth = $img.attr('actual-width') || $img.attr('data-actual-width'),
//                     actualHeight = $img.attr('actual-height') || $img.attr('data-actual-height');

//                   if (actualWidth && actualHeight) {
//                     $img.css('height', (actualHeight * img.width / actualWidth) + 'px');
//                   }

//                 });
//                 $item.removeClass('ag-no-transition');
//               });

//               //get all list items new height
//               var clones = listElms.clone();

//               clones.addClass('ag-no-transition ag-clone');

//               var clonesCssObj = angular.extend({}, cloneCss);
//               clonesCssObj.width = colWidth + 'px';
//               clones.css(clonesCssObj);
//               element.append(clones);

//               //For cloned element again we have to check if image loaded (IOS only)

//               (function (reflowIndx) {
//                 afterImageLoad(clones, {
//                   ignoreCheck: function (img) {
//                     return !single(img).hasClass('img-loaded');
//                   },
//                   onFullLoad: function () {
//                     //if its older reflow don't do any thing
//                     if (reflowIndx < reflowCount) {
//                       clones.remove();
//                       return;
//                     }

//                     var listElmHeights = [],
//                       listElmPosInfo = [],
//                       item, i, ln;



//                     //find height with clones
//                     for (i = 0, ln = clones.length; i < ln; i++) {
//                       listElmHeights.push(clones[i].offsetHeight);
//                     }

//                     //set new positions
//                     for (i = 0, ln = listElms.length; i < ln; i++) {
//                       item = single(listElms[i]);
//                       var height = listElmHeights[i],
//                         top = Math.min.apply(Math, lastRowBottom),
//                         col = lastRowBottom.indexOf(top);

//                       //update lastRowBottom value
//                       lastRowBottom[col] = top + height + options.gutterSize;

//                       //set top and left of list items
//                       var posX = col * (colWidth + options.gutterSize);

//                       var cssObj = {
//                         position: 'absolute',
//                         top: top + 'px'
//                       };

//                       if (options.direction == 'rtol') {
//                         cssObj.right = posX + 'px';
//                       } else {
//                         cssObj.left = posX + 'px';
//                       }

//                       cssObj.width = colWidth + 'px';

//                       //add position info of each grids
//                       listElmPosInfo.push({
//                         top: top,
//                         bottom: top + height
//                       });

//                       item.css(cssObj).addClass('angular-grid-item');
//                     }

//                     //set the height of container
//                     var contHeight = Math.max.apply(Math, lastRowBottom);
//                     element.css('height', contHeight + 'px');

//                     clones.remove();

//                     //update the scroll container info
//                     // if (options.performantScroll || scope.infiniteScroll) { MEEEEEEEEEEEEEEEEEEEEEEEEEEE
//                     //   scrollNs.scrollContInfo = getScrollContainerInfo();
//                     // }

//                     //if performantScroll is enabled calculate the page info, and reflect dom elements to reflect visible pages
//                     if (options.performantScroll) {
//                       scrollNs.lastPage = null;
//                       calculatePageInfo(listElmPosInfo, contHeight, cols);
//                       scrollNs.isBusy = false;
//                       refreshDomElm(scrollNs.lastScrollPosition || 0);
//                     }

//                     //re enable infiniteScroll
//                     reEnableInfiniteScroll();
//                   }
//                 });
//               }(reflowCount));

//             }


//             //function to handle asynchronous image loading
//             function handleImage() {
//               var reflowPending = false;
//               domToAry(listElms).forEach(function (listItem) {
//                 var $listItem = $(listItem),
//                   allImg = $listItem.find('img');

//                 if (!allImg.length) {
//                   return;
//                 }

//                 //add image loading class on list item
//                 $listItem.addClass('img-loading');

//                 afterImageLoad($listItem, {
//                   beforeLoad: function (img) {
//                     single(img).addClass('img-loading');
//                   },
//                   isLoaded: function (img) {
//                     single(img).removeClass('img-loading').addClass('img-loaded');
//                   },
//                   onLoad: function (img) {
//                     if (!reflowPending && options.refreshOnImgLoad) {
//                       reflowPending = true;
//                       $timeout(function () {
//                         reflowGrids();
//                         reflowPending = false;
//                       }, 100);
//                     }
//                     single(img).removeClass('img-loading').addClass('img-loaded');
//                   },
//                   onFullLoad: function () {
//                     $listItem.removeClass('img-loading').addClass('img-loaded');
//                   }
//                 });
//               });

//             }

//             //function to get list elements excluding clones
//             function getListElms() {
//               return $(domToAry(element.children()).filter(function (elm) {
//                 return !single(elm).hasClass('ag-clone');
//               }));
//             }

//             //function to check for ng animation
//             function ngCheckAnim() {
//               var leavingElm = domToAry(listElms).filter(function (elm) {
//                 return single(elm).hasClass('ng-leave');
//               });
//               return $q(function (resolve) {
//                 if (!leavingElm.length) {
//                   resolve();
//                 } else {
//                   single(leavingElm[0]).one('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd', function () {
//                     $timeout(function () {
//                       listElms = getListElms();
//                       resolve();
//                     });
//                   });
//                 }
//               });
//             }

//             //watch on modal key

//             function watch() {
//               scrollNs.isBusy = true;
//               $timeout(function () {
//                 listElms = getListElms();
//                 ngCheckAnim().then(function () {
//                   //handle images
//                   //handleImage();
//                   $timeout(function () {
//                     //to handle scroll appearance
//                     reflowGrids();
//                   });
//                 });
//               });
//             }

//             scope.$watch('model', watch, true);


//             //watch option for changes
//             function watchOptions() {
//               getOptions();
//               if (listElms) reflowGrids();
//             }

//             scope.$watch('options', watchOptions, true);

//             Object.keys(defaults).forEach(function (key) {
//               if (scope[key] !== undefined) scope.$watch(key, watchOptions);
//             });

//             //listen window resize event and reflow grids after a timeout
//             var lastDomWidth = domElm.offsetWidth;

//             function windowResizeCallback() {
//               scrollNs.isBusy = true;
//               var contWidth = domElm.offsetWidth;
//               if (lastDomWidth == contWidth) return;
//               lastDomWidth = contWidth;


//               if (timeoutPromise) {
//                 $timeout.cancel(timeoutPromise);
//               }

//               timeoutPromise = $timeout(function () {
//                 //caclulate container info
//                 if (options.performantScroll) {
//                   element.children().detach();
//                   element.append(listElms);
//                 }

//                 reflowGrids();
//               }, 100);
//             }
//             try {
//               win.on('resize', windowResizeCallback);
//               addResizeListener(content_container, windowResizeCallback);
//             } catch (e) {
//               console.log(e)
//               win.on('resize', windowResizeCallback);
//             }

//             //add instance to factory if id is assigned
//             if (agId) {
//               angularGridInstance[agId] = {
//                 refresh: function () {
//                   watch();
//                 },
//                 handleScroll: function (scrollTop) {
//                   if (options.performantScroll) refreshDomElm(scrollTop);
//                   if (scope.infiniteScroll) infiniteScroll(scrollTop);
//                 }
//               };
//             }

//             //destroy on refrences and events on scope destroy
//             scope.$on('$destroy', function () {
//               if (agId) delete angularGridInstance[agId];
//               try {
//                 win.off('resize', windowResizeCallback);
//                 removeResizeListener(content_container, windowResizeCallback);
//               } catch (e) {
//                 console.log(e)
//               }
//               clearTimeout(scrollNs.infiniteScrollTimeout);
//               if (scrollNs.scrollContInfo) scrollNs.scrollContInfo.$elm.off('scroll', scrollHandler);
//             });
//           }
//         };
//       }
//     ])
//     //a factory to store angulargrid instances which can be injected to controllers or directive
//     .factory('angularGridInstance', function () {

//       var angularGridInstance = {};

//       return angularGridInstance;

//     })
//     .name;

// }));
