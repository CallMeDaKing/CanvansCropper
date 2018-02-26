![canvas](http://upload-images.jianshu.io/upload_images/1617138-145125c6393221f3.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
######友情链接
今天突然收到消息提醒，之前一篇文章[小程序采坑指南](https://www.jianshu.com/p/4fbf2d1eb402)被收加入到《小程序》专题。颇感意外，毕竟本人刚做小程序开发没多久。在此感谢支持和信赖。
####前言
 项目中使用了人脸识别功能， 需要用户上传自己的图片作为Marker，考虑到用户上传照片的不同需求，决定对用户上传的图片进行缩放和裁剪。

######需求 
 图片可上下左右滑动 ， 可放缩，用户把想要裁剪的图片，放到裁剪框，进行裁剪并上传，裁剪框固定。

先看下效果图
![canvas.gif](http://upload-images.jianshu.io/upload_images/1617138-29855675508fc324.gif?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

######需求解决和实现思路
考虑到自己独立做小程序时间并不长，第一反应，上网查找各位大佬的学习笔记和文档，拿过来学习，但是很遗憾的是找了几乎所有的资料，并没有发现可以解决我项目中需求的的资料，几乎所有的裁剪方式都是图片固定，裁剪框可以放缩移动（为了区分后者，这里就叫移动裁剪框方式）。没办法，只能自己写一个满足自己需求的固定区域的裁剪组件了（第二种方式暂且就叫做固定区域裁剪吧）。

写这个组件之前自己从网上下载了cavans 裁剪的相关代码进行学习，其实是为了弄明白裁剪原理是怎样的。既然可以通过缩放移动裁剪框，那么固定裁剪框，放缩和移动图片功能肯定也能实现，无非就是变通下的问题。（其实写的过程中发现，移动裁剪框和移动图片这两者需要考虑的角度真的差的不是一点点，后面我会细细道来）在这里分两部分。第一部分主要是对移动裁剪框实现原理的学习和总结，第二部分是如何实现固定区域进行裁剪。

#####第一部分 canvans裁剪原理学习  该部分主要是对前辈代码分析。
最好最快的学习方式就是模仿，首先从前辈的组件中找出我能够使用的代码，那就是裁剪功能，至于裁剪框的移动和放缩 暂且不做考虑，主要是为了快速明白裁剪原理 。（感谢源码作者，当时项目比较急，我竟然忘了是哪篇文章了。再次抱歉），通过对移动裁剪框方式的学习和代码的理解分析，明白了一点，其实裁剪功能是通过canvas 的两个API完成的。
```
//1 . 通过canvas 进行图片渲染
  const ctx = wx.createCanvasContext('myCanvas')
            ctx.drawImage(that.data.temp_file_path)  //that.data.temp_file_path 是我要渲染的图片路径
            ctx.draw()
```
```
//2 . 获取画布要裁剪的位置（距左和距上）和长度宽度
  wx.canvasToTempFilePath({
            x: canvasL,
            y: canvasT,
            width: canvasW,
            height: canvasH,
            destWidth: canvasW,
            destHeight: canvasH,
            canvasId: 'myCanvas',
            success: function (res) {
            //裁剪成功以后的操作
            }
          })
```
既然我们知道如何对canvas 操作，那么我们接下来就是需要计算出canvas 实际的裁剪区域，如何计算？
仔细理解下面一段代码
```
       //计算方式 均为百分比 * 画布中图片的长度    此种方式保证了在微信小程序中裁剪的图片模糊 ，位置不对的问题
        var canvasW = _this.data.cutW / _this.data.cropperW * _this.data.imageW / pixelRatio
        var canvasH = _this.data.cutH / _this.data.cropperH * _this.data.imageH / pixelRatio
        
        var canvasL = _this.data.cutL / _this.data.cropperW * _this.data.imageW / pixelRatio
        var canvasT = _this.data.cutT / _this.data.cropperH * _this.data.imageH / pixelRatio
```
下面分析下这个计算方式，先看这几行中的参数cutW、cutH、cutL、cutT ，分别代表的是裁剪框的长、宽、距左、距上，我们也是通过这几四个约束来确定裁剪框的大小和位置。cropperH和cropperW 是指展示图片的区域大小。imageH、imageW，是图片的实际大小。要明白展示图片区域的大小并不代表图片本身的大小，它是你在屏幕中使用css代码写的宽高来展示图片。
最后一个参数是pixelRatio ，看一下是如何定义的
```
var pixelRatio = wx.getSystemInfoSync().pixelRatio;
```
注意这里是异步！！不小心后面会犯错的。
查看了下官方文档
![来自小程序API_.pic_hd.jpg](http://upload-images.jianshu.io/upload_images/1617138-5ab2fc5fe6ee0da7.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
原来是设备像素比，官网中给出的解释很少，需要自己查下资料，毕竟作为大前端领域的小菜，虚心求教是好的，给大家推荐下面一篇文章[设备像素比devicePixelRatio简单介绍](http://www.zhangxinxu.com/wordpress/2012/08/window-devicepixelratio/),相信你看完以后就会明白了，定义如下。
>window.devicePixelRatio是设备上物理像素和设备独立像素(device-independent pixels (dips))的比例。
公式表示就是：window.devicePixelRatio = 物理像素 / dips

在这里浏览器就不讲了，毕竟自己水平有限，在我推荐的文档中也讲的很明白了。
单就移动端来讲，每种牌子的手机 都有自己的设备像素比，但是大致分为两类：
- iOS设备，screen.width乘以devicePixelRatio得到的是物理像素值。
- 在Android以及Windows Phone设备，screen.width除以devicePixelRatio得到的是设备独立像素(dips)值。
>[Vasilis](http://vasilis.nl/)有一个很好的理论：苹果像素，因为它想使显示更清晰，更流畅，而Android厂商增加的像素在屏幕上塞进更多的东西。它解释了为什么苹果强调非视网膜视网膜的连续性，而Android集中在原始像素数。

当我们调用API上传图片，获取图片信息时，其实微信给我们返回的是已经除以设备像素比的长和宽，有的朋友可能还不是很明白什么是屏幕物理像素，什么是设备独立像素。这么说吧，iPhone 6s 以下的非retina屏的手机的设备独立像素是320 （可以理解为屏幕宽度），物理像素也是320 ，所以手机界面看起来刚刚好，此时设备像素比是1 ，但是6s以下的retina屏幕的物理像素变成了640 ，（这里不对plus以后的举例子了，本人没有测试过。你可以在你的手机上跑下我的代码，看下调试器的数据输出就知道了）苹果为了不改变用户320设备像素的习惯 ，屏幕依然采用了320 的独立设备像素的设计，那么设备像素比就是2 ，那么该怎么才能在320 的视距宽度来放下640 的物理像素呢，那就是原来一个像素点的面积，现在用来表示两个像素点。刚好可以放下640 的屏幕物理像素，所以画质更加清晰，界面更流畅。

当然也可以尝试下不使用pixelRatio 来进行裁剪，你会发现裁剪出来的图片是糊的

咳咳，冷静下，明白了pixelRatio 的作用，那么我们再回到我们刚才的代码中去，我们看其中一句代码，如何计算裁剪区canvas 的宽？  其实就是裁剪框的宽比上图片展示区域的宽，然后比例乘以API返回图片的宽度，这样算出来就是canvas 上实际的裁剪宽度，其他的也一样计算。只不过需要换一下对应的参数，从这里我们先不用明白他是如何展示图片，如何裁剪的，我们的目的不仅是看懂这些代码，代码谁都能看懂，我们需要获得重要信息，就是如何计算一个图片裁剪区的实际大小，要明白这是对我们自己做固定区域裁剪计算提供理论帮助的。可以说我们后面所有的计算裁剪区域的基础都离不开这段代码。
知道了计算的原理下一步就是明白到底小程序中是如何对图片进行裁剪的，在此之前我们需要明白的事，到底裁剪的是哪张图片吗？是我们展示的图片吗？很明显不是，否则不用费这么大劲，又是设备像素比又是计算图片比例的，当我看到wxml 文件中关于canvas设置的约束是我才意识到，原来计算那么多，是在我看不到一个canvas 进行裁剪的！
```
<canvas canvas-id="myCanvas" style="position:absolute;border: 1px solid red; width:{{imageW}}rpx;height:{{imageH}}rpx;top:-9999px;left:-9999px;" ></canvas>

```
就像我一开始不明白，为什么这两个参数top:-9999px; left:-9999px 设置约束这么大，后来慢慢的才明白，我们展示图片的区域和裁剪框是用来给用户看的，实际上的裁剪区域是在上面代码中的canvas 进行的。因为图片的物理像素一般比较大，屏幕上无法直接放下的。所以将canvans进行隐藏掉。通过计算展示区域的裁剪框和图片的比例 间接获取到canvas 上图片的裁剪区域。

也就是说，我们只要获取到裁剪区域的宽高和位置，知道图片的宽高和位置，那我们就可以计算出canvas 中裁剪区域的大小了。然而现实总会给你狠狠一巴掌，哪有那么简单的事？

#####第二部分 实现固定区域裁剪

参考了前辈的代码，了解到了计算的基本理论，那么我们就开始动手，然后突然意识到事情并不像我想的那样简单，单纯移动还好计算，放缩情况下怎么计算？先移动后放缩和先放缩后移动的值一样吗？很明显不一样，思前想后列出来下面几种情况
- 普通移动图片裁剪
- 图片位置不变放缩裁剪
- 移动位置后再放缩    裁剪需要考虑放缩比例问题
- 放缩后再移动位置    同样需要考虑放缩比例和放缩后的位移以及放缩之前的位移变化



总算知道为什么大部分资料都是移动裁剪框的方式了，我这典型的是羊群里出了头驴，但是需求在这放着，不能前功尽弃啊， 咬咬牙，继续写吧，遇山开山，遇水搭桥，事实证明，坚持下来还是有收获的。

接下来考虑的事怎么计算图片位置呢？以什么为参考呢？因为我要同时考虑到移动和放缩情况下位置的偏移是完全不同的，没有思路， 回头又捋了一遍前辈们的代码，分析了下，因为我的裁剪框是固定在图片展示区域的水平居中的位置的，那么我展示图片最好好让裁剪区域位于我图片中心位置，这样一来美观度高一些，再者以图片中心，便于更好的计算距上和距左的距离大小。

嗯不错，总算有点眉目了，下面先做放缩和移动吧，我选择的方式是监听view touch点击事件，（其实这个有挺多实现方式，我考虑到用到放缩，刚好可以通过监听view的touch事件来计算出放缩比例，其他的方式并没有尝试，有什么好的简单的方式还希望不吝赐教）通过获取touch数组的个数来判断是单只操作还是双指放缩，如果数组个数是1，说明是单指滑动，然后通过view的catchtouchstart和catchtouchmove两个监听事件来动态计算滑动距离，进而计算图片的移动像素大小；如果数组的个数是两个，那么就说明是双指操作，计算出来的就是放缩的距离，进而换算成放缩比例即可。（因为代码有点多，占篇幅太长，在这里就不附上太多代码了，希望能理解，而且单纯摘抄部分代码，我感觉很难完全理解整个原理，重要的还是思路 ，所以如果想弄明白具体怎么实现的，建议从头到尾仔细看下我的源码，看两遍就懂了，如果有什么不明白的问题，欢迎随时垂询。本文章主要讲一下我的解决思路和关键代码，文章最后回附上我写的组件的github 链接，有需要的朋友可以下载，相互交流，共同学习）

既然放缩和移动的原理解决了，下面无非就是搭界面了，为了不让界面那么丑，我让图片的展示区域变为宽是700rpx ,高是500 rpx ,然后对展示的图片按照图片本身的宽高比进行摆放，这样图片不会变形，同时看起来感觉还不错

![until  you](http://upload-images.jianshu.io/upload_images/1617138-4e40f4ed8673eebc.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

展示图片区域的布局文件代码
```
<!--中间的图片显示  -->
<view class="img" catchtouchstart="touchstartCallback"  catchtouchmove="touchmoveCallback" catchtouchend="touchendCallback">
    <image style="transform:translate({{stv.offsetX}}px, {{stv.offsetY}}px) scale({{stv.scale}}); height:{{pic_height}}rpx; width:{{pic_width}}rpx; position:absolute; left:{{pic_L}}rpx; top:{{pic_T}}rpx;" src='{{temp_file_path}}'></image>   
  </view>
```
可以看到图片展示区域外层是个view，用来获取事件，内层是image 用来展示图片，通过对view的touch 事件捕捉来控制image的位置和大小，感觉我们是直接在拖拽和放缩图片的一样。
view的三个事件前面说了 ， 就不多讲了，transform是进行图片放缩和实现位置偏移的，offsetX、offsetY，x方向和y方向的偏移，也可说是距离原点的水平和垂直距离。（小程序规定，屏幕左上角为屏幕的原点，水平方向X轴垂直方向Y轴）scale 就是相对于原图片大小1 的缩放比例。大于1 是放大，小于1 是缩小。关于小程序坐标的问题这里就不多讲了，参考了了JS的 定义方式，有不明白的可以看这张图，和JS 还是有区别的

![小程序·API .png](http://upload-images.jianshu.io/upload_images/1617138-093a3fd291aeaa56.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

到这里我们需要解决的问题很明了了， 首先裁剪框的大小是固定的已知的，图片的大小也已知，我们只需要计算出裁剪框距左距上的位置带入公式就可以了！

下面就是分几种情况进行裁剪了

先看下touchStart 监听函数中的方法，不管是双指还是单指，记录最初的状态
 ```
//事件处理函数
  touchstartCallback: function (e) {
    //触摸开始
    console.log('touchstartCallback');
    console.log(e);
    console.log(" e.touches[0] ==",e.touches[0])
    
    if (e.touches.length === 1) {
      //单指拖动
      let { clientX, clientY } = e.touches[0];
      this.startX = clientX;
      this.startY = clientY;
      this.touchStartEvent = e.touches;
      pageX = clientX;
      pageY = clientY;

    } else {
      //两指放缩
      let xMove = e.touches[1].clientX - e.touches[0].clientX;
      let yMove = e.touches[1].clientY - e.touches[0].clientY;
      let distance = Math.sqrt(xMove * xMove + yMove * yMove);
      x_move = xMove;
      y_move = yMove;

      this.setData({
        'stv.distance': distance,
        'stv.zoom': true, //缩放状态
      })
    }

  },
```
下面的代码放在touchmoveCallback 中
1.普通移动图片裁剪方式    代码在touchmoveCallback 单指操作事件内
直接通过下面代码计算出手指滑动的距离再转为屏幕上像素移动的距离。
```
      let { clientX, clientY } = e.touches[0];
      let offsetX = clientX - this.startX;  //记录的事touchstart 事件中的x轴方向距离原点的距离。
      let offsetY = clientY - this.startY;
      console.log("offsetY----", offsetY)
      //实际像素的位移大小
      var dragLengthX = offsetX * dragScaleP ; 
      var dragLengthY = offsetY * dragScaleP ;
      //如果图片不在裁剪框内的话  暂时不做判断，后期有好的解决办法时再加
      var cut_L = this.data.cutL - dragLengthX;
      var cut_T = this.data.cutT - dragLengthY;

    //记录图片的距左和距上的距离，考虑到后面先移动后放缩情况。
      move_scale_L = cut_L;
      move_scale_T = cut_T;  
      console.log("移动状态下的move_scale_L", move_scale_L)
      console.log("移动状态下的move_scale_T", move_scale_T)

      this.setData({
          cutL: cut_L,
          cutT: cut_T,
        })
```
直接计算出来距左距上的位置，然后用我从前辈那学习到的计算方式，带入公式。

2.图片位置不变放缩裁剪     代码在touchmoveCallback 中双指操作条件内

这个是需要获取到放缩大小的，这种情况下图片肯定是没有移动的，直接通过放缩来计算放心大胆的计算。
```
 //双指缩放
      let xMove = e.touches[1].clientX - e.touches[0].clientX;
      let yMove = e.touches[1].clientY - e.touches[0].clientY;
      let distance = Math.sqrt(xMove * xMove + yMove * yMove);
      console.log("xMove---",xMove)
      console.log("yMove---",yMove)
      //在这里需要对绝对值计算，保证获取到的数据准确性
      let xmove = Math.abs(xMove) - Math.abs(x_move);
      let ymove = Math.abs(yMove) - Math.abs(y_move);
      //手势移动的距离 和 屏幕中图片的所占的长度比
      // pic_scale = (Math.abs(distancex) > Math.abs(distancey) ? distancex : distancey ) / pic_area; 
      let distanceDiff = distance - this.data.stv.distance;
      let newScale = this.data.stv.scale + 0.005 * distanceDiff;
      //这里计算出来的newScale  就是图片相对于初始图片的放缩比例，为了展示方便，把其他容易引起混乱的代码删掉了，其实还要在这里考虑先移动再放缩的情况。
        //直接放缩，然后拖动
        var cut_L = (pic_newW - cropper_w_h) / 2;
        var cut_T = (pic_newH - cropper_w_h) / 2;
      // 
      this.setData({
        'stv.distance': distance,
        'stv.scale': newScale,
        cutL: cut_L,
        cutT: cut_T,
    })
    }
```
如果是放缩，需要在用图片当前的距左和距上的位置减去我们动态拖动的距离，因为我们拖动的方向和裁剪区距离图片的方向移动是相反的。同时记得对图片进行缩放和偏移展示。

3. 移动位置后再放缩裁剪  和放缩够再移动位置    需要同时考虑下
这一种情况目前有小概率出现bug ，有一定几率的会裁剪位置发生偏移，想了半天觉得可能是我放缩后在移动的位置计算有误差导致的，这块需要考虑到东西有点多，日后如果修改完了，会更新。
这种情况下。需要有个全局的变量，动态记录图片的宽和高，为了后面计算裁剪框的位置，因为图片是动态变化的，这种变化还会影响原来位移的大小。现在还没有很清晰的思维方式，暂时算是个遗憾吧
先上我的代码计算方式
```
 if (e.touches.length === 1) {
      //单指移动 
      if (this.data.stv.zoom) {
    //这个条件是在已经放缩的情况下移动位置

        let { clientX, clientY } = e.touches[0];
        let offsetX = clientX - this.startX;
        let offsetY = clientY - this.startY

        //实际像素的位移大小
        var dragLengthX = offsetX * dragScaleP;
        var dragLengthY = offsetY * dragScaleP;
        //如果是放缩状态下，动态获取图片宽高并计算单指滑动的的位置
        var cut_L = this.data.cutL  - dragLengthX;
        var cut_T = this.data.cutT - dragLengthY;

        this.setData({
          cutL: cut_L,
          cutT: cut_T,
        })

        this.startX = clientX;
        this.startY = clientY;
        let { stv } = this.data;
        stv.offsetX += offsetX;
        stv.offsetY += offsetY;
        stv.offsetLeftX = -stv.offsetX;
        stv.offsetLeftY = -stv.offsetLeftY;
        this.setData({
          stv: stv
        });
      }
```
```
//双指缩放
      let xMove = e.touches[1].clientX - e.touches[0].clientX;
      let yMove = e.touches[1].clientY - e.touches[0].clientY;
      let distance = Math.sqrt(xMove * xMove + yMove * yMove)；
      //在这里需要对绝对值计算，保证获取到的数据准确性
      let xmove = Math.abs(xMove) - Math.abs(x_move);
      let ymove = Math.abs(yMove) - Math.abs(y_move);
      //手势移动的距离 和 屏幕中图片的所占的长度比
      // pic_scale = (Math.abs(distancex) > Math.abs(distancey) ? distancex : distancey ) / pic_area; 
      let distanceDiff = distance - this.data.stv.distance;
      let newScale = this.data.stv.scale + 0.005 * distanceDiff;
      
      pic_newH = this.data.pic_width * newScale;
      pic_newW = this.data.pic_height * newScale;

      //如果是放缩状态下，动态获取图片宽高并计算单指滑动的的位置 需要判断是先放缩还是先拖动
//move_scale_L 和 move_scale_T是比较重要的他记录了最初的图片的距左和距上的距离，和 图片单指移动后的距上和距左的距离。
      if(move_scale_L != 0  || move_scale_T != 0){
        //未放缩情况下先拖动，然后再放缩
        let move =  Math.abs(xmove) > Math.abs(ymove) ? xmove : ymove;
         var cut_L = move_scale_L * newScale + move ;
         var cut_T = move_scale_T * newScale + move;
        //这块可能涉及到比例问题，导致计算有误差。不是那么精确
      }else{
        //直接放缩，然后拖动
        var cut_L = (pic_newW - cropper_w_h) / 2;
        var cut_T = (pic_newH - cropper_w_h) / 2;
      }
   
      this.setData({
        'stv.distance': distance,
        'stv.scale': newScale,
        cutL: cut_L,
        cutT: cut_T,
    })
    }

```
额，关键代码大体就这么多，相信你看着这一块一块的代码已经蒙了，不要担心，这是因为在头脑中没有形成一个完整的思路，所以还是再次建议，如果想弄清楚具体考虑的情况，希望仔细看下源代码，因为确实情况有点多，不是一两句话能说明白的。请忽略代码排版和格式问题。如果不小心伤了您的眼镜请见谅，实在因为本人实在是菜鸡一枚，有什么错误或者不到位的地方，欢迎指正。
下面附上我的   [github地址](https://github.com/CallMeDaKing/CanvansCropper)   同时，如果您对我的代码有什么不清楚的地方或者代码有误的地方欢迎指正。
