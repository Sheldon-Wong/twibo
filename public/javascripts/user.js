$(function() {
	$("#fobtn").click(function () {
		if ( $("#fobtn").hasClass('followed') ) {
			$.ajax({
		      method: 'post',
		      url: '/unfollow',
		      dataType: 'json',
		      data: {unFollow: $("#fobtn").data('follow')}
		    }).success(function(response) {
		      $("#fobtn").text('关注').removeClass('followed');
		    })
		} else {
			$.ajax({
		      method: 'post',
		      url: '/follow',
		      dataType: "json",
		      contentType: "application/json",
		      data: JSON.stringify({follow: $("#fobtn").data('follow')})
		    }).success(function(response) {
		      $("#fobtn").text('取消关注').addClass('followed');
		    })
		}
	})
})