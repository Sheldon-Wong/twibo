$(function() {
	$("#fobtn").click(function () {
		if ( $("#fobtn").hasClass('followed') ) {
			$.ajax({
		      method: 'post',
		      url: '/unfollow',
		      dataType: 'json',
		      data: {unFollow: $("#fobtn").data('follow')}
		    }).success(function (response) {
	    		var $fansLength = $('#fans-length');
	    		$fansLength.text(parseInt($fansLength.text(), 10) - 1);
		      	$("#fobtn").text('关注').removeClass('followed');
		    })
		} else {
			$.ajax({
		      method: 'post',
		      url: '/follow',
		      dataType: "json",
		      contentType: "application/json",
		      data: JSON.stringify({follow: $("#fobtn").data('follow')})
		    })
		    .success(function (response) {
		    	// 这里 success，只有数据有相应才会调用这个方法，不然调用的是 fail 方法
		    	var $fansLength = $('#fans-length');
		    	$fansLength.text(parseInt($fansLength.text(), 10) + 1);
		      	$("#fobtn").text('取消关注').addClass('followed');
		    }).fail(function() {})
		}
	});

	$(".delbtn").click(function (event) {
		var twibo = $(event.target).data('twibo');
		$.ajax({
			method: 'post',
			url: '/delete',
			dataType: 'json',
			data: {twibo: twibo}
		}).success(function (response) {
			$("#" + twibo).remove();
			var $twiboLength = $('#twibo-length');
	    	$twiboLength.text(parseInt($twiboLength.text(), 10) - 1);
		})
	});

	$(".retwibtn").click(function (event) {
		var twibo = $(event.target).data('retwi');
		$.ajax({
			method: 'post',
			url: '/retwi',
			dataType: 'json',
			data: {twibo: twibo}
		}).success(function (response) {
			location.reload(true);
		})
	});

	$(".replybtn").click(function (event) {
		var reply = "回复<a href='" + $(event.target).data('reply') + "'>@" + $(event.target).data('reply') + "</a>：";
		$("#commenttext").html(reply);
		$("#commenttext").focus();
		console.log($("#commenttext").offset());
		$("html,body").animate({scrollTop: $("#commenttext").offset().top},100);
	});
})