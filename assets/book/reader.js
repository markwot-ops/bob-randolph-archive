/* BookReader: leather covers + open-book frame + 3D page turn.
   BookReader({root, layout, base, page(n)->url, total, leftStart, front, back, title, backHref, backLabel}) */
(function(){
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
window.BookReader=function(cfg){
  var root=cfg.root,lay=cfg.layout,base=cfg.base||'',page=cfg.page,total=cfg.total,
      leftStart=cfg.leftStart==null?2:cfg.leftStart,hasCov=!!cfg.front,off=hasCov?1:0;
  var spreads=[];for(var p=leftStart;p<=total;p+=2)spreads.push([p>=1?p:0,(p+1<=total)?p+1:0]);
  var nViews=spreads.length+(hasCov?2:0),cur=0,busy=false,single=false,api={};
  root.classList.add('br');
  root.innerHTML='';
  /* bar */
  var bar=el('div','br-bar');
  bar.innerHTML=(cfg.backHref?'<a href="'+cfg.backHref+'">&larr; '+(cfg.backLabel||'Back')+'</a>':'')+
    '<span class="br-sp"></span><input class="br-go" type="number" min="1" max="'+total+'" placeholder="page" aria-label="Go to page">'+
    '<button class="br-btn" data-a="prev" aria-label="Previous">&lsaquo;</button><span class="br-lbl"></span>'+
    '<button class="br-btn" data-a="next" aria-label="Next">&rsaquo;</button>';
  root.appendChild(bar);
  var stage=el('div','br-stage');root.appendChild(stage);
  /* closed covers */
  var closed=null,imgF,imgB;
  if(hasCov){closed=el('div','br-closed');imgF=el('img');imgB=el('img','br-off');
    imgF.src=base+cfg.front;imgB.src=base+cfg.back;imgF.alt='Front cover';imgB.alt='Back cover';
    closed.appendChild(imgF);closed.appendChild(imgB);stage.appendChild(closed);}
  /* open view */
  var view=el('div','br-view'),bk=el('div','br-bk');view.appendChild(bk);stage.appendChild(view);
  var fr=el('img','br-frame');fr.src=base+lay.frame;fr.alt='';bk.appendChild(fr);
  function mkSlot(side){var s=el('div','br-slot br-'+side),f=el('div','br-face'),i=el('img');f.appendChild(i);s.appendChild(f);
    var g=lay[side];s.style.cssText='left:'+g.x*100+'%;top:'+g.y*100+'%;width:'+g.w*100+'%;height:'+g.h*100+'%';bk.appendChild(s);return {s:s,i:i};}
  var SL=mkSlot('L'),SR=mkSlot('R');
  var sh=el('img','br-shade');sh.src=base+lay.shade;sh.alt='';bk.appendChild(sh);
  var nzl=el('button','br-nz br-nzl'),nzr=el('button','br-nz br-nzr');nzl.setAttribute('aria-label','Previous');nzr.setAttribute('aria-label','Next');
  stage.appendChild(nzl);stage.appendChild(nzr);
  var zoom=el('div','br-zoom','<span class="br-x">&times;</span><img alt="">');root.appendChild(zoom);
  var lbl=bar.querySelector('.br-lbl'),bPrev=bar.querySelector('[data-a=prev]'),bNext=bar.querySelector('[data-a=next]'),go=bar.querySelector('.br-go');

  function url(n){return n?page(n):'';}
  function setImg(slot,n){if(n){slot.i.src=url(n);slot.s.style.visibility='';}else{slot.i.removeAttribute('src');}}
  function pre(n){if(n){var i=new Image();i.src=url(n);}}
  function spreadOf(v){return spreads[v-off];}
  function isClosed(v){return hasCov&&(v===0||v===nViews-1);}
  function layoutMode(){
    var s=window.innerWidth<760&&window.innerHeight>window.innerWidth*0.8;
    view.style.setProperty('--asp',s?lay.aspect/2:lay.aspect);
    view.classList.toggle('br-clip',s);root.classList.toggle('br-single',s);single=s;
  }
  function label(v){
    if(isClosed(v))return v===0?'Front cover':'Back cover';
    var s=spreadOf(v);return 'pp. '+(s[0]||'\u2014')+'\u2013'+(s[1]||'\u2014');
  }
  function renderSpread(v){var s=spreadOf(v);setImg(SL,s[0]);setImg(SR,s[1]);
    if(!s[0])SL.i.removeAttribute('src');if(!s[1])SR.i.removeAttribute('src');
    applyHalf(s);
    var a=spreads[v-off+1],b=spreads[v-off-1];[a,b].forEach(function(x){if(x){pre(x[0]);pre(x[1]);}});}
  var half='l'; // single-page mode: which half of the spread is on screen
  function applyHalf(s){if(!single){root.classList.remove('br-half-r');return;}
    if(!s[0])half='r';else if(!s[1])half='l';root.classList.toggle('br-half-r',half==='r');
    lbl.textContent='p. '+(half==='r'?s[1]:s[0]);}
  function state(v){root.classList.toggle('br-st-closed',isClosed(v));root.classList.toggle('br-st-open',!isClosed(v));
    if(hasCov){imgF.classList.toggle('br-off',v===nViews-1);imgB.classList.toggle('br-off',v!==nViews-1);}
    bPrev.disabled=v<=0;bNext.disabled=v>=nViews-1;nzl.disabled=bPrev.disabled;nzr.disabled=bNext.disabled;
    lbl.textContent=(single&&!isClosed(v))?lbl.textContent:label(v);
    try{history.replaceState(null,'','#'+v);}catch(e){}}
  function flip(v0,v1){
    var s0=spreadOf(v0),s1=spreadOf(v1),fwd=v1>v0;busy=true;
    var g=fwd?lay.R:lay.L,leaf=el('div','br-leaf '+(fwd?'br-fwd':'br-bwd'));
    leaf.style.cssText='left:'+g.x*100+'%;top:'+g.y*100+'%;width:'+g.w*100+'%;height:'+g.h*100+'%;transform-origin:'+(fwd?'left':'right')+' center;';
    var f1=el('div','br-face'),i1=el('img'),f2=el('div','br-face br-back'),i2=el('img');
    f1.appendChild(i1);f2.appendChild(i2);leaf.appendChild(f1);leaf.appendChild(f2);
    if(fwd){i1.src=url(s0[1]);i2.src=url(s1[0]);setImg(SR,s1[1]);}   // reveal next right page beneath
    else{i1.src=url(s0[0]);i2.src=url(s1[1]);setImg(SL,s1[0]);}
    bk.appendChild(leaf);
    void leaf.offsetWidth;
    leaf.style.transform='rotateY('+(fwd?-180:180)+'deg)';
    var done=false;function fin(){if(done)return;done=true;
      if(fwd)setImg(SL,s1[0]);else setImg(SR,s1[1]);
      if(leaf.parentNode)leaf.parentNode.removeChild(leaf);busy=false;renderSpread(v1);}
    leaf.addEventListener('transitionend',fin);setTimeout(fin,1000);
  }
  function show(v,instant){
    if(busy)return;v=Math.max(0,Math.min(nViews-1,v));
    var prevOpen=!isClosed(cur);
    if(isClosed(v)){cur=v;state(v);return;}
    if(!isClosed(cur)&&!instant&&Math.abs(v-cur)===1&&!single){var v0=cur;cur=v;state(v);flip(v0,v);return;}
    cur=v;renderSpread(v);state(v);
  }
  api.next=function(){
    if(busy)return;
    if(single&&!isClosed(cur)){var s=spreadOf(cur);
      if(half==='l'&&s[1]){half='r';applyHalf(s);return;}
      half='l';}
    else if(single)half='l';
    show(cur+1);};
  api.prev=function(){
    if(busy)return;
    if(single&&!isClosed(cur)){var s=spreadOf(cur);
      if(half==='r'&&s[0]){half='l';applyHalf(s);return;}
      half='r';}
    else if(single)half='r';
    show(cur-1);};
  api.goPage=function(n){n=parseInt(n,10);if(isNaN(n))return;
    var v;if(hasCov&&n<=1)v=0;else if(hasCov&&n>total)v=nViews-1;else{var k=Math.floor((n-leftStart)/2);k=Math.max(0,Math.min(spreads.length-1,k));v=k+off;}
    busy=false;show(v,true);};
  bPrev.onclick=api.prev;bNext.onclick=api.next;nzl.onclick=api.prev;nzr.onclick=api.next;
  if(closed)closed.onclick=function(){show(cur===0?1:cur-1);};
  go.onkeydown=function(e){if(e.key==='Enter'){api.goPage(go.value);go.blur();}};
  document.addEventListener('keydown',function(e){if(e.target===go)return;
    if(e.key==='ArrowRight')api.next();else if(e.key==='ArrowLeft')api.prev();else if(e.key==='Escape')zoom.classList.remove('on');});
  /* swipe */
  var tx=null;stage.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});
  stage.addEventListener('touchend',function(e){if(tx==null)return;var dx=e.changedTouches[0].clientX-tx;tx=null;
    if(Math.abs(dx)>50){dx<0?api.next():api.prev();}},{passive:true});
  /* zoom on page click */
  function openZoom(n){if(!n)return;zoom.querySelector('img').src=url(n);zoom.classList.add('on');zoom.scrollTop=0;}
  SL.s.onclick=function(){if(busy)return;var s=spreadOf(cur);if(s)openZoom(s[0]);};
  SR.s.onclick=function(){if(busy)return;var s=spreadOf(cur);if(s)openZoom(s[1]);};
  zoom.onclick=function(){zoom.classList.remove('on');};
  window.addEventListener('resize',function(){var was=single;layoutMode();if(was!==single&&!isClosed(cur)){root.classList.remove('br-half-r');renderSpread(cur);}});
  layoutMode();
  var h=parseInt((location.hash||'').replace('#',''),10);
  cur=isNaN(h)?0:Math.max(0,Math.min(nViews-1,h));if(!hasCov&&isNaN(h))cur=0;
  if(!isClosed(cur))renderSpread(cur);state(cur);
  if(single&&!isClosed(cur)){root.classList.remove('br-half-r');}
  api.show=show;api.view=function(){return cur;};
  return api;
};
})();
