<?php

/*	
	This controller will be called after visiting /admin.html or one of it childs like /admin/home.html while not beeing logged in.
	This route has been defined in /config/environment.cfg.php.
*/
class Login Extends YS_Controller 
{
	
	public function index()
	{
		
		// redirect to /home.html, because there is where you need to login
		$this->helpers->http->redirect('/home.html');
		
	}
	
}