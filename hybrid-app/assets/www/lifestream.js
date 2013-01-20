document.addEventListener("deviceready", ondeviceready)

var server = 'ec2-23-20-11-194.compute-1.amazonaws.com'

var s3prefix = 'https://s3.amazonaws.com/sagar-picblogger/'


	var app = null

	function ondeviceready(){
	  app = new App()
	}


	function App() {
	  var self = this

	  var imagedata = null

	  var con = $('#con_lifestream')

	  var lifestream_images   = $('#lifestream_images')
	  var lifestream_image    = $('#lifestream_image')
	  var lifestream_register = $('#lifestream_register')
	  var lifestream_username = $('#lifestream_username')
	  var lifestream_complete = $('#lifestream_complete')
	  var lifestream_twitter  = $('#lifestream_twitter')
	  var lifestream_facebook = $('#lifestream_facebook')

	  var follow_followers = $('#follow_followers')
	  var follow_following = $('#follow_following')
	  var follow_search    = $('#follow_search')
	  var follow_results   = $('#follow_results')
	  var follow_followee  = $('#follow_followee')

	  var post_pic = $('#post_pic')
	  var post_msg = $('#post_msg')


	  $('#nav_lifestream').click(function(){
	    showcon('lifestream')
	    showimages( load('images') )
	    update()
	  })

	  $('#nav_post').click(function(){
	    showcon('post')
	  })

	  $('#nav_follow').click(function(){
	    showcon('follow')
	    update()
	  })

	  $('#btn_takepic').click(picTake)
	  $('#btn_upload').click(picUpload)
	  $('#btn_register').click(register)
	  $('#btn_search').click(search)
	  $('#btn_complete').click(complete)


	  function update() {
	    var user = load('user')
	    follow_search.val('')
	    follow_results.empty()

	    http_get(user.username,function(data){
	      showfollowers(data.followers)
	      showfollows(follow_following,false,data.following)

	      save('images',data.stream)
	      showimages(data.stream)
	    })
	  }


	  function search() {
	    var query = follow_search.val()
	    http_get('search/'+escape(query),function(data){
	      showfollows(follow_results,true,data.list)
	    })
	  }


	  function picTake(){
	    navigator.camera.getPicture(
	      function(base64) {
	        imagedata = base64
	        post_pic.attr({src:"data:image/jpeg;base64,"+imagedata})
	      }, 
	      function(){
	        post_msg.text('Could not take picture')
	      },
	      { quality: 50 }
	    ) 
	  }


	  function picUpload(){
	    var user = load('user')

	    if( imagedata ) {
	      post_msg.text('Uploading...')

	      uploadData(function(data){
	        http_post(
	          user.username+'/post',
	          {picid:data.picid},
	          function(data){
	            post_msg.text('Picture uploaded.')
	            appendimage(username,data.picid)            
	          }
	        )
	      })
	    }
	    else {
	      post_msg.text('Take a picture first')
	    }
	  }


	  function uploadData(win) {
	    var padI = imagedata.length-1
	    while( '=' == imagedata[padI] ) {
	      padI--
	    }
	    var padding = imagedata.length - padI - 1

	    var user = load('user')
	    $.ajax({
	      url:'http://'+server+'/lifestream/api/user/'+user.username+'/upload', 
	        type:'POST',
	      contentType:'application/octet-stream',
	      data:imagedata, 
	      headers:{'X-LifeStream-Padding':''+padding,
	               'X-LifeStream-Token':user.token},
	      dataType:'json',
	      success:win,
	      error:function(err){
	        showalert('Upload','Could not upload picture.')
	      },
	    })
	  }


	  function register() {
	    var username = lifestream_username.val()
	    if( username && '' != username ) {
	      createuser(username)
	    }
	    else {
	      showalert('Registration','Please enter a username.')
	    }
	  }

	  
	  function complete() {
	    var registration = load('registration')
	    http_get('complete/'+registration.token,function(data){
	      delete registration.token
	      save('registration',registration)
	      lifestream_complete.hide()
	      createuser(data.username)
	    })
	  }


	  function createuser(username){
	    http_post('register',{username:username},function(data){
	      lifestream_register.hide()
	      var user = load('user')
	      user.username = username
	      user.token = data.token
	      save('user',user)
	      showcon('post')
	    })
	  }


	  function showimages(images) {
	    lifestream_images.empty();
	    for( var i = images.length-1; 0 <= i; i-- ) {
	      var li = 
	        lifestream_image.clone()        
	        .css({display:'block'})
	      li.find('span').text(images[i].user)
	      li.find('img').attr({src:s3prefix+images[i].picid+'.jpg'})
	      lifestream_images.append(li)
	    }
	  }


	  function appendimage(username,picid) {
	    var images = load('images')
	    images.push({picid:picid,user:username})
	    save('images',images)
	  }


	  function showfollowers(followers) {
	    follow_followers.empty();
	    for( var i = 0; i < followers.length; i++ ) {
	      var li = $('<li>').text(followers[i])
	      follow_followers.append(li)
	    }
	    if( 0 == followers.length ) {
	      var li = $('<li>').text('No followers yet.')
	      follow_followers.append(li)
	    }
	  }

	  function showfollows(follows,yes,users) {
	    follows.empty();
	    for( var i = 0; i < users.length; i++ ) {
	      var username = users[i]
	      var li 
	        = follow_followee.clone()
	        .css({display:'block'})
	      li.find('.username').text(username)
	      li.find('.follow')
	        .attr({id:'username_'+username})
	        .text(yes?'Follow':'Unfollow').click(function(){
	          follow(yes,$(this))
	        })
	      follows.append(li)
	    }
	    if( 0 == users.length ) {
	      var li = $('<li>').text('No follows yet.')
	      follows.append(li)
	    }
	  }

	  function follow(yes,li) {
	    var user = load('user')
	    var username = /username_(.*)/.exec( li.attr('id') )[1]
	    http_post(
	      user.username+'/'+(yes?'':'un')+'follow',
	      {username:username},
	      function(data){
	        li.text(yes?'Unfollow':'Follow').click(function(){
	          follow(!yes,$(this))
	        })
	      }
	    )
	  }


	  function init() {
	    var user = load('user')
	    var registration = load('registration')

	    if( registration.token ) {
	      lifestream_complete.show()
	    }
	    else if( !user.username ) {

	      function service(btn,kind){
	        btn.click(function(){
	          registration = load('registration')
	          if( !registration.token ) {
	            var token = ''+(new Date().getTime())+Math.random()
	            save('registration',{token:token})
	            lifestream_register.hide()
	            lifestream_complete.show()
	            btn.attr({href:'http://'+server+'/lifestream/api/user/oauth/'+kind+'/login/'+token}).click()
	          }
	        })
	      }

	      service(lifestream_twitter, 'twitter')
	      service(lifestream_facebook,'facebook')

	      lifestream_register.show()
	    }
	    else {
	      update()
	    }
	  }


	  function http_get(suffix,win) {
	    var user = load('user')
	    $.ajax(
	      {
	        url:'http://'+server+'/lifestream/api/user/'+suffix, 
	        headers:{'X-LifeStream-Token':user.token},
	        dataType:'json',
	        success:win,
	        error:function(err){
	          showalert('Network','Unable to contact server.')
	        }
	      }
	    )
	  }


	  function http_post(suffix,data,win) {
	    var user = load('user')
	    $.ajax(
	      {
	        url:'http://'+server+'/lifestream/api/user/'+suffix, 
	        type:'POST',
	        headers:{'X-LifeStream-Token':user.token},
	        contentType:'application/json',
	        data:JSON.stringify(data),
	        dataType:'json',
	        success:win,
	        error:function(err){
	          showalert('Network','Unable to contact server.')
	        }
	      }
	    )
	  }


	  function showalert(title,msg){
	    navigator.notification.alert(
	      msg, 
	      function(){},
	      title,       
	      'OK'
	    )
	  }


	  function showcon(name) {
	    if( con ) {
	      con.hide()
	    }
	    con = $('#con_'+name)
	    con.show()
	  }


	  var cache = {}

	  function load(key) {
	    return cache[key] || JSON.parse(localStorage[key] || '{}')
	  }

	  function save(key,obj) {
	    cache[key] = obj
	    localStorage[key] = JSON.stringify(obj)
	  }

	  
	  init()
	}





