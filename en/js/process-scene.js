/* 신정개발 홈페이지 — 현장 진행 방식 페이지 "현장 배치와 작업 순서" 3D 애니메이션 (28차)
   외부 라이브러리 없이 WebGL로 그린다. 3D를 쓸 수 없으면 data-fallback 에 적힌 2D 파일(js/process-scene-2d.js)을 불러온다.
   필요한 마크업: #scn-stage > canvas#scn-gl + #scn-labels, 버튼 #scn-pp · #scn-rs, .scn-steps li, #scn-say */
(function(){
'use strict';
var stage=document.getElementById('scn-stage'); if(!stage) return;
var canvas=document.getElementById('scn-gl'), overlay=document.getElementById('scn-labels');
var dead=false, stopFn=null;
function fallback(){
  if(dead) return; dead=true; if(stopFn) stopFn();
  stage.classList.remove('is-drag'); stage.classList.add('no-gl');
  var src=stage.getAttribute('data-fallback'); if(!src){ stage.classList.add('no-fig'); return; }
  var sc=document.createElement('script'); sc.src=src; sc.onerror=function(){ stage.classList.add('no-fig'); }; document.body.appendChild(sc);
}
var gl=null;
try{ if(canvas&&overlay) gl=canvas.getContext('webgl',{antialias:true,alpha:true,stencil:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl',{antialias:true,alpha:true,stencil:true}); }catch(e){ gl=null; }
if(!gl){ fallback(); return; }
try{ init(); }catch(e){ fallback(); }
function init(){
var $=function(id){return document.getElementById(id)};
// ---------- 수학 ----------
function ident(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}
function mul(a,b){var o=new Float32Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3]}return o}
function T(x,y,z){var m=ident();m[12]=x;m[13]=y;m[14]=z;return m}
function S(x,y,z){var m=ident();m[0]=x;m[5]=y;m[10]=z;return m}
function RX(a){var c=Math.cos(a),s=Math.sin(a),m=ident();m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m}
function RY(a){var c=Math.cos(a),s=Math.sin(a),m=ident();m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m}
function RZ(a){var c=Math.cos(a),s=Math.sin(a),m=ident();m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m}
function M(){var m=arguments[0];for(var i=1;i<arguments.length;i++)m=mul(m,arguments[i]);return m}
function persp(fov,asp,n,f){var t=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=t/asp;m[5]=t;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function add(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function scl(a,s){return[a[0]*s,a[1]*s,a[2]*s]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function norm(a){var l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]}
function lookAt(e,c,u){var z=norm(sub(e,c)),x=norm(cross(u,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1])}
function basis(o,x,y,z){return new Float32Array([x[0],x[1],x[2],0,y[0],y[1],y[2],0,z[0],z[1],z[2],0,o[0],o[1],o[2],1])}
function hex(h,a){var n=parseInt(h.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,a==null?1:a]}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function ease(x){x=clamp(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function seg(t,a,b){return clamp((t-a)/(b-a),0,1)}
function kf(s,k,c){c=c||1;for(var i=0;i<k.length-1;i++){if(s<=k[i+1][0]){var u=ease(seg(s,k[i][0],k[i+1][0]));return k[i][c]+(k[i+1][c]-k[i][c])*u}}return k[k.length-1][c]}
function kf3(s,k){return[kf(s,k,1),kf(s,k,2),kf(s,k,3)]}
// ---------- 도형 ----------
function Mesh(dyn){this.buf=gl.createBuffer();this.n=0;this.dyn=dyn}
Mesh.prototype.set=function(arr){gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.bufferData(gl.ARRAY_BUFFER,arr instanceof Float32Array?arr:new Float32Array(arr),this.dyn?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);this.n=arr.length/6;return this};
function quad(v,a,b,c,d,n){ // a,b,c,d 반시계
  [a,b,c,a,c,d].forEach(function(p){v.push(p[0],p[1],p[2],n[0],n[1],n[2])})}
function tri(v,a,b,c,na,nb,nc){v.push(a[0],a[1],a[2],na[0],na[1],na[2],b[0],b[1],b[2],nb[0],nb[1],nb[2],c[0],c[1],c[2],nc[0],nc[1],nc[2])}
function box(w,h,d,v){v=v||[];var x=w/2,y=h/2,z=d/2;
  quad(v,[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z],[0,0,1]);quad(v,[x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z],[0,0,-1]);
  quad(v,[x,-y,z],[x,-y,-z],[x,y,-z],[x,y,z],[1,0,0]);quad(v,[-x,-y,-z],[-x,-y,z],[-x,y,z],[-x,y,-z],[-1,0,0]);
  quad(v,[-x,y,z],[x,y,z],[x,y,-z],[-x,y,-z],[0,1,0]);quad(v,[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z],[0,-1,0]);return v}
// 원기둥: 축 y, 아래 y=0 → 위 y=h. 각 a: x=r sin a, z=r cos a
function cyl(rb,rt,h,n,o){o=o||{};var v=[],t0=o.t0||0,tl=o.tl==null?Math.PI*2:o.tl,sl=(rb-rt)/h;
  for(var i=0;i<n;i++){var a0=t0+tl*i/n,a1=t0+tl*(i+1)/n,s0=Math.sin(a0),c0=Math.cos(a0),s1=Math.sin(a1),c1=Math.cos(a1);
    var n0=norm([s0,sl,c0]),n1=norm([s1,sl,c1]);
    var p0=[rb*s0,0,rb*c0],p1=[rb*s1,0,rb*c1],p2=[rt*s1,h,rt*c1],p3=[rt*s0,h,rt*c0];
    tri(v,p0,p1,p2,n0,n1,n1);tri(v,p0,p2,p3,n0,n1,n0);
    if(o.caps!==false){ if(rt>0) tri(v,[0,h,0],p3,p2,[0,1,0],[0,1,0],[0,1,0]); if(rb>0) tri(v,[0,0,0],p1,p0,[0,-1,0],[0,-1,0],[0,-1,0]); }}
  return v}
function sphere(r,nw,nh,sy){var v=[];sy=sy||1;function P(i,j){var th=Math.PI*j/nh,ph=2*Math.PI*i/nw,n=[Math.sin(th)*Math.sin(ph),Math.cos(th),Math.sin(th)*Math.cos(ph)];return[[n[0]*r,n[1]*r*sy,n[2]*r],n]}
  for(var i=0;i<nw;i++)for(var j=0;j<nh;j++){var a=P(i,j),b=P(i,j+1),c=P(i+1,j+1),d=P(i+1,j);tri(v,a[0],b[0],c[0],a[1],b[1],c[1]);tri(v,a[0],c[0],d[0],a[1],c[1],d[1])}return v}
function tube(pts,r,ns){var v=[],N=pts.length,fr=[],up=[0,1,0];
  for(var i=0;i<N;i++){var t=norm(sub(pts[Math.min(N-1,i+1)],pts[Math.max(0,i-1)]));var x=cross(up,t);if(Math.hypot(x[0],x[1],x[2])<1e-3)x=[1,0,0];x=norm(x);var y=cross(t,x);fr.push([x,y])}
  for(i=0;i<N-1;i++)for(var j=0;j<ns;j++){var a0=2*Math.PI*j/ns,a1=2*Math.PI*(j+1)/ns;
    var n00=add(scl(fr[i][0],Math.cos(a0)),scl(fr[i][1],Math.sin(a0))),n01=add(scl(fr[i][0],Math.cos(a1)),scl(fr[i][1],Math.sin(a1)));
    var n10=add(scl(fr[i+1][0],Math.cos(a0)),scl(fr[i+1][1],Math.sin(a0))),n11=add(scl(fr[i+1][0],Math.cos(a1)),scl(fr[i+1][1],Math.sin(a1)));
    var p00=add(pts[i],scl(n00,r)),p01=add(pts[i],scl(n01,r)),p10=add(pts[i+1],scl(n10,r)),p11=add(pts[i+1],scl(n11,r));
    tri(v,p00,p10,p11,n00,n10,n11);tri(v,p00,p11,p01,n00,n11,n01)}
  return v}
function catmull(P,n){var out=[];for(var i=0;i<P.length-1;i++){var p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];
  for(var k=0;k<n;k++){var t=k/n,t2=t*t,t3=t2*t,o=[];for(var c=0;c<3;c++)o[c]=0.5*((2*p1[c])+(-p0[c]+p2[c])*t+(2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t2+(-p0[c]+3*p1[c]-3*p2[c]+p3[c])*t3);out.push(o)}}
  out.push(P[P.length-1]);return out}
function xf(v,m){var o=new Float32Array(v.length);for(var i=0;i<v.length;i+=6){var x=v[i],y=v[i+1],z=v[i+2],a=v[i+3],b=v[i+4],c=v[i+5];
  o[i]=m[0]*x+m[4]*y+m[8]*z+m[12];o[i+1]=m[1]*x+m[5]*y+m[9]*z+m[13];o[i+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
  var nx=m[0]*a+m[4]*b+m[8]*c,ny=m[1]*a+m[5]*b+m[9]*c,nz=m[2]*a+m[6]*b+m[10]*c,l=Math.hypot(nx,ny,nz)||1;o[i+3]=nx/l;o[i+4]=ny/l;o[i+5]=nz/l}return o}
function cat(){var n=0,i;for(i=0;i<arguments.length;i++)n+=arguments[i].length;var o=new Float32Array(n),k=0;for(i=0;i<arguments.length;i++){o.set(arguments[i],k);k+=arguments[i].length}return o}
function bx(w,h,d,x,y,z){return xf(box(w,h,d),T(x,y,z))}
function cy(rb,rt,h,n,x,y,z,o){return xf(cyl(rb,rt,h,n,o),T(x,y,z))}
function cyZ(r,len,n,x,y,z){return xf(cyl(r,r,len,n),M(T(x,y,z-len/2),RX(Math.PI/2)))}   // 축 z
function cyX(r,len,n,x,y,z){return xf(cyl(r,r,len,n),M(T(x-len/2,y,z),RZ(-Math.PI/2)))}  // 축 x
// ---------- 셰이더 ----------
var VS='attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;uniform mat4 uM;varying vec3 vN;varying vec3 vW;void main(){vec4 w=uM*vec4(aP,1.0);vW=w.xyz;vN=mat3(uM)*aN;gl_Position=uVP*w;}';
var FS='precision mediump float;varying vec3 vN;varying vec3 vW;uniform vec4 uC;uniform vec4 uB;uniform vec3 uL;uniform vec3 uEye;uniform float uEm;uniform float uSp;uniform vec3 uFogC;uniform vec2 uFog;uniform float uFlat;'+
'void main(){vec4 base=uC;vec3 N=normalize(vN);if(!gl_FrontFacing){N=-N;if(uB.a>0.0)base=uB;}'+
'if(uFlat>0.5){gl_FragColor=base;return;}'+
'vec3 L=normalize(uL);float nd=max(dot(N,L),0.0);vec3 hemi=mix(vec3(0.60,0.65,0.72),vec3(1.0,1.0,1.0),N.y*0.5+0.5);'+
'vec3 col=base.rgb*(hemi*0.66+nd*0.50);vec3 V=normalize(uEye-vW);vec3 H=normalize(L+V);col+=pow(max(dot(N,H),0.0),40.0)*uSp;'+
'float rim=pow(1.0-max(dot(N,V),0.0),3.0);col+=rim*0.06;col=mix(col,base.rgb*1.15,uEm);'+
'float f=smoothstep(uFog.x,uFog.y,length(uEye-vW));col=mix(col,uFogC,f);gl_FragColor=vec4(col,base.a);}';
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o}
var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
var U={};['uVP','uM','uC','uB','uL','uEye','uEm','uSp','uFogC','uFog','uFlat'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n)});
var aP=gl.getAttribLocation(pr,'aP'),aN=gl.getAttribLocation(pr,'aN');gl.enableVertexAttribArray(aP);gl.enableVertexAttribArray(aN);
// ---------- 장면 ----------
var nodes=[];
function node(geo,color,o){o=o||{};var n={mesh:geo instanceof Mesh?geo:new Mesh(false).set(geo),c:typeof color==='string'?hex(color):color,b:o.back?hex(o.back):[0,0,0,0],m:o.m||ident(),em:o.em||0,sp:o.sp==null?0.12:o.sp,shadow:o.shadow!==false,flat:!!o.flat,vis:true,tr:!!o.tr,nodepth:!!o.nodepth,parent:o.parent||null};nodes.push(n);return n}
function group(parent){return{m:ident(),parent:parent||null,isGroup:true}}
function world(n){return n.parent?mul(world(n.parent),n.m):n.m}
var NAVY='#0e2e4a',BRAND='#12558c',INK='#161b20',WHITE='#f7f9fb',STEEL='#cdd7e0',GREEN='#47a948',GLASS='#a9c3da';
// 바닥·배경
node(xf(box(120,0.02,80),T(0,-0.012,-6)),'#e3e8ed',{sp:0,shadow:false});
node(cat(bx(120,0.006,0.16,0,0.004,7.2)),'#f4f6f8',{sp:0,shadow:false});
(function(){var v=[];for(var i=-9;i<=9;i++)v.push(bx(2.2,0.006,0.16,i*4.2,0.004,9.6));node(cat.apply(null,v),'#f7f9fa',{sp:0,shadow:false})})();
node(bx(46,0.006,15,1.6,0.003,1.2),'#d6dde5',{sp:0,shadow:false});
node(cy(5.3,5.3,0.14,56,0,0,0),'#c6cfd8',{sp:0.02});
(function(){var f=[]; // 먼 플랜트 (안개로 흐려짐)
  f.push(cy(1.6,1.6,11,20,-21,0,-24),cy(1.0,1.0,8,16,-17.5,0,-25),cy(3.4,3.4,6,28,-9,0,-27),cy(1.3,1.3,13,18,8,0,-26),cy(2.6,2.6,7,24,15,0,-25),cy(0.5,0.5,16,10,24,0,-24),cy(0.45,0.45,13,10,27,0,-24));
  f.push(bx(22,0.4,0.8,20,6.2,-23),bx(22,0.4,0.8,20,4.6,-23),bx(0.4,6.2,0.6,10,3.1,-23),bx(0.4,6.2,0.6,30,3.1,-23),bx(9,5,6,-30,2.5,-26));
  node(cat.apply(null,f),'#cfd9e4',{sp:0,shadow:false})})();
// 설비(탱크) — 앞쪽을 잘라 낸 단면
var R=4.2,H=7,CUT=55*Math.PI/180,T0=CUT,TL=Math.PI*2-2*CUT;
node(cy(R,R,H,72,0,0.14,0,{t0:T0,tl:TL,caps:false}),NAVY,{back:'#e9eff5',sp:0.35});
node(xf(cyl(R,0.01,0.02,72,{t0:T0,tl:TL,caps:false}),T(0,0.14+H,0)),NAVY,{back:'#dfe7ee',sp:0.2});
node(cat(cy(R+0.07,R+0.07,0.16,72,0,0.14+H-0.16,0,{t0:T0,tl:TL,caps:false}),cy(R+0.07,R+0.07,0.22,72,0,0.14,0,{t0:T0,tl:TL,caps:false}),cy(R+0.05,R+0.05,0.1,72,0,3.6,0,{t0:T0,tl:TL,caps:false})),'#16405f',{back:'#16405f',sp:0.3,shadow:false});
(function(){var e=[];[T0,T0+TL].forEach(function(a){e.push(xf(box(0.16,H,0.2),M(T((R-0.06)*Math.sin(a),0.14+H/2,(R-0.06)*Math.cos(a)),RY(a))))});node(cat.apply(null,e),'#1b4a70',{sp:0.3,shadow:false})})();
node(cy(R-0.06,R-0.06,0.03,72,0,0.14,0),'#d7e0e9',{sp:0.05,shadow:false});
node(cat(cy(0.5,0.5,0.55,24,0,0.14+H,0),cy(0.72,0.72,0.1,24,0,0.14+H+0.55,0)),NAVY,{sp:0.3});
(function(){var v=[],n=14;for(var i=0;i<n;i++){var a=T0+TL*(i+0.5)/n;v.push(cy(0.035,0.035,0.8,6,(R-0.2)*Math.sin(a),0.14+H,(R-0.2)*Math.cos(a)))}
  v.push(cy(R-0.2,R-0.2,0.05,72,0,0.14+H+0.8,0,{t0:T0,tl:TL,caps:false}),cy(R-0.2,R-0.2,0.04,72,0,0.14+H+0.42,0,{t0:T0,tl:TL,caps:false}));node(cat.apply(null,v),'#1b4a70',{back:'#1b4a70',sp:0.2,shadow:false})})();
var MW=72*Math.PI/180, MWP=[R*Math.sin(MW),2.7,R*Math.cos(MW)];
node(xf(cyl(0.46,0.46,0.34,24),M(T(MWP[0]-0.12*Math.sin(MW),MWP[1],MWP[2]-0.12*Math.cos(MW)),RY(MW),RX(Math.PI/2))),'#16405f',{sp:0.3});
// 잔류물
var slG=group(); var slSide=node(cyl(R-0.14,R-0.14,1,72,{caps:false}),hex('#7d91a5',0.93),{parent:slG,sp:0.1,shadow:false,tr:true});
var slTopMesh=new Mesh(true), slTop=node(slTopMesh,hex('#9db0c1',0.95),{sp:0.5,shadow:false,tr:true});
// CCTV
var CAMP=[-2.35,6.2,-3.1];
node(cat(bx(0.5,0.08,0.08,CAMP[0]-0.2,CAMP[1]+0.25,CAMP[2]-0.2)),'#16405f',{shadow:false});
var cctv=node(cat(bx(0.34,0.3,0.62,0,0,0.2),xf(cyl(0.13,0.16,0.16,14),M(T(0,0,0.5),RX(Math.PI/2)))),'#46535f',{sp:0.3,shadow:false});
var coneN=node(xf(cyl(0.02,1,1,36,{caps:false}),RX(Math.PI/2)),hex('#3f95da',0.13),{flat:true,shadow:false,tr:true,nodepth:true,back:'#3f95da'}); coneN.b=hex('#3f95da',0.13);
// 로봇
var FLOOR=0.17, rob=group();
node(cat(bx(1.95,0.44,0.36,0,0.24,0.56),bx(1.95,0.44,0.36,0,0.24,-0.56)),'#10263a',{parent:rob,sp:0.1,shadow:false});
var wheelN=[];[-0.72,-0.24,0.24,0.72].forEach(function(x){[0.75,-0.75].forEach(function(z){var g=group(rob);g.base=T(x,0.24,z);
  node(cat(cyZ(0.2,0.06,14,0,0,0),bx(0.3,0.05,0.07,0,0,0),bx(0.05,0.3,0.07,0,0,0)),'#7f95aa',{parent:g,sp:0.2,shadow:false});wheelN.push(g)})});
node(cat(bx(1.5,0.56,0.82,0.05,0.76,0)),STEEL,{parent:rob,sp:0.75,shadow:false});
node(cat(bx(1.52,0.09,0.84,0.05,0.62,0)),BRAND,{parent:rob,sp:0.3,shadow:false});
node(cat(bx(0.8,0.06,0.5,-0.15,1.07,0),bx(0.1,0.4,0.1,-0.35,1.28,0.1),bx(0.42,0.2,0.26,-0.4,1.52,0.1),bx(0.26,0.26,0.26,0.66,1.02,0)),NAVY,{parent:rob,sp:0.3,shadow:false});
node(xf(sphere(0.07,10,8),T(-0.62,1.52,0.1)),'#bfe2ff',{parent:rob,em:1,shadow:false});
var lamp=node(xf(sphere(0.055,10,8),T(-0.26,1.66,0.1)),GREEN,{parent:rob,em:1,shadow:false});
node(cat(bx(0.5,0.1,0.1,-0.95,0.42,0.42),bx(0.5,0.1,0.1,-0.95,0.42,-0.42)),NAVY,{parent:rob,shadow:false});
var aug=group(rob); aug.base=T(-1.2,0.32,0);
node(cyZ(0.2,1.2,18,0,0,0),'#27486a',{parent:aug,sp:0.3,shadow:false});
(function(){var v=[];for(var i=0;i<16;i++){var a=i*Math.PI*2/5.3,z=-0.55+i*1.1/15;v.push(xf(box(0.09,0.16,0.09),M(T(0.24*Math.cos(a),0.24*Math.sin(a),z),RZ(a))))}node(cat.apply(null,v),'#9bbcd8',{parent:aug,sp:0.5,shadow:false})})();
// 호스
var hoseMesh=new Mesh(true), hose=node(hoseMesh,'#1a66a6',{sp:0.45});
var pulses=[];for(var pI=0;pI<5;pI++)pulses.push(node(sphere(0.215,12,10),hex('#7fc0f5',1),{em:0.85,shadow:false}));
// 제어 차량
var CX=-11.2;
node(cat(bx(6.3,0.24,1.9,CX+0.9,0.6,0)),INK,{sp:0.05});
node(cat(bx(4.1,2.35,2.25,CX,1.9,0)),WHITE,{sp:0.25});
node(cat(bx(4.12,0.2,2.27,CX,1.0,0)),BRAND,{sp:0.2,shadow:false});
node(cat(bx(4.12,0.06,2.27,CX,0.84,0)),GREEN,{sp:0.2,shadow:false});
node(cat(bx(2.9,1.3,0.06,CX-0.25,2.1,1.13)),'#0c2740',{sp:0.2,shadow:false});
var screen=node(cat(bx(1.25,0.8,0.02,CX-0.9,2.15,1.17)),'#2a7fc4',{em:0.9,shadow:false});
var scrDot=node(cat(bx(0.14,0.09,0.02,0,0,0)),'#ffffff',{em:1,shadow:false});
var scrLv=node(xf(box(0.72,1,0.015),T(0,0.5,0)),hex('#bfe2ff',1),{em:0.8,shadow:false});
node(xf(box(3.0,0.07,1.25),M(T(CX-0.25,3.16,1.62),RX(0.42))),'#eef2f6',{sp:0.2});
node(cat(bx(1.55,1.75,2.1,CX+2.95,1.6,0)),WHITE,{sp:0.25});
node(cat(bx(0.04,0.72,1.7,CX+3.74,1.95,0),bx(0.9,0.62,0.04,CX+3.05,2.0,1.06)),GLASS,{sp:0.9,shadow:false});
node(cat(bx(0.08,0.2,0.3,CX+3.74,1.05,0.75),bx(0.08,0.2,0.3,CX+3.74,1.05,-0.75)),'#fff3c4',{em:0.8,shadow:false});
(function(){var v=[];[CX-1.3,CX+2.75].forEach(function(x){[0.86,-0.86].forEach(function(z){v.push(cyZ(0.52,0.36,22,x,0.52,z))})});node(cat.apply(null,v),INK,{sp:0.08});
  var h=[];[CX-1.3,CX+2.75].forEach(function(x){h.push(cyZ(0.24,0.06,14,x,0.52,1.05))});node(cat.apply(null,h),'#cfd8e1',{sp:0.4,shadow:false})})();
node(cat(cy(0.03,0.03,1.3,6,CX+1.6,3.07,0.6),xf(sphere(0.07,8,6),T(CX+1.6,4.4,0.6))),INK,{shadow:false});
var rings=[];for(var rI=0;rI<3;rI++)rings.push(node(xf(cyl(1,1,0.03,40,{caps:false}),M(RX(Math.PI/2))),hex('#2377bb',0.6),{flat:true,shadow:false,tr:true,nodepth:true,back:'#2377bb'}));
// 조종하는 작업자
function person(parent,body){var g=group(parent),legL=group(g),legR=group(g),arm=group(g);legL.base=T(-0.11,0.82,0);legR.base=T(0.11,0.82,0);arm.base=T(0,1.32,0);
  node(cat(bx(0.17,0.8,0.2,0,-0.4,0),bx(0.19,0.1,0.3,0,-0.78,0.05)),NAVY,{parent:legL});node(cat(bx(0.17,0.8,0.2,0,-0.4,0),bx(0.19,0.1,0.3,0,-0.78,0.05)),'#123653',{parent:legR});
  node(cat(bx(0.5,0.66,0.3,0,1.14,0)),body||BRAND,{parent:g});node(cat(bx(0.52,0.07,0.32,0,1.2,0)),'#e6edf3',{parent:g,shadow:false});node(cat(bx(0.52,0.04,0.32,0,1.02,0)),GREEN,{parent:g,shadow:false});
  node(xf(sphere(0.15,12,10),T(0,1.62,0)),'#ecd9c6',{parent:g,sp:0.05});node(cat(xf(sphere(0.18,14,8,0.62),T(0,1.7,0)),cy(0.21,0.21,0.025,16,0,1.67,0.02)),'#ffffff',{parent:g,sp:0.5});
  node(cat(bx(0.13,0.5,0.15,0.32,-0.2,0.12),bx(0.13,0.5,0.15,-0.32,-0.2,0.12)),body||BRAND,{parent:arm});
  return{g:g,legL:legL,legR:legR,arm:arm}}
var op=person(null); op.g.m=M(T(CX-0.2,0,1.75),RY(Math.PI));
// 신호 점
var sigA=[],sigB=[];for(var sI=0;sI<5;sI++){sigA.push(node(sphere(0.085,10,8),BRAND,{em:1,shadow:false}));sigB.push(node(sphere(0.07,10,8),'#8a939c',{em:1,shadow:false}))}
// 진공흡입차
var VX=10.6, vac=group();
node(cat(bx(6.7,0.24,1.9,VX,0.6,0)),INK,{parent:vac,sp:0.05});
node(cat(cyX(1.2,4.2,40,VX-1.1,2.0,0),xf(sphere(1.2,28,16),M(T(VX-3.2,2.0,0),S(0.32,1,1))),xf(sphere(1.2,28,16),M(T(VX+1.0,2.0,0),S(0.32,1,1)))),NAVY,{parent:vac,sp:0.8});
node(cat(cyX(1.23,0.1,40,VX-2.9,2.0,0),cyX(1.23,0.08,40,VX-1.6,2.0,0),cyX(1.23,0.08,40,VX+0.2,2.0,0)),'#1b4a70',{parent:vac,sp:0.5,shadow:false});
node(cat(cyX(0.2,0.5,16,VX-3.75,2.0,0)),BRAND,{parent:vac,sp:0.4});
node(cat(bx(0.14,1.5,0.05,VX+0.5,2.0,1.22)),'#061624',{parent:vac,shadow:false});
var gauge=node(xf(box(0.09,1,0.04),T(0,0.5,0)),'#8fd0ff',{parent:vac,em:1,shadow:false});
node(cat(bx(1.65,1.95,2.1,VX+2.35,1.7,0)),WHITE,{parent:vac,sp:0.25});
node(cat(bx(0.04,0.75,1.7,VX+3.19,2.1,0),bx(1.0,0.66,0.04,VX+2.45,2.12,1.06)),GLASS,{parent:vac,sp:0.9,shadow:false});
node(cat(bx(0.08,0.2,0.3,VX+3.19,1.1,0.75),bx(0.08,0.2,0.3,VX+3.19,1.1,-0.75)),'#fff3c4',{parent:vac,em:0.8,shadow:false});
var beacon=node(cat(bx(0.4,0.14,0.2,VX+2.3,2.75,0)),GREEN,{parent:vac,em:1,shadow:false});
node(cat(bx(0.06,0.9,0.06,VX-0.2,2.6,1.05),bx(0.06,0.9,0.06,VX-0.7,2.6,1.05),bx(0.6,0.05,0.06,VX-0.45,2.9,1.05),bx(0.6,0.05,0.06,VX-0.45,2.6,1.05),bx(0.6,0.05,0.06,VX-0.45,2.3,1.05)),'#9aa7b3',{parent:vac,shadow:false});
(function(){var v=[],h=[];[VX-2.3,VX-1.1,VX+2.3].forEach(function(x){[0.86,-0.86].forEach(function(z){v.push(cyZ(0.52,0.36,22,x,0.52,z))});h.push(cyZ(0.24,0.06,14,x,0.52,1.05))});
  node(cat.apply(null,v),INK,{parent:vac,sp:0.08});node(cat.apply(null,h),'#cfd8e1',{parent:vac,sp:0.4,shadow:false})})();
// 분리장치
var SX=16.6;
node(cat(cy(0.8,0.8,1.5,28,SX,2.3,0),cy(0.84,0.84,0.08,28,SX,3.76,0)),WHITE,{sp:0.4});
node(xf(cyl(0.2,0.8,0.95,28),T(SX,1.35,0)),'#e6ebf0',{sp:0.4});
(function(){var v=[];[[0.6,0.6],[-0.6,0.6],[0.6,-0.6],[-0.6,-0.6]].forEach(function(p){v.push(cy(0.05,0.05,2.3,8,SX+p[0],0,p[1]))});v.push(bx(1.3,0.06,1.3,SX,1.2,0));node(cat.apply(null,v),'#56677a',{sp:0.2})})();
node(tube(catmull([[VX-0.6,3.2,0],[VX+0.6,4.7,0],[SX-1.6,5.3,0],[SX,4.6,0],[SX,3.84,0]],14),0.07,8),'#8e99a4',{sp:0.2,shadow:false});
// 안전 고깔
(function(){var o=[],w=[];[[-3.9,5.3],[3.5,5.6],[6.2,3.9],[-6.4,3.6],[0,6.2]].forEach(function(p){o.push(xf(cyl(0.2,0.04,0.62,14),T(p[0],0.04,p[1])),bx(0.5,0.04,0.5,p[0],0.02,p[1]));w.push(xf(cyl(0.135,0.105,0.12,14,{caps:false}),T(p[0],0.28,p[1])))});
  node(cat.apply(null,o),'#f08a24',{sp:0.2});node(cat.apply(null,w),'#ffffff',{sp:0.2,shadow:false})})();
// 최종 클리닝 작업자
var wk=person(null,'#12558c'); var lance=group(wk.g); lance.base=M(T(0.3,0.95,0.52)); node(cyl(0.025,0.02,1.3,6),'#6b7885',{parent:lance,shadow:false});
var drops=[];for(var dI=0;dI<14;dI++)drops.push(node(sphere(0.07,8,6),'#a9dbff',{em:1,shadow:false}));
var wkNodes=nodes.filter(function(n){var p=n.parent;while(p){if(p===wk.g)return true;p=p.parent}return false});
wkNodes.forEach(function(n){n.shadow=false});
// ---------- 시간표 ----------
var D=26000, OFF=2.4, RS=1.3;
var RXK=[[0,1.9],[3.6,1.9],[9.2,-1.5],[14.8,0.9],[15.4,0.9],[17.4,-1.6],[24,-1.6]];
var LV0=0.85, LVK=[[0,LV0],[3.9,LV0],[14.8,0.3],[16.8,0.3],[19.6,0.015],[24,0.015]];
var GAK=[[0,0],[4.2,0],[15,0.86],[24,0.86]];
var CPOS=[[0,0.8,7.4,30.5],[1.4,-8.2,4.9,16.5],[3.3,-8.6,4.9,16.5],[4.9,-3.6,5.8,14.2],[9.0,-2.2,5.6,14.2],[10.6,6.4,5.4,17],[14.6,7.4,5.4,17],[16.2,4.2,4.6,12.8],[20.3,3.4,4.4,12.8],[22.0,0.8,7.4,30.5],[24,0.8,7.4,30.5]];
var CTGT=[[0,1.6,3.7,0],[1.4,-8.4,2.0,0],[3.3,-8.0,2.0,0],[4.9,0.1,2.2,0],[9.0,-0.2,2.2,0],[10.6,7.2,2.2,0],[14.6,7.8,2.2,0],[16.2,0.6,1.8,0.2],[20.3,0.4,1.8,0.2],[22.0,1.6,3.7,0],[24,1.6,3.7,0]];
var says=['The operator controls the robot from the control vehicle outside the equipment, watching the interior on CCTV.','The robot recovers the remaining hazardous material inside the equipment.','The recovered material travels along the hose to the vacuum truck.','Once the hazardous material has been reduced, workers enter and remove the final residue.'];
var labels=[]; function label(id,fn){var el=$(id);if(el)labels.push([el,fn])}
var st={rx:1.9};
label('scn-lb1',function(){return[CX-1.6,3.75,1.1]});label('scn-lb2',function(){return[st.rx+0.1,2.75,0.6]});label('scn-lb3',function(){return[VX-1.2,3.75,0.6]});label('scn-lb4',function(){return[SX,4.55,0]});
label('scn-lbT',function(){return[0,8.55,0]});label('scn-lbC',function(){return[CAMP[0]+0.9,CAMP[1]+0.55,CAMP[2]]});label('scn-lbS',function(){return[-6.15,2.25,1.0]});label('scn-lbH',function(){return[5.7,2.95,1.4]});
var LIGHT=norm([-0.45,0.82,0.36]);
var SHM=new Float32Array([1,0,0,0, -LIGHT[0]/LIGHT[1],0,-LIGHT[2]/LIGHT[1],0, 0,0,1,0, 0,0.012,0,1]);
var orb={y:0,p:0,drag:false,x:0,y0:0};
var W=0,Hh=0,dpr=1,VP=ident(),eye=[0,8,28],lastStep=-1;
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);var r=canvas.getBoundingClientRect();W=Math.max(2,Math.round(r.width*dpr));Hh=Math.max(2,Math.round(r.height*dpr));if(canvas.width!==W||canvas.height!==Hh){canvas.width=W;canvas.height=Hh}gl.viewport(0,0,W,Hh)}
function update(ms){
  var real=ms/1000, s=Math.max(0,real-OFF), rx=kf(s,RXK), lv=kf(s,LVK), work=s>3.9&&s<14.8, sig=s>1.4&&s<17.4; st.rx=rx;
  // 카메라
  var asp=W/Hh, cp=kf3(s,CPOS), ct=kf3(s,CTGT), k=clamp(2.0/asp,1,2.2);
  cp=add(ct,scl(sub(cp,ct),k)); cp[0]+=Math.sin(ms/3100)*0.35; cp[1]+=Math.sin(ms/4300)*0.12;
  if(Math.abs(orb.y)>1e-4||Math.abs(orb.p)>1e-4){var d=sub(cp,ct),cy_=Math.cos(orb.y),sy_=Math.sin(orb.y),dx=d[0]*cy_+d[2]*sy_,dz=-d[0]*sy_+d[2]*cy_,hl=Math.hypot(dx,dz),el=clamp(Math.atan2(d[1],hl)+orb.p,0.06,1.2),L3=Math.hypot(hl,d[1]);cp=[ct[0]+dx/hl*Math.cos(el)*L3,ct[1]+Math.sin(el)*L3,ct[2]+dz/hl*Math.cos(el)*L3]}
  eye=cp;
  VP=mul(persp(32*Math.PI/180,asp,0.5,140),lookAt(cp,ct,[0,1,0]));
  // 로봇
  rob.m=M(T(rx,FLOOR,0.6),S(RS,RS,RS)); wheelN.forEach(function(g){g.m=M(g.base,RZ(-(rx-1.9)/0.2))}); aug.m=M(aug.base,RZ(work?ms/90:0));
  lamp.c=hex(sig&&Math.sin(ms/280)>-0.2?'#47a948':'#1d5a20');
  // 잔류물
  slG.m=M(T(0,FLOOR,0),S(1,Math.max(0.001,lv),1));
  var v=[],rr=R-0.14,NR=7,NA=56,amp=work?0.045:0.015;
  function P(i,j){var r=rr*i/NR,a=2*Math.PI*j/NA,x=r*Math.sin(a),z=r*Math.cos(a),dx=x-(rx-0.6),dz=z-0.6,dd=Math.hypot(dx,dz);
    var y=FLOOR+lv+Math.sin(ms/520+x*1.7)*amp+Math.sin(ms/390+z*2.3)*amp*0.6-(work?0.10*Math.exp(-dd*dd*0.9):0);return[x,y,z]}
  for(var i=0;i<NR;i++)for(var j=0;j<NA;j++){var a=P(i,j),b=P(i+1,j),c=P(i+1,j+1),d=P(i,j+1),n=[0,1,0];tri(v,a,b,c,n,n,n);if(i>0)tri(v,a,c,d,n,n,n)}
  slTopMesh.set(v); slTop.vis=slSide.vis=lv>0.02;
  // CCTV와 시야
  var tgt=[rx-0.2,FLOOR+0.5,0.6], dir=norm(sub(tgt,CAMP)), len=Math.hypot.apply(null,sub(tgt,CAMP));
  var zx=norm(cross([0,1,0],dir)), zy=cross(dir,zx);
  cctv.m=basis(CAMP,zx,zy,dir);
  var co=kf(s,[[0,0],[1.6,0],[2.4,1],[22,1]]); coneN.vis=co>0.01; coneN.c[3]=coneN.b[3]=0.13*co;
  coneN.m=basis(add(CAMP,scl(dir,0.6)),scl(zx,1.5),scl(zy,1.5),scl(dir,len-0.6));
  // 호스
  var hp=catmull([[rx+0.66*RS,FLOOR+1.14*RS,0.6],[rx+0.95,2.6,0.75],[Math.min(3.0,rx+1.9),3.2-0.1*(1.9-rx),1.15],[MWP[0]-0.2,MWP[1],MWP[2]],[5.0,2.35,1.5],[6.2,1.55,1.05],[VX-4.0,2.0,0]],9);
  hoseMesh.set(tube(hp,0.16,10));
  pulses.forEach(function(p,i){var u=((ms/2600)+i/5)%1,idx=Math.min(hp.length-1,Math.floor(u*(hp.length-1)));p.vis=work;p.m=T(hp[idx][0],hp[idx][1],hp[idx][2])});
  // 신호
  sigA.forEach(function(n,i){var u=((ms/1500)+i/5)%1;n.vis=sig;n.m=T(-7.4+u*3.2,1.75,1.0)});
  sigB.forEach(function(n,i){var u=((ms/1500)+i/5)%1;n.vis=sig;n.m=T(-4.2-u*3.2,1.45,1.0)});
  rings.forEach(function(n,i){var u=((ms/1400)+i/3)%1;n.vis=sig;n.c[3]=n.b[3]=0.55*(1-u);var r=0.2+u*0.9;n.m=M(T(CX+1.6,4.4,0.6),S(r,r,1))});
  // 모니터
  screen.em=sig?0.9:0.35;
  scrDot.vis=s>1.8||real<OFF; scrDot.m=T(CX-1.42+ (rx+2.2)/4.4*0.9, 1.86+0.06, 1.19);
  scrLv.m=M(T(CX-0.05,1.8,1.19),S(1,0.02+lv/LV0*0.6,1));
  op.arm.m=M(op.arm.base,RX(-0.9+(sig?Math.sin(ms/330)*0.12:0)));
  op.legL.m=op.legL.base; op.legR.m=op.legR.base;
  // 진공흡입차
  vac.m=T(0,work?Math.sin(ms/38)*0.012:0,0);
  gauge.m=M(T(VX+0.5,1.3,1.26),S(1,0.02+1.4*kf(s,GAK),1));
  beacon.c=hex(work&&Math.sin(ms/300)>0?'#6fe070':'#2f7a31');
  // 작업자
  var WS=[2.7,5.7],WE=[1.5,1.3],wu=ease(seg(s,15.3,17.6)),wx=WS[0]+(WE[0]-WS[0])*wu,wz=WS[1]+(WE[1]-WS[1])*wu,walking=s>15.3&&s<17.6,spray=s>18.0&&s<20.2;
  var h0=Math.atan2(WE[0]-WS[0],WE[1]-WS[1]),h1=-Math.PI/2-0.3,hd=h0+(h1-h0)*ease(seg(s,17.2,17.9));
  wkNodes.forEach(function(n){n.vis=s>15.3});
  wk.g.m=M(T(wx,Math.hypot(wx,wz)<5.3?FLOOR:0,wz),RY(hd));
  var la=walking?Math.sin(ms/120)*0.5:0; wk.legL.m=M(wk.legL.base,RX(la)); wk.legR.m=M(wk.legR.base,RX(-la));
  var sw=spray?Math.sin(ms/300)*0.22:0;
  wk.arm.m=M(wk.arm.base,RX(-0.75));
  lance.m=M(lance.base,RY(sw),RX(2.02));
  var lw=world(lance),tip=[lw[4]*1.3+lw[12],lw[5]*1.3+lw[13],lw[6]*1.3+lw[14]],ld=norm([lw[4],lw[5],lw[6]]);
  drops.forEach(function(n,i){var u=((ms/380)+i/14)%1,sp=u*0.3;n.vis=spray;
    n.m=T(tip[0]+ld[0]*u*1.1+Math.sin(i*2.4)*sp,Math.max(FLOOR+0.04,tip[1]+ld[1]*u*1.1-u*u*0.25),tip[2]+ld[2]*u*1.1+Math.cos(i*1.7)*sp)});
  // 단계 표시
  var step=s<3.6?0:s<9.2?1:s<15.4?2:3;
  if(step!==lastStep){lastStep=step;var li=document.querySelectorAll('.scn-steps li');for(var q=0;q<li.length;q++){li[q].classList.toggle('is-on',q===step);li[q].classList.toggle('is-done',q<step)}var sy=$('scn-say');if(sy)sy.textContent=says[step]}
  var dn=$('scn-lbD'); if(dn) dn.style.opacity=seg(s,20.2,20.7)*(1-seg(real,D/1000-0.9,D/1000-0.5));
  // 처음으로 넘어갈 때 부드럽게 가림
  var fade=real>D/1000-0.55?seg(real,D/1000-0.55,D/1000):real<0.55?1-seg(real,0,0.55):0; canvas.style.opacity=(1-fade).toFixed(3); overlay.style.opacity=(1-fade).toFixed(3);
}
function drawNode(n,shadowPass){
  if(n.isGroup||!n.vis||!n.mesh.n) return; if(shadowPass&&!n.shadow) return;
  var m=world(n); if(shadowPass) m=mul(SHM,m);
  gl.uniformMatrix4fv(U.uM,false,m);
  if(shadowPass){gl.uniform4f(U.uC,0.05,0.16,0.27,0.24);gl.uniform4f(U.uB,0.05,0.16,0.27,0.24);gl.uniform1f(U.uFlat,1)}
  else{gl.uniform4fv(U.uC,n.c);gl.uniform4fv(U.uB,n.b);gl.uniform1f(U.uFlat,n.flat?1:0);gl.uniform1f(U.uEm,n.em);gl.uniform1f(U.uSp,n.sp)}
  gl.bindBuffer(gl.ARRAY_BUFFER,n.mesh.buf);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(aN,3,gl.FLOAT,false,24,12);
  gl.drawArrays(gl.TRIANGLES,0,n.mesh.n);
}
function render(){
  gl.clearColor(0,0,0,0);gl.clearStencil(0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  gl.uniformMatrix4fv(U.uVP,false,VP);gl.uniform3fv(U.uL,LIGHT);gl.uniform3fv(U.uEye,eye);gl.uniform3f(U.uFogC,0.90,0.93,0.96);gl.uniform2f(U.uFog,34,78);
  gl.disable(gl.BLEND);gl.depthMask(true);
  var i,n; for(i=0;i<nodes.length;i++){n=nodes[i];if(!n.tr)drawNode(n,false)}
  // 바닥 그림자 (겹쳐도 한 번만 어두워지게)
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  gl.enable(gl.STENCIL_TEST);gl.stencilFunc(gl.EQUAL,0,0xff);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);
  gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2,-2);
  for(i=0;i<nodes.length;i++){n=nodes[i];if(!n.tr)drawNode(n,true)}
  gl.disable(gl.POLYGON_OFFSET_FILL);gl.disable(gl.STENCIL_TEST);
  // 반투명
  for(i=0;i<nodes.length;i++){n=nodes[i];if(n.tr&&!n.nodepth){gl.depthMask(true);drawNode(n,false)}}
  gl.depthMask(false);for(i=0;i<nodes.length;i++){n=nodes[i];if(n.tr&&n.nodepth)drawNode(n,false)}
  gl.depthMask(true);
  // 이름표
  var cw=canvas.clientWidth,ch=canvas.clientHeight;
  labels.forEach(function(L){var p=L[1](),x=VP[0]*p[0]+VP[4]*p[1]+VP[8]*p[2]+VP[12],y=VP[1]*p[0]+VP[5]*p[1]+VP[9]*p[2]+VP[13],w=VP[3]*p[0]+VP[7]*p[1]+VP[11]*p[2]+VP[15];
    var sx=(x/w*0.5+0.5)*cw,sy=(1-(y/w*0.5+0.5))*ch,ok=w>0&&sx>14&&sx<cw-14&&sy>14&&sy<ch-10;
    L[0].style.transform='translate(-50%,-100%) translate('+sx.toFixed(1)+'px,'+sy.toFixed(1)+'px)';L[0].style.visibility=ok?'visible':'hidden'});
}
// ---------- 재생 ----------
var tNow=0,last=null,raf=null,paused=false,reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(now){if(dead){raf=null;return}if(last===null)last=now;var dt=Math.min(100,now-last);last=now;tNow=(tNow+dt)%D;if(!orb.drag){var kk=Math.exp(-dt/700);orb.y*=kk;orb.p*=kk}resize();update(tNow);render();raf=requestAnimationFrame(frame)}
function play(){if(raf)cancelAnimationFrame(raf);paused=false;last=null;raf=requestAnimationFrame(frame);var b=$('scn-pp');if(b){b.textContent='Pause';b.setAttribute('aria-pressed','false')}}
function pause(){paused=true;if(raf)cancelAnimationFrame(raf);raf=null;var b=$('scn-pp');if(b){b.textContent='Play';b.setAttribute('aria-pressed','true')}}
function still(ms){tNow=ms;lastStep=-1;resize();update(ms);render()}
var pp=$('scn-pp');if(pp)pp.addEventListener('click',function(){if(dead)return;paused?play():pause()});
var rs=$('scn-rs');if(rs)rs.addEventListener('click',function(){if(dead)return;tNow=0;lastStep=-1;if(paused)still(0)});
window.addEventListener('resize',function(){if(!dead&&paused)still(tNow)});
document.addEventListener('visibilitychange',function(){if(dead)return;if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=null}}else if(!paused)play()});
if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){if(dead)return;if(e.isIntersecting){if(!paused&&!raf)play()}else if(raf){cancelAnimationFrame(raf);raf=null}})},{threshold:0.05}).observe(canvas)}
stage.addEventListener('pointerdown',function(e){if(dead)return;if(e.pointerType==='touch'&&!e.isPrimary)return;orb.drag=true;orb.x=e.clientX;orb.y0=e.clientY;stage.classList.add('is-drag');try{stage.setPointerCapture(e.pointerId)}catch(_){}});
stage.addEventListener('pointermove',function(e){if(dead||!orb.drag)return;orb.y=clamp(orb.y-(e.clientX-orb.x)*0.006,-1.1,1.1);orb.p=clamp(orb.p+(e.clientY-orb.y0)*0.004,-0.3,0.6);orb.x=e.clientX;orb.y0=e.clientY;if(paused)still(tNow)});
function up(){orb.drag=false;stage.classList.remove('is-drag')}stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
stopFn=function(){if(raf)cancelAnimationFrame(raf);raf=null};
canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();fallback()});
window.__scnSetT=function(ms){if(dead)return;pause();still(ms)};
if(reduce){pause();still(10400)}else{still(0);play()}
}
})();
