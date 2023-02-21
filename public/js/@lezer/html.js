import{ContextTracker,ExternalTokenizer,LRParser}from"@lezer/lr";import{styleTags,tags}from"@lezer/highlight";import{parseMixed}from"@lezer/common";const scriptText=53,StartCloseScriptTag=1,styleText=54,StartCloseStyleTag=2,textareaText=55,StartCloseTextareaTag=3,StartTag=4,StartScriptTag=5,StartStyleTag=6,StartTextareaTag=7,StartSelfClosingTag=8,StartCloseTag=9,NoMatchStartCloseTag=10,MismatchedStartCloseTag=11,missingCloseTag=56,IncompleteCloseTag=12,commentContent$1=57,Element=18,ScriptText=27,StyleText=30,TextareaText=33,OpenTag=35,Dialect_noMatch=0;const selfClosers={area:true,base:true,br:true,col:true,command:true,embed:true,frame:true,hr:true,img:true,input:true,keygen:true,link:true,meta:true,param:true,source:true,track:true,wbr:true,menuitem:true};const implicitlyClosed={dd:true,li:true,optgroup:true,option:true,p:true,rp:true,rt:true,tbody:true,td:true,tfoot:true,th:true,tr:true};const closeOnOpen={dd:{dd:true,dt:true},dt:{dd:true,dt:true},li:{li:true},option:{option:true,optgroup:true},optgroup:{optgroup:true},p:{address:true,article:true,aside:true,blockquote:true,dir:true,div:true,dl:true,fieldset:true,footer:true,form:true,h1:true,h2:true,h3:true,h4:true,h5:true,h6:true,header:true,hgroup:true,hr:true,menu:true,nav:true,ol:true,p:true,pre:true,section:true,table:true,ul:true},rp:{rp:true,rt:true},rt:{rp:true,rt:true},tbody:{tbody:true,tfoot:true},td:{td:true,th:true},tfoot:{tbody:true},th:{td:true,th:true},thead:{tbody:true,tfoot:true},tr:{tr:true}};function nameChar(ch){return ch==45||ch==46||ch==58||ch>=65&&ch<=90||ch==95||ch>=97&&ch<=122||ch>=161}function isSpace(ch){return ch==9||ch==10||ch==13||ch==32}let cachedName=null,cachedInput=null,cachedPos=0;function tagNameAfter(input,offset){let pos=input.pos+offset;if(cachedPos==pos&&cachedInput==input)return cachedName;let next=input.peek(offset);while(isSpace(next))next=input.peek(++offset);let name="";for(;;){if(!nameChar(next))break;name+=String.fromCharCode(next);next=input.peek(++offset)}cachedInput=input;cachedPos=pos;return cachedName=name?name.toLowerCase():next==question||next==bang?undefined:null}const lessThan=60,greaterThan=62,slash=47,question=63,bang=33,dash=45;function ElementContext(name,parent){this.name=name;this.parent=parent;this.hash=parent?parent.hash:0;for(let i=0;i<name.length;i++)this.hash+=(this.hash<<4)+name.charCodeAt(i)+(name.charCodeAt(i)<<8)}const startTagTerms=[StartTag,StartSelfClosingTag,StartScriptTag,StartStyleTag,StartTextareaTag];const elementContext=new ContextTracker({start:null,shift(context,term,stack,input){return startTagTerms.indexOf(term)>-1?new ElementContext(tagNameAfter(input,1)||"",context):context},reduce(context,term){return term==Element&&context?context.parent:context},reuse(context,node,stack,input){let type=node.type.id;return type==StartTag||type==OpenTag?new ElementContext(tagNameAfter(input,1)||"",context):context},hash(context){return context?context.hash:0},strict:false});const tagStart=new ExternalTokenizer((input,stack)=>{if(input.next!=lessThan){if(input.next<0&&stack.context)input.acceptToken(missingCloseTag);return}input.advance();let close=input.next==slash;if(close)input.advance();let name=tagNameAfter(input,0);if(name===undefined)return;if(!name)return input.acceptToken(close?IncompleteCloseTag:StartTag);let parent=stack.context?stack.context.name:null;if(close){if(name==parent)return input.acceptToken(StartCloseTag);if(parent&&implicitlyClosed[parent])return input.acceptToken(missingCloseTag,-2);if(stack.dialectEnabled(Dialect_noMatch))return input.acceptToken(NoMatchStartCloseTag);for(let cx=stack.context;cx;cx=cx.parent)if(cx.name==name)return;input.acceptToken(MismatchedStartCloseTag)}else{if(name=="script")return input.acceptToken(StartScriptTag);if(name=="style")return input.acceptToken(StartStyleTag);if(name=="textarea")return input.acceptToken(StartTextareaTag);if(selfClosers.hasOwnProperty(name))return input.acceptToken(StartSelfClosingTag);if(parent&&closeOnOpen[parent]&&closeOnOpen[parent][name])input.acceptToken(missingCloseTag,-1);else input.acceptToken(StartTag)}},{contextual:true});const commentContent=new ExternalTokenizer(input=>{for(let dashes=0,i=0;;i++){if(input.next<0){if(i)input.acceptToken(commentContent$1);break}if(input.next==dash){dashes++}else if(input.next==greaterThan&&dashes>=2){if(i>3)input.acceptToken(commentContent$1,-2);break}else{dashes=0}input.advance()}});function contentTokenizer(tag,textToken,endToken){let lastState=2+tag.length;return new ExternalTokenizer(input=>{for(let state=0,matchedLen=0,i=0;;i++){if(input.next<0){if(i)input.acceptToken(textToken);break}if(state==0&&input.next==lessThan||state==1&&input.next==slash||state>=2&&state<lastState&&input.next==tag.charCodeAt(state-2)){state++;matchedLen++}else if((state==2||state==lastState)&&isSpace(input.next)){matchedLen++}else if(state==lastState&&input.next==greaterThan){if(i>matchedLen)input.acceptToken(textToken,-matchedLen);else input.acceptToken(endToken,-(matchedLen-2));break}else if((input.next==10||input.next==13)&&i){input.acceptToken(textToken,1);break}else{state=matchedLen=0}input.advance()}})}const scriptTokens=contentTokenizer("script",scriptText,StartCloseScriptTag);const styleTokens=contentTokenizer("style",styleText,StartCloseStyleTag);const textareaTokens=contentTokenizer("textarea",textareaText,StartCloseTextareaTag);const htmlHighlighting=styleTags({"Text RawText":tags.content,"StartTag StartCloseTag SelfCloserEndTag EndTag SelfCloseEndTag":tags.angleBracket,TagName:tags.tagName,"MismatchedCloseTag/TagName":[tags.tagName,tags.invalid],AttributeName:tags.attributeName,"AttributeValue UnquotedAttributeValue":tags.attributeValue,Is:tags.definitionOperator,"EntityReference CharacterReference":tags.character,Comment:tags.blockComment,ProcessingInst:tags.processingInstruction,DoctypeDecl:tags.documentMeta});const parser=LRParser.deserialize({version:14,states:",xOVOxOOO!WQ!bO'#CoO!]Q!bO'#CyO!bQ!bO'#C|O!gQ!bO'#DPO!lQ!bO'#DRO!qOXO'#CnO!|OYO'#CnO#XO[O'#CnO$eOxO'#CnOOOW'#Cn'#CnO$lO!rO'#DSO$tQ!bO'#DUO$yQ!bO'#DVOOOW'#Dj'#DjOOOW'#DX'#DXQVOxOOO%OQ#tO,59ZO%WQ#tO,59eO%`Q#tO,59hO%hQ#tO,59kO%pQ#tO,59mOOOX'#D]'#D]O%xOXO'#CwO&TOXO,59YOOOY'#D^'#D^O&]OYO'#CzO&hOYO,59YOOO['#D_'#D_O&pO[O'#C}O&{O[O,59YOOOW'#D`'#D`O'TOxO,59YO'[Q!bO'#DQOOOW,59Y,59YOOO`'#Da'#DaO'aO!rO,59nOOOW,59n,59nO'iQ!bO,59pO'nQ!bO,59qOOOW-E7V-E7VO'sQ#tO'#CqOOQO'#DY'#DYO(OQ#tO1G.uOOOX1G.u1G.uO(WQ#tO1G/POOOY1G/P1G/PO(`Q#tO1G/SOOO[1G/S1G/SO(hQ#tO1G/VOOOW1G/V1G/VO(pQ#tO1G/XOOOW1G/X1G/XOOOX-E7Z-E7ZO(xQ!bO'#CxOOOW1G.t1G.tOOOY-E7[-E7[O(}Q!bO'#C{OOO[-E7]-E7]O)SQ!bO'#DOOOOW-E7^-E7^O)XQ!bO,59lOOO`-E7_-E7_OOOW1G/Y1G/YOOOW1G/[1G/[OOOW1G/]1G/]O)^Q&jO,59]OOQO-E7W-E7WOOOX7+$a7+$aOOOY7+$k7+$kOOO[7+$n7+$nOOOW7+$q7+$qOOOW7+$s7+$sO)iQ!bO,59dO)nQ!bO,59gO)sQ!bO,59jOOOW1G/W1G/WO)xO,UO'#CtO*ZO7[O'#CtOOQO1G.w1G.wOOOW1G/O1G/OOOOW1G/R1G/ROOOW1G/U1G/UOOOO'#DZ'#DZO*lO,UO,59`OOQO,59`,59`OOOO'#D['#D[O*}O7[O,59`OOOO-E7X-E7XOOQO1G.z1G.zOOOO-E7Y-E7Y",stateData:"+h~O!]OS~OSSOTPOUQOVROWTOY]OZ[O[^O^^O_^O`^Oa^Ow^Oz_O!cZO~OdaO~OdbO~OdcO~OddO~OdeO~O!VfOPkP!YkP~O!WiOQnP!YnP~O!XlORqP!YqP~OSSOTPOUQOVROWTOXqOY]OZ[O[^O^^O_^O`^Oa^Ow^O!cZO~O!YrO~P#dO!ZsO!duO~OdvO~OdwO~OfyOj|O~OfyOj!OO~OfyOj!QO~OfyOj!SO~OfyOj!UO~O!VfOPkX!YkX~OP!WO!Y!XO~O!WiOQnX!YnX~OQ!ZO!Y!XO~O!XlORqX!YqX~OR!]O!Y!XO~O!Y!XO~P#dOd!_O~O!ZsO!d!aO~Oj!bO~Oj!cO~Og!dOfeXjeX~OfyOj!fO~OfyOj!gO~OfyOj!hO~OfyOj!iO~OfyOj!jO~Od!kO~Od!lO~Od!mO~Oj!nO~Oi!qO!_!oO!a!pO~Oj!rO~Oj!sO~Oj!tO~O_!uO`!uOa!uO!_!wO!`!uO~O_!xO`!xOa!xO!a!wO!b!xO~O_!uO`!uOa!uO!_!{O!`!uO~O_!xO`!xOa!xO!a!{O!b!xO~O`_a!cwz!c~",goto:"%o!_PPPPPPPPPPPPPPPPPP!`!fP!lPP!xPP!{#O#R#X#[#_#e#h#k#q#w!`P!`!`P#}$T$k$q$w$}%T%Z%aPPPPPPPP%gX^OX`pXUOX`pezabcde{}!P!R!TR!q!dRhUR!XhXVOX`pRkVR!XkXWOX`pRnWR!XnXXOX`pQrXR!XpXYOX`pQ`ORx`Q{aQ}bQ!PcQ!RdQ!TeZ!e{}!P!R!TQ!v!oR!z!vQ!y!pR!|!yQgUR!VgQjVR!YjQmWR![mQpXR!^pQtZR!`tS_O`ToXp",nodeNames:"⚠ StartCloseTag StartCloseTag StartCloseTag StartTag StartTag StartTag StartTag StartTag StartCloseTag StartCloseTag StartCloseTag IncompleteCloseTag Document Text EntityReference CharacterReference InvalidEntity Element OpenTag TagName Attribute AttributeName Is AttributeValue UnquotedAttributeValue EndTag ScriptText CloseTag OpenTag StyleText CloseTag OpenTag TextareaText CloseTag OpenTag CloseTag SelfClosingTag Comment ProcessingInst MismatchedCloseTag CloseTag DoctypeDecl",maxTerm:66,context:elementContext,nodeProps:[["closedBy",-11,1,2,3,4,5,6,7,8,9,10,11,"EndTag",-4,19,29,32,35,"CloseTag"],["group",-9,12,15,16,17,18,38,39,40,41,"Entity",14,"Entity TextContent",-3,27,30,33,"TextContent Entity"],["openedBy",26,"StartTag StartCloseTag",-4,28,31,34,36,"OpenTag"]],propSources:[htmlHighlighting],skippedNodes:[0],repeatNodeCount:9,tokenData:"!#b!aR!WOX$kXY)sYZ)sZ]$k]^)s^p$kpq)sqr$krs*zsv$kvw+dwx2yx}$k}!O3f!O!P$k!P!Q7_!Q![$k![!]8u!]!^$k!^!_>b!_!`!!p!`!a8T!a!c$k!c!}8u!}#R$k#R#S8u#S#T$k#T#o8u#o$f$k$f$g&R$g%W$k%W%o8u%o%p$k%p&a8u&a&b$k&b1p8u1p4U$k4U4d8u4d4e$k4e$IS8u$IS$I`$k$I`$Ib8u$Ib$Kh$k$Kh%#t8u%#t&/x$k&/x&Et8u&Et&FV$k&FV;'S8u;'S;:j<t;:j?&r$k?&r?Ah8u?Ah?BY$k?BY?Mn8u?Mn~$k!Z$vc^PiW!``!bpOX$kXZ&RZ]$k]^&R^p$kpq&Rqr$krs&qsv$kvw)Rwx'rx!P$k!P!Q&R!Q!^$k!^!_(k!_!a&R!a$f$k$f$g&R$g~$k!R&[V^P!``!bpOr&Rrs&qsv&Rwx'rx!^&R!^!_(k!_~&Rq&xT^P!bpOv&qwx'Xx!^&q!^!_'g!_~&qP'^R^POv'Xw!^'X!_~'Xp'lQ!bpOv'gx~'ga'yU^P!``Or'rrs'Xsv'rw!^'r!^!_(]!_~'r`(bR!``Or(]sv(]w~(]!Q(rT!``!bpOr(krs'gsv(kwx(]x~(kW)WXiWOX)RZ])R^p)Rqr)Rsw)Rx!P)R!Q!^)R!a$f)R$g~)R!a*O^^P!``!bp!]^OX&RXY)sYZ)sZ]&R]^)s^p&Rpq)sqr&Rrs&qsv&Rwx'rx!^&R!^!_(k!_~&R!Z+TT!_h^P!bpOv&qwx'Xx!^&q!^!_'g!_~&q!Z+kbiWa!ROX,sXZ.QZ],s]^.Q^p,sqr,srs.Qst/]tw,swx.Qx!P,s!P!Q.Q!Q!],s!]!^)R!^!a.Q!a$f,s$f$g.Q$g~,s!Z,xbiWOX,sXZ.QZ],s]^.Q^p,sqr,srs.Qst)Rtw,swx.Qx!P,s!P!Q.Q!Q!],s!]!^.i!^!a.Q!a$f,s$f$g.Q$g~,s!R.TTOp.Qqs.Qt!].Q!]!^.d!^~.Q!R.iO_!R!Z.pXiW_!ROX)RZ])R^p)Rqr)Rsw)Rx!P)R!Q!^)R!a$f)R$g~)R!Z/baiWOX0gXZ1qZ]0g]^1q^p0gqr0grs1qsw0gwx1qx!P0g!P!Q1q!Q!]0g!]!^)R!^!a1q!a$f0g$f$g1q$g~0g!Z0laiWOX0gXZ1qZ]0g]^1q^p0gqr0grs1qsw0gwx1qx!P0g!P!Q1q!Q!]0g!]!^2V!^!a1q!a$f0g$f$g1q$g~0g!R1tSOp1qq!]1q!]!^2Q!^~1q!R2VO`!R!Z2^XiW`!ROX)RZ])R^p)Rqr)Rsw)Rx!P)R!Q!^)R!a$f)R$g~)R!Z3SU!ax^P!``Or'rrs'Xsv'rw!^'r!^!_(]!_~'r!]3qe^PiW!``!bpOX$kXZ&RZ]$k]^&R^p$kpq&Rqr$krs&qsv$kvw)Rwx'rx}$k}!O5S!O!P$k!P!Q&R!Q!^$k!^!_(k!_!a&R!a$f$k$f$g&R$g~$k!]5_d^PiW!``!bpOX$kXZ&RZ]$k]^&R^p$kpq&Rqr$krs&qsv$kvw)Rwx'rx!P$k!P!Q&R!Q!^$k!^!_(k!_!`&R!`!a6m!a$f$k$f$g&R$g~$k!T6xV^P!``!bp!dQOr&Rrs&qsv&Rwx'rx!^&R!^!_(k!_~&R!X7hX^P!``!bpOr&Rrs&qsv&Rwx'rx!^&R!^!_(k!_!`&R!`!a8T!a~&R!X8`VjU^P!``!bpOr&Rrs&qsv&Rwx'rx!^&R!^!_(k!_~&R!a9U!YfSdQ^PiW!``!bpOX$kXZ&RZ]$k]^&R^p$kpq&Rqr$krs&qsv$kvw)Rwx'rx}$k}!O8u!O!P8u!P!Q&R!Q![8u![!]8u!]!^$k!^!_(k!_!a&R!a!c$k!c!}8u!}#R$k#R#S8u#S#T$k#T#o8u#o$f$k$f$g&R$g$}$k$}%O8u%O%W$k%W%o8u%o%p$k%p&a8u&a&b$k&b1p8u1p4U8u4U4d8u4d4e$k4e$IS8u$IS$I`$k$I`$Ib8u$Ib$Je$k$Je$Jg8u$Jg$Kh$k$Kh%#t8u%#t&/x$k&/x&Et8u&Et&FV$k&FV;'S8u;'S;:j<t;:j?&r$k?&r?Ah8u?Ah?BY$k?BY?Mn8u?Mn~$k!a=Pe^PiW!``!bpOX$kXZ&RZ]$k]^&R^p$kpq&Rqr$krs&qsv$kvw)Rwx'rx!P$k!P!Q&R!Q!^$k!^!_(k!_!a&R!a$f$k$f$g&R$g;=`$k;=`<%l8u<%l~$k!R>iW!``!bpOq(kqr?Rrs'gsv(kwx(]x!a(k!a!bKj!b~(k!R?YZ!``!bpOr(krs'gsv(kwx(]x}(k}!O?{!O!f(k!f!gAR!g#W(k#W#XGz#X~(k!R@SV!``!bpOr(krs'gsv(kwx(]x}(k}!O@i!O~(k!R@rT!``!bp!cPOr(krs'gsv(kwx(]x~(k!RAYV!``!bpOr(krs'gsv(kwx(]x!q(k!q!rAo!r~(k!RAvV!``!bpOr(krs'gsv(kwx(]x!e(k!e!fB]!f~(k!RBdV!``!bpOr(krs'gsv(kwx(]x!v(k!v!wBy!w~(k!RCQV!``!bpOr(krs'gsv(kwx(]x!{(k!{!|Cg!|~(k!RCnV!``!bpOr(krs'gsv(kwx(]x!r(k!r!sDT!s~(k!RD[V!``!bpOr(krs'gsv(kwx(]x!g(k!g!hDq!h~(k!RDxW!``!bpOrDqrsEbsvDqvwEvwxFfx!`Dq!`!aGb!a~DqqEgT!bpOvEbvxEvx!`Eb!`!aFX!a~EbPEyRO!`Ev!`!aFS!a~EvPFXOzPqF`Q!bpzPOv'gx~'gaFkV!``OrFfrsEvsvFfvwEvw!`Ff!`!aGQ!a~FfaGXR!``zPOr(]sv(]w~(]!RGkT!``!bpzPOr(krs'gsv(kwx(]x~(k!RHRV!``!bpOr(krs'gsv(kwx(]x#c(k#c#dHh#d~(k!RHoV!``!bpOr(krs'gsv(kwx(]x#V(k#V#WIU#W~(k!RI]V!``!bpOr(krs'gsv(kwx(]x#h(k#h#iIr#i~(k!RIyV!``!bpOr(krs'gsv(kwx(]x#m(k#m#nJ`#n~(k!RJgV!``!bpOr(krs'gsv(kwx(]x#d(k#d#eJ|#e~(k!RKTV!``!bpOr(krs'gsv(kwx(]x#X(k#X#YDq#Y~(k!RKqW!``!bpOrKjrsLZsvKjvwLowxNPx!aKj!a!b! g!b~KjqL`T!bpOvLZvxLox!aLZ!a!bM^!b~LZPLrRO!aLo!a!bL{!b~LoPMORO!`Lo!`!aMX!a~LoPM^OwPqMcT!bpOvLZvxLox!`LZ!`!aMr!a~LZqMyQ!bpwPOv'gx~'gaNUV!``OrNPrsLosvNPvwLow!aNP!a!bNk!b~NPaNpV!``OrNPrsLosvNPvwLow!`NP!`!a! V!a~NPa! ^R!``wPOr(]sv(]w~(]!R! nW!``!bpOrKjrsLZsvKjvwLowxNPx!`Kj!`!a!!W!a~Kj!R!!aT!``!bpwPOr(krs'gsv(kwx(]x~(k!V!!{VgS^P!``!bpOr&Rrs&qsv&Rwx'rx!^&R!^!_(k!_~&R",tokenizers:[scriptTokens,styleTokens,textareaTokens,tagStart,commentContent,0,1,2,3,4,5],topRules:{Document:[0,13]},dialects:{noMatch:0},tokenPrec:476});function getAttrs(element,input){let attrs=Object.create(null);for(let att of element.firstChild.getChildren("Attribute")){let name=att.getChild("AttributeName"),value=att.getChild("AttributeValue")||att.getChild("UnquotedAttributeValue");if(name)attrs[input.read(name.from,name.to)]=!value?"":value.name=="AttributeValue"?input.read(value.from+1,value.to-1):input.read(value.from,value.to)}return attrs}function maybeNest(node,input,tags){let attrs;for(let tag of tags){if(!tag.attrs||tag.attrs(attrs||(attrs=getAttrs(node.node.parent,input))))return{parser:tag.parser}}return null}function configureNesting(tags){let script=[],style=[],textarea=[];for(let tag of tags){let array=tag.tag=="script"?script:tag.tag=="style"?style:tag.tag=="textarea"?textarea:null;if(!array)throw new RangeError("Only script, style, and textarea tags can host nested parsers");array.push(tag)}return parseMixed((node,input)=>{let id=node.type.id;if(id==ScriptText)return maybeNest(node,input,script);if(id==StyleText)return maybeNest(node,input,style);if(id==TextareaText)return maybeNest(node,input,textarea);return null})}export{configureNesting,parser};