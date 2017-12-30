var fucking = require('../../utils/fucking.js')
var kScreenW = 750;
var drag_top = 183.5; //拖动区域绝对距上位置
var view_H = 500;   //外层view的高度
var pic_area = 700;  //照片展示区域（宽高都为500）   注意小于拖动区域
//上传的图片信息

var pic_radio = 0;   //照片的宽高比
var pic_left = 0;    //距左
var pic_top = 0;     //距上
var tempFilePaths = ''; //路径
var sourceFilePath = '';//存储裁剪完的图片url
var pixelRatio = wx.getSystemInfoSync().pixelRatio;
var dragScaleP = 2; //  手势移动和实际像素位移比

// 拖动时候的 pageX
var pageX = 0;
// 拖动时候的 pageY
var pageY = 0;
//拖动前两指间x方向的距离
var x_move = 0;
//拖动前两指y 方向的距离
var y_move = 0;

var pic_scale = 0;
var cropper_w_h = 387;

//动态放缩状态下的图片位置和大小
var  image_w = 0;
var  image_h = 0;
var  pic_newW = 0;
var  pic_newH = 0;
var  newScalse = 0;

//记录从控件上传的图片
var Index = 1000;

//如果先移动再放缩，记录此时的位置
var move_scale_L = 0;
var move_scale_T = 0;
var isFlag = true;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imageWidth: 0,
    imageHeight: 0,
    image_url_arry:[],
    letter_content:'',
    letter_type:-1,
    temp_file_path:'',
    lock_image_1:'../../Resource/9/plus1.png',
    lock_image_2:'../../Resource/9/plus1.png',
    lock_image_3:'../../Resource/9/plus1.png',
    lock_image_4:'../../Resource/9/plus1.png',
    lock_image_5:'../../Resource/9/plus1.png',
    stv: {
      offsetX: 0,
      offsetY: 0,
      zoom: false, //是否缩放状态
      distance: 0,  //两指距离
      scale: 1,  //缩放倍数
    },
    // 展示图片的信息
    pic_height:0,
    pic_width:0,
    pic_L:0,
    pic_T:0,
    pic_H : 0,
    pic_w : 0,
    // 裁剪框大小
    cropper_w_H :387,
    cropper_top : 56.5,
    cropper_left : 0,
    isChoose:false,
    pic_tempfile:'',
    // 裁剪框的初始位置
    cutL:0,
    cutT:0,
    cutW:0,
    cutH:0,

    cut_url:'',
    isDone:false,
  },
  onShow:function(){
    isFlag = true;
  },
  //获取到上一页的数据作为这一页的参数传到服务器
  onLoad:function (option) {
    
    this.setData({
      
      //屏幕宽高
      imageWidth: 375,
      imageHeight: 603,

    })
  },
  add_lock_image_1:function(){

    this.upload_image(0)
  },
  add_lock_image_2: function () {

    this.upload_image(1)
  },
  add_lock_image_3: function () {

    this.upload_image(2)

  },
  add_lock_image_4: function () {

    this.upload_image(3)

  },
  add_lock_image_5: function () {

    this.upload_image(4)
  },

  //创建信
  create_letter: function () {

    var postData = {};

    postData.title = '信标题，无需解锁可见内容';
    postData.letter_type = this.data.letter_type;
    console.log("this.data.letter_type的内容是", this.data.letter_type)
    postData.screen_id = '0';   
    postData.letter_value = this.data.letter_content;


    //添加图文列表
    if (this.data.letter_type === 0){
      postData.image_url_arry = this.data.image_url_arry;
      console.log("postData.image_url_arry的内容是", this.data.image_url_arry)
    }
    //添加解锁人的列表 ,就写2个，意思一下
    var lock_image_url_arry = [];

      // 测试代码，为了便于测试，正式版中此代码删去 
    console.log("this.data.lock_image_5----", this.data.lock_image_5)
    if (this.data.lock_image_1 != '../../Resource/9/plus1.png'){
       lock_image_url_arry.push(this.data.lock_image_1)
    }
    if (this.data.lock_image_2 != '../../Resource/9/plus1.png') {
      lock_image_url_arry.push(this.data.lock_image_2)
    }
    if (this.data.lock_image_3 != '../../Resource/9/plus1.png') {
      lock_image_url_arry.push(this.data.lock_image_3)
    }
    if (this.data.lock_image_4 != '../../Resource/9/plus1.png') {
      lock_image_url_arry.push(this.data.lock_image_4)
    }
    
    if (this.data.lock_image_5 != '../../Resource/9/plus1.png') {
      lock_image_url_arry.push(this.data.lock_image_5)
    }

    postData.unlock_image_arry = lock_image_url_arry;

    fucking.post('/create_letter', postData, function (d) {
      console.log("上传返回数据", d);

      if (d.retcode == 0) {
        if(isFlag){
          isFlag = false;
          wx.navigateTo({
            url: '../letterPage/letterPage?letter_id=' + d.letter._id,
          })
        }

      }
    })

  },
  // 上传图片
  upload_image: function (index) {

    var that = this;
    //每次选择照片时初始化这几个个值
    pic_newW = 0;
    pic_newH = 0;  
    x_move = 0;
    y_move = 0;

    if (!this.data.isChoose){
      Index = index;
      wx.showLoading({
        title: '上传图片中',
        mask: true
      }),
      setTimeout((function callback() {
          wx.hideLoading();
        }).bind(this), 2000);

      wx.chooseImage({
      count: 1, // 默认9  
      sizeType: ['original','compressed'], // 可以指定是原图还是压缩图，默认二者都有  compressed
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        // tempFilePaths = res.tempFilePaths[0]

        that.setData({ temp_file_path: res.tempFilePaths[0], isChoose: true ,isDone :false})
        switch (index) {
          case 0: {
            that.setData({ lock_image_1: '../../Resource/9/right1.png' });
          }
            break;
          case 1: {
            that.setData({ lock_image_2: '../../Resource/9/right1.png' });
          }
            break;
          case 2: {
            that.setData({ lock_image_3: '../../Resource/9/right1.png' });
          }
            break;
          case 3: {
            that.setData({ lock_image_4: '../../Resource/9/right1.png' })
          }
            break;
          case 4: {
            that.setData({ lock_image_5: '../../Resource/9/right1.png' });
          }
            break;
        }

        wx.getImageInfo({
          src: that.data.temp_file_path,
          success: function(res) {
            wx.hideLoading();
            console.log("照片信息", res)
            //获取图片宽高
            console.log('获取图片宽',res.width)
            console.log('获取图片高',res.height)

            var pic_radio = res.width / res.height;
            //考虑到宽高比不同，图片的显示方式不同

            if (pic_radio >= 1) {
              //以宽边为参考
              pic_newW = pic_area;
              pic_newH = pic_area / pic_radio;
              move_scale_L = Math.ceil((pic_area - cropper_w_h) / 2);
              move_scale_T = Math.ceil((pic_area / pic_radio - cropper_w_h) / 2);
              that.setData({
                pic_width: pic_area,
                pic_height: pic_area / pic_radio,
                pic_L: (kScreenW - pic_area) /2,
                pic_T: (view_H -(pic_area / pic_radio) ) / 2, 
                cutT: Math.ceil((pic_area / pic_radio - cropper_w_h) / 2),
                cutL: Math.ceil((pic_area - cropper_w_h) / 2),
              })

              
            } else {
              //以高度为参考
              pic_newW = pic_area * pic_radio;
              pic_newH = pic_area;
              move_scale_L = Math.ceil((pic_area * pic_radio - cropper_w_h) / 2);
              move_scale_T = Math.ceil((pic_area - cropper_w_h) / 2);

              that.setData({
                pic_width: pic_area * pic_radio,
                pic_height: pic_area,
                pic_L: (kScreenW - (pic_area * pic_radio)) / 2,
                pic_T: (view_H - pic_area)/2,       //确保图像在canvas中心区域 ，方便后面计算裁剪的位置和大小
                //canvas裁剪框距上位置
                cutT: Math.ceil( (pic_area - cropper_w_h ) / 2),
                cutL: Math.ceil( (pic_area * pic_radio - cropper_w_h)/2 ),
              }) 
             
  
            }
            that.setData({
              //图片原始宽度 rpx   cropper_w_h 裁剪框的宽高。正方形
              imageW: res.width * pixelRatio,
              imageH: res.height * pixelRatio,
              //canvas裁剪框距左位置
              })
              console.log("最初的cutL",that.data.cutL)
              console.log("最初的cutT", that.data.cutT)
            // 将图片写入画布   如果在剪裁的时候会有问题就是，如果canvas 还没有渲染图片，直接截图是返回空白图片的， 手机上是没有反应
            const ctx = wx.createCanvasContext('myCanvas')
            ctx.drawImage(that.data.temp_file_path)
            ctx.draw()
          }
        })
      }
    })
    }else{
      //如果不是当前控件选择的图片 ，过滤掉
      if (Index != index) {
        return;
      }
      //裁剪图片
      wx.showLoading({
        title: '正在裁剪...',
      })
      if(that.data.stv.zoom === true){
        console.log("scale", that.data.stv.scale)

        pic_newW = this.data.pic_width * that.data.stv.scale;
        pic_newH = this.data.pic_height * that.data.stv.scale;

        //获取放缩后的宽高和位置
         image_w =  that.data.imageW;
         image_h =  that.data.imageH;

        //计算裁剪框的大小和位置
        var canvasW = that.data.cropper_w_H / pic_newW * image_w / pixelRatio;
        var canvasH = that.data.cropper_w_H / pic_newH * image_h / pixelRatio;
        var canvasL = that.data.cutL / pic_newW * image_w / pixelRatio;
        var canvasT = that.data.cutT / pic_newH * image_h / pixelRatio;

      }else{

        // 获取画布要裁剪的位置和宽度   均为百分比 * 画布中图片的宽度    保证了在微信小程序中裁剪的图片模糊  位置不对的问题
        var canvasW = that.data.cropper_w_H / that.data.pic_width * that.data.imageW / pixelRatio;
        var canvasH = that.data.cropper_w_H / that.data.pic_height * that.data.imageH / pixelRatio;
        var canvasL = that.data.cutL  / that.data.pic_width * that.data.imageW / pixelRatio;
        var canvasT = that.data.cutT  / that.data.pic_height * that.data.imageH / pixelRatio;
      }
    
          wx.canvasToTempFilePath({
            x: canvasL,
            y: canvasT,
            width: canvasW,
            height: canvasH,
            destWidth: canvasW,
            destHeight: canvasH,
            canvasId: 'myCanvas',
            success: function (res) {
              
              console.log("裁剪完后的---",res.tempFilePath)
              sourceFilePath = res.tempFilePath;   //存储裁剪完的图片url
              wx.hideLoading();
              // 裁剪完以后记得将位置归为初始位置，方便下次裁剪计算位置
              that.setData({ isChoose: false, temp_file_path: '', isDone:true ,cut_url: res.tempFilePath, 'stv.offsetX': 0, 'stv.offsetY': 0, 'stv.zoom': false,'stv.scale':1})
              that.upload(index);
            }
          })
   }
  },
  upload:function(index){
    var that = this;
    wx.uploadFile({
      url: 'https://www.safacreative.com/uploadfile',
      filePath: sourceFilePath,
      name: 'image',
      success: function (res) {
        wx.hideLoading();
        console.log(res);
        var resData = JSON.parse(res.data);
        var imageurl = resData.data.value;
        switch (index) {
          case 0: {
            that.setData({ lock_image_1: imageurl });
          }
            break;
          case 1: {
            that.setData({ lock_image_2: imageurl });
          }
            break;
          case 2: {
            that.setData({ lock_image_3: imageurl });
          }
            break;
          case 3: {
            that.setData({ lock_image_4: imageurl })
          }
            break;
          case 4: {
            that.setData({ lock_image_5: imageurl });
          }
            break;
        }
      }
    })
  }
  ,
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
  touchmoveCallback: function (e) {
    //触摸移动中
    //console.log('touchmoveCallback');


    if (e.touches.length === 1) {
      //单指移动
      if (this.data.stv.zoom) {
        let { clientX, clientY } = e.touches[0];
        let offsetX = clientX - this.startX;
        let offsetY = clientY - this.startY;

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
      let { clientX, clientY } = e.touches[0];
      let offsetX = clientX - this.startX;
      let offsetY = clientY - this.startY;
      console.log("offsetY----", offsetY)
      //实际像素的位移大小
      var dragLengthX = offsetX * dragScaleP ; 
      var dragLengthY = offsetY * dragScaleP ;
      //如果图片不在裁剪框内的话  暂时不做判断，后期有好的解决办法时再加
      var cut_L = this.data.cutL - dragLengthX;
      var cut_T = this.data.cutT - dragLengthY;
      move_scale_L = cut_L;
      move_scale_T = cut_T;  
      console.log("移动状态下的move_scale_L", move_scale_L)
      console.log("移动状态下的move_scale_T", move_scale_T)

      this.setData({
          cutL: cut_L,
          cutT: cut_T,
        })
      console.log("cut_T", cut_T)

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
     
    } else {

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
      
      pic_newH = this.data.pic_width * newScale;
      pic_newW = this.data.pic_height * newScale;

      console.log("放缩状态下的move_scale_L", move_scale_L)
      console.log("放缩状态下的move_scale_T", move_scale_T)
      console.log("放缩状态下的xmove", xmove)
      console.log("放缩状态下的ymove", ymove)
      //如果是放缩状态下，动态获取图片宽高并计算单指滑动的的位置 需要判断是先放缩还是先拖动
      if(move_scale_L != 0  || move_scale_T != 0){
        //未放缩情况下先拖动，然后再放缩
        let move =  Math.abs(xmove) > Math.abs(ymove) ? xmove : ymove;
         console.log("..........")
         var cut_L = move_scale_L * newScale + move ;
         var cut_T = move_scale_T * newScale + move;

      }else{
        //直接放缩，然后拖动
        var cut_L = (pic_newW - cropper_w_h) / 2;
        var cut_T = (pic_newH - cropper_w_h) / 2;
      }
      console.log("放缩状态下的cutL", cut_L)
      console.log("放缩状态下的cutT", cut_T)

      this.setData({
        'stv.distance': distance,
        'stv.scale': newScale,
        cutL: cut_L,
        cutT: cut_T,
    })
    }
  },
  touchendCallback: function (e) {
    //触摸结束
    console.log('touchendCallback');
    console.log(e);
  },

})