/*! For license information please see main.502504faa9ec22dca16e.bundle.js.LICENSE.txt */
(()=>{var e,t={197:(e,t,s)=>{"use strict";s(260);class r extends Phaser.Physics.Arcade.Sprite{constructor(e,t,s){super(e,t,s,"phaser-logo"),e.add.existing(this),e.physics.add.existing(this),this.setCollideWorldBounds(!0).setBounce(.6).setInteractive().on("pointerdown",(()=>{this.setVelocityY(-400)}))}}class a extends Phaser.GameObjects.Text{constructor(e){super(e,10,10,"",{color:"black",fontSize:"28px"}),e.add.existing(this),this.setOrigin(0)}update(){this.setText(`FPS: ${Math.floor(this.scene.game.loop.actualFps)}`)}}class o extends Phaser.Scene{constructor(){super({key:"MainScene"})}create(){new r(this,this.cameras.main.width/2,0),this.fpsText=new a(this),this.add.text(this.cameras.main.width-15,15,`Phaser3 v${Phaser.VERSION}`,{color:"#00000F",fontSize:"24px"}).setOrigin(1,0)}update(){this.fpsText.update()}}class n extends Phaser.Scene{constructor(){super({key:"PreloadScene"})}preload(){this.load.image("phaser-logo","assets/img/phaser-logo.png")}create(){this.scene.start("MainScene")}}const c={type:Phaser.AUTO,backgroundColor:"#ffffff",scale:{parent:"phaser-game",mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:1280,height:720},scene:[n,o],physics:{default:"arcade",arcade:{debug:!1,gravity:{y:400}}}};window.addEventListener("load",(()=>{new Phaser.Game(c)}))},204:()=>{console.log("%c %c %c %c %c Built using phaser-project-template %c https://github.com/yandeu/phaser-project-template","background: #ff0000","background: #ffff00","background: #00ff00","background: #00ffff","color: #fff; background: #000000;","background: none")}},s={};function r(e){var a=s[e];if(void 0!==a)return a.exports;var o=s[e]={exports:{}};return t[e].call(o.exports,o,o.exports,r),o.exports}r.m=t,e=[],r.O=(t,s,a,o)=>{if(!s){var n=1/0;for(h=0;h<e.length;h++){for(var[s,a,o]=e[h],c=!0,i=0;i<s.length;i++)(!1&o||n>=o)&&Object.keys(r.O).every((e=>r.O[e](s[i])))?s.splice(i--,1):(c=!1,o<n&&(n=o));c&&(e.splice(h--,1),t=a())}return t}o=o||0;for(var h=e.length;h>0&&e[h-1][2]>o;h--)e[h]=e[h-1];e[h]=[s,a,o]},r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),(()=>{var e={179:0};r.O.j=t=>0===e[t];var t=(t,s)=>{var a,o,[n,c,i]=s,h=0;for(a in c)r.o(c,a)&&(r.m[a]=c[a]);if(i)var d=i(r);for(t&&t(s);h<n.length;h++)o=n[h],r.o(e,o)&&e[o]&&e[o][0](),e[n[h]]=0;return r.O(d)},s=self.webpackChunkld48=self.webpackChunkld48||[];s.forEach(t.bind(null,0)),s.push=t.bind(null,s.push.bind(s))})(),r.O(void 0,[216],(()=>r(197)));var a=r.O(void 0,[216],(()=>r(204)));a=r.O(a)})();