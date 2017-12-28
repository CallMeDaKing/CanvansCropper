var fucking = {};
const app = getApp()
fucking.server_url = 'https://www.safacreative.com'
fucking.needLogin = false; //是否需要登录
fucking.token = undefined;
fucking.random = function(min, max ){
  return Math.floor(Math.random() * (max - min) + min);
}


fucking.save_token = function(token){
  fucking.token = token;
}

fucking.get_token = function(){
  return fucking.token;
}

//解锁
fucking.unlock_letter = function(tempFilePaths,letter_id ,cb){
  

  
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
      
        console.log(tempFilePaths);
        wx.showLoading({
          title: '解锁中',
          mask: true,
          success: function(res) {},
          fail: function(res) {},
          complete: function(res) {},
        })
        wx.uploadFile({
          url: 'https://www.safacreative.com/uploadfile',
          filePath: tempFilePaths,
          name: 'image',
          success: function (res) {
            var resData = JSON.parse(res.data);
            var imageurl = resData.data.value;
            var postData = {};
            postData.unlock_image_url = imageurl;
            postData.letter_id = letter_id;
            wx.showModal({
              title: '开始解锁',
              // content: JSON.stringify(postData),
              content:'正在解锁',
            })
            fucking.post('/unlock_letter', postData,function(d){
                wx.hideLoading();
                cb(d);
            })
          }
        })

},

//鉴权登录
fucking.login = function(){
  console.log("进入登录接口")
  if (fucking.get_token() == undefined || fucking.needLogin == true){

    wx.login({
      success: function (res) {
        console.log('login res', res);
        var code = res.code;
        
        wx.getUserInfo({
          success: function (res) {
            var postData = {};
            postData.userInfo = res.userInfo;
            app.globalData.userInfo = res.userInfo;
            postData.code = code;
            fucking.post('/login', postData, function (data) {
              console.log("denglu------- ",data);
              //存token，所有接口都需要
              fucking.save_token(data.token);
              fucking.needLogin = false;
              fucking.empower = true;
              wx.showToast({
                title: '登录成功',
              })

            })
          }
        })
      }
    })
  }

  
}


function getSid() {
  return wx.getStorageSync('sid');//本地取存储的sessionID 
}

//post方法
fucking.post = function(url,data,cb){
  var target_url = fucking.server_url + url;

  if(fucking.get_token() != undefined){
     data.token = fucking.get_token();
  }

  wx.request({
    url: target_url,
    method: 'POST',
    data:data,
    header:{
      'Content-Type': 'application/json',
    },
    success:function(res){
      if(res.statusCode == 200){
        cb(res.data);
      }
      else{
        if(res.statusCode == 511 || res.statusCode == 510){
            fucking.login();
        }
        cb({retcode:res.statusCode,data:undefined})
      }
    }
  })
}

module.exports = fucking