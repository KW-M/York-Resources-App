/*
    angularGrid.js v 0.6.0
    Author: Sudhanshu Yadav
    Copyright (c) 2015-2016 Sudhanshu Yadav - ignitersworld.com , released under the MIT license.
    Demo on: http://ignitersworld.com/lab/angulargrid/
    Documentation and download on https://github.com/s-yadav/angulargrid
*/

/* module to create pinterest like responsive masonry grid system for angular */

!function(o,n){"undefined"!=typeof module&&module.exports?module.exports=n(require("angular"),o):"function"==typeof define&&define.amd?define(["angular"],function(t){return global.PatternLock=n(t,o)}):n(o.angular,o)}(this,function(o,n,t){"use strict";function i(o){return o.complete&&("undefined"==typeof o.naturalWidth||0!==o.naturalWidth)}function e(o){return Array.prototype.slice.call(o)}var r={gridWidth:300,gutterSize:10,gridNo:"auto",direction:"ltor",refreshOnImgLoad:!0,cssGrid:!1,performantScroll:!1,pageSize:"auto",scrollContainer:"body",infiniteScrollDelay:3e3,infiniteScrollDistance:100},a=o.element,l=function(o){return o.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()},s={visibility:"hidden",opacity:0,top:0,left:0,width:""},d=function(){var o=a(n);return function(n){return o[0]=n,o}}();return a(document.head).append("<style>.ag-no-transition{-webkit-transition: none !important;transition: none !important;} .angular-grid{position : relative;} .angular-grid > *{opacity : 0} .angular-grid > .angular-grid-item{opacity : 1}</style>"),o.module("angularGrid",[]).directive("angularGrid",["$timeout","$window","$q","angularGridInstance",function(c,f,g,u){return{restrict:"A",scope:{model:"=angularGrid",dep_gridWidth:"=gridWidth",dep_gutterSize:"=gutterSize",dep_refreshOnImgLoad:"=refreshOnImgLoad",dep_direction:"=direction",dep_cssGrid:"=cssGrid",dep_options:"=angularGridOptions",dep_gridNo:"=gridNo",dep_agId:"@angularGridId",gridNo:"=agGridNo",gridWidth:"=agGridWidth",gutterSize:"=agGutterSize",refreshOnImgLoad:"=agRefreshOnImgLoad",direction:"=agDirection",cssGrid:"=agCssGrid",options:"=agOptions",agId:"@",pageSize:"=agPageSize",performantScroll:"=agPerformantScroll",scrollContainer:"=agScrollContainer",infiniteScroll:"&agInfiniteScroll",infiniteScrollDistance:"=agInfiniteScrollDistance",infiniteScrollDelay:"=agInfiniteScrollDelay"},link:function(h,p,m){function S(){A={},Object.keys(r).forEach(function(o){h[o]!==t?A[o]=h[o]:h["dep_"+o]!==t&&(A[o]=h["dep_"+o])}),A=o.extend({},r,A,h.options||h.dep_options),A.cssGrid&&(A.gutterSize=0),"auto"==A.pageSize&&(A.pageSize=n.offsetWidth>=768?2:3)}function v(o,n){n=n||document.body;var t=0,i=0;if(o.offsetParent)do t+=o.offsetLeft,i+=o.offsetTop,o=o.offsetParent;while(o&&o!=n);return{left:t,top:i}}function I(){var o=a(document.querySelector(A.scrollContainer)),n=o[0];return{height:n.offsetHeight,scrollHeight:n.scrollHeight,startFrom:v(k,n).top,$elm:"body"==A.scrollContainer?D:o}}function C(o,n,t){B.pageInfo=[{from:0}];var i,e,r,a=A.pageSize,l=B.scrollContInfo.height,s=l*a,d=Math.ceil(n/s),c=0;for(c=0;d>c;c++)for(var f=0,g=o.length;g>f;f++)if(i=o[f],e=c?s*c:0,r=s*(c+1),i.bottom<e||i.top>r){if(i.top>r)break}else B.pageInfo[c]||(B.pageInfo[c]={from:f}),B.pageInfo[c].to=f;B.pageInfo=B.pageInfo.map(function(o,n){var t=Math.max(n-1,0),i=Math.min(n+1,B.pageInfo.length-1);return{from:B.pageInfo[t].from,to:B.pageInfo[i].to}})}function y(o){var n,t,i,e;for(i=0,e=N.length;e>i;i++)t=d(N[i]),n=t.data(),n.$scope&&(t.data("_agOldWatchers",n.$scope.$$watchers),n.$scope.$$watchers=[]);for(i=0,e=o.length;e>i;i++)n=d(o[i]).data(),n.$scope&&(n.$scope.$$watchers=n._agOldWatchers||[],n.$scope.$digest())}function $(o){B.lastScrollPosition=o;var n;if(!B.isBusy){var t=0,i=A.pageSize;if(o>B.scrollContInfo.startFrom+B.scrollContInfo.height*i&&(t=Math.floor((o-B.scrollContInfo.startFrom)/(B.scrollContInfo.height*i))),t!=B.lastPage){B.lastPage=t;var e=B.pageInfo[t];e&&(p.children().detach(),n=Array.prototype.slice.call(N,e.from,e.to+1),y(n),p.append(n))}}}function w(){clearTimeout(B.infiniteScrollTimeout),B.isLoading=!1}function z(o){if(!B.isLoading&&h.model.length){var n=B.scrollContInfo.scrollHeight,t=B.scrollContInfo.height;o>=n-t*(1+A.infiniteScrollDistance/100)&&(B.isLoading=!0,h.infiniteScroll(),B.infiniteScrollTimeout=setTimeout(w,A.infiniteScrollDelay))}}function L(){var o=this.scrollTop||this.scrollY;A.performantScroll&&$(o),h.infiniteScroll&&z(o)}function G(){var o,n=k.offsetWidth;if(A.cssGrid){o=a(N[0]).clone(),o.css(s).addClass("ag-no-transition ag-clone"),p.append(o);var t=o[0].offsetWidth;return o.remove(),{no:Math.floor((n+12)/t),width:t}}var i="auto"==A.gridNo?A.gridWidth:Math.floor(n/A.gridNo)-A.gutterSize,e="auto"==A.gridNo?Math.floor((n+A.gutterSize)/(i+A.gutterSize)):A.gridNo,r=(n+A.gutterSize)%(i+A.gutterSize);return i+=Math.floor(r/e),{no:e,width:i}}function W(n,t){var r=t.beforeLoad||o.noop,a=t.onLoad||o.noop,l=t.isLoaded||o.noop,s=t.onFullLoad||o.noop,d=t.ignoreCheck||o.noop,c=n.find("img"),f=[];e(c).forEach(function(o){o.src&&(r(o),i(o)||d(o)?l(o):f.push(g(function(n,t){o.onload=function(){a(o),n()},o.onerror=t})))}),f.length?g.all(f).then(s,s):setTimeout(function(){s()},0)}function b(){H++;var n,t=G(),i=t.width,r=t.no,l=[];for(n=0;r>n;n++)l.push(0);e(N).forEach(function(o){var n=d(o);e(n.find("img")).forEach(function(o){var t=a(o);if(t.hasClass("img-loaded"))return void t.css("height","");n.addClass("ag-no-transition"),n.css("width",i+"px");var e=t.attr("actual-width")||t.attr("data-actual-width"),r=t.attr("actual-height")||t.attr("data-actual-height");e&&r&&t.css("height",r*o.width/e+"px")}),n.removeClass("ag-no-transition")});var c=N.clone();c.addClass("ag-no-transition ag-clone");var f=o.extend({},s);f.width=i+"px",c.css(f),p.append(c),function(o){W(c,{ignoreCheck:function(o){return!d(o).hasClass("img-loaded")},onFullLoad:function(){if(!(H>o)){var n,t,e,a=[],s=[];for(t=0,e=c.length;e>t;t++)a.push(c[t].offsetHeight);for(t=0,e=N.length;e>t;t++){n=d(N[t]);var f=a[t],g=Math.min.apply(Math,l),u=l.indexOf(g);l[u]=g+f+A.gutterSize;var m=u*(i+A.gutterSize),S={position:"absolute",top:g+"px"};"rtol"==A.direction?S.right=m+"px":S.left=m+"px",S.width=i+"px",s.push({top:g,bottom:g+f}),n.css(S).addClass("angular-grid-item")}var v=Math.max.apply(Math,l);p.css("height",v+"px"),c.remove(),(A.performantScroll||h.infiniteScroll)&&(B.scrollContInfo=I()),A.performantScroll&&(B.lastPage=null,C(s,v,r),B.isBusy=!1,$(B.lastScrollPosition||0)),w()}}})}(H)}function x(){var o=!1;e(N).forEach(function(n){var t=a(n),i=t.find("img");i.length&&(t.addClass("img-loading"),W(t,{beforeLoad:function(o){d(o).addClass("img-loading")},isLoaded:function(o){d(o).removeClass("img-loading").addClass("img-loaded")},onLoad:function(n){!o&&A.refreshOnImgLoad&&(o=!0,c(function(){b(),o=!1},100)),d(n).removeClass("img-loading").addClass("img-loaded")},onFullLoad:function(){t.removeClass("img-loading").addClass("img-loaded")}}))})}function _(){return a(e(p.children()).filter(function(o){return!d(o).hasClass("ag-clone")}))}function O(){var o=e(N).filter(function(o){return d(o).hasClass("ng-leave")});return g(function(n){o.length?d(o[0]).one("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd",function(){c(function(){N=_(),n()})}):n()})}function T(){B.isBusy=!0,c(function(){N=_(),O().then(function(){x(),c(function(){b()})})})}function M(){S(),N&&b()}function E(){B.isBusy=!0;var o=k.offsetWidth;q!=o&&(q=o,P&&c.cancel(P),P=c(function(){A.performantScroll&&(p.children().detach(),p.append(N)),b()},100))}var N,P,k=p[0],D=a(f),F=h.agId||h.dep_agId,H=0;p.addClass("angular-grid");var A;["gridWidth","gutterSize","refreshOnImgLoad","direction","options","cssGrid","gridNo","agId"].forEach(function(o){var n=l(o),i="ag-"+l(o);"options"==o&&(n="angular-grid-options"),"agId"==o&&(n="angular-grid-id",i="ag-id"),h["dep_"+o]!==t&&console&&console.warn&&console.warn(n+" is deprecated. Use "+i+" instead in template.")}),S();var B={};setTimeout(function(){B.scrollContInfo=I(),B.scrollContInfo.$elm.on("scroll",L)},0),h.$watch("model",T,!0),h.$watch("options",M,!0),Object.keys(r).forEach(function(o){h[o]!==t&&h.$watch(o,M)});var q=k.offsetWidth;D.on("resize",E),F&&(u[F]={refresh:function(){T()},handleScroll:function(o){A.performantScroll&&$(o),h.infiniteScroll&&z(o)}}),h.$on("$destroy",function(){F&&delete u[F],D.off("resize",E),clearTimeout(B.infiniteScrollTimeout),B.scrollContInfo&&B.scrollContInfo.$elm.off("scroll",L)})}}}]).factory("angularGridInstance",function(){var o={};return o}).name});