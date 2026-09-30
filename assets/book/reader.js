/* BookReader: leather covers + open-book frame + 3D page turn + live page-stack depth.
   BookReader({root, layout, base, page(n)->url, total, leftStart, front, back, backHref, backLabel, homeHref}) */
(function(){
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
window.BookReader=function(cfg){
  var root=cfg.root,lay=cfg.layout,base=cfg.base||'',page=cfg.page,total=cfg.total,
      leftStart=cfg.leftStart==null?2:cfg.leftStart,hasCov=!!cfg.front,hasBack=hasCov&&!!cfg.back,off=hasCov?1:0;
  var spreads=[];for(var p=leftStart;p<=total;p+=2)spreads.push([p>=1?p:0,(p+1<=total)?p+1:0]);
  var nViews=spreads.length+(hasCov?1:0)+(hasBack?1:0),cur=0,busy=false,single=false,half='l',api={};
  var flat=!!cfg.flat;
  root.classList.add('br');if(flat)root.classList.add('br-flat');root.innerHTML='';
  var bar=el('div','br-bar');
  bar.innerHTML=(cfg.homeHref?'<a href="'+cfg.homeHref+'">Home</a>':'')+
    (cfg.backHref?'<a href="'+cfg.backHref+'">&larr; '+(cfg.backLabel||'Back')+'</a>':'')+
    '<span class="br-sp"></span>'+
    (cfg.jump?'<select class="br-jump" aria-label="Jump to poem"><option value="">Jump to poem\u2026</option>'+cfg.jump.map(function(j){return '<option value="'+j[1]+'">'+String(j[0]).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</option>';}).join('')+'</select>':'')+
    (cfg.noArrows?'':'<button class="br-btn" data-a="prev" aria-label="Previous page">&lsaquo;</button>'+
    '<button class="br-btn" data-a="next" aria-label="Next page">&rsaquo;</button>');
  root.appendChild(bar);
  var stage=el('div','br-stage');root.appendChild(stage);
  var closed=null,imgF,imgB=null;
  if(hasCov){closed=el('div','br-closed');imgF=el('img');
    imgF.src=base+cfg.front;imgF.alt='Front cover';closed.appendChild(imgF);
    if(hasBack){imgB=el('img','br-off');imgB.src=base+cfg.back;imgB.alt='Back cover';closed.appendChild(imgB);}
    stage.appendChild(closed);}
  var view=el('div','br-view'),bk=el('div','br-bk');view.appendChild(bk);stage.appendChild(view);
  if(!flat){var fr=el('img','br-frame');fr.src=base+lay.frame;fr.alt='';bk.appendChild(fr);}
  /* page-stack depth: fore-edge + bottom edge of each block, thickness follows position in the book */
  function pct(o){return 'left:'+o.x*100+'%;top:'+o.y*100+'%;width:'+o.w*100+'%;height:'+o.h*100+'%';}
  function mkStack(side){
    var g=lay[side],sm=lay.sm*100,bm=lay.bm*100,e=el('div','br-stk br-stk-'+side),b=el('div','br-stk br-stk-b br-stk-'+side+'b');
    e.style.top=g.y*100+'%';e.style.height=(g.h+lay.bm)*100+'%';
    b.style.top=(g.y+g.h)*100+'%';b.style.left=g.x*100+'%';b.style.width=g.w*100+'%';
    if(side==='L'){e.style.right=(100-g.x*100)+'%';}else{e.style.left=(g.x+g.w)*100+'%';}
    bk.appendChild(e);bk.appendChild(b);return {e:e,b:b,max:sm,bmax:bm};}
  var STL=flat?null:mkStack('L'),STR=flat?null:mkStack('R');
  function slot(side){var s=el('div','br-slot'),f=el('div','br-face'),i=el('img');f.appendChild(i);s.appendChild(f);s.style.cssText=pct(lay[side]);bk.appendChild(s);return {s:s,i:i};}
  var SL=slot('L'),SR=slot('R');
  if(flat){ /* plain chapbook: pages as scanned; spine shadow + two staples unless cfg.spine===false (spiral-bound scans) */
    if(cfg.spine!==false){
    var sp=el('div','br-spine');bk.appendChild(sp);
    [26,72].forEach(function(t){var st=el('div','br-staple');st.style.top=t+'%';bk.appendChild(st);});
    }
  }else{var sh=el('img','br-shade');sh.src=base+lay.shade;sh.alt='';bk.appendChild(sh);}
  var bPrev=bar.querySelector('[data-a=prev]')||{},bNext=bar.querySelector('[data-a=next]')||{},jumpSel=bar.querySelector('.br-jump');

  /* pages come either as one file per page (cfg.page) or as spread sheets holding two facing pages (cfg.sheet) */
  /* optional page-turn sounds (cfg.sounds = list of files under base) */
  var snd=(cfg.sounds||[]).map(function(u){var a=new Audio(base+u);a.preload='auto';a.volume=0.42;return a;});
  function swish(){if(!snd.length)return;try{snd.forEach(function(x){try{x.pause();}catch(e){}});var a=snd[Math.floor(Math.random()*snd.length)];a.currentTime=0;var p=a.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
  function url(n){if(!n)return '';return cfg.sheet?cfg.sheet(Math.floor((n-leftStart)/2)):page(n);}
  function halfOf(n){return ((n-leftStart)%2===0)?'br-half-l':'br-half-r';}
  function putImg(img,n){if(n){img.src=url(n);img.className=cfg.sheet?halfOf(n):'';}else{img.removeAttribute('src');img.className='';}}
  function setImg(s,n){putImg(s.i,n);}
  function pre(n){if(n){var i=new Image();i.src=url(n);}}
  function spreadOf(v){return spreads[v-off];}
  function isClosed(v){return hasCov&&(v===0||(hasBack&&v===nViews-1));}
  function setStacks(v){
    if(flat)return;
    var span=Math.max(1,total-leftStart),tl,tr;
    if(v<=0&&hasCov){tl=0;tr=1;}else if(hasBack&&v>=nViews-1){tl=1;tr=0;}
    else{var s=spreadOf(v),l=s[0]||leftStart,r=s[1]||total;
      tl=Math.max(0,Math.min(1,(l-leftStart)/span));tr=Math.max(0,Math.min(1,(total-r)/span));}
    // never fully flat: front/back boards + a few leaves are always present
    tl=0.08+0.92*tl;tr=0.08+0.92*tr;
    STL.e.style.width=(STL.max*tl)+'%';STR.e.style.width=(STR.max*tr)+'%';
    STL.b.style.height=(STL.bmax*tl)+'%';STR.b.style.height=(STR.bmax*tr)+'%';
  }
  function layoutMode(){
    var s=window.innerWidth<760&&window.innerHeight>window.innerWidth*0.8;
    view.style.setProperty('--asp',s?lay.aspect/2:lay.aspect);
    view.classList.toggle('br-clip',s);root.classList.toggle('br-single',s);single=s;
  }
  function applyHalf(s){
    if(!single){root.classList.remove('br-half-r');return;}
    if(!s[0])half='r';else if(!s[1])half='l';
    root.classList.toggle('br-half-r',half==='r');}
  function renderSpread(v){var s=spreadOf(v);setImg(SL,s[0]);setImg(SR,s[1]);applyHalf(s);
    [spreads[v-off+1],spreads[v-off-1]].forEach(function(x){if(x){pre(x[0]);pre(x[1]);}});}
  function state(v){
    root.classList.toggle('br-st-closed',isClosed(v));root.classList.toggle('br-st-open',!isClosed(v));
    if(hasBack){imgF.classList.toggle('br-off',v===nViews-1);imgB.classList.toggle('br-off',v!==nViews-1);}
    bPrev.disabled=v<=0;bNext.disabled=v>=nViews-1;setStacks(v);
    try{history.replaceState(null,'','#'+v);}catch(e){}}
  function flip(v0,v1){
    var s0=spreadOf(v0),s1=spreadOf(v1),fwd=v1>v0;busy=true;
    var g=fwd?lay.R:lay.L,leaf=el('div','br-leaf '+(fwd?'br-fwd':'br-bwd'));
    leaf.style.cssText=pct(g)+';transform-origin:'+(fwd?'left':'right')+' center;';
    var f1=el('div','br-face'),i1=el('img'),f2=el('div','br-face br-back'),i2=el('img');
    f1.appendChild(i1);f2.appendChild(i2);leaf.appendChild(f1);leaf.appendChild(f2);
    if(fwd){putImg(i1,s0[1]);putImg(i2,s1[0]);setImg(SR,s1[1]);}
    else{putImg(i1,s0[0]);putImg(i2,s1[1]);setImg(SL,s1[0]);}
    bk.appendChild(leaf);void leaf.offsetWidth;
    leaf.style.transform='rotateY('+(fwd?-180:180)+'deg)';
    var done=false;function fin(){if(done)return;done=true;
      if(fwd)setImg(SL,s1[0]);else setImg(SR,s1[1]);
      if(leaf.parentNode)leaf.parentNode.removeChild(leaf);busy=false;renderSpread(v1);}
    leaf.addEventListener('transitionend',fin);setTimeout(fin,1000);
  }
  function show(v,instant){
    if(busy)return;v=Math.max(0,Math.min(nViews-1,v));
    if(v!==cur)swish();
    if(isClosed(v)){cur=v;state(v);return;}
    if(!isClosed(cur)&&!instant&&Math.abs(v-cur)===1&&!single){var v0=cur;cur=v;state(v);flip(v0,v);return;}
    cur=v;renderSpread(v);state(v);
  }
  api.next=function(){
    if(busy)return;
    if(single&&!isClosed(cur)){var s=spreadOf(cur);if(half==='l'&&s[1]){half='r';applyHalf(s);swish();return;}half='l';}
    else if(single)half='l';
    show(cur+1);};
  api.prev=function(){
    if(busy)return;
    if(single&&!isClosed(cur)){var s=spreadOf(cur);if(half==='r'&&s[0]){half='l';applyHalf(s);swish();return;}half='r';}
    else if(single)half='r';
    show(cur-1);};
  bPrev.onclick=api.prev;bNext.onclick=api.next;
  if(jumpSel)jumpSel.onchange=function(){var v=parseInt(this.value,10);this.value='';if(!isNaN(v)){busy=false;show(v,true);}};
  if(closed)closed.onclick=function(){show(cur===0?1:cur-1);};
  /* click a page to turn it: right page = forward, left page = back (phones: left third = back, rest = forward) */
  SL.s.onclick=function(e){if(single){var r=SL.s.getBoundingClientRect();e.clientX-r.left<r.width*0.3?api.prev():api.next();}else api.prev();};
  SR.s.onclick=function(e){if(single){var r=SR.s.getBoundingClientRect();e.clientX-r.left<r.width*0.3?api.prev():api.next();}else api.next();};
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'||e.key==='PageDown')api.next();else if(e.key==='ArrowLeft'||e.key==='PageUp')api.prev();});
  var tx=null;stage.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});
  stage.addEventListener('touchend',function(e){if(tx==null)return;var dx=e.changedTouches[0].clientX-tx;tx=null;
    if(Math.abs(dx)>50){dx<0?api.next():api.prev();}},{passive:true});
  window.addEventListener('resize',function(){var was=single;layoutMode();if(was!==single&&!isClosed(cur)){half='l';renderSpread(cur);}});
  layoutMode();
  var h=parseInt((location.hash||'').replace('#',''),10);
  cur=isNaN(h)?0:Math.max(0,Math.min(nViews-1,h));
  if(!isClosed(cur))renderSpread(cur);state(cur);
  api.show=show;api.view=function(){return cur;};
  return api;
};
})();
